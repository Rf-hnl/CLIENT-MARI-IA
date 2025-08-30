/**
 * INTELLIGENT ACTIONS SYSTEM
 * 
 * Sistema que genera acciones ejecutables basadas en el análisis de conversaciones
 * Convierte insights de IA en botones de acción específicos
 */

import { ConversationAnalysis } from '@/types/conversationAnalysis';

export type ActionType = 
  | 'schedule_meeting'
  | 'send_proposal'
  | 'send_comparison'
  | 'send_pricing'
  | 'make_followup_call'
  | 'send_demo_link'
  | 'send_case_study'
  | 'schedule_technical_call'
  | 'send_contract'
  | 'address_objection'
  | 'nurture_sequence'
  | 'escalate_manager'
  | 'send_references'
  | 'schedule_trial'
  | 'send_roi_calculator';

export interface IntelligentAction {
  id: string;
  type: ActionType;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'today' | 'this_week' | 'next_week';
  icon: string;
  color: string;
  reasoning: string;
  suggestedTime?: string;
  template?: string;
  metadata?: any;
}

/**
 * GENERADOR DE ACCIONES INTELIGENTES
 */
export class IntelligentActionGenerator {
  
  /**
   * Generar acciones basadas en análisis de conversación
   */
  static generateActions(analysis: ConversationAnalysis, leadData?: any): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // 1. ACCIONES BASADAS EN BUYING SIGNALS
    actions.push(...this.generateBuyingSignalActions(analysis));

    // 2. ACCIONES BASADAS EN OBJECTIONS
    actions.push(...this.generateObjectionActions(analysis));

    // 3. ACCIONES BASADAS EN INTEREST LEVEL
    actions.push(...this.generateInterestActions(analysis));

    // 4. ACCIONES BASADAS EN SENTIMENT
    actions.push(...this.generateSentimentActions(analysis));

    // 5. ACCIONES BASADAS EN CONVERSION LIKELIHOOD
    actions.push(...this.generateConversionActions(analysis));

    // 6. ACCIONES BASADAS EN COMPETENCIA
    actions.push(...this.generateCompetitorActions(analysis));

    // 7. ACCIONES BASADAS EN PAIN POINTS
    actions.push(...this.generatePainPointActions(analysis));

