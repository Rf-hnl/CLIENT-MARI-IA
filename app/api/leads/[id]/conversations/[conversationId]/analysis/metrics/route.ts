import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Métricas específicas de conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('📊 [METRICS ANALYSIS] Starting conversation metrics for:', { leadId, conversationId });

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

    // 5. Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();

    // 6. Crear prompt específico para métricas de conversación
    const metricsPrompt = buildMetricsPrompt(transcript);

    // 7. Ejecutar análisis de métricas con agente específico
    console.log('🤖 [METRICS ANALYSIS] Using metrics-focused prompt with agent:', agentId || 'auto');
    
    // Use the private method correctly via reflection
    const aiResponse = await (analyzer as any).callDirectOpenAI(metricsPrompt, 'metrics');

    // 8. Procesar respuesta específica de métricas
    const metricsData = parseMetricsResponse(aiResponse);

    console.log('✅ [METRICS ANALYSIS] Conversation metrics completed successfully');

    return NextResponse.json({
      success: true,
      analysisType: 'metrics',
      data: metricsData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown'
    });

  } catch (error) {
    console.error('❌ [METRICS ANALYSIS] Error in conversation metrics:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Crear prompt específico para métricas de conversación
 */
function buildMetricsPrompt(transcript: any): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `
CALCULA MÉTRICAS DE CONVERSACIÓN PARA ESTA LLAMADA DE VENTAS - ENFOQUE EXCLUSIVO EN MÉTRICAS:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA MÉTRICAS DE CONVERSACIÓN ===
Calcula ÚNICAMENTE métricas cuantificables de esta conversación. Enfócate en:

1. PREGUNTAS del agente vs RESPUESTAS del cliente
2. INTERRUPCIONES durante la conversación  
3. RATIO DE TIEMPO hablado (agente vs cliente)
4. TIEMPO DE RESPUESTA promedio
5. FLUJO DE LA CONVERSACIÓN
6. MÉTRICAS DE PARTICIPACIÓN
7. ESTADÍSTICAS DE INTERACCIÓN
8. MEDIDAS DE EFECTIVIDAD

Cuenta y analiza elementos cuantificables:
- Número de preguntas hechas por el agente
- Número de preguntas respondidas por el cliente
- Frecuencia de interrupciones
- Distribución del tiempo de habla
- Longitud promedio de respuestas
- Velocidad de la conversación

Responde ÚNICAMENTE con este JSON:

{
  "questionsAsked": número de preguntas del agente,
  "questionsAnswered": número de preguntas respondidas por el cliente,
  "interruptions": número de interrupciones,
  "talkTimeRatio": ratio de tiempo hablado agente/cliente (0.0 a 1.0),
  "averageResponseTime": "tiempo promedio de respuesta en segundos",
  "conversationFlow": "smooth|choppy|interrupted|natural",
  "detailed": {
    "agent_metrics": {
      "total_messages": número de mensajes del agente,
      "average_message_length": número promedio de palabras por mensaje,
      "question_frequency": "frequent|moderate|rare",
      "interruption_rate": número entre 0 y 1,
      "talk_time_percentage": porcentaje de tiempo hablado por el agente
    },
    "client_metrics": {
      "total_messages": número de mensajes del cliente,
      "average_message_length": número promedio de palabras por mensaje,
      "response_completeness": "complete|partial|minimal",
      "engagement_level": "high|medium|low",
      "talk_time_percentage": porcentaje de tiempo hablado por el cliente
    },
    "interaction_metrics": {
      "conversation_pace": "fast|moderate|slow",
      "turn_taking": "balanced|agent_dominated|client_dominated",
      "silence_gaps": "minimal|moderate|frequent",
      "conversation_efficiency": número entre 0 y 100
    }
  },
  "timing_analysis": {
    "opening_duration": "duración estimada de la apertura en minutos",
    "main_discussion_duration": "duración de la discusión principal en minutos", 
    "closing_duration": "duración del cierre en minutos",
    "most_engaging_period": "opening|middle|closing",
    "conversation_structure": "structured|semi_structured|unstructured"
  },
  "communication_patterns": {
    "agent_patterns": [
      "patrón de comunicación del agente 1",
      "patrón de comunicación del agente 2"
    ],
    "client_patterns": [
      "patrón de comunicación del cliente 1", 
      "patrón de comunicación del cliente 2"
    ],
    "interaction_quality": "excellent|good|fair|poor"
  },
  "efficiency_metrics": {
    "information_density": "high|medium|low",
    "goal_achievement": "fully_achieved|partially_achieved|not_achieved",
    "time_utilization": "excellent|good|fair|poor",
    "conversation_productivity": número entre 0 y 100
  },
  "summary": {
    "total_duration_minutes": número total de minutos,
    "total_words": número total de palabras estimadas,
    "words_per_minute": palabras por minuto promedio,
    "interaction_balance": "balanced|agent_heavy|client_heavy",
    "overall_flow_rating": número entre 1 y 10
  }
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Procesar respuesta de IA específica para métricas
 */
function parseMetricsResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de métricas
    if (parsed.questionsAsked === undefined || parsed.questionsAnswered === undefined || parsed.talkTimeRatio === undefined) {
      throw new Error('Invalid metrics analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'metrics',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [METRICS ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      questionsAsked: 0,
      questionsAnswered: 0,
      interruptions: 0,
      talkTimeRatio: 0.5,
      averageResponseTime: 'No disponible',
      conversationFlow: 'natural',
      detailed: {
        agent_metrics: {
          total_messages: 0,
          average_message_length: 0,
          question_frequency: 'moderate',
          interruption_rate: 0,
          talk_time_percentage: 50
        },
        client_metrics: {
          total_messages: 0,
          average_message_length: 0,
          response_completeness: 'partial',
          engagement_level: 'medium',
          talk_time_percentage: 50
        },
        interaction_metrics: {
          conversation_pace: 'moderate',
          turn_taking: 'balanced',
          silence_gaps: 'moderate',
          conversation_efficiency: 50
        }
      },
      timing_analysis: {
        opening_duration: 'No disponible',
        main_discussion_duration: 'No disponible',
        closing_duration: 'No disponible',
        most_engaging_period: 'middle',
        conversation_structure: 'semi_structured'
      },
      communication_patterns: {
        agent_patterns: ['Análisis no disponible debido a error'],
        client_patterns: ['Análisis no disponible debido a error'],
        interaction_quality: 'fair'
      },
      efficiency_metrics: {
        information_density: 'medium',
        goal_achievement: 'partially_achieved',
        time_utilization: 'fair',
        conversation_productivity: 50
      },
      summary: {
        total_duration_minutes: 0,
        total_words: 0,
        words_per_minute: 0,
        interaction_balance: 'balanced',
        overall_flow_rating: 5
      },
      analysisType: 'metrics',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}