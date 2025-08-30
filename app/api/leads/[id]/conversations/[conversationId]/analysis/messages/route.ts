import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Análisis específico por mensaje de una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('💬 [MESSAGE ANALYSIS] Starting per-message analysis for:', { leadId, conversationId });

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

    // 6. Crear prompt específico para análisis por mensaje
    const messagesPrompt = buildMessageAnalysisPrompt(transcript);

    // 7. Ejecutar análisis por mensaje con agente específico
    console.log('🤖 [MESSAGE ANALYSIS] Using per-message analysis prompt with agent:', agentId || 'auto');
    
    // Use the private method correctly via reflection
    const aiResponse = await (analyzer as any).callDirectOpenAI(messagesPrompt, 'message_analysis');

    // 8. Procesar respuesta específica de análisis por mensaje
    const messageData = parseMessageAnalysisResponse(aiResponse);

    console.log('✅ [MESSAGE ANALYSIS] Per-message analysis completed successfully');

    return NextResponse.json({
      success: true,
      analysisType: 'message_analysis',
      data: messageData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown'
    });

  } catch (error) {
    console.error('❌ [MESSAGE ANALYSIS] Error in per-message analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Crear prompt específico para análisis por mensaje
 */
function buildMessageAnalysisPrompt(transcript: any): string {
  const messages = transcript.messages
    .map((msg: any, index: number) => `${index + 1}. ${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `
ANALIZA CADA MENSAJE DEL CLIENTE EN ESTA CONVERSACIÓN - ENFOQUE EXCLUSIVO POR MENSAJE:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA ANÁLISIS POR MENSAJE ===
Analiza ÚNICAMENTE cada mensaje del CLIENTE/LEAD (NO del agente). Para cada mensaje del cliente, extrae:

1. SENTIMENT específico del mensaje
2. EMOCIONES detectadas
3. INTENCIÓN del mensaje (pregunta, objeción, interés, etc.)
4. FRASES CLAVE importantes
5. NIVEL DE URGENCIA expresado
6. INDICADORES de toma de decisión
7. INFORMACIÓN VALIOSA proporcionada
8. CAMBIOS en el tono o actitud

IMPORTANTE: Solo analiza mensajes del CLIENTE/LEAD, ignora mensajes del agente.

Responde ÚNICAMENTE con este JSON:

{
  "totalMessages": número total de mensajes en la conversación,
  "clientMessages": número de mensajes del cliente,
  "agentMessages": número de mensajes del agente,
  "sentimentProgression": "descripción de cómo cambió el sentiment del cliente",
  "overallClientJourney": "resumen del viaje del cliente durante la conversación",
  "keyTransitionMoments": [
    {
      "messageIndex": número del mensaje donde ocurrió la transición,
      "transition": "descripción del cambio",
      "impact": "high|medium|low",
      "trigger": "qué causó este cambio"
    }
  ],
  "messagesAnalysis": [
    {
      "messageIndex": número del mensaje del cliente (no contar mensajes del agente),
      "content": "texto completo del mensaje del cliente",
      "sentiment": "positive|negative|neutral|mixed",
      "sentimentScore": número entre -1.0 y 1.0,
      "confidence": número entre 0.0 y 1.0,
      "emotions": ["happy", "frustrated", "interested", "confused", "excited", "worried", ...],
      "intent": "question|objection|interest|agreement|concern|information|decision",
      "urgencyLevel": "low|medium|high|critical",
      "keyPhrases": ["frase importante 1", "frase importante 2", ...],
      "businessInfo": "información de negocio revelada en este mensaje",
      "decisionIndicators": ["indicador 1", "indicador 2"],
      "painPointsRevealed": ["dolor 1", "dolor 2"],
      "buyingSignalsDetected": ["señal 1", "señal 2"],
      "objectionType": "price|timing|authority|need|trust|feature|other|none",
      "informationValue": "high|medium|low|none",
      "responseQuality": "detailed|moderate|brief|minimal",
      "reasoning": "por qué se clasificó de esta manera"
    }
  ],
  "clientBehaviorPatterns": {
    "engagement_trend": "increasing|stable|decreasing|volatile",
    "information_sharing": "open|selective|cautious|closed",
    "decision_making_style": "analytical|impulsive|collaborative|cautious",
    "communication_style": "direct|diplomatic|detailed|concise"
  },
  "criticalMoments": [
    {
      "messageIndex": número del mensaje,
      "moment": "descripción del momento crítico",
      "type": "breakthrough|objection|interest_peak|concern|decision_point",
      "impact_on_deal": "positive|negative|neutral",
      "follow_up_needed": "descripción de seguimiento necesario"
    }
  ],
  "insights": {
    "strongest_message": "cuál mensaje mostró más interés/engagement",
    "weakest_message": "cuál mensaje mostró menos interés/preocupaciones",
    "most_informative": "cuál mensaje proporcionó más información valiosa",
    "decision_readiness_indicators": ["indicador 1", "indicador 2"],
    "relationship_building_moments": ["momento 1", "momento 2"]
  }
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Procesar respuesta de IA específica para análisis por mensaje
 */
function parseMessageAnalysisResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de análisis por mensaje
    if (!Array.isArray(parsed.messagesAnalysis) || parsed.clientMessages === undefined) {
      throw new Error('Invalid message analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'message_analysis',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [MESSAGE ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      totalMessages: 0,
      clientMessages: 0,
      agentMessages: 0,
      sentimentProgression: 'Análisis no disponible debido a error',
      overallClientJourney: 'No se pudo analizar el viaje del cliente',
      keyTransitionMoments: [],
      messagesAnalysis: [{
        messageIndex: 1,
        content: 'Error en el análisis automático',
        sentiment: 'neutral',
        sentimentScore: 0,
        confidence: 0.5,
        emotions: ['uncertain'],
        intent: 'information',
        urgencyLevel: 'medium',
        keyPhrases: ['error de análisis'],
        businessInfo: 'No disponible',
        decisionIndicators: [],
        painPointsRevealed: [],
        buyingSignalsDetected: [],
        objectionType: 'none',
        informationValue: 'low',
        responseQuality: 'minimal',
        reasoning: 'Error en procesamiento de IA'
      }],
      clientBehaviorPatterns: {
        engagement_trend: 'stable',
        information_sharing: 'selective',
        decision_making_style: 'cautious',
        communication_style: 'concise'
      },
      criticalMoments: [{
        messageIndex: 1,
        moment: 'Error en análisis automático',
        type: 'concern',
        impact_on_deal: 'neutral',
        follow_up_needed: 'Revisar transcripción manualmente'
      }],
      insights: {
        strongest_message: 'No determinado debido a error',
        weakest_message: 'No determinado debido a error',
        most_informative: 'No determinado debido a error',
        decision_readiness_indicators: ['Análisis manual requerido'],
        relationship_building_moments: ['No disponible']
      },
      analysisType: 'message_analysis',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}