    // Ordenar por prioridad y urgencia
    return this.prioritizeActions(actions);
  }

  /**
   * Acciones basadas en señales de compra
   */
  private static generateBuyingSignalActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Verificar que buyingSignals existe y es un array
    const buyingSignals = analysis.buyingSignals || [];
    buyingSignals.forEach((signal, index) => {
      const lowerSignal = signal.toLowerCase();

      // Señales de timing/urgencia
      if (lowerSignal.includes('reunión') || lowerSignal.includes('meeting') || lowerSignal.includes('junta')) {
        actions.push({
          id: `schedule_meeting_${index}`,
          type: 'schedule_meeting',
          title: 'Agendar Reunión',
          description: `El lead mencionó interés en reunirse: "${signal}"`,
          priority: 'high',
          urgency: 'immediate',
          icon: '📅',
          color: 'bg-blue-500 text-white',
          reasoning: 'Lead expresó interés directo en agendar reunión',
          suggestedTime: 'Esta semana',
          template: `Hola {leadName}, 

Me da mucho gusto saber de tu interés en {product}. 

Como mencionaste en nuestra conversación, me encantaría agendar una reunión para mostrarte exactamente cómo podemos {solution}.

¿Te parece bien el {suggestedDay} a las {suggestedTime}?

Saludos,
{agentName}`,
          metadata: { signal, suggestedDuration: '30 min' }
        });
      }

      // Señales de demo/prueba
      if (lowerSignal.includes('demo') || lowerSignal.includes('prueba') || lowerSignal.includes('mostrar')) {
        actions.push({
          id: `send_demo_${index}`,
          type: 'send_demo_link',
          title: 'Enviar Demo',
          description: `Interés en ver demostración: "${signal}"`,
          priority: 'high',
          urgency: 'today',
          icon: '🎬',
          color: 'bg-purple-500 text-white',
          reasoning: 'Lead quiere ver el producto en acción',
          template: `¡Perfecto! Aquí está el link para la demo personalizada: {demoLink}`
        });
      }

      // Señales de presupuesto
      if (lowerSignal.includes('presupuesto') || lowerSignal.includes('precio') || lowerSignal.includes('cost')) {
        actions.push({
          id: `send_proposal_${index}`,
          type: 'send_proposal',
          title: 'Enviar Propuesta',
          description: `Interés en aspectos comerciales: "${signal}"`,
          priority: 'high',
          urgency: 'today',
          icon: '💰',
          color: 'bg-green-500 text-white',
          reasoning: 'Lead está evaluando aspectos comerciales',
          template: 'Propuesta comercial personalizada con pricing y términos'
        });
      }

      // Señales de implementación
      if (lowerSignal.includes('implementar') || lowerSignal.includes('empezar') || lowerSignal.includes('cuando')) {
        actions.push({
          id: `schedule_implementation_${index}`,
          type: 'schedule_technical_call',
          title: 'Call Técnico',
          description: `Interés en implementación: "${signal}"`,
          priority: 'medium',
          urgency: 'this_week',
          icon: '⚙️',
          color: 'bg-orange-500 text-white',
          reasoning: 'Lead está pensando en aspectos de implementación'
        });
      }
    });

    return actions;
  }

  /**
   * Acciones basadas en objeciones
   */
  private static generateObjectionActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Verificar que objections existe y es un array
    const objections = analysis.objections || [];
    objections.forEach((objection, index) => {
      const lowerObjection = objection.toLowerCase();

      // Objeciones de precio
      if (lowerObjection.includes('caro') || lowerObjection.includes('precio') || lowerObjection.includes('cost')) {
        actions.push({
          id: `address_price_objection_${index}`,
          type: 'send_roi_calculator',
          title: 'Enviar ROI Calculator',
          description: `Objeción de precio: "${objection}"`,
          priority: 'high',
          urgency: 'immediate',
          icon: '📊',
          color: 'bg-red-500 text-white',
          reasoning: 'Necesita demostrar valor vs costo',
          template: `Entiendo tu preocupación sobre el precio. Te envío una calculadora de ROI que muestra el retorno de inversión: {roiLink}`
        });
      }

      // Objeciones de competencia
      if (lowerObjection.includes('competencia') || lowerObjection.includes('otro')) {
        actions.push({
          id: `send_comparison_${index}`,
          type: 'send_comparison',
          title: 'Enviar Comparativo',
          description: `Comparando con competencia: "${objection}"`,
          priority: 'high',
          urgency: 'today',
          icon: '⚡',
          color: 'bg-yellow-500 text-black',
          reasoning: 'Necesita diferenciarse de la competencia'
        });
      }

      // Objeciones de tiempo/implementación
      if (lowerObjection.includes('tiempo') || lowerObjection.includes('complej') || lowerObjection.includes('dificil')) {
        actions.push({
          id: `send_case_study_${index}`,
          type: 'send_case_study',
          title: 'Enviar Caso de Éxito',
          description: `Preocupación sobre implementación: "${objection}"`,
          priority: 'medium',
          urgency: 'today',
          icon: '📖',
          color: 'bg-teal-500 text-white',
          reasoning: 'Mostrar casos similares exitosos'
        });
      }

      // Objeciones de autorización/decisión
      if (lowerObjection.includes('jefe') || lowerObjection.includes('aprobar') || lowerObjection.includes('decidir')) {
        actions.push({
          id: `escalate_decision_${index}`,
          type: 'schedule_meeting',
          title: 'Meeting con Decisor',
          description: `Involucrar tomador de decisiones: "${objection}"`,
          priority: 'high',
          urgency: 'this_week',
          icon: '👥',
          color: 'bg-indigo-500 text-white',
          reasoning: 'Necesita involucrar al decisor final'
        });
      }
    });

    return actions;
  }

  /**
   * Acciones basadas en nivel de interés
   */
  private static generateInterestActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Calcular nivel de interés basado en sentiment score
    let interestLevel = 0;
    if (analysis.sentiment?.overall?.score) {
      // Convert sentiment score (-1 to 1) to interest level (0-10)
      interestLevel = Math.round((analysis.sentiment.overall.score + 1) * 5);
    } else if (analysis.leadInterestLevel) {
      interestLevel = analysis.leadInterestLevel;
    }

    // Alto interés (8-10)
    if (interestLevel >= 8) {
      actions.push({
        id: 'high_interest_close',
        type: 'send_contract',
        title: 'Enviar Contrato',
        description: 'Alto nivel de interés detectado (9/10)',
        priority: 'high',
        urgency: 'immediate',
        icon: '✍️',
        color: 'bg-green-600 text-white',
        reasoning: 'Lead muy interesado, momento ideal para cerrar',
        template: 'Contrato pre-llenado listo para firma'
      });

      actions.push({
        id: 'high_interest_trial',
        type: 'schedule_trial',
        title: 'Iniciar Prueba',
        description: 'Configurar trial inmediato',
        priority: 'high',
        urgency: 'today',
        icon: '🚀',
        color: 'bg-purple-600 text-white',
        reasoning: 'Capitalizar alto interés con experiencia práctica'
      });
    }

    // Interés medio (5-7)
    else if (interestLevel >= 5) {
      actions.push({
        id: 'medium_interest_nurture',
        type: 'send_case_study',
        title: 'Enviar Casos de Éxito',
        description: 'Nutrir interés con contenido relevante',
        priority: 'medium',
        urgency: 'today',
        icon: '📚',
        color: 'bg-blue-500 text-white',
        reasoning: 'Mantener y aumentar el interés gradualmente'
      });
    }

    // Bajo interés (1-4)
    else {
      actions.push({
        id: 'low_interest_qualify',
        type: 'make_followup_call',
        title: 'Call de Calificación',
        description: 'Entender mejor necesidades y fit',
        priority: 'medium',
        urgency: 'this_week',
        icon: '🔍',
        color: 'bg-gray-500 text-white',
        reasoning: 'Necesita mejor calificación antes de continuar'
      });
    }

    return actions;
  }

  /**
   * Acciones basadas en sentiment
   */
  private static generateSentimentActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Extraer sentiment de la estructura correcta
    let sentiment = 'neutral';
    if (analysis.sentiment?.overall?.sentiment) {
      sentiment = analysis.sentiment.overall.sentiment.toLowerCase();
    } else if (analysis.sentiment?.sentiment) {
      sentiment = analysis.sentiment.sentiment.toLowerCase();
    } else if (analysis.overallSentiment) {
      sentiment = analysis.overallSentiment.toLowerCase();
    }

    switch (sentiment) {
      case 'positive':
        actions.push({
          id: 'positive_momentum',
          type: 'schedule_meeting',
          title: 'Capitalizar Momentum',
          description: 'Sentiment positivo - acelerar proceso',
          priority: 'high',
          urgency: 'immediate',
          icon: '🚀',
          color: 'bg-green-500 text-white',
          reasoning: 'Sentiment positivo, momento ideal para avanzar'
        });
        break;

      case 'negative':
        actions.push({
          id: 'address_concerns',
          type: 'address_objection',
          title: 'Resolver Preocupaciones',
          description: 'Sentiment negativo - atender dudas',
          priority: 'high',
          urgency: 'immediate',
          icon: '🤝',
          color: 'bg-red-500 text-white',
          reasoning: 'Necesita abordar preocupaciones antes de continuar'
        });
        break;

      case 'neutral':
        actions.push({
          id: 'generate_interest',
          type: 'send_demo_link',
          title: 'Generar Interés',
          description: 'Sentiment neutral - mostrar valor',
          priority: 'medium',
          urgency: 'today',
          icon: '✨',
          color: 'bg-yellow-500 text-black',
          reasoning: 'Necesita generar más emoción e interés'
        });
        break;

      case 'mixed':
        actions.push({
          id: 'clarify_position',
          type: 'make_followup_call',
          title: 'Clarificar Posición',
          description: 'Sentiment mixto - entender mejor situación',
          priority: 'medium',
          urgency: 'this_week',
          icon: '🎯',
          color: 'bg-purple-500 text-white',
          reasoning: 'Sentiment mixto requiere mayor clarificación'
        });
        break;
    }

    return actions;
  }

  /**
   * Acciones basadas en likelihood de conversión
   */
  private static generateConversionActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Obtener probabilidad de conversión con fallback seguro
    const conversionProbability = analysis.conversionProbability || analysis.conversionLikelihood || 0;
    const conversionPercentage = Math.round(conversionProbability * 100);

    // Alta probabilidad (70%+)
    if (conversionPercentage >= 70) {
      actions.push({
        id: 'high_conversion_close',
        type: 'send_contract',
        title: 'Cerrar Venta',
        description: `${conversionPercentage}% probabilidad de conversión`,
        priority: 'high',
        urgency: 'immediate',
        icon: '🎯',
        color: 'bg-green-600 text-white',
        reasoning: 'Alta probabilidad - momento perfecto para cerrar'
      });
    }

    // Probabilidad media (40-69%)
    else if (conversionPercentage >= 40) {
      actions.push({
        id: 'medium_conversion_proposal',
        type: 'send_proposal',
        title: 'Enviar Propuesta',
        description: `${conversionPercentage}% probabilidad - propuesta formal`,
        priority: 'high',
        urgency: 'today',
        icon: '📄',
        color: 'bg-blue-600 text-white',
        reasoning: 'Buena probabilidad - necesita propuesta formal'
      });
    }

    // Baja probabilidad (<40%)
    else {
      actions.push({
        id: 'low_conversion_nurture',
        type: 'nurture_sequence',
        title: 'Secuencia de Nurturing',
        description: `${conversionPercentage}% probabilidad - nutrir relación`,
        priority: 'low',
        urgency: 'next_week',
        icon: '🌱',
        color: 'bg-gray-600 text-white',
        reasoning: 'Baja probabilidad - necesita nurturing a largo plazo'
      });
    }

    return actions;
  }

  /**
   * Acciones basadas en competencia mencionada
   */
  private static generateCompetitorActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Verificar que competitorMentions existe y es un array
    const competitorMentions = analysis.competitorMentions || [];
    if (competitorMentions.length > 0) {
      actions.push({
        id: 'competitor_comparison',
        type: 'send_comparison',
        title: 'Tabla Comparativa',
        description: `Mencionó: ${competitorMentions.join(', ')}`,
        priority: 'high',
        urgency: 'today',
        icon: '⚔️',
        color: 'bg-red-600 text-white',
        reasoning: 'Está evaluando competencia - necesita diferenciación',
        metadata: { competitors: analysis.competitorMentions }
      });

      actions.push({
        id: 'competitive_references',
        type: 'send_references',
        title: 'Referencias de Clientes',
        description: 'Casos que cambiaron de la competencia',
        priority: 'medium',
        urgency: 'today',
        icon: '🏆',
        color: 'bg-orange-600 text-white',
        reasoning: 'Referencias específicas vs competencia mencionada'
      });
    }

    return actions;
  }

  /**
   * Acciones basadas en pain points
   */
  private static generatePainPointActions(analysis: ConversationAnalysis): IntelligentAction[] {
    const actions: IntelligentAction[] = [];

    // Verificar que mainPainPoints existe y es un array
    const painPoints = analysis.mainPainPoints || [];
    painPoints.forEach((painPoint, index) => {
      actions.push({
        id: `pain_solution_${index}`,
        type: 'send_case_study',
        title: 'Caso de Éxito Relevante',
        description: `Solución para: "${painPoint}"`,
        priority: 'medium',
        urgency: 'today',
        icon: '💡',
        color: 'bg-teal-600 text-white',
        reasoning: `Caso específico que resuelve: ${painPoint}`,
        metadata: { painPoint }
      });
    });

    return actions;
  }

  /**
   * Priorizar y ordenar acciones
   */
  private static prioritizeActions(actions: IntelligentAction[]): IntelligentAction[] {
    // Remover duplicados por type
    const uniqueActions = actions.reduce((acc, action) => {
      const exists = acc.find(a => a.type === action.type);
      if (!exists || action.priority === 'high') {
        acc.push(action);
      }
      return acc;
    }, [] as IntelligentAction[]);

    // Ordenar por prioridad y urgencia
    return uniqueActions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const urgencyOrder = { immediate: 4, today: 3, this_week: 2, next_week: 1 };

      const scoreA = priorityOrder[a.priority] * 10 + urgencyOrder[a.urgency];
      const scoreB = priorityOrder[b.priority] * 10 + urgencyOrder[b.urgency];

      return scoreB - scoreA;
    }).slice(0, 6); // Máximo 6 acciones para no saturar UI
  }
}

/**
 * QUICK ACTIONS - Acciones rápidas comunes
 */
export const QUICK_ACTIONS: IntelligentAction[] = [
  {
    id: 'quick_followup',
    type: 'make_followup_call',
    title: 'Llamada de Seguimiento',
    description: 'Programar seguimiento telefónico',
    priority: 'medium',
    urgency: 'today',
    icon: '📞',
    color: 'bg-blue-500 text-white',
    reasoning: 'Mantener contacto regular'
  },
  {
    id: 'quick_email',
    type: 'nurture_sequence',
    title: 'Enviar Email',
    description: 'Email personalizado de seguimiento',
    priority: 'medium',
    urgency: 'today',
    icon: '✉️',
    color: 'bg-gray-500 text-white',
    reasoning: 'Comunicación escrita de seguimiento'
  },
  {
    id: 'quick_meeting',
    type: 'schedule_meeting',
    title: 'Agendar Reunión',
    description: 'Programar meeting presencial/virtual',
    priority: 'high',
    urgency: 'this_week',
    icon: '📅',
    color: 'bg-green-500 text-white',
    reasoning: 'Reunión para avanzar en el proceso'
  }
];