import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Análisis específico de engagement de una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('🎯 [ANÁLISIS ENGAGEMENT] Iniciando análisis de engagement para:', { leadId, conversationId });

    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No hay header de autorización' }, { status: 401 });
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
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    // 2. Obtener tenant usando el userId
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    // 3. Verificar que el lead pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: tenant.id
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    // 4. Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { transcript, agentId, analysisStyle, temperature } = body;

    console.log('🔍 [DEBUG ENGAGEMENT] Cuerpo de petición:', {
      hasTranscript: !!transcript,
      transcriptType: typeof transcript,
      transcriptKeys: transcript ? Object.keys(transcript) : 'N/A',
      hasMessages: transcript?.messages ? transcript.messages.length : 'Sin mensajes',
      hasRawTranscript: transcript?.transcript?.raw ? transcript.transcript.raw.length : 'Sin transcript raw'
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
      console.log('🔧 [DEBUG ENGAGEMENT] Estructura de transcript ElevenLabs convertida');
    } else {
      console.error('❌ [DEBUG ENGAGEMENT] Estructura de transcript inválida:', transcript);
      return NextResponse.json({ error: 'Transcript debe contener array de mensajes o transcript.raw' }, { status: 400 });
    }

    // 5. Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();

    // 6. Crear prompt específico para engagement con estilo personalizado
    const engagementPrompt = buildEngagementPrompt(normalizedTranscript, analysisStyle);

    // 7. Ejecutar análisis de engagement con parámetros personalizados
    console.log('🤖 [ANÁLISIS ENGAGEMENT] Usando prompt personalizado:', {
      agent: agentId || 'auto',
      style: analysisStyle || 'default',
      temperature: temperature || 0.3
    });
    
    // Use the private method correctly via reflection with custom temperature
    const aiResponse = await (analyzer as any).callDirectOpenAI(engagementPrompt, 'engagement', temperature);

    // 8. Procesar respuesta específica de engagement
    const engagementData = parseEngagementResponse(aiResponse);

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
      // Actualizar análisis existente con datos de engagement
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          engagementScore: engagementData.score,
          leadInterestLevel: engagementData.interestLevel,
          responseQuality: engagementData.responseQuality,
          // Guardar el análisis completo de engagement en rawInsights
          rawInsights: {
            ...((existingAnalysis.rawInsights as any) || {}),
            engagement: engagementData
          },
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nuevo análisis con datos de engagement
      savedAnalysis = await prisma.conversationAnalysis.create({
        data: {
          tenantId: tenant.id,
          organizationId: tenant.organizationId || tenant.id,
          leadId,
          conversationId,
          engagementScore: engagementData.score,
          leadInterestLevel: engagementData.interestLevel,
          responseQuality: engagementData.responseQuality,
          rawInsights: {
            engagement: engagementData
          },
          analysisModel: aiResponse.model || 'unknown',
          analysisVersion: '1.0',
          processingTime: Date.now()
        }
      });
    }

    console.log('✅ [ANÁLISIS ENGAGEMENT] Análisis de engagement completado y guardado:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisType: 'engagement',
      data: engagementData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown',
      savedToDatabase: true
    });

  } catch (error) {
    console.error('❌ [ANÁLISIS ENGAGEMENT] Error en análisis de engagement:', error);
    
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
 * Crear prompt específico para engagement con estilo personalizado
 */
function buildEngagementPrompt(transcript: any, analysisStyle?: string): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.message || msg.content || ''}`)
    .join('\n');

  // Instrucciones específicas según el estilo de análisis
  const styleInstructions = getEngagementStyleInstructions(analysisStyle);

  return `
ANALIZA EL ENGAGEMENT DE ESTA CONVERSACIÓN DE VENTAS - ENFOQUE EXCLUSIVO EN ENGAGEMENT:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA ANÁLISIS DE ENGAGEMENT ===
Analiza ÚNICAMENTE el nivel de engagement de esta conversación. Enfócate en:

1. NIVEL DE INTERÉS del cliente (1-10)
2. ENGAGEMENT SCORE general (0-100)
3. CALIDAD DE RESPUESTAS del cliente
4. PARTICIPACIÓN ACTIVA vs PASIVA
5. INDICADORES DE ATENCIÓN y DISTRACCIÓN
6. PROGRESIÓN del engagement durante la conversación
7. MOMENTOS de alto y bajo engagement
8. FACTORES que influyeron en el engagement

Evalúa basándote en:
- Longitud y detalle de respuestas del cliente
- Frecuencia de preguntas del cliente
- Uso de lenguaje específico vs genérico
- Evidencia de escucha activa
- Iniciativa del cliente en la conversación
- Tiempo de respuesta percibido
- Expresión de emociones

