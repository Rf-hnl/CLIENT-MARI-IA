import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';
import { saveAnalysisToDatabase } from '@/lib/ai/analysisDbSaver';

/**
 * POST - Predicciones específicas de IA para una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('🔮 [ANÁLISIS PREDICCIONES] Iniciando predicciones de IA para:', { leadId, conversationId });

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

    console.log('🔍 [DEBUG PREDICCIONES] Cuerpo de petición:', {
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
      console.log('🔧 [DEBUG PREDICCIONES] Estructura de transcript ElevenLabs convertida');
    } else {
      console.error('❌ [DEBUG PREDICCIONES] Estructura de transcript inválida:', transcript);
      return NextResponse.json({ error: 'Transcript debe contener array de mensajes o transcript.raw' }, { status: 400 });
    }

    // 5. Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();

    // 6. Crear prompt específico para predicciones con estilo personalizado
    const predictionsPrompt = buildPredictionsPrompt(normalizedTranscript, analysisStyle);

    // 7. Ejecutar predicciones con parámetros personalizados
    console.log('🤖 [ANÁLISIS PREDICCIONES] Usando prompt personalizado:', {
      agent: agentId || 'auto',
      style: analysisStyle || 'default',
      temperature: temperature || 0.3
    });
    
    // Use the private method correctly via reflection with custom temperature
    const aiResponse = await (analyzer as any).callDirectOpenAI(predictionsPrompt, 'predictions', temperature);

    // 8. Procesar respuesta específica de predicciones
    const predictionsData = parsePredictionsResponse(aiResponse);

    // 9. Guardar en base de datos usando utility function
    await saveAnalysisToDatabase(
      'predictions',
      predictionsData,
      conversationId,
      tenant.id,
      leadId,
      aiResponse
    );

    console.log('✅ [ANÁLISIS PREDICCIONES] Predicciones de IA completadas y guardadas exitosamente');

    return NextResponse.json({
      success: true,
      analysisType: 'predictions',
      data: predictionsData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown',
      savedToDatabase: true
    });

  } catch (error) {
    console.error('❌ [ANÁLISIS PREDICCIONES] Error en predicciones de IA:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * Crear prompt específico para predicciones con estilo personalizado
 */
function buildPredictionsPrompt(transcript: any, analysisStyle?: string): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.message || msg.content || ''}`)
    .join('\n');

  // Instrucciones específicas según el estilo de análisis
  const styleInstructions = getPredictionsStyleInstructions(analysisStyle);

  return `
GENERA PREDICCIONES DE IA PARA ESTA CONVERSACIÓN DE VENTAS - ENFOQUE EXCLUSIVO EN PREDICCIONES:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA PREDICCIONES DE IA ===
Genera ÚNICAMENTE predicciones basadas en IA para esta conversación. Enfócate en:

1. PROBABILIDAD DE CONVERSIÓN (0-100%)
2. ACCIÓN RECOMENDADA específica
3. NIVEL DE URGENCIA de seguimiento
4. TIMELINE DE FOLLOW-UP recomendado
5. PREDICCIÓN DE COMPORTAMIENTO del cliente
6. RIESGOS y OPORTUNIDADES identificados
7. ESTRATEGIA RECOMENDADA para próximos pasos
8. PROBABILIDAD DE CIERRE por timeline

Usa análisis predictivo basado en:
- Patrones de comportamiento del cliente
- Señales de compra identificadas
- Nivel de engagement y interés
- Objeciones y su manejo
- Contexto del negocio
- Timing expresado por el cliente

Responde ÚNICAMENTE con este JSON:

