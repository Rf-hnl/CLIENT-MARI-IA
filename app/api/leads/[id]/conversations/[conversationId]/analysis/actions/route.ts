import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Generación de acciones inteligentes basadas en una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('⚡ [ACTIONS ANALYSIS] Starting intelligent actions generation for:', { leadId, conversationId });

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

    // 6. Crear prompt específico para generación de acciones inteligentes
    const actionsPrompt = buildActionsPrompt(transcript, lead);

    // 7. Ejecutar generación de acciones con agente específico
    console.log('🤖 [ACTIONS ANALYSIS] Using actions-focused prompt with agent:', agentId || 'auto');
    
    // Use the private method correctly via reflection
    const aiResponse = await (analyzer as any).callDirectOpenAI(actionsPrompt, 'actions');

    // 8. Procesar respuesta específica de acciones inteligentes
    const actionsData = parseActionsResponse(aiResponse);

    console.log('✅ [ACTIONS ANALYSIS] Intelligent actions generation completed successfully');

    return NextResponse.json({
      success: true,
      analysisType: 'actions',
      data: actionsData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown'
    });

  } catch (error) {
    console.error('❌ [ACTIONS ANALYSIS] Error in intelligent actions generation:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Crear prompt específico para generación de acciones inteligentes
 */
function buildActionsPrompt(transcript: any, lead: any): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join('\n');

  return `
GENERA ACCIONES INTELIGENTES EJECUTABLES PARA ESTA CONVERSACIÓN DE VENTAS:

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

=== INSTRUCCIONES ESPECÍFICAS PARA GENERACIÓN DE ACCIONES ===
Genera ÚNICAMENTE acciones específicas, ejecutables y priorizadas basadas en esta conversación. 

TIPOS DE ACCIONES DISPONIBLES:
1. schedule_meeting - Programar reunión/demo
2. send_proposal - Enviar propuesta comercial
3. send_demo_link - Enviar enlace de demo/video
4. make_followup_call - Programar llamada de seguimiento
5. send_comparison - Enviar comparación vs competidores
6. address_objection - Abordar objeción específica
7. send_case_study - Enviar caso de estudio relevante
8. escalate_manager - Escalar a manager/ejecutivo senior
9. send_pricing - Enviar información de precios
10. schedule_technical_demo - Demo técnico especializado

Para cada acción, considera:
- Qué se discutió en la conversación
- Señales de interés detectadas
- Objeciones planteadas
- Información solicitada
- Urgencia expresada
- Siguiente paso lógico

Responde ÚNICAMENTE con este JSON:

{
  "totalActions": número total de acciones generadas,
  "highPriority": número de acciones de alta prioridad,
  "actionsSummary": "resumen ejecutivo de las acciones recomendadas",
  "generatedActions": [
    {
      "id": "action_1",
      "type": "schedule_meeting|send_proposal|send_demo_link|make_followup_call|send_comparison|address_objection|send_case_study|escalate_manager|send_pricing|schedule_technical_demo",
      "title": "Título específico de la acción",
      "description": "Descripción detallada de qué hacer",
      "priority": "high|medium|low",
      "urgency": "immediate|1_day|3_days|1_week|2_weeks",
      "reasoning": "por qué se recomienda esta acción basado en la conversación",
      "trigger": "qué en la conversación generó esta recomendación",
      "expectedOutcome": "resultado esperado de esta acción",
      "executionDetails": {
        "when": "cuándo ejecutar la acción",
        "how": "cómo ejecutar la acción específicamente",
        "what_to_include": "qué incluir en la comunicación",
        "personalization": "cómo personalizar basado en la conversación"
      },
      "successMetrics": ["métrica 1", "métrica 2"],
      "risksIfNotDone": "riesgos si no se ejecuta esta acción",
      "dependencies": ["acción o recurso requerido antes de ejecutar"]
    }
  ],
  "sequenceRecommendation": [
    {
      "order": 1,
      "actionId": "action_1",
      "reasoning": "por qué debe ir en este orden"
    }
  ],
  "strategicContext": {
    "dealStage": "awareness|interest|consideration|intent|evaluation|purchase",
    "clientReadiness": "ready_to_buy|evaluating|early_interest|just_browsing",
    "keyOpportunities": ["oportunidad 1", "oportunidad 2"],
    "potentialRisks": ["riesgo 1", "riesgo 2"],
    "competitiveThreats": ["amenaza 1", "amenaza 2"]
  },
  "automationOpportunities": [
    {
      "action": "qué se puede automatizar",
      "method": "cómo automatizar",
      "benefits": "beneficios de automatizar",
      "requirements": "qué se necesita para automatizar"
    }
  ],
  "personalizationData": {
    "client_interests": ["interés específico 1", "interés específico 2"],
    "pain_points_to_address": ["dolor 1", "dolor 2"],
    "preferred_communication": "email|phone|meeting|demo",
    "decision_timeline": "timeline mencionado o inferido",
    "budget_indicators": "indicadores de presupuesto encontrados"
  }
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Procesar respuesta de IA específica para acciones inteligentes
 */
function parseActionsResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    const parsed = JSON.parse(cleanJson);
    
    // Validar estructura específica de acciones
    if (!Array.isArray(parsed.generatedActions) || parsed.totalActions === undefined) {
      throw new Error('Invalid actions analysis structure');
    }
    
    return {
      ...parsed,
      analysisType: 'actions',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [ACTIONS ANALYSIS] Error parsing AI response:', error);
    
    // Retornar estructura por defecto en caso de error
    return {
      totalActions: 1,
      highPriority: 1,
      actionsSummary: 'Error en análisis automático - revisar manualmente',
      generatedActions: [{
        id: 'action_error_1',
        type: 'make_followup_call',
        title: 'Revisar Conversación Manualmente',
        description: 'El análisis automático falló. Revisar la transcripción manualmente para determinar próximos pasos.',
        priority: 'high',
        urgency: 'immediate',
        reasoning: 'Sistema de análisis automático no pudo procesar la conversación correctamente',
        trigger: 'Error en procesamiento de IA',
        expectedOutcome: 'Comprensión clara de la conversación y próximos pasos',
        executionDetails: {
          when: 'Lo antes posible',
          how: 'Revisar transcripción completa y contexto del lead',
          what_to_include: 'Análisis manual de la conversación',
          personalization: 'Basado en información específica del lead'
        },
        successMetrics: ['Comprensión clara de la conversación', 'Plan de acción definido'],
        risksIfNotDone: 'Pérdida de oportunidad por falta de seguimiento',
        dependencies: ['Acceso a transcripción completa']
      }],
      sequenceRecommendation: [{
        order: 1,
        actionId: 'action_error_1',
        reasoning: 'Es prioritario entender la conversación antes de tomar cualquier acción'
      }],
      strategicContext: {
        dealStage: 'evaluation',
        clientReadiness: 'evaluating',
        keyOpportunities: ['Análisis manual detallado'],
        potentialRisks: ['Error en análisis automático'],
        competitiveThreats: ['No determinadas']
      },
      automationOpportunities: [{
        action: 'Mejorar sistema de análisis automático',
        method: 'Optimizar prompts y validación de respuestas',
        benefits: 'Análisis más confiable y consistente',
        requirements: 'Desarrollo y testing adicional'
      }],
      personalizationData: {
        client_interests: ['No determinados debido a error'],
        pain_points_to_address: ['Error en sistema de análisis'],
        preferred_communication: 'phone',
        decision_timeline: 'No determinado',
        budget_indicators: 'No disponible'
      },
      analysisType: 'actions',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
  }
}