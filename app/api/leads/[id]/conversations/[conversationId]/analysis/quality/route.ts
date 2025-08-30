import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Análisis específico de calidad de una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('📊 [ANÁLISIS CALIDAD] Iniciando análisis de calidad para:', { leadId, conversationId });

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
    const { transcript, agentId, analysisStyle, temperature } = body;

    console.log('🔍 [DEBUG CALIDAD] Cuerpo de petición completo:', {
      bodyKeys: Object.keys(body),
      hasTranscript: !!transcript,
      transcriptType: typeof transcript,
      transcriptKeys: transcript ? Object.keys(transcript) : 'N/A',
      hasMessages: transcript?.messages ? transcript.messages.length : 'Sin mensajes',
      hasRawTranscript: transcript?.transcript?.raw ? transcript.transcript.raw.length : 'Sin transcript raw',
      analysisStyle: analysisStyle,
      temperature: temperature,
      agentId: agentId
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript es requerido' }, { status: 400 });
    }

    // Detectar estructura del transcript y normalizar
    let normalizedTranscript;
    if (transcript.messages && Array.isArray(transcript.messages)) {
      // Estructura estándar: { messages: [...] }
      normalizedTranscript = transcript;
    } else if (transcript.transcript?.raw && Array.isArray(transcript.transcript.raw)) {
      // Estructura ElevenLabs: { transcript: { raw: [...] } }
      normalizedTranscript = {
        messages: transcript.transcript.raw,
        duration: transcript.conversationDetails?.duration || 0,
        totalWords: 0
      };
      console.log('🔧 [QUALITY DEBUG] Converted ElevenLabs transcript structure');
    } else {
      console.error('❌ [QUALITY DEBUG] Invalid transcript structure:', transcript);
      return NextResponse.json({ error: 'Transcript must contain messages array or transcript.raw' }, { status: 400 });
    }

    // 5. Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();

    // 6. Crear prompt específico para análisis de calidad con estilo personalizado
    const qualityPrompt = buildQualityPrompt(normalizedTranscript, analysisStyle);

    console.log('🔍 [QUALITY DEBUG] Generated prompt info:', {
      promptLength: qualityPrompt.length,
      normalizedTranscriptMessages: normalizedTranscript?.messages?.length || 0,
      firstMessage: normalizedTranscript?.messages?.[0]?.message?.substring(0, 100) || 'No first message',
      promptPreview: qualityPrompt.substring(0, 300) + '...'
    });

    // 7. Ejecutar análisis de calidad con parámetros personalizados
    console.log('🤖 [QUALITY ANALYSIS] Using styled prompt:', {
      agent: agentId || 'auto',
      style: analysisStyle || 'default',
      temperature: temperature || 0.3
    });
    
    // Use the private method correctly via reflection with custom temperature
    const aiResponse = await (analyzer as any).callDirectOpenAI(qualityPrompt, 'quality', temperature);

    console.log('🔍 [QUALITY DEBUG] AI Response received:', {
      hasContent: !!aiResponse?.content,
      contentType: typeof aiResponse?.content,
      contentLength: aiResponse?.content?.length || 0,
      firstChars: aiResponse?.content?.substring(0, 200) || 'No content',
      model: aiResponse?.model,
      tokensUsed: aiResponse?.tokensUsed
    });

    // 8. Procesar respuesta específica de calidad
    const qualityData = parseQualityResponse(aiResponse);

    console.log('🔍 [QUALITY DEBUG] Parsed quality data:', {
      overall: qualityData.overall,
      agentPerformance: qualityData.agentPerformance,
      flow: qualityData.flow,
      hasReasoning: !!qualityData.reasoning,
      hasError: !!qualityData.error
    });

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
      // Actualizar análisis existente con datos de calidad
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          callQualityScore: qualityData.overall,
          agentPerformanceScore: qualityData.agentPerformance,
          conversationFlow: qualityData.conversationFlow,
          // Guardar el análisis completo de calidad en rawInsights
          rawInsights: {
            ...((existingAnalysis.rawInsights as any) || {}),
            quality: qualityData
          },
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nuevo análisis con datos de calidad
      savedAnalysis = await prisma.conversationAnalysis.create({
        data: {
          tenantId: tenant.id,
          organizationId: tenant.organizationId || tenant.id,
          leadId,
          conversationId,
          callQualityScore: qualityData.overall,
          agentPerformanceScore: qualityData.agentPerformance,
          conversationFlow: qualityData.conversationFlow,
          rawInsights: {
            quality: qualityData
          },
          analysisModel: aiResponse.model || 'unknown',
          analysisVersion: '1.0',
          processingTime: Date.now()
        }
      });
    }

    console.log('✅ [QUALITY ANALYSIS] Quality analysis completed and saved:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisType: 'quality',
      data: qualityData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown',
      savedToDatabase: true
    });

  } catch (error) {
    console.error('❌ [QUALITY ANALYSIS] Error in quality analysis:', error);
    
    // Determinar el status code y mensaje basado en el tipo de error
    let statusCode = 500;
    let errorTitle = 'Error interno del servidor';
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (errorMessage.includes('insufficient_quota') || errorMessage.includes('exceeded your current quota')) {
      statusCode = 402;
      errorTitle = 'Créditos insuficientes';
    } else if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
      statusCode = 429;
      errorTitle = 'Límite de velocidad excedido';
    } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      statusCode = 401;
      errorTitle = 'Clave de API inválida';
    }
    
    return NextResponse.json({ 
      error: errorTitle,
      details: errorMessage
    }, { status: statusCode });
  }
}

