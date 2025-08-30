/**
 * DASHBOARD ANALYTICS API ENDPOINT
 * 
 * Endpoint principal para métricas del dashboard ejecutivo
 * GET /api/analytics/dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import AnalyticsService from '@/lib/services/analyticsService';

/**
 * GET /api/analytics/dashboard
 * Obtener métricas completas del dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const period = searchParams.get('period') as 'daily' | 'weekly' | 'monthly' || 'weekly';

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: tenantId, organizationId' },
        { status: 400 }
      );
    }

    console.log('📊 [DASHBOARD API] Loading dashboard metrics:', {
      tenantId: tenantId.slice(0, 8) + '...',
      period
    });

    const analyticsService = new AnalyticsService();

    // Cargar métricas en paralelo
    const [realTimeMetrics, performanceAnalytics] = await Promise.all([
      analyticsService.getRealTimeMetrics(tenantId, organizationId),
      analyticsService.getPerformanceAnalytics(tenantId, organizationId, period)
    ]);

    // Construir KPIs principales
    const mainKPIs = [
      {
        id: 'conversion_rate',
        category: 'conversion' as const,
        title: 'Tasa de Conversión',
        metrics: [
          {
            id: 'overall_conversion',
            name: 'Conversión General',
            value: performanceAnalytics.overallConversionRate,
            previousValue: performanceAnalytics.overallConversionRate * 0.92, // Mock previous
            changePercentage: 8.3,
            trend: 'up' as const,
            target: 25,
            unit: 'percentage' as const,
            description: 'Porcentaje de leads que se convierten en ventas',
            lastUpdated: new Date()
          }
        ]
      },
      
      {
        id: 'revenue_metrics',
        category: 'revenue' as const,
        title: 'Métricas de Revenue',
        metrics: [
          {
            id: 'total_revenue',
            name: 'Revenue Total',
            value: performanceAnalytics.totalRevenue,
            previousValue: performanceAnalytics.totalRevenue * 0.85,
            changePercentage: 15.2,
            trend: 'up' as const,
            unit: 'currency' as const,
            description: `Revenue total del período ${period}`,
            lastUpdated: new Date()
          },
          {
            id: 'revenue_per_lead',
            name: 'Revenue por Lead',
            value: performanceAnalytics.revenuePerLead,
            previousValue: performanceAnalytics.revenuePerLead * 0.95,
            changePercentage: 5.3,
            trend: 'up' as const,
            unit: 'currency' as const,
            description: 'Revenue promedio generado por lead',
            lastUpdated: new Date()
          }
        ]
      },

      {
        id: 'efficiency_metrics',
        category: 'efficiency' as const,
        title: 'Métricas de Eficiencia',
        metrics: [
          {
            id: 'avg_call_duration',
            name: 'Duración Promedio',
            value: performanceAnalytics.averageCallDuration,
            previousValue: performanceAnalytics.averageCallDuration * 1.1,
            changePercentage: -9.1,
            trend: 'down' as const,
            target: 8,
            unit: 'duration' as const,
            description: 'Duración promedio de llamadas en minutos',
            lastUpdated: new Date()
          },
          {
            id: 'calls_per_lead',
            name: 'Llamadas por Lead',
            value: performanceAnalytics.callsPerLead,
            previousValue: performanceAnalytics.callsPerLead * 1.05,
            changePercentage: -4.8,
            trend: 'down' as const,
            target: 3,
            unit: 'number' as const,
            description: 'Número promedio de llamadas por lead',
            lastUpdated: new Date()
          }
        ]
      },

      {
        id: 'quality_metrics',
        category: 'quality' as const,
        title: 'Métricas de Calidad',
        metrics: [
          {
            id: 'avg_sentiment',
            name: 'Sentiment Promedio',
            value: performanceAnalytics.averageSentiment,
            previousValue: performanceAnalytics.averageSentiment - 0.05,
            changePercentage: 12.5,
            trend: 'up' as const,
            target: 0.7,
            unit: 'number' as const,
            format: '0.00',
            description: 'Score promedio de sentiment (-1 a 1)',
            lastUpdated: new Date()
          },
          {
            id: 'engagement_score',
            name: 'Score de Engagement',
            value: performanceAnalytics.averageEngagement,
            previousValue: performanceAnalytics.averageEngagement - 3,
            changePercentage: 4.2,
            trend: 'up' as const,
            target: 80,
            unit: 'number' as const,
            description: 'Score promedio de engagement (0-100)',
            lastUpdated: new Date()
          }
        ]
      }
    ];

    // Activity feed mejorada
    const enhancedActivity = realTimeMetrics.recentActivity.map(activity => ({
      ...activity,
      relativeTime: getRelativeTime(activity.timestamp)
    }));

    // Métricas en tiempo real con alertas
    const realTimeWithAlerts = {
      ...realTimeMetrics,
      alerts: [
        ...(realTimeMetrics.currentConversionRate < 15 ? [{
          type: 'warning' as const,
          message: 'Tasa de conversión por debajo del objetivo',
          metric: 'conversion_rate',
          value: realTimeMetrics.currentConversionRate
        }] : []),
        
        ...(realTimeMetrics.hotLeads > 10 ? [{
          type: 'opportunity' as const,
          message: `${realTimeMetrics.hotLeads} leads calientes requieren atención`,
          metric: 'hot_leads',
          value: realTimeMetrics.hotLeads
        }] : [])
      ]
    };

    const dashboardData = {
      success: true,
      data: {
        period,
        realTimeMetrics: realTimeWithAlerts,
        performanceAnalytics,
        mainKPIs,
        recentActivity: enhancedActivity,
        
        // Summary stats
        summary: {
          totalLeads: performanceAnalytics.totalLeads,
          totalCalls: performanceAnalytics.totalCalls,
          totalRevenue: performanceAnalytics.totalRevenue,
          conversionRate: performanceAnalytics.overallConversionRate,
          
          // Comparisons with previous period
          improvements: {
            conversionRate: 8.3,
            revenue: 15.2,
            efficiency: -6.5, // Negative is good for efficiency
            quality: 8.4
          }
        },
        
        // Integration metrics from all phases
        integrationMetrics: {
          // Phase 1: Bulk Calling
          bulkCalling: {
            activeQueues: realTimeMetrics.activeCalls > 0 ? 1 : 0,
            processedToday: realTimeMetrics.successfulCallsToday + realTimeMetrics.failedCallsToday,
            successRate: realTimeMetrics.successfulCallsToday + realTimeMetrics.failedCallsToday > 0 
              ? (realTimeMetrics.successfulCallsToday / (realTimeMetrics.successfulCallsToday + realTimeMetrics.failedCallsToday)) * 100 
              : 0
          },
          
          // Phase 2: Sentiment Analysis
          sentimentAnalysis: {
            averageScore: performanceAnalytics.averageSentiment,
            criticalMoments: Math.floor(performanceAnalytics.totalCalls * 0.15), // Estimated
            positiveTrend: performanceAnalytics.averageSentiment > 0.5
          },
          
          // Phase 3: Calendar
          calendar: {
            meetingsScheduled: Math.floor(performanceAnalytics.totalLeads * 0.3), // Estimated
            automatedScheduling: Math.floor(performanceAnalytics.totalLeads * 0.15), // Estimated
            completionRate: 85 // Mock
          },
          
          // Phase 4: Personalization
          personalization: {
            scriptsGenerated: Math.floor(performanceAnalytics.totalCalls * 0.6), // Estimated
            usageRate: performanceAnalytics.scriptUsageRate,
            impactOnConversion: performanceAnalytics.personalizationImpact
          }
        }
      },
      
      generatedAt: new Date(),
      dataFreshness: 'real-time'
    };

    console.log('✅ [DASHBOARD API] Dashboard data loaded successfully:', {
      kpis: mainKPIs.length,
      activities: enhancedActivity.length,
      alerts: realTimeWithAlerts.alerts?.length || 0
    });

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('❌ [DASHBOARD API] Error loading dashboard:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to load dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Utilidades auxiliares
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Ahora mismo';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  return `Hace ${diffDays}d`;
}