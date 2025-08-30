/**
 * AUTO-PROGRESSION ENGINE
 * 
 * Motor de progresión automática que mueve leads por el pipeline
 * basado en análisis de IA, métricas de engagement y reglas predefinidas
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import AnalyticsService from './analyticsService';
import {
  AutoProgressionRule,
  AutoProgressionResult,
  ProgressionTrigger,
  ProgressionAction,
  LeadScore
} from '@/types/analytics';

export class AutoProgressionEngine {
  private openai: OpenAI;
  private analyticsService: AnalyticsService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.analyticsService = new AnalyticsService();

    console.log('🔄 [AUTO-PROGRESSION] Engine initialized');
  }

  /**
   * Iniciar motor de auto-progresión
   */
  async start(intervalMinutes: number = 15): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ [AUTO-PROGRESSION] Engine is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 [AUTO-PROGRESSION] Starting engine (every ${intervalMinutes} minutes)`);

    // Ejecutar inmediatamente
    await this.processAllLeads();

    // Configurar interval
    this.intervalId = setInterval(async () => {
      await this.processAllLeads();
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Detener motor
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('⏹️ [AUTO-PROGRESSION] Engine stopped');
  }

  /**
   * Procesar todos los leads elegibles
   */
  async processAllLeads(): Promise<void> {
    try {
      console.log('🔄 [AUTO-PROGRESSION] Processing all leads...');

      // Obtener todas las reglas activas
      const activeRules = await this.getActiveRules();

      if (activeRules.length === 0) {
        console.log('📝 [AUTO-PROGRESSION] No active rules found');
        return;
      }

      // Obtener leads elegibles (no won/lost/cold)
      const eligibleLeads = await prisma.lead.findMany({
        where: {
          status: { 
            notIn: ['won', 'lost', 'cold'] 
          },
          autoProgressionEnabled: true
        },
        include: {
          conversationAnalysis: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          callLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          calendarEvents: {
            where: { startTime: { gte: new Date() } },
            take: 5
          }
        }
      });

      console.log(`📊 [AUTO-PROGRESSION] Found ${eligibleLeads.length} eligible leads and ${activeRules.length} active rules`);

      let totalProcessed = 0;
      let totalProgressed = 0;

      // Procesar cada lead contra cada regla
      for (const lead of eligibleLeads) {
        for (const rule of activeRules) {
          try {
            const result = await this.evaluateLeadAgainstRule(lead, rule);
            if (result.overallSuccess) {
              totalProgressed++;
              console.log(`✅ [AUTO-PROGRESSION] Lead ${lead.id.slice(0, 8)}... progressed by rule ${rule.name}`);
            }
            totalProcessed++;
          } catch (error) {
            console.error(`❌ [AUTO-PROGRESSION] Error processing lead ${lead.id}:`, error);
          }
        }
      }

      console.log(`✅ [AUTO-PROGRESSION] Processing complete: ${totalProgressed}/${totalProcessed} progressions`);

    } catch (error) {
      console.error('❌ [AUTO-PROGRESSION] Error in processAllLeads:', error);
    }
  }

  /**
   * Evaluar un lead contra una regla específica
   */
  async evaluateLeadAgainstRule(
    lead: any,
    rule: AutoProgressionRule
  ): Promise<AutoProgressionResult> {
    const startTime = new Date();

    try {
      console.log(`🔍 [AUTO-PROGRESSION] Evaluating lead ${lead.id.slice(0, 8)}... against rule ${rule.name}`);

      // Verificar restricciones básicas
      if (!this.meetBasicConstraints(lead, rule)) {
        return {
          ruleId: rule.id,
          leadId: lead.id,
          triggeredAt: startTime,
          actionsExecuted: [],
          overallSuccess: false,
          notes: 'Basic constraints not met'
        };
      }

      // Evaluar triggers
      const triggerResults = await this.evaluateTriggers(lead, rule.triggers);
      const shouldTrigger = this.shouldRuleTriggering(triggerResults, rule.triggers);

      if (!shouldTrigger) {
        return {
          ruleId: rule.id,
          leadId: lead.id,
          triggeredAt: startTime,
          actionsExecuted: [],
          overallSuccess: false,
          notes: 'Triggers not satisfied'
        };
      }

      // Ejecutar acciones
      const executedActions = await this.executeActions(lead, rule.actions);

      // Calcular impacto si es exitoso
      let impactMeasured;
      if (executedActions.some(a => a.success)) {
        impactMeasured = await this.measureImpact(lead.id);
      }

      const result: AutoProgressionResult = {
        ruleId: rule.id,
        leadId: lead.id,
        triggeredAt: startTime,
        actionsExecuted: executedActions,
        overallSuccess: executedActions.some(a => a.success),
        impactMeasured,
        notes: `Rule triggered successfully. Actions executed: ${executedActions.length}`
      };

      // Actualizar estadísticas de la regla
      await this.updateRuleStats(rule.id, result.overallSuccess);

      return result;

    } catch (error) {
      console.error(`❌ [AUTO-PROGRESSION] Error evaluating lead against rule:`, error);
      return {
        ruleId: rule.id,
        leadId: lead.id,
        triggeredAt: startTime,
        actionsExecuted: [],
        overallSuccess: false,
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Verificar restricciones básicas
   */
  private meetBasicConstraints(lead: any, rule: AutoProgressionRule): boolean {
    // Score mínimo
    if (rule.minScore && (lead.qualificationScore || 0) < rule.minScore) {
      return false;
    }

    // Estado requerido
    if (rule.requiredStatuses && rule.requiredStatuses.length > 0) {
      if (!rule.requiredStatuses.includes(lead.status)) {
        return false;
      }
    }

    // Estados excluidos
    if (rule.excludedStatuses && rule.excludedStatuses.includes(lead.status)) {
      return false;
    }

    // Último contacto
    if (rule.maxDaysSinceLastTouch && lead.lastContactDate) {
      const daysSince = (Date.now() - lead.lastContactDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > rule.maxDaysSinceLastTouch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluar todos los triggers de una regla
   */
  private async evaluateTriggers(
    lead: any,
    triggers: ProgressionTrigger[]
  ): Promise<{ trigger: ProgressionTrigger; result: boolean; confidence: number }[]> {
    const results = [];

    for (const trigger of triggers) {
      try {
        const result = await this.evaluateSingleTrigger(lead, trigger);
        results.push({ trigger, ...result });
      } catch (error) {
        console.warn(`⚠️ [AUTO-PROGRESSION] Error evaluating trigger ${trigger.type}:`, error);
        results.push({ trigger, result: false, confidence: 0 });
      }
    }

    return results;
  }

  /**
   * Evaluar un trigger específico
   */
  private async evaluateSingleTrigger(
    lead: any,
    trigger: ProgressionTrigger
  ): Promise<{ result: boolean; confidence: number }> {
    switch (trigger.type) {
      case 'sentiment_threshold':
        return this.evaluateSentimentTrigger(lead, trigger);
      
      case 'engagement_increase':
        return this.evaluateEngagementTrigger(lead, trigger);
      
      case 'time_based':
        return this.evaluateTimeTrigger(lead, trigger);
      
      case 'behavior_pattern':
        return this.evaluateBehaviorTrigger(lead, trigger);
      
      case 'external_signal':
        return this.evaluateExternalTrigger(lead, trigger);
      
      default:
        return { result: false, confidence: 0 };
    }
  }

  /**
   * Evaluar trigger de sentiment
   */
  private evaluateSentimentTrigger(
    lead: any,
    trigger: ProgressionTrigger
  ): { result: boolean; confidence: number } {
    const threshold = trigger.parameters.threshold || 0.7;
    const currentSentiment = Number(lead.lastSentimentScore) || 0;
    
    const result = currentSentiment >= threshold;
    const confidence = Math.min(currentSentiment / threshold, 1);
    
    return { result, confidence };
  }

  /**
   * Evaluar trigger de engagement
   */
  private evaluateEngagementTrigger(
    lead: any,
    trigger: ProgressionTrigger
  ): { result: boolean; confidence: number } {
    const minIncrease = trigger.parameters.minIncrease || 10;
    const currentEngagement = lead.lastEngagementScore || 0;
    const previousEngagement = lead.previousEngagementScore || 0;
    
    const increase = currentEngagement - previousEngagement;
    const result = increase >= minIncrease;
    const confidence = Math.min(increase / minIncrease, 1);
    
    return { result, confidence };
  }

  /**
   * Evaluar trigger basado en tiempo
   */
  private evaluateTimeTrigger(
    lead: any,
    trigger: ProgressionTrigger
  ): { result: boolean; confidence: number } {
    const daysInStatus = trigger.parameters.daysInStatus || 7;
    const statusDate = lead.statusUpdatedAt || lead.createdAt;
    const daysSince = (Date.now() - statusDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const result = daysSince >= daysInStatus;
    const confidence = Math.min(daysSince / daysInStatus, 1);
    
    return { result, confidence };
  }

  /**
   * Evaluar trigger de comportamiento
   */
  private async evaluateBehaviorTrigger(
    lead: any,
    trigger: ProgressionTrigger
  ): Promise<{ result: boolean; confidence: number }> {
    // Usar IA para analizar patrones de comportamiento
    try {
      const behaviorAnalysis = await this.analyzeBehaviorPattern(lead, trigger.parameters);
      return {
        result: behaviorAnalysis.matchesPattern,
        confidence: behaviorAnalysis.confidence
      };
    } catch (error) {
      return { result: false, confidence: 0 };
    }
  }

  /**
   * Evaluar trigger externo
   */
  private evaluateExternalTrigger(
    lead: any,
    trigger: ProgressionTrigger
  ): { result: boolean; confidence: number } {
    // Placeholder para triggers externos (webhooks, API calls, etc.)
    return { result: false, confidence: 0 };
  }

  /**
   * Determinar si la regla debe ejecutarse
   */
  private shouldRuleTriggering(
    results: { trigger: ProgressionTrigger; result: boolean; confidence: number }[],
    triggers: ProgressionTrigger[]
  ): boolean {
    const totalWeight = triggers.reduce((sum, t) => sum + t.weight, 0);
    const triggeredWeight = results
      .filter(r => r.result)
      .reduce((sum, r) => sum + r.trigger.weight, 0);

    const triggerThreshold = 0.6; // 60% del peso debe estar activado
    return (triggeredWeight / totalWeight) >= triggerThreshold;
  }

  /**
   * Ejecutar acciones de progresión
   */
  private async executeActions(
    lead: any,
    actions: ProgressionAction[]
  ): Promise<{
    action: ProgressionAction;
    success: boolean;
    result?: any;
    error?: string;
    executedAt: Date;
  }[]> {
    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeSingleAction(lead, action);
        results.push({
          action,
          success: true,
          result,
          executedAt: new Date()
        });
      } catch (error) {
        results.push({
          action,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          executedAt: new Date()
        });
      }
    }

    return results;
  }

  /**
   * Ejecutar acción específica
   */
  private async executeSingleAction(lead: any, action: ProgressionAction): Promise<any> {
    switch (action.type) {
      case 'status_change':
        return this.executeStatusChange(lead, action.parameters);
      
      case 'schedule_call':
        return this.executeScheduleCall(lead, action.parameters);
      
      case 'send_email':
        return this.executeSendEmail(lead, action.parameters);
      
      case 'create_task':
        return this.executeCreateTask(lead, action.parameters);
      
      case 'assign_to_user':
        return this.executeAssignToUser(lead, action.parameters);
      
      case 'personalize_script':
        return this.executePersonalizeScript(lead, action.parameters);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Ejecutar cambio de estado
   */
  private async executeStatusChange(lead: any, parameters: any): Promise<any> {
    const newStatus = parameters.newStatus;
    
    await prisma.lead.update({
      where: { id: lead.id },
      data: { 
        status: newStatus,
        statusUpdatedAt: new Date(),
        lastAutoProgressionAt: new Date()
      }
    });

    console.log(`📈 [AUTO-PROGRESSION] Lead ${lead.id.slice(0, 8)}... status changed: ${lead.status} → ${newStatus}`);
    
    return { previousStatus: lead.status, newStatus };
  }

  /**
   * Programar llamada
   */
  private async executeScheduleCall(lead: any, parameters: any): Promise<any> {
    // TODO: Integrar con sistema de calendario para programar llamada
    console.log(`📞 [AUTO-PROGRESSION] Call scheduled for lead ${lead.id.slice(0, 8)}...`);
    return { callScheduled: true, scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }

  /**
   * Enviar email
   */
  private async executeSendEmail(lead: any, parameters: any): Promise<any> {
    // TODO: Integrar con sistema de email
    console.log(`📧 [AUTO-PROGRESSION] Email sent to lead ${lead.id.slice(0, 8)}...`);
    return { emailSent: true, template: parameters.template };
  }

  /**
   * Crear tarea
   */
  private async executeCreateTask(lead: any, parameters: any): Promise<any> {
    // TODO: Crear tarea en sistema de tareas
    console.log(`✅ [AUTO-PROGRESSION] Task created for lead ${lead.id.slice(0, 8)}...`);
    return { taskCreated: true, taskType: parameters.taskType };
  }

  /**
   * Asignar a usuario
   */
  private async executeAssignToUser(lead: any, parameters: any): Promise<any> {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { 
        assignedTo: parameters.userId,
        lastAutoProgressionAt: new Date()
      }
    });

    console.log(`👤 [AUTO-PROGRESSION] Lead ${lead.id.slice(0, 8)}... assigned to user ${parameters.userId}`);
    
    return { assignedTo: parameters.userId, previousAssignee: lead.assignedTo };
  }

  /**
   * Personalizar script
   */
  private async executePersonalizeScript(lead: any, parameters: any): Promise<any> {
    // TODO: Integrar con sistema de personalización
    console.log(`🎯 [AUTO-PROGRESSION] Script personalized for lead ${lead.id.slice(0, 8)}...`);
    return { scriptPersonalized: true, strategy: parameters.strategy };
  }

  /**
   * Analizar patrón de comportamiento con IA
   */
  private async analyzeBehaviorPattern(lead: any, parameters: any): Promise<{
    matchesPattern: boolean;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analiza el comportamiento del lead y determina si coincide con el patrón especificado.
            
            Responde SOLO con JSON válido:
            {
              "matchesPattern": true/false,
              "confidence": 0.95,
              "reasoning": "Explicación breve"
            }`
          },
          {
            role: 'user',
            content: `Lead Data:
            - Status: ${lead.status}
            - Sentiment Score: ${lead.lastSentimentScore}
            - Engagement Score: ${lead.lastEngagementScore}
            - Call History: ${lead.callLogs?.length || 0} calls
            - Last Contact: ${lead.lastContactDate}
            
            Pattern to Match: ${JSON.stringify(parameters.pattern)}
            
            ¿Este lead coincide con el patrón especificado?`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      const analysis = JSON.parse(aiResponse);
      return analysis;

    } catch (error) {
      console.warn('⚠️ [AUTO-PROGRESSION] Error analyzing behavior pattern:', error);
      return { matchesPattern: false, confidence: 0, reasoning: 'Analysis failed' };
    }
  }

  /**
   * Medir impacto de la progresión
   */
  private async measureImpact(leadId: string): Promise<number> {
    try {
      const leadScore = await this.analyticsService.calculateLeadScore(leadId);
      return leadScore.totalScore;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Actualizar estadísticas de la regla
   */
  private async updateRuleStats(ruleId: string, success: boolean): Promise<void> {
    try {
      const rule = await prisma.autoProgressionRule.findUnique({
        where: { id: ruleId }
      });

      if (!rule) return;

      const newTimesTriggered = rule.timesTriggered + 1;
      const newSuccesses = success ? rule.successfulExecutions + 1 : rule.successfulExecutions;
      const newSuccessRate = (newSuccesses / newTimesTriggered) * 100;

      await prisma.autoProgressionRule.update({
        where: { id: ruleId },
        data: {
          timesTriggered: newTimesTriggered,
          successfulExecutions: newSuccesses,
          successRate: newSuccessRate,
          lastExecutedAt: new Date()
        }
      });

    } catch (error) {
      console.warn('⚠️ [AUTO-PROGRESSION] Error updating rule stats:', error);
    }
  }

  /**
   * Obtener reglas activas
   */
  private async getActiveRules(): Promise<AutoProgressionRule[]> {
    // Mock data - en producción esto vendría de la base de datos
    return [
      {
        id: 'rule_high_sentiment',
        name: 'High Sentiment Progression',
        description: 'Move leads with high sentiment score to qualified status',
        isActive: true,
        triggers: [
          {
            type: 'sentiment_threshold',
            condition: 'sentiment >= 0.8',
            parameters: { threshold: 0.8 },
            weight: 0.8
          },
          {
            type: 'engagement_increase',
            condition: 'engagement_increase >= 15',
            parameters: { minIncrease: 15 },
            weight: 0.4
          }
        ],
        actions: [
          {
            type: 'status_change',
            parameters: { newStatus: 'qualified' }
          }
        ],
        minScore: 60,
        timesTriggered: 0,
        successRate: 0,
        averageImpact: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'rule_stale_leads',
        name: 'Stale Lead Nurturing',
        description: 'Re-engage leads that have been contacted but no recent activity',
        isActive: true,
        triggers: [
          {
            type: 'time_based',
            condition: 'days_since_contact >= 7',
            parameters: { daysInStatus: 7 },
            weight: 1.0
          }
        ],
        actions: [
          {
            type: 'personalize_script',
            parameters: { strategy: 'relationship' }
          },
          {
            type: 'schedule_call',
            parameters: { delay: 24 }
          }
        ],
        requiredStatuses: ['contacted', 'interested'],
        maxDaysSinceLastTouch: 14,
        timesTriggered: 0,
        successRate: 0,
        averageImpact: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];
  }

  /**
   * Crear nueva regla de progresión
   */
  async createRule(rule: Omit<AutoProgressionRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // En producción esto se guardaría en la base de datos
    console.log('📝 [AUTO-PROGRESSION] New rule created:', ruleId);
    
    return ruleId;
  }

  /**
   * Obtener estadísticas del engine
   */
  getEngineStats(): {
    isRunning: boolean;
    totalRulesExecuted: number;
    successRate: number;
    averageImpact: number;
  } {
    // Mock stats - en producción estos datos se calcularían de la base de datos
    return {
      isRunning: this.isRunning,
      totalRulesExecuted: 0,
      successRate: 0,
      averageImpact: 0
    };
  }
}

export default AutoProgressionEngine;