Responde ÚNICAMENTE con este JSON:

{
  "interestLevel": número entre 1 y 10,
  "score": número entre 0 y 100,
  "responseQuality": "excellent|good|fair|poor",
  "reasoning": "análisis detallado del nivel de engagement",
  "participationLevel": "high|medium|low",
  "responsiveness": "excellent|good|fair|poor",
  "attentionIndicators": {
    "activeListening": número entre 0 y 100,
    "questionAsking": número entre 0 y 100,
    "detailProvision": número entre 0 y 100,
    "followUpEngagement": número entre 0 y 100
  },
  "engagementProgression": [
    {
      "phase": "opening|middle|closing",
      "engagementLevel": número entre 1 y 10,
      "keyFactors": ["factor 1", "factor 2"],
      "evidence": "evidencia específica"
    }
  ],
  "highEngagementMoments": [
    {
      "moment": "descripción del momento",
      "evidence": "evidencia específica",
      "trigger": "qué causó el alto engagement",
      "impact": "high|medium|low"
    }
  ],
  "lowEngagementMoments": [
    {
      "moment": "descripción del momento",
      "evidence": "evidencia específica",
      "cause": "qué causó el bajo engagement",
      "recovery": "cómo se recuperó o no"
    }
  ],
  "clientBehavior": {
    "responseLength": "detailed|moderate|brief|minimal",
    "initiative": "high|medium|low",
    "questionAsking": "frequent|occasional|rare|none",
    "emotionalExpression": "high|medium|low|none",
    "specificityLevel": "very_specific|specific|general|vague"
  },
  "engagementDrivers": [
    {
      "driver": "factor que impulsa engagement",
      "impact": "positive|negative",
      "strength": "high|medium|low",
      "recommendation": "cómo aprovechar o mejorar"
    }
  ],
  "overallAssessment": {
    "trend": "increasing|stable|decreasing|volatile",
    "sustainability": "high|medium|low",
    "conversion_readiness": "ready|warming_up|needs_nurturing|unlikely",
    "next_interaction_timing": "immediate|few_days|week|month"
  }
}

ESTILO DE ANÁLISIS: ${styleInstructions}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Obtener instrucciones específicas para engagement según el estilo
 */
function getEngagementStyleInstructions(analysisStyle?: string): string {
  switch (analysisStyle) {
    case 'creative':
      return `ENFOQUE CREATIVO: Identifica patrones únicos de participación, micro-señales de interés, dinámicas emocionales sutiles. Considera factores psicológicos, ritmo de conversación y energía emocional no obvios.`;
    
    case 'conservative':
      return `ENFOQUE CONSERVADOR: Mide indicadores tradicionales de engagement: número de preguntas, longitud de respuestas, tiempo de participación. Usa métricas objetivas y cuantificables.`;
    
    case 'balanced':
    default:
      return `ENFOQUE BALANCEADO: Combina métricas cuantitativas con análisis cualitativo de participación. Considera tanto indicadores directos como señales comportamentales sutiles.`;
  }
}

/**
 * Procesar respuesta de IA específica para engagement
 */
function parseEngagementResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de engagement
    if (parsed.interestLevel === undefined || parsed.score === undefined || !parsed.responseQuality) {
      throw new Error('Invalid engagement analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'engagement',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [ENGAGEMENT ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      interestLevel: 5,
      score: 50,
      responseQuality: 'fair',
      reasoning: 'Error en el análisis - respuesta por defecto',
      participationLevel: 'medium',
      responsiveness: 'fair',
      attentionIndicators: {
        activeListening: 50,
        questionAsking: 50,
        detailProvision: 50,
        followUpEngagement: 50
      },
      engagementProgression: [
        {
          phase: 'opening',
          engagementLevel: 5,
          keyFactors: ['Análisis no disponible'],
          evidence: 'Error en procesamiento'
        }
      ],
      highEngagementMoments: [],
      lowEngagementMoments: [],
      clientBehavior: {
        responseLength: 'moderate',
        initiative: 'medium',
        questionAsking: 'occasional',
        emotionalExpression: 'medium',
        specificityLevel: 'general'
      },
      engagementDrivers: [{
        driver: 'Análisis detallado no disponible',
        impact: 'positive',
        strength: 'medium',
        recommendation: 'Revisar transcripción manualmente'
      }],
      overallAssessment: {
        trend: 'stable',
        sustainability: 'medium',
        conversion_readiness: 'needs_nurturing',
        next_interaction_timing: 'week'
      },
      analysisType: 'engagement',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}