/**
 * Crear prompt específico para análisis de calidad con estilo personalizado
 */
function buildQualityPrompt(transcript: any, analysisStyle?: string): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.message || msg.content || ''}`)
    .join('\n');

  // Instrucciones específicas según el estilo de análisis
  const styleInstructions = getQualityStyleInstructions(analysisStyle);

  return `
ANALIZA LA CALIDAD DE ESTA CONVERSACIÓN DE VENTAS - ENFOQUE EXCLUSIVO EN CALIDAD:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA ANÁLISIS DE CALIDAD ===
Evalúa ÚNICAMENTE la calidad de esta conversación de ventas. Enfócate en:

1. CALIDAD GENERAL de la conversación (0-100)
2. PERFORMANCE DEL AGENTE (0-100)
3. FLUJO DE LA CONVERSACIÓN (excellent, good, fair, poor)
4. TÉCNICAS DE VENTAS utilizadas
5. MANEJO DE OBJECIONES
6. ESCUCHA ACTIVA y RAPPORT
7. ESTRUCTURA y ORGANIZACIÓN
8. EFECTIVIDAD DE PREGUNTAS

Evalúa basándote en mejores prácticas de ventas:
- Construcción de rapport
- Identificación de necesidades
- Presentación de valor
- Manejo de objeciones
- Técnicas de cierre
- Profesionalismo
- Comunicación clara

Responde ÚNICAMENTE con este JSON:

{
  "overall": número entre 0 y 100,
  "agentPerformance": número entre 0 y 100,
  "flow": "excellent|good|fair|poor",
  "reasoning": "análisis detallado de la calidad de la conversación",
  "strengths": [
    "fortaleza 1 específica",
    "fortaleza 2 específica",
    "fortaleza 3 específica"
  ],
  "improvements": [
    "área de mejora 1 específica",
    "área de mejora 2 específica", 
    "área de mejora 3 específica"
  ],
  "salesTechniques": {
    "rapport": {
      "score": número entre 0 y 100,
      "evidence": "evidencia específica observada",
      "suggestions": "sugerencias de mejora"
    },
    "needsIdentification": {
      "score": número entre 0 y 100,
      "evidence": "evidencia específica observada",
      "suggestions": "sugerencias de mejora"
    },
    "valuePresentation": {
      "score": número entre 0 y 100,
      "evidence": "evidencia específica observada",
      "suggestions": "sugerencias de mejora"
    },
    "objectionHandling": {
      "score": número entre 0 y 100,
      "evidence": "evidencia específica observada",
      "suggestions": "sugerencias de mejora"
    },
    "closing": {
      "score": número entre 0 y 100,
      "evidence": "evidencia específica observada",
      "suggestions": "sugerencias de mejora"
    }
  },
  "communicationMetrics": {
    "clarity": número entre 0 y 100,
    "professionalism": número entre 0 y 100,
    "activeListening": número entre 0 y 100,
    "questionQuality": número entre 0 y 100
  },
  "recommendations": [
    "recomendación específica 1",
    "recomendación específica 2",
    "recomendación específica 3"
  ],
  "training_focus": [
    "área de entrenamiento prioritaria 1",
    "área de entrenamiento prioritaria 2"
  ]
}