{
  "conversionLikelihood": número entre 0 y 100,
  "recommendedAction": "immediate_follow_up|send_proposal|schedule_meeting|send_demo|nurture_lead|qualify_further|close_deal|archive_lead",
  "urgency": "low|medium|high|critical",
  "followUpTimeline": "immediate|1_day|3_days|1_week|2_weeks|1_month",
  "reasoning": "justificación detallada de las predicciones",
  "nextSteps": [
    {
      "step": "paso específico recomendado",
      "priority": "high|medium|low",
      "timeline": "cuando ejecutar este paso",
      "expected_outcome": "resultado esperado"
    }
  ],
  "conversionFactors": {
    "positive": [
      {
        "factor": "factor positivo específico",
        "impact": "high|medium|low",
        "evidence": "evidencia de la conversación"
      }
    ],
    "negative": [
      {
        "factor": "factor negativo específico",
        "impact": "high|medium|low",
        "evidence": "evidencia de la conversación"
      }
    ]
  },
  "riskAssessment": {
    "overall_risk": "low|medium|high",
    "risk_factors": [
      {
        "risk": "riesgo específico",
        "probability": "low|medium|high",
        "impact": "low|medium|high",
        "mitigation": "cómo mitigar este riesgo"
      }
    ]
  },
  "opportunityMatrix": {
    "immediate_opportunities": ["oportunidad 1", "oportunidad 2"],
    "medium_term_opportunities": ["oportunidad 1", "oportunidad 2"],
    "long_term_opportunities": ["oportunidad 1", "oportunidad 2"]
  },
  "clientProfile": {
    "decision_readiness": "ready|evaluating|early_stage|not_ready",
    "buying_timeline": "immediate|1_month|3_months|6_months|longer",
    "budget_availability": "confirmed|likely|uncertain|limited",
    "authority_level": "decision_maker|influencer|gatekeeper|unknown"
  },
  "closingProbability": {
    "next_30_days": número entre 0 y 100,
    "next_90_days": número entre 0 y 100,
    "next_6_months": número entre 0 y 100,
    "factors_affecting_timeline": ["factor 1", "factor 2"]
  },
  "strategicRecommendations": [
    {
      "strategy": "estrategia específica recomendada",
      "rationale": "por qué se recomienda esta estrategia",
      "execution": "cómo ejecutar la estrategia",
      "success_metrics": "cómo medir el éxito"
    }
  ],
  "competitive_positioning": {
    "our_advantage": ["ventaja 1", "ventaja 2"],
    "areas_to_strengthen": ["área 1", "área 2"],
    "competitive_threats": ["amenaza 1", "amenaza 2"]
  }
}

ESTILO DE ANÁLISIS: ${styleInstructions}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Obtener instrucciones específicas para predicciones según el estilo
 */
function getPredictionsStyleInstructions(analysisStyle?: string): string {
  switch (analysisStyle) {
    case 'creative':
      return `ENFOQUE CREATIVO: Considera señales sutiles de conversión, patrones emocionales únicos, micro-expresiones en el lenguaje. Analiza dinámicas psicológicas y conexiones no obvias entre comportamientos y intención de compra.`;
    
    case 'conservative':
      return `ENFOQUE CONSERVADOR: Basate únicamente en evidencia directa de intención de compra: preguntas sobre precios, plazos, términos de contrato. Usa indicadores tradicionales y objetivos.`;
    
    case 'balanced':
    default:
      return `ENFOQUE BALANCEADO: Combina señales directas con indicadores comportamentales sutiles. Considera tanto evidencia explícita como patrones de engagement. Evaluación comprehensiva pero objetiva.`;
  }
}

/**
 * Procesar respuesta de IA específica para predicciones
 */
function parsePredictionsResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de predicciones
    if (parsed.conversionLikelihood === undefined || !parsed.recommendedAction || !parsed.urgency) {
      throw new Error('Invalid predictions analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'predictions',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [PREDICTIONS ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      conversionLikelihood: 50,
      recommendedAction: 'qualify_further',
      urgency: 'medium',
      followUpTimeline: '1_week',
      reasoning: 'Error en el análisis - respuesta por defecto',
      nextSteps: [{
        step: 'Revisar transcripción manualmente',
        priority: 'high',
        timeline: 'immediate',
        expected_outcome: 'Análisis detallado'
      }],
      conversionFactors: {
        positive: [{
          factor: 'Conversación completada',
          impact: 'medium',
          evidence: 'Cliente participó en la conversación'
        }],
        negative: [{
          factor: 'Análisis automático falló',
          impact: 'medium',
          evidence: 'Error en procesamiento de IA'
        }]
      },
      riskAssessment: {
        overall_risk: 'medium',
        risk_factors: [{
          risk: 'Falta de análisis detallado',
          probability: 'high',
          impact: 'medium',
          mitigation: 'Revisar manualmente'
        }]
      },
      opportunityMatrix: {
        immediate_opportunities: ['Revisión manual'],
        medium_term_opportunities: ['Mejorar sistema de análisis'],
        long_term_opportunities: ['Automatización completa']
      },
      clientProfile: {
        decision_readiness: 'evaluating',
        buying_timeline: '3_months',
        budget_availability: 'uncertain',
        authority_level: 'unknown'
      },
      closingProbability: {
        next_30_days: 30,
        next_90_days: 50,
        next_6_months: 70,
        factors_affecting_timeline: ['Análisis manual requerido', 'Seguimiento necesario']
      },
      strategicRecommendations: [{
        strategy: 'Análisis manual inmediato',
        rationale: 'Sistema automático falló',
        execution: 'Revisar transcripción completa',
        success_metrics: 'Comprensión clara de la conversación'
      }],
      competitive_positioning: {
        our_advantage: ['Sistema de análisis en desarrollo'],
        areas_to_strengthen: ['Confiabilidad del análisis automático'],
        competitive_threats: ['No determinadas debido a error']
      },
      analysisType: 'predictions',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}