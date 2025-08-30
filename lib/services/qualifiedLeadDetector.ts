/**
 * QUALIFIED LEAD DETECTOR SERVICE
 * 
 * Servicio para detectar automáticamente leads calificados
 * basándose en análisis de sentiment y momentos críticos
 */

import { prisma } from '@/lib/prisma';
import { 
  QualifiedLeadDetection, 
  QualifiedLeadCriteria, 
  FollowUpType, 
  CalendarEventPriority,
  SentimentBasedScheduling 
} from '@/types/calendar';

export class QualifiedLeadDetector {
  private defaultCriteria: QualifiedLeadCriteria = {
    minSentimentScore: 0.4,           // Sentiment mínimo positivo
    minEngagementScore: 60,           // Score de engagement mínimo
    requiredBuyingSignals: ['interest_peak', 'buying_signal'], // Momentos críticos requeridos
    excludeStatuses: ['won', 'lost', 'cold'], // Estados a excluir
    daysSinceLastContact: 7,          // Máximo días desde último contacto
    criticalMomentTypes: ['buying_signal', 'interest_peak'] // Tipos de momentos críticos relevantes
  };

  constructor(private criteria: QualifiedLeadCriteria = {}) {
    this.criteria = { ...this.defaultCriteria, ...criteria };
  }

