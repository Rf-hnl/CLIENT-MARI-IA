/**
 * ANALYTICS SERVICE
 * 
 * Servicio principal para análisis avanzado y dashboard ejecutivo
 * Integra métricas de todas las fases (1-4) y proporciona insights con IA
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import {
  DashboardMetric,
  DashboardKPI,
  RealTimeMetrics,
  PerformanceAnalytics,
  LeadScore,
  SmartReport,
  ActivityFeed,
  AutoProgressionRule,
  AutoProgressionResult,
  MetricPeriod,
  MetricType,
  TrendDirection,
  SystemIntegration,
  ReportFinding,
  ReportRecommendation,
  DEFAULT_AI_INSIGHT_CONFIG
} from '@/types/analytics';

export class AnalyticsService {
  private openai: OpenAI;
  private cache: Map<string, { data: any; timestamp: Date; ttl: number }> = new Map();

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('📊 [ANALYTICS SERVICE] Initialized with AI insights enabled');
  }

  /**
   * Obtener métricas en tiempo real
   */
  async getRealTimeMetrics(tenantId: string, organizationId: string): Promise<RealTimeMetrics> {
    try {
      console.log('🔴 [ANALYTICS] Loading real-time metrics');

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Obtener datos base
      const [
        totalLeadsToday,
        completedCallsToday,
        failedCallsToday,
        avgCallDuration,
        activeQueueItems,
        recentActivity
      ] = await Promise.all([
        // Total leads created today
        prisma.lead.count({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: todayStart }
          }
        }),

        // Successful calls today
        prisma.leadCallLog.count({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: todayStart },
            outcome: 'completed'
          }
        }),

        // Failed calls today
        prisma.leadCallLog.count({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: todayStart },
            outcome: 'failed'
          }
        }),

        // Average call duration today
        prisma.leadCallLog.aggregate({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: todayStart },
            durationMinutes: { not: null }
          },
          _avg: {
            durationMinutes: true
          }
        }),

        // Active bulk call queue items
        prisma.bulkCallQueueItem.count({
          where: {
            status: 'PROCESSING',
            queue: {
              tenantId,
              organizationId
            }
          }
        }),

        // Recent activity
        this.getRecentActivity(tenantId, organizationId, 10)
      ]);

      const totalCallsToday = completedCallsToday + failedCallsToday;
      const conversionRate = totalCallsToday > 0 ? (completedCallsToday / totalCallsToday) * 100 : 0;

      // Hot leads - leads with high sentiment and engagement
      const hotLeads = await prisma.lead.count({
        where: {
          tenantId,
          organizationId,
          lastSentimentScore: { gte: 0.7 },
          lastEngagementScore: { gte: 80 },
          status: { notIn: ['won', 'lost', 'cold'] }
        }
      });

      const leadsInPipeline = await prisma.lead.count({
        where: {
          tenantId,
          organizationId,
          status: { notIn: ['won', 'lost', 'cold'] }
        }
      });

      const metrics: RealTimeMetrics = {
        timestamp: now,
        activeCalls: activeQueueItems,
        successfulCallsToday: completedCallsToday,
        failedCallsToday: failedCallsToday,
        averageCallDuration: Number(avgCallDuration._avg.durationMinutes) || 0,
        currentConversionRate: Math.round(conversionRate * 100) / 100,
        leadsInPipeline,
        hotLeads,
        recentActivity
      };

      console.log('✅ [ANALYTICS] Real-time metrics loaded:', {
        activeCalls: metrics.activeCalls,
        conversionRate: metrics.currentConversionRate + '%',
        hotLeads: metrics.hotLeads
      });

      return metrics;

    } catch (error) {
      console.error('❌ [ANALYTICS] Error loading real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis de performance por período
   */
  async getPerformanceAnalytics(
    tenantId: string,
    organizationId: string,
    period: MetricPeriod
  ): Promise<PerformanceAnalytics> {
    try {
      console.log('📈 [ANALYTICS] Loading performance analytics for period:', period);

      const { startDate, endDate } = this.getDateRange(period);

      // Métricas de volumen
      const [totalCalls, totalLeads, totalOpportunities] = await Promise.all([
        prisma.leadCallLog.count({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: startDate, lte: endDate }
          }
        }),

        prisma.lead.count({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: startDate, lte: endDate }
          }
        }),

        prisma.lead.count({
          where: {
            tenantId,
            organizationId,
            createdAt: { gte: startDate, lte: endDate },
            status: { in: ['qualified', 'proposal_sent', 'negotiation', 'won'] }
          }
        })
      ]);

      // Métricas de conversión
      const completedCalls = await prisma.leadCallLog.count({
        where: {
          tenantId,
          organizationId,
          createdAt: { gte: startDate, lte: endDate },
          outcome: 'completed'
        }
      });

      const wonLeads = await prisma.lead.count({
        where: {
          tenantId,
          organizationId,
          createdAt: { gte: startDate, lte: endDate },
          status: 'won'
        }
      });

      // Cálculo de rates
      const callToLeadRate = totalCalls > 0 ? (totalLeads / totalCalls) * 100 : 0;
      const leadToOpportunityRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;
      const opportunityToWinRate = totalOpportunities > 0 ? (wonLeads / totalOpportunities) * 100 : 0;
      const overallConversionRate = totalCalls > 0 ? (wonLeads / totalCalls) * 100 : 0;

      // Métricas de eficiencia
      const avgCallDurationResult = await prisma.leadCallLog.aggregate({
        where: {
          tenantId,
          organizationId,
          createdAt: { gte: startDate, lte: endDate },
          durationMinutes: { not: null }
        },
        _avg: { durationMinutes: true }
      });

      const avgCallsPerLead = totalLeads > 0 ? totalCalls / totalLeads : 0;

      // Métricas de calidad
      const avgSentimentResult = await prisma.lead.aggregate({
        where: {
          tenantId,
          organizationId,
          lastSentimentScore: { not: null },
          updatedAt: { gte: startDate, lte: endDate }
        },
        _avg: { lastSentimentScore: true, lastEngagementScore: true }
      });

      // Métricas de revenue (simplificadas)
      const totalRevenue = wonLeads * 5000; // Asumiendo $5k promedio
      const averageDealSize = 5000;
      const revenuePerLead = totalLeads > 0 ? totalRevenue / totalLeads : 0;
      const revenuePerCall = totalCalls > 0 ? totalRevenue / totalCalls : 0;

      const analytics: PerformanceAnalytics = {
        period,
        startDate,
        endDate,
        
        // Volume
        totalCalls,
        totalLeads,
        totalOpportunities,
        totalRevenue,
        
        // Conversion
        callToLeadRate: Math.round(callToLeadRate * 100) / 100,
        leadToOpportunityRate: Math.round(leadToOpportunityRate * 100) / 100,
        opportunityToWinRate: Math.round(opportunityToWinRate * 100) / 100,
        overallConversionRate: Math.round(overallConversionRate * 100) / 100,
        
        // Efficiency
        averageCallDuration: Number(avgCallDurationResult._avg.durationMinutes) || 0,
        callsPerLead: Math.round(avgCallsPerLead * 100) / 100,
        touchesToConversion: Math.round(avgCallsPerLead * 1.2), // Estimación
        salesCycleLength: 14, // Días promedio estimados
        
        // Quality
        averageSentiment: Number(avgSentimentResult._avg.lastSentimentScore) || 0,
        averageEngagement: Number(avgSentimentResult._avg.lastEngagementScore) || 0,
        scriptUsageRate: 85, // TODO: Calcular de personalization data
        personalizationImpact: 23, // TODO: Calcular basado en scripts vs no-scripts
        
        // Revenue
        averageDealSize,
        revenuePerLead: Math.round(revenuePerLead),
        revenuePerCall: Math.round(revenuePerCall),
        
        // Trends
        trendsOverTime: [], // TODO: Implementar trends históricos
        
        generatedAt: new Date()
      };

      console.log('✅ [ANALYTICS] Performance analytics loaded:', {
        period,
        conversionRate: analytics.overallConversionRate + '%',
        totalRevenue: '$' + analytics.totalRevenue.toLocaleString()
      });

      return analytics;

    } catch (error) {
      console.error('❌ [ANALYTICS] Error loading performance analytics:', error);
      throw error;
    }
  }

  /**
   * Calcular puntuación de lead con IA
   */
  async calculateLeadScore(leadId: string): Promise<LeadScore> {
    try {
      console.log('🎯 [ANALYTICS] Calculating AI lead score for:', leadId.slice(0, 8) + '...');

      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
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

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Calcular scores por factor
      const engagementScore = this.calculateEngagementScore(lead);
      const sentimentScore = this.calculateSentimentScore(lead);
      const behavioralScore = this.calculateBehavioralScore(lead);
      const firmographicScore = this.calculateFirmographicScore(lead);

      const totalScore = Math.round((engagementScore + sentimentScore + behavioralScore + firmographicScore) / 4);

      // Probabilidad de cierre usando IA
      const probabilityToClose = await this.calculateCloseProbabilityAI(lead);

      // Valor estimado
      const estimatedValue = this.calculateEstimatedValue(lead, totalScore);

      // Próximas acciones
      const recommendedActions = await this.generateRecommendedActions(lead, totalScore);

      const leadScore: LeadScore = {
        leadId,
        totalScore,
        factorScores: {
          engagement: engagementScore,
          sentiment: sentimentScore,
          behavioral: behavioralScore,
          firmographic: firmographicScore
        },
        riskFactors: this.identifyRiskFactors(lead),
        opportunities: this.identifyOpportunities(lead),
        recommendedActions,
        nextBestAction: recommendedActions[0]?.title || 'Contact lead',
        probabilityToClose,
        estimatedValue,
        estimatedCloseDate: this.estimateCloseDate(lead, probabilityToClose),
        lastUpdated: new Date()
      };

      console.log('✅ [ANALYTICS] Lead score calculated:', {
        totalScore: leadScore.totalScore,
        probability: Math.round(leadScore.probabilityToClose * 100) + '%',
        value: '$' + leadScore.estimatedValue.toLocaleString()
      });

      return leadScore;

    } catch (error) {
      console.error('❌ [ANALYTICS] Error calculating lead score:', error);
      throw error;
    }
  }

  /**
   * Generar reporte inteligente con IA
   */
  async generateSmartReport(
    tenantId: string,
    organizationId: string,
    type: SmartReport['type']
  ): Promise<SmartReport> {
    try {
      console.log('🤖 [ANALYTICS] Generating smart report:', type);

      // Obtener datos relevantes
      const performanceData = await this.getPerformanceAnalytics(tenantId, organizationId, 'weekly');
      const realTimeData = await this.getRealTimeMetrics(tenantId, organizationId);

      // Prompt para IA
      const reportPrompt = this.buildReportPrompt(type, performanceData, realTimeData);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un analista experto en ventas B2B. Genera un reporte ${type} con insights accionables.
            
            Responde SOLO con JSON válido:
            {
              "summary": "Resumen ejecutivo del reporte",
              "keyFindings": [
                {
                  "type": "insight|anomaly|trend|correlation|prediction",
                  "severity": "info|warning|critical",
                  "title": "Título del hallazgo",
                  "description": "Descripción detallada",
                  "confidence": 0.95
                }
              ],
              "recommendations": [
                {
                  "title": "Recomendación específica",
                  "description": "Descripción detallada",
                  "type": "process_improvement|resource_allocation|training|technology|strategy",
                  "effort": "low|medium|high",
                  "impact": "low|medium|high",
                  "timeline": "1 semana",
                  "priority": 8
                }
              ]
            }`
          },
          {
            role: 'user',
            content: reportPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      const reportData = this.parseAIResponse(aiResponse);

      const smartReport: SmartReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: this.getReportTitle(type),
        type,
        priority: this.determineReportPriority(reportData.keyFindings),
        summary: reportData.summary,
        keyFindings: reportData.keyFindings,
        recommendations: reportData.recommendations,
        generatedBy: 'ai',
        aiConfidence: this.calculateAverageConfidence(reportData.keyFindings),
        dataRange: {
          startDate: performanceData.startDate,
          endDate: performanceData.endDate
        },
        audience: 'manager',
        deliveryMethod: 'dashboard',
        createdAt: new Date()
      };

      console.log('✅ [ANALYTICS] Smart report generated:', {
        type: smartReport.type,
        findings: smartReport.keyFindings.length,
        recommendations: smartReport.recommendations.length,
        confidence: Math.round(smartReport.aiConfidence! * 100) + '%'
      });

      return smartReport;

    } catch (error) {
      console.error('❌ [ANALYTICS] Error generating smart report:', error);
      throw error;
    }
  }

  /**
   * Obtener actividad reciente
   */
  private async getRecentActivity(tenantId: string, organizationId: string, limit: number): Promise<ActivityFeed[]> {
    try {
      // Recent call completions
      const recentCalls = await prisma.leadCallLog.findMany({
        where: {
          tenantId,
          organizationId,
          outcome: 'completed',
          endTime: { not: null }
        },
        include: {
          lead: {
            select: { id: true, name: true }
          }
        },
        orderBy: { endTime: 'desc' },
        take: Math.floor(limit / 2)
      });

      // Recent calendar events
      const recentMeetings = await prisma.leadCalendarEvent.findMany({
        where: {
          lead: { tenantId, organizationId },
          completedAt: { not: null }
        },
        include: {
          lead: {
            select: { id: true, name: true }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: Math.floor(limit / 2)
      });

      const activities: ActivityFeed[] = [
        ...recentCalls.map(call => ({
          id: `call_${call.id}`,
          type: 'call_completed' as const,
          title: 'Llamada completada',
          description: `Llamada con ${call.lead.name} completada exitosamente`,
          leadId: call.leadId,
          leadName: call.lead.name,
          timestamp: call.endTime!,
          priority: 'medium' as const,
          icon: 'phone'
        })),
        
        ...recentMeetings.map(meeting => ({
          id: `meeting_${meeting.id}`,
          type: 'meeting_scheduled' as const,
          title: 'Reunión completada',
          description: `${meeting.title} con ${meeting.lead.name}`,
          leadId: meeting.leadId,
          leadName: meeting.lead.name,
          timestamp: meeting.completedAt!,
          priority: 'high' as const,
          icon: 'calendar'
        }))
      ];

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      console.warn('⚠️ [ANALYTICS] Error loading recent activity:', error);
      return [];
    }
  }

  /**
   * Calcular diferentes scores del lead
   */
  private calculateEngagementScore(lead: any): number {
    let score = 0;
    
    // Base score from engagement data
    if (lead.lastEngagementScore) {
      score += Math.min(lead.lastEngagementScore * 0.25, 25);
    }
    
    // Bonus for recent activity
    if (lead.lastContactDate) {
      const daysSince = (Date.now() - lead.lastContactDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) score += 5;
      else if (daysSince < 30) score += 2;
    }
    
    return Math.min(Math.round(score), 25);
  }

  private calculateSentimentScore(lead: any): number {
    if (!lead.lastSentimentScore) return 10; // Default neutral
    
    // Convert sentiment (-1 to 1) to score (0 to 25)
    const sentimentValue = Number(lead.lastSentimentScore);
    return Math.round(((sentimentValue + 1) / 2) * 25);
  }

  private calculateBehavioralScore(lead: any): number {
    let score = 10; // Base score
    
    // Response rate
    if (lead.responseRate) {
      score += Number(lead.responseRate) * 0.1;
    }
    
    // Call history
    const callCount = lead.callLogs?.length || 0;
    if (callCount > 3) score += 5;
    else if (callCount > 1) score += 2;
    
    // Calendar events (shows engagement)
    const eventCount = lead.calendarEvents?.length || 0;
    if (eventCount > 0) score += 5;
    
    return Math.min(Math.round(score), 25);
  }

  private calculateFirmographicScore(lead: any): number {
    let score = 15; // Base score
    
    // Company info available
    if (lead.company) score += 3;
    if (lead.position) score += 2;
    
    // Lead status progression
    const statusScores: Record<string, number> = {
      'new': 0,
      'contacted': 1,
      'interested': 3,
      'qualified': 5,
      'proposal_sent': 7,
      'negotiation': 9,
      'won': 10,
      'lost': -5,
      'cold': -2
    };
    
    score += statusScores[lead.status] || 0;
    
    return Math.min(Math.max(Math.round(score), 0), 25);
  }

  /**
   * Calcular probabilidad de cierre con IA
   */
  private async calculateCloseProbabilityAI(lead: any): Promise<number> {
    try {
      // Simplified calculation for now
      const baseScore = (lead.qualificationScore || 50) / 100;
      const sentimentBoost = (Number(lead.lastSentimentScore) || 0 + 1) / 2;
      const engagementBoost = (lead.lastEngagementScore || 50) / 100;
      
      const probability = (baseScore * 0.4) + (sentimentBoost * 0.3) + (engagementBoost * 0.3);
      
      return Math.min(Math.max(probability, 0), 1);
    } catch (error) {
      return 0.5; // Default 50%
    }
  }

  /**
   * Generar acciones recomendadas
   */
  private async generateRecommendedActions(lead: any, totalScore: number): Promise<any[]> {
    const actions = [];
    
    if (totalScore >= 80) {
      actions.push({
        id: 'close_deal',
        type: 'close',
        priority: 'urgent',
        title: 'Cerrar la venta',
        description: 'Lead altamente calificado, proceder al cierre',
        expectedOutcome: 'Conversión a cliente',
        estimatedEffort: 'medium',
        successProbability: 0.8,
        potentialImpact: 5,
        createdAt: new Date()
      });
    } else if (totalScore >= 60) {
      actions.push({
        id: 'schedule_demo',
        type: 'meeting',
        priority: 'high',
        title: 'Programar demostración',
        description: 'Lead calificado, agendar demo del producto',
        expectedOutcome: 'Progresión a propuesta',
        estimatedEffort: 'low',
        successProbability: 0.7,
        potentialImpact: 3,
        createdAt: new Date()
      });
    } else {
      actions.push({
        id: 'nurture_lead',
        type: 'nurture',
        priority: 'medium',
        title: 'Continuar nutriendo',
        description: 'Mantener contacto y proporcionar valor',
        expectedOutcome: 'Aumento en score',
        estimatedEffort: 'low',
        successProbability: 0.6,
        potentialImpact: 2,
        createdAt: new Date()
      });
    }
    
    return actions;
  }

  /**
   * Identificar factores de riesgo
   */
  private identifyRiskFactors(lead: any): any[] {
    const risks = [];
    
    if (lead.consecutiveFailures > 3) {
      risks.push({
        type: 'no_response',
        severity: 'high',
        description: 'Múltiples intentos fallidos de contacto',
        impact: -10,
        mitigation: 'Cambiar estrategia de contacto o timing',
        detectedAt: new Date()
      });
    }
    
    if (Number(lead.lastSentimentScore) < 0) {
      risks.push({
        type: 'negative_sentiment',
        severity: 'medium',
        description: 'Sentiment negativo en últimas interacciones',
        impact: -5,
        mitigation: 'Addressing concerns directamente',
        detectedAt: new Date()
      });
    }
    
    return risks;
  }

  /**
   * Identificar oportunidades
   */
  private identifyOpportunities(lead: any): any[] {
    const opportunities = [];
    
    if (Number(lead.lastSentimentScore) > 0.5) {
      opportunities.push({
        type: 'positive_sentiment',
        strength: 'strong',
        description: 'Sentiment muy positivo en interacciones recientes',
        impact: 10,
        actionable: true,
        detectedAt: new Date()
      });
    }
    
    if (lead.lastEngagementScore > 80) {
      opportunities.push({
        type: 'engagement_increase',
        strength: 'very_strong',
        description: 'Alto nivel de engagement detectado',
        impact: 15,
        actionable: true,
        detectedAt: new Date()
      });
    }
    
    return opportunities;
  }

  /**
   * Utilidades auxiliares
   */
  private getDateRange(period: MetricPeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    return { startDate, endDate };
  }

  private calculateEstimatedValue(lead: any, score: number): number {
    const baseValue = 5000; // $5k base
    const scoreMultiplier = score / 100;
    return Math.round(baseValue * scoreMultiplier);
  }

  private estimateCloseDate(lead: any, probability: number): Date | undefined {
    if (probability < 0.5) return undefined;
    
    const daysToClose = Math.round((1 - probability) * 60) + 7; // 7-67 days
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + daysToClose);
    
    return closeDate;
  }

  private buildReportPrompt(type: string, performance: PerformanceAnalytics, realTime: RealTimeMetrics): string {
    return `Genera un reporte de ${type} basado en estos datos:

RENDIMIENTO (${performance.period}):
- Llamadas totales: ${performance.totalCalls}
- Leads totales: ${performance.totalLeads}  
- Tasa de conversión: ${performance.overallConversionRate}%
- Revenue total: $${performance.totalRevenue}
- Duración promedio llamada: ${performance.averageCallDuration} min
- Sentiment promedio: ${performance.averageSentiment}

TIEMPO REAL:
- Llamadas exitosas hoy: ${realTime.successfulCallsToday}
- Llamadas fallidas hoy: ${realTime.failedCallsToday}
- Leads activos: ${realTime.leadsInPipeline}
- Hot leads: ${realTime.hotLeads}
- Tasa conversión actual: ${realTime.currentConversionRate}%

Identifica patrones, anomalías y oportunidades de mejora.`;
  }

  private getReportTitle(type: string): string {
    const titles = {
      performance: 'Análisis de Rendimiento',
      insights: 'Insights de Ventas',
      forecast: 'Pronóstico de Ventas',
      exception: 'Reporte de Excepciones',
      opportunity: 'Oportunidades Identificadas'
    };
    return titles[type as keyof typeof titles] || 'Reporte Inteligente';
  }

  private determineReportPriority(findings: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    
    if (criticalCount > 0) return 'critical';
    if (warningCount > 2) return 'high';
    if (warningCount > 0) return 'medium';
    return 'low';
  }

  private calculateAverageConfidence(findings: any[]): number {
    if (findings.length === 0) return 0.8;
    return findings.reduce((acc, f) => acc + (f.confidence || 0.8), 0) / findings.length;
  }

  private parseAIResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (error) {
      console.warn('⚠️ [ANALYTICS] Failed to parse AI response:', error);
      return { summary: 'Error parsing AI response', keyFindings: [], recommendations: [] };
    }
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 [ANALYTICS SERVICE] Cache cleared');
  }
}

export default AnalyticsService;