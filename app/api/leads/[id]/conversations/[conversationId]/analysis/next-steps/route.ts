import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Análisis inteligente de próximos pasos basado en una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('📋 [NEXT STEPS ANALYSIS] Starting next steps analysis for:', { leadId, conversationId });

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

    // 6. Crear prompt específico para análisis de próximos pasos
    const nextStepsPrompt = buildNextStepsPrompt(transcript, lead);

    // 7. Ejecutar análisis con agente específico
    console.log('🤖 [NEXT STEPS ANALYSIS] Using next-steps-focused prompt with agent:', agentId || 'auto');
    
    // Use the private method correctly via reflection
    const aiResponse = await (analyzer as any).callDirectOpenAI(nextStepsPrompt, 'next_steps');

    // 8. Procesar respuesta específica de próximos pasos
    const nextStepsData = parseNextStepsResponse(aiResponse);

    console.log('✅ [NEXT STEPS ANALYSIS] Next steps analysis completed successfully');

    return NextResponse.json({
      success: true,
      analysisType: 'next_steps',
      data: nextStepsData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown'
    });

  } catch (error) {
    console.error('❌ [NEXT STEPS ANALYSIS] Error in next steps analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Crear prompt específico para análisis de próximos pasos
 */
function buildNextStepsPrompt(transcript: any, lead: any): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `
ANALIZA LOS PRÓXIMOS PASOS INTELIGENTES PARA ESTA CONVERSACIÓN DE VENTAS:

=== INFORMACIÓN DEL LEAD ===
Nombre: ${lead.name}
Teléfono: ${lead.phone}
Email: ${lead.email || 'No disponible'}
Empresa: ${lead.company || 'No especificada'}
Estado: ${lead.status}
Prioridad: ${lead.priority}

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA ANÁLISIS DE PRÓXIMOS PASOS ===
Analiza esta conversación para detectar intenciones específicas y recomendaciones de próximos pasos.

TIPOS DE INTENCIONES A DETECTAR:
1. schedule_meeting - Cliente quiere agendar reunión, demo o cita
2. request_information - Cliente solicita información adicional, materiales, propuesta
3. follow_up_call - Cliente acepta o sugiere llamada de seguimiento
4. price_discussion - Cliente quiere discutir precios o costos
5. technical_demo - Cliente necesita demo técnico o prueba del producto
6. decision_timeline - Cliente menciona cuándo tomará decisión
7. involve_decision_maker - Necesita involucrar a otros en la decisión
8. competitor_comparison - Quiere comparar con competidores
9. budget_approval - Necesita aprobación de presupuesto
10. contract_negotiation - Listo para negociar términos o contrato

Para cada intención detectada, evalúa:
- DETECTADO: Claramente expresado por el cliente
- IMPLÍCITO: Sugerido o insinuado en la conversación
- NO_DETECTADO: No mencionado

Responde ÚNICAMENTE con este JSON:

{
  "totalIntentions": número de intenciones detectadas,
  "highPriority": número de intenciones de alta prioridad,
  "nextStepsSummary": "resumen ejecutivo de los próximos pasos recomendados",
  "detectedIntentions": [
    {
      "intention": "schedule_meeting|request_information|follow_up_call|price_discussion|technical_demo|decision_timeline|involve_decision_maker|competitor_comparison|budget_approval|contract_negotiation",
      "confidence": "DETECTADO|IMPLÍCITO|NO_DETECTADO",
      "evidence": "texto específico de la conversación que soporta esta detección",
      "urgency": "immediate|1_day|3_days|1_week|2_weeks",
      "priority": "high|medium|low",
      "recommendedAction": "acción específica recomendada",
      "reasoning": "por qué se recomienda esta acción"
    }
  ],
  "conversationContext": {
    "clientReadiness": "ready_to_buy|evaluating|interested|exploring|skeptical",
    "emotionalTone": "enthusiastic|positive|neutral|concerned|resistant",
    "decisionStage": "awareness|interest|consideration|intent|evaluation|purchase",
    "keyPainPoints": ["dolor principal 1", "dolor principal 2"],
    "buyingSignals": ["señal 1", "señal 2"],
    "objections": ["objeción 1", "objeción 2"]
  },
  "recommendedSequence": [
    {
      "order": 1,
      "intention": "intention_name",
      "action": "acción específica a tomar",
      "timing": "cuándo ejecutar",
      "method": "cómo ejecutar (email, llamada, reunión, etc.)",
      "success_criteria": "cómo medir el éxito"
    }
  ],
  "timeline": {
    "immediate": ["acciones para las próximas 2 horas"],
    "today": ["acciones para hoy"],
    "this_week": ["acciones para esta semana"],
    "next_week": ["acciones para la próxima semana"]
  },
  "riskAssessment": {
    "lossRisk": "high|medium|low",
    "competitorThreat": "high|medium|low",
    "delayRisk": "high|medium|low",
    "riskFactors": ["factor de riesgo 1", "factor de riesgo 2"],
    "mitigationActions": ["acción de mitigación 1", "acción de mitigación 2"]
  },
  "personalizationTips": {
    "communication_style": "formal|casual|technical|relationship_focused",
    "preferred_channel": "email|phone|meeting|text|whatsapp",
    "key_motivators": ["motivador 1", "motivador 2"],
    "decision_factors": ["factor 1", "factor 2"]
  }
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Procesar respuesta de IA específica para próximos pasos
 */
function parseNextStepsResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de próximos pasos
    if (!Array.isArray(parsed.detectedIntentions) || parsed.totalIntentions === undefined) {
      throw new Error('Invalid next steps analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'next_steps',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [NEXT STEPS ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      totalIntentions: 1,
      highPriority: 1,
      nextStepsSummary: 'Error en análisis automático - revisar conversación manualmente',
      detectedIntentions: [{
        intention: 'follow_up_call',
        confidence: 'DETECTADO',
        evidence: 'Error en procesamiento automático',
        urgency: 'immediate',
        priority: 'high',
        recommendedAction: 'Revisar conversación manualmente y definir próximos pasos',
        reasoning: 'Sistema de análisis automático falló, se requiere revisión manual'
      }],
      conversationContext: {
        clientReadiness: 'evaluating',
        emotionalTone: 'neutral',
        decisionStage: 'consideration',
        keyPainPoints: ['Análisis automático falló'],
        buyingSignals: ['No determinadas'],
        objections: ['Error en sistema']
      },
      recommendedSequence: [{
        order: 1,
        intention: 'follow_up_call',
        action: 'Llamar para aclarar próximos pasos',
        timing: 'Lo antes posible',
        method: 'Llamada telefónica',
        success_criteria: 'Clarificación de intenciones del cliente'
      }],
      timeline: {
        immediate: ['Revisar transcripción manualmente'],
        today: ['Contactar al cliente para aclarar próximos pasos'],
        this_week: ['Definir plan de acción basado en conversación'],
        next_week: ['Ejecutar plan definido']
      },
      riskAssessment: {
        lossRisk: 'medium',
        competitorThreat: 'medium',
        delayRisk: 'high',
        riskFactors: ['Error en análisis automático', 'Falta de claridad en próximos pasos'],
        mitigationActions: ['Contacto inmediato con el cliente', 'Revisión manual de la conversación']
      },
      personalizationTips: {
        communication_style: 'formal',
        preferred_channel: 'phone',
        key_motivators: ['No determinados'],
        decision_factors: ['No determinados']
      },
      analysisType: 'next_steps',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}