import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Extracción específica de insights de una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('💡 [INSIGHTS ANALYSIS] Starting insights extraction for:', { leadId, conversationId });

    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { 
        id: payload.userId as string, 
        email: payload.email as string
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Obtener tenant usando el userId
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Verificar que el lead pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: tenant.id
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 4. Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { transcript, agentId } = body;

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Log para debug del fallback
    if (!agentId) {
      console.log('🔄 [INSIGHTS ANALYSIS] No agentId provided, backend will use OpenAI fallback');
    }

    // 5. Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();

    // 6. Crear prompt específico para extracción de insights
    const insightsPrompt = buildInsightsPrompt(transcript);

    // 7. Ejecutar extracción de insights - El analyzer manejará fallback automáticamente
    console.log('🤖 [INSIGHTS ANALYSIS] Using insights-focused prompt with agent:', agentId || 'OpenAI Fallback');
    
    // Use the private method correctly via reflection
    const aiResponse = await (analyzer as any).callDirectOpenAI(insightsPrompt, 'insights');

    // 8. Procesar respuesta específica de insights
    const insightsData = parseInsightsResponse(aiResponse);

    // 9. Buscar análisis existente o crear uno nuevo
    let existingAnalysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        tenantId: tenant.id
      }
    });

    // 10. Actualizar o crear análisis en la base de datos
    let savedAnalysis;
    if (existingAnalysis) {
      // Actualizar análisis existente con datos de insights
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          keyTopics: insightsData.keyTopics,
          mainPainPoints: insightsData.painPoints,
          buyingSignals: insightsData.buyingSignals,
          objections: insightsData.objections,
          // Guardar el análisis completo de insights en rawInsights
          rawInsights: {
            ...((existingAnalysis.rawInsights as any) || {}),
            insights: insightsData
          },
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nuevo análisis con datos de insights
      savedAnalysis = await prisma.conversationAnalysis.create({
        data: {
          tenantId: tenant.id,
          organizationId: tenant.organizationId || tenant.id,
          leadId,
          conversationId,
          keyTopics: insightsData.keyTopics,
          mainPainPoints: insightsData.painPoints,
          buyingSignals: insightsData.buyingSignals,
          objections: insightsData.objections,
          rawInsights: {
            insights: insightsData
          },
          analysisModel: aiResponse.model || 'unknown',
          analysisVersion: '1.0',
          processingTime: Date.now()
        }
      });
    }

    console.log('✅ [INSIGHTS ANALYSIS] Insights analysis completed and saved:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisType: 'insights',
      data: insightsData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown',
      savedToDatabase: true
    });

  } catch (error) {
    console.error('❌ [INSIGHTS ANALYSIS] Error in insights extraction:', error);
    
    // Determinar el status code y mensaje basado en el tipo de error
    let statusCode = 500;
    let errorTitle = 'Internal server error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('insufficient_quota') || errorMessage.includes('exceeded your current quota')) {
      statusCode = 402;
      errorTitle = 'Insufficient credits';
    } else if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
      statusCode = 429;
      errorTitle = 'Rate limit exceeded';
    } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      statusCode = 401;
      errorTitle = 'Invalid API key';
    }
    
    return NextResponse.json({ 
      error: errorTitle,
      details: errorMessage
    }, { status: statusCode });
  }
}

/**
 * Crear prompt específico para extracción de insights
 */