  /**
   * Detectar todos los leads calificados para una organización
   */
  async detectQualifiedLeads(
    tenantId: string, 
    organizationId: string,
    customCriteria?: Partial<QualifiedLeadCriteria>
  ): Promise<QualifiedLeadDetection[]> {
    const criteria = { ...this.criteria, ...customCriteria };
    
    try {
      console.log('🎯 [QUALIFIED DETECTOR] Starting qualified lead detection', {
        tenantId: tenantId.slice(0, 8) + '...',
        organizationId: organizationId.slice(0, 8) + '...',
        criteria
      });

      // 1. Obtener leads candidatos con análisis de sentiment
      const candidateLeads = await this.getCandidateLeads(tenantId, organizationId, criteria);
      
      console.log(`🔍 [QUALIFIED DETECTOR] Found ${candidateLeads.length} candidate leads`);

      if (candidateLeads.length === 0) {
        return [];
      }

      // 2. Analizar cada lead candidato
      const qualifiedLeads: QualifiedLeadDetection[] = [];

      for (const lead of candidateLeads) {
        try {
          const qualification = await this.analyzeLeadQualification(lead, criteria);
          if (qualification && qualification.qualificationScore >= 70) {
            qualifiedLeads.push(qualification);
          }
        } catch (error) {
          console.warn(`⚠️ [QUALIFIED DETECTOR] Error analyzing lead ${lead.id}:`, error);
          continue;
        }
      }

      // 3. Ordenar por score de calificación
      qualifiedLeads.sort((a, b) => b.qualificationScore - a.qualificationScore);

      console.log(`✅ [QUALIFIED DETECTOR] Detected ${qualifiedLeads.length} qualified leads`);
      
      return qualifiedLeads;

    } catch (error) {
      console.error('❌ [QUALIFIED DETECTOR] Error in detection process:', error);
      throw new Error(`Failed to detect qualified leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Obtener leads candidatos basándose en criterios básicos
   */
  private async getCandidateLeads(
    tenantId: string, 
    organizationId: string, 
    criteria: QualifiedLeadCriteria
  ) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.daysSinceLastContact);

    return await prisma.lead.findMany({
      where: {
        tenantId,
        organizationId,
        status: {
          notIn: criteria.excludeStatuses
        },
        lastSentimentScore: {
          gte: criteria.minSentimentScore
        },
        lastEngagementScore: {
          gte: criteria.minEngagementScore
        },
        OR: [
          { lastContactDate: { gte: cutoffDate } },
          { lastContactDate: null } // Incluir leads sin contacto previo
        ]
      },
      include: {
        conversationAnalysis: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Últimos 3 análisis
        },
        callLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Últimos 5 call logs
        }
      }
    });
  }

  /**
   * Analizar si un lead específico está calificado
   */
  private async analyzeLeadQualification(
    lead: any, 
    criteria: QualifiedLeadCriteria
  ): Promise<QualifiedLeadDetection | null> {
    const reasons: string[] = [];
    let qualificationScore = 0;

    // 1. Analizar sentiment score
    const sentimentScore = lead.lastSentimentScore || 0;
    if (sentimentScore >= criteria.minSentimentScore) {
      qualificationScore += 25;
      reasons.push(`Sentiment positivo: ${sentimentScore.toFixed(2)}`);
    }

    // 2. Analizar engagement score
    const engagementScore = lead.lastEngagementScore || 0;
    if (engagementScore >= criteria.minEngagementScore) {
      qualificationScore += 20;
      reasons.push(`Alto engagement: ${engagementScore}%`);
    }

    // 3. Analizar momentos críticos en conversaciones
    const criticalMoments = this.extractCriticalMoments(lead.conversationAnalysis);
    const relevantMoments = criticalMoments.filter(moment => 
      criteria.criticalMomentTypes.includes(moment.type)
    );

    if (relevantMoments.length > 0) {
      qualificationScore += relevantMoments.length * 15;
      reasons.push(`${relevantMoments.length} momentos críticos detectados`);
    }

    // 4. Analizar frecuencia de interacciones
    const recentCallLogs = lead.callLogs?.filter((call: any) => {
      const callDate = new Date(call.createdAt);
      const daysSince = (Date.now() - callDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= criteria.daysSinceLastContact;
    }) || [];

    if (recentCallLogs.length > 1) {
      qualificationScore += 10;
      reasons.push(`${recentCallLogs.length} llamadas recientes`);
    }

    // 5. Analizar progresión en el pipeline
    const statusScore = this.getStatusProgressionScore(lead.status);
    qualificationScore += statusScore;

    if (statusScore > 0) {
      reasons.push(`Estado avanzado en pipeline: ${lead.status}`);
    }

    // 6. Determinar tipo de seguimiento sugerido
    const suggestedFollowUpType = this.determineSuggestedFollowUp(
      lead, 
      criticalMoments, 
      sentimentScore
    );

    // 7. Determinar prioridad
    const suggestedPriority = this.determinePriority(
      qualificationScore, 
      sentimentScore, 
      relevantMoments.length
    );

    // Solo retornar si cumple el threshold mínimo
    if (qualificationScore < 70) {
      return null;
    }

    const lastCriticalMoment = relevantMoments.length > 0 ? 
      relevantMoments[relevantMoments.length - 1] : undefined;

    return {
      leadId: lead.id,
      qualificationScore,
      reasons,
      suggestedFollowUpType,
      suggestedPriority,
      sentimentScore,
      engagementScore,
      lastCriticalMoment
    };
  }

  /**
   * Extraer momentos críticos de los análisis de conversación
   */
  private extractCriticalMoments(conversationAnalyses: any[]): Array<{
    type: string;
    description: string;
    timePoint: number;
  }> {
    const criticalMoments: Array<{
      type: string;
      description: string;
      timePoint: number;
    }> = [];

    for (const analysis of conversationAnalyses) {
      if (analysis.rawAnalysis?.temporalSentiment?.timeline?.criticalMoments) {
        const moments = analysis.rawAnalysis.temporalSentiment.timeline.criticalMoments;
        criticalMoments.push(...moments);
      }
    }

    // Ordenar por tiempo más reciente
    return criticalMoments.sort((a, b) => b.timePoint - a.timePoint);
  }

  /**
   * Determinar score basado en el estado del lead en el pipeline
   */
  private getStatusProgressionScore(status: string): number {
    const statusScores: Record<string, number> = {
      'new': 5,
      'interested': 10,
      'qualified': 15,
      'follow_up': 12,
      'proposal_current': 20,
      'negotiation': 25,
      'nurturing': 8,
      'cold': 0,
      'lost': 0,
      'won': 0
    };

    return statusScores[status] || 5;
  }

  /**
   * Determinar tipo de seguimiento sugerido
   */
  private determineSuggestedFollowUp(
    lead: any, 
    criticalMoments: any[], 
    sentimentScore: number
  ): FollowUpType {
    const status = lead.status;
    
    // Basado en momentos críticos recientes
    const recentMoments = criticalMoments.slice(0, 2);
    const hasBuyingSignal = recentMoments.some(m => m.type === 'buying_signal');
    const hasInterestPeak = recentMoments.some(m => m.type === 'interest_peak');

    // Lógica de determinación
    if (hasBuyingSignal && sentimentScore > 0.6) {
      return status === 'negotiation' ? 'closing' : 'demo';
    }

    if (hasInterestPeak) {
      return status === 'new' || status === 'interested' ? 'discovery' : 'proposal';
    }

    if (status === 'proposal_current') {
      return 'follow_up';
    }

    if (status === 'qualified') {
      return 'demo';
    }

    if (sentimentScore > 0.5) {
      return 'follow_up';
    }

    return 'nurturing';
  }

  /**
   * Determinar prioridad basada en los factores de calificación
   */
  private determinePriority(
    qualificationScore: number, 
    sentimentScore: number, 
    criticalMomentsCount: number
  ): CalendarEventPriority {
    if (qualificationScore >= 90 && sentimentScore > 0.7) {
      return 'urgent';
    }

    if (qualificationScore >= 80 && criticalMomentsCount >= 2) {
      return 'high';
    }

    if (qualificationScore >= 70) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Analizar lead específico y generar recomendación de programación
   */
  async generateSchedulingRecommendation(
    leadId: string,
    conversationId?: string
  ): Promise<SentimentBasedScheduling | null> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          conversationAnalysis: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!lead || !lead.conversationAnalysis.length) {
        return null;
      }

      const analysis = lead.conversationAnalysis[0];
      const sentimentScore = lead.lastSentimentScore || 0;
      
      // Extraer momentos críticos
      const criticalMoments = this.extractCriticalMoments([analysis]);

      // Determinar acción recomendada
      let recommendedAction: SentimentBasedScheduling['recommendedAction'] = 'no_action';
      let urgency: SentimentBasedScheduling['urgency'] = 'low';
      let reasoning = 'Score de sentiment bajo';

      if (sentimentScore > 0.7) {
        recommendedAction = 'schedule_immediately';
        urgency = 'high';
        reasoning = 'Sentiment muy positivo, programar inmediatamente';
      } else if (sentimentScore > 0.4) {
        recommendedAction = 'schedule_follow_up';
        urgency = 'medium';
        reasoning = 'Sentiment positivo, programar seguimiento';
      } else if (sentimentScore > 0) {
        recommendedAction = 'nurture';
        urgency = 'low';
        reasoning = 'Sentiment neutral, mantener en nurturing';
      }

      // Ajustar basado en momentos críticos
      const hasBuyingSignals = criticalMoments.some(m => m.type === 'buying_signal');
      if (hasBuyingSignals) {
        recommendedAction = 'schedule_immediately';
        urgency = 'urgent';
        reasoning = 'Señales de compra detectadas, acción inmediata requerida';
      }

      const suggestedFollowUpType = this.determineSuggestedFollowUp(
        lead, 
        criticalMoments, 
        sentimentScore
      );

      return {
        leadId,
        conversationId: conversationId || analysis.conversationId,
        sentimentScore,
        criticalMoments: criticalMoments.slice(0, 3), // Top 3
        recommendedAction,
        suggestedFollowUpType,
        urgency,
        reasoning
      };

    } catch (error) {
      console.error('❌ [QUALIFIED DETECTOR] Error generating scheduling recommendation:', error);
      return null;
    }
  }

  /**
   * Actualizar criterios de calificación
   */
  updateCriteria(newCriteria: Partial<QualifiedLeadCriteria>): void {
    this.criteria = { ...this.criteria, ...newCriteria };
    console.log('📝 [QUALIFIED DETECTOR] Criteria updated:', this.criteria);
  }

  /**
   * Obtener estadísticas de calificación
   */
  async getQualificationStats(
    tenantId: string, 
    organizationId: string
  ): Promise<{
    totalLeads: number;
    qualifiedLeads: number;
    qualificationRate: number;
    averageSentimentScore: number;
    averageEngagementScore: number;
    leadsByPriority: Record<CalendarEventPriority, number>;
  }> {
    try {
      const [totalLeads, qualifiedLeads] = await Promise.all([
        prisma.lead.count({
          where: {
            tenantId,
            organizationId,
            status: { notIn: ['won', 'lost', 'cold'] }
          }
        }),
        this.detectQualifiedLeads(tenantId, organizationId)
      ]);

      const averageSentiment = await prisma.lead.aggregate({
        where: {
          tenantId,
          organizationId,
          lastSentimentScore: { not: null }
        },
        _avg: {
          lastSentimentScore: true,
          lastEngagementScore: true
        }
      });

      const leadsByPriority = qualifiedLeads.reduce((acc, lead) => {
        acc[lead.suggestedPriority] = (acc[lead.suggestedPriority] || 0) + 1;
        return acc;
      }, {} as Record<CalendarEventPriority, number>);

      // Llenar valores faltantes
      ['low', 'medium', 'high', 'urgent'].forEach(priority => {
        if (!(priority in leadsByPriority)) {
          leadsByPriority[priority as CalendarEventPriority] = 0;
        }
      });

      return {
        totalLeads,
        qualifiedLeads: qualifiedLeads.length,
        qualificationRate: totalLeads > 0 ? (qualifiedLeads.length / totalLeads) * 100 : 0,
        averageSentimentScore: Number(averageSentiment._avg.lastSentimentScore) || 0,
        averageEngagementScore: Number(averageSentiment._avg.lastEngagementScore) || 0,
        leadsByPriority
      };

    } catch (error) {
      console.error('❌ [QUALIFIED DETECTOR] Error getting qualification stats:', error);
      throw error;
    }
  }
}

export default QualifiedLeadDetector;