ESTILO DE ANÁLISIS: ${styleInstructions}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Obtener instrucciones específicas para análisis de calidad según el estilo
 */
function getQualityStyleInstructions(analysisStyle?: string): string {
  switch (analysisStyle) {
    case 'creative':
      return `ENFOQUE CREATIVO: Busca técnicas de venta innovadoras, patrones de comunicación únicos, aspectos no convencionales de la calidad. Considera dinámicas emocionales, creatividad en manejo de objeciones y enfoques de venta no tradicionales.`;
    
    case 'conservative':
      return `ENFOQUE CONSERVADOR: Enfócate en métricas tradicionales de calidad: estructura básica, claridad de comunicación, seguimiento de proceso estándar. Usa criterios objetivos y evidencia directa.`;
    
    case 'balanced':
    default:
      return `ENFOQUE BALANCEADO: Combina métricas tradicionales con insights modernos de calidad. Considera tanto aspectos técnicos como habilidades blandas. Evaluación comprehensiva pero objetiva.`;
  }
}

/**
 * Procesar respuesta de IA específica para calidad
 */
function parseQualityResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    // 🔧 SOLUCIÓN: Intentar reparar JSON truncado (igual que en sentiment)
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.log('⚠️ [QUALITY] JSON parsing failed, attempting repair...');
      
      // Intentar cerrar strings y objetos incompletos
      let repairedJson = cleanJson;
      
      // Si termina con una coma, quitarla
      if (repairedJson.endsWith(',')) {
        repairedJson = repairedJson.slice(0, -1);
      }
      
      // Contar llaves y corchetes para balance
      const openBraces = (repairedJson.match(/\{/g) || []).length;
      const closeBraces = (repairedJson.match(/\}/g) || []).length;
      const openBrackets = (repairedJson.match(/\[/g) || []).length;
      const closeBrackets = (repairedJson.match(/\]/g) || []).length;
      
      // Cerrar arrays incompletos
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repairedJson += ']';
      }
      
      // Cerrar objetos incompletos
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repairedJson += '}';
      }
      
      // Si hay strings sin cerrar, intentar cerrarlas
      const quoteCount = (repairedJson.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        repairedJson += '"';
      }
      
      console.log('🔧 [QUALITY] Attempting with repaired JSON...');
      parsed = JSON.parse(repairedJson);
      console.log('✅ [QUALITY] JSON repair successful!');
    }
    
    // Validar estructura específica de calidad
    if (parsed.overall === undefined || parsed.agentPerformance === undefined || !parsed.flow) {
      throw new Error('Invalid quality analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'quality',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [QUALITY ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      overall: 50,
      agentPerformance: 50,
      flow: 'fair',
      reasoning: 'Error en el análisis - respuesta por defecto',
      strengths: ['Conversación completada'],
      improvements: ['Análisis detallado no disponible debido a error'],
      salesTechniques: {
        rapport: { score: 50, evidence: 'No disponible', suggestions: 'No disponible' },
        needsIdentification: { score: 50, evidence: 'No disponible', suggestions: 'No disponible' },
        valuePresentation: { score: 50, evidence: 'No disponible', suggestions: 'No disponible' },
        objectionHandling: { score: 50, evidence: 'No disponible', suggestions: 'No disponible' },
        closing: { score: 50, evidence: 'No disponible', suggestions: 'No disponible' }
      },
      communicationMetrics: {
        clarity: 50,
        professionalism: 50,
        activeListening: 50,
        questionQuality: 50
      },
      recommendations: ['Revisar transcripción manualmente'],
      training_focus: ['Análisis de calidad', 'Técnicas de ventas'],
      analysisType: 'quality',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}