function buildInsightsPrompt(transcript: any): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `
EXTRAE INSIGHTS CLAVE DE ESTA CONVERSACIÓN DE VENTAS - ENFOQUE EXCLUSIVO EN INSIGHTS:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA EXTRACCIÓN DE INSIGHTS ===
Extrae ÚNICAMENTE los insights más importantes de esta conversación. Enfócate en:

1. TEMAS PRINCIPALES discutidos
2. PUNTOS DE DOLOR expresados por el cliente
3. SEÑALES DE COMPRA identificadas
4. OBJECIONES planteadas
5. COMPETIDORES mencionados
6. INFORMACIÓN ESTRATÉGICA clave
7. CONTEXTO DEL NEGOCIO del cliente
8. NECESIDADES específicas identificadas

Busca información específica y accionable, no generalidades.

Responde ÚNICAMENTE con este JSON:

{
  "keyTopics": [
    "tema específico 1",
    "tema específico 2",
    "tema específico 3"
  ],
  "painPoints": [
    {
      "pain": "punto de dolor específico",
      "severity": "high|medium|low",
      "evidence": "cita textual o evidencia",
      "impact": "descripción del impacto en el negocio"
    }
  ],
  "buyingSignals": [
    {
      "signal": "señal de compra específica",
      "strength": "strong|medium|weak",
      "evidence": "cita textual o evidencia",
      "timing": "immediate|short_term|long_term"
    }
  ],
  "objections": [
    {
      "objection": "objeción específica",
      "type": "price|timing|authority|need|trust|other",
      "evidence": "cita textual",
      "handled": true|false,
      "response_quality": "excellent|good|fair|poor"
    }
  ],
  "competitors": [
    {
      "name": "nombre del competidor",
      "context": "contexto de la mención",
      "client_sentiment": "positive|negative|neutral",
      "advantages_mentioned": ["ventaja 1", "ventaja 2"],
      "disadvantages_mentioned": ["desventaja 1", "desventaja 2"]
    }
  ],
  "businessContext": {
    "industry": "industria del cliente",
    "company_size": "tamaño estimado de la empresa",
    "decision_makers": ["persona 1", "persona 2"],
    "budget_indicators": "indicadores de presupuesto mencionados",
    "timeline": "timeline de decisión mencionado",
    "current_solution": "solución actual que usan"
  },
  "strategicInsights": [
    {
      "insight": "insight estratégico específico",
      "category": "opportunity|risk|requirement|preference",
      "priority": "high|medium|low",
      "actionable": "acción específica recomendada"
    }
  ],
  "keyQuotes": [
    {
      "speaker": "client|agent",
      "quote": "cita textual importante",
      "context": "contexto de la cita",
      "significance": "por qué es importante esta cita"
    }
  ],
  "needsIdentified": [
    {
      "need": "necesidad específica identificada",
      "urgency": "high|medium|low",
      "evidence": "evidencia de la necesidad",
      "solution_fit": "how well our solution fits this need"
    }
  ]
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Procesar respuesta de IA específica para insights
 */
function parseInsightsResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de insights
    if (!Array.isArray(parsed.keyTopics) || !Array.isArray(parsed.painPoints)) {
      throw new Error('Invalid insights analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'insights',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [INSIGHTS ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      keyTopics: ['Error en análisis', 'Revisar manualmente'],
      painPoints: [{
        pain: 'Análisis no disponible debido a error',
        severity: 'medium',
        evidence: 'Error en procesamiento',
        impact: 'No determinado'
      }],
      buyingSignals: [{
        signal: 'Análisis no disponible',
        strength: 'weak',
        evidence: 'Error en procesamiento',
        timing: 'long_term'
      }],
      objections: [{
        objection: 'Análisis no disponible',
        type: 'other',
        evidence: 'Error en procesamiento',
        handled: false,
        response_quality: 'poor'
      }],
      competitors: [],
      businessContext: {
        industry: 'No determinado',
        company_size: 'No determinado',
        decision_makers: [],
        budget_indicators: 'No disponible',
        timeline: 'No determinado',
        current_solution: 'No determinado'
      },
      strategicInsights: [{
        insight: 'Revisar transcripción manualmente',
        category: 'requirement',
        priority: 'high',
        actionable: 'Análisis manual requerido'
      }],
      keyQuotes: [],
      needsIdentified: [{
        need: 'Análisis detallado no disponible',
        urgency: 'medium',
        evidence: 'Error en procesamiento',
        solution_fit: 'No determinado'
      }],
      analysisType: 'insights',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}