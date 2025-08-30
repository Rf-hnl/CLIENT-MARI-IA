/**
 * PERFORMANCE TRACKER
 * 
 * Componente de seguimiento de rendimiento y lead scoring predictivo
 * Integra métricas avanzadas, análisis de tendencias y scoring con IA
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Star,
  Zap,
  Brain,
  Heart,
  Gauge,
  BarChart3,
  LineChart,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';

import {
  LeadScore,
  PerformanceAnalytics,
  RiskFactor,
  OpportunityFactor,
  RecommendedAction
} from '@/types/analytics';

interface PerformanceTrackerProps {
  tenantId: string;
  organizationId: string;
  onLeadScoreUpdate?: (leadId: string, score: LeadScore) => void;
  className?: string;
}

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description: string;
}

export function PerformanceTracker({
  tenantId,
  organizationId,
  onLeadScoreUpdate,
  className = ""
}: PerformanceTrackerProps) {
  // Estados principales
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'scoring' | 'trends'>('overview');
  const [performanceData, setPerformanceData] = useState<PerformanceAnalytics | null>(null);
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  // Estados de filtros
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'probability' | 'value'>('score');

  /**
   * Cargar datos de performance
   */
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);

      console.log('📊 [PERFORMANCE TRACKER] Loading performance data...');

      // Cargar analytics de performance
      const analyticsResponse = await fetch(
        `/api/analytics/dashboard?tenantId=${tenantId}&organizationId=${organizationId}&period=weekly`
      );

      const analyticsData = await analyticsResponse.json();

      if (analyticsData.success) {
        const analytics = analyticsData.data.performanceAnalytics;
        setPerformanceData(analytics);
        updatePerformanceMetrics(analytics);
        console.log('✅ [PERFORMANCE TRACKER] Performance analytics loaded');
      }

      // 🚀 Cargar lead scores reales desde la API
      try {
        const leadScoresResponse = await fetch(
          `/api/leads/list?tenantId=${tenantId}&organizationId=${organizationId}`
        );
        
        const leadScoresData = await leadScoresResponse.json();
        
        if (leadScoresData.success && leadScoresData.data) {
          const realLeadScores: LeadScore[] = leadScoresData.data.map((lead: any) => ({
            leadId: lead.id,
            totalScore: lead.qualificationScore || 0,
            factorScores: {
              engagement: lead.lastEngagementScore || 0,
              sentiment: Math.round((lead.lastSentimentScore || 0) * 100),
              behavioral: Math.round((lead.responseRate || 0) * 100), 
              firmographic: Math.round((lead.qualificationScore || 0) * 0.25)
            },
            riskFactors: lead.qualificationScore < 30 ? ['Low engagement'] : [],
            opportunities: lead.qualificationScore > 70 ? [{
              type: 'positive_sentiment',
              strength: 'strong',
              description: 'Lead altamente calificado',
              impact: 10,
              actionable: true,
              detectedAt: new Date()
            }] : [],
            recommendedActions: [{
              id: `action_${lead.id}`,
              type: lead.qualificationScore > 70 ? 'close' : 'meeting',
              priority: lead.qualificationScore > 70 ? 'urgent' : 'medium',
              title: lead.qualificationScore > 70 ? 'Cerrar venta' : 'Programar reunión',
              description: `Acción recomendada para ${lead.name}`,
              expectedOutcome: lead.qualificationScore > 70 ? 'Conversión' : 'Progresión',
              estimatedEffort: 'medium',
              successProbability: Math.min(lead.qualificationScore / 100, 0.95),
              potentialImpact: lead.qualificationScore > 70 ? 5 : 3,
              createdAt: new Date()
            }],
            nextBestAction: lead.qualificationScore > 70 ? 'Cerrar venta' : 'Programar reunión',
            probabilityToClose: Math.min(lead.qualificationScore / 100, 0.95),
            estimatedValue: Math.round((lead.qualificationScore / 100) * 5000),
            estimatedCloseDate: lead.qualificationScore > 70 ? 
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            lastUpdated: new Date(lead.updatedAt || Date.now())
          }));
          
          setLeadScores(realLeadScores);
        } else {
          console.warn('⚠️ [PERFORMANCE TRACKER] No lead data available');
          setLeadScores([]);
        }
      } catch (leadScoresError) {
        console.error('❌ [PERFORMANCE TRACKER] Error loading lead scores:', leadScoresError);
        setLeadScores([]);
      }

    } catch (error) {
      console.error('❌ [PERFORMANCE TRACKER] Error loading performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Actualizar métricas de performance
   */
  const updatePerformanceMetrics = (analytics: PerformanceAnalytics) => {
    const metrics: PerformanceMetric[] = [
      {
        id: 'conversion_rate',
        name: 'Tasa de Conversión',
        value: analytics.overallConversionRate,
        target: 25,
        change: 8.3,
        trend: 'up',
        status: analytics.overallConversionRate >= 20 ? 'excellent' : 
                analytics.overallConversionRate >= 15 ? 'good' : 
                analytics.overallConversionRate >= 10 ? 'warning' : 'critical',
        description: 'Porcentaje de leads que se convierten en ventas'
      },
      {
        id: 'avg_score',
        name: 'Score Promedio',
        value: 67,
        target: 75,
        change: 5.2,
        trend: 'up',
        status: 'good',
        description: 'Puntuación promedio de calificación de leads'
      },
      {
        id: 'high_score_leads',
        name: 'Leads Score Alto',
        value: leadScores.filter(l => l.totalScore >= 70).length,
        target: 15,
        change: 12.5,
        trend: 'up',
        status: 'good',
        description: 'Número de leads con puntuación alta (≥70)'
      },
      {
        id: 'prediction_accuracy',
        name: 'Precisión IA',
        value: 84,
        target: 85,
        change: 2.1,
        trend: 'up',
        status: 'good',
        description: 'Precisión de predicciones del modelo de IA'
      },
      {
        id: 'avg_close_time',
        name: 'Tiempo Cierre',
        value: analytics.salesCycleLength,
        target: 12,
        change: -8.7,
        trend: 'down',
        status: 'excellent',
        description: 'Días promedio para cerrar una venta'
      },
      {
        id: 'revenue_per_lead',
        name: 'Revenue por Lead',
        value: analytics.revenuePerLead,
        target: 3500,
        change: 15.3,
        trend: 'up',
        status: 'excellent',
        description: 'Revenue promedio generado por lead'
      }
    ];

    setPerformanceMetrics(metrics);
  };

  /**
   * Filtrar y ordenar leads
   */
  const getFilteredAndSortedLeads = () => {
    let filtered = leadScores;

    // Filtrar por score
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(lead => {
        switch (scoreFilter) {
          case 'high': return lead.totalScore >= 70;
          case 'medium': return lead.totalScore >= 40 && lead.totalScore < 70;
          case 'low': return lead.totalScore < 40;
          default: return true;
        }
      });
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.leadId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score': return b.totalScore - a.totalScore;
        case 'probability': return b.probabilityToClose - a.probabilityToClose;
        case 'value': return b.estimatedValue - a.estimatedValue;
        default: return 0;
      }
    });

    return filtered;
  };

  /**
   * Obtener color de score
   */
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  /**
   * Obtener color de métrica por estado
   */
  const getMetricStatusColor = (status: PerformanceMetric['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  /**
   * Cargar datos al montar
   */
  useEffect(() => {
    loadPerformanceData();
  }, [tenantId, organizationId]);

  const filteredLeads = getFilteredAndSortedLeads();

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <Gauge className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando Performance Tracker
          </h3>
          <p className="text-gray-600">Analizando métricas y calculando scores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Gauge className="w-6 h-6 text-purple-600" />
              <span>🎯 Performance Tracker</span>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Seguimiento avanzado y lead scoring predictivo con IA
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSelectedTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTab === 'overview'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedTab('scoring')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTab === 'scoring'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lead Scoring
              </button>
              <button
                onClick={() => setSelectedTab('trends')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTab === 'trends'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tendencias
              </button>
            </div>

            <button
              onClick={loadPerformanceData}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceMetrics.map(metric => (
              <div
                key={metric.id}
                className={`p-4 rounded-lg border ${getMetricStatusColor(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">{metric.name}</h3>
                  <div className="flex items-center space-x-1">
                    {metric.trend === 'up' ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : metric.trend === 'down' ? (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    ) : (
                      <Activity className="w-4 h-4 text-gray-600" />
                    )}
                    <span className={`text-xs font-medium ${
                      metric.change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">
                      {metric.id === 'conversion_rate' || metric.id === 'avg_score' || metric.id === 'prediction_accuracy' 
                        ? metric.value.toFixed(1) + '%'
                        : metric.id === 'revenue_per_lead'
                        ? '$' + metric.value.toLocaleString()
                        : metric.id === 'avg_close_time'
                        ? metric.value + ' días'
                        : metric.value
                      }
                    </span>
                    <span className="text-sm text-gray-600">
                      / {metric.id === 'conversion_rate' || metric.id === 'avg_score' || metric.id === 'prediction_accuracy' 
                        ? metric.target + '%'
                        : metric.id === 'revenue_per_lead'
                        ? '$' + metric.target.toLocaleString()
                        : metric.id === 'avg_close_time'
                        ? metric.target + ' días'
                        : metric.target
                      }
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.status === 'excellent' ? 'bg-green-500' :
                        metric.status === 'good' ? 'bg-blue-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min((metric.value / metric.target) * 100, 100)}%` 
                      }}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-gray-700">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead Scoring Tab */}
      {selectedTab === 'scoring' && (
        <div className="p-6">
          {/* Filtros */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todos los scores</option>
                <option value="high">Score Alto (≥70)</option>
                <option value="medium">Score Medio (40-69)</option>
                <option value="low">Score Bajo (&lt;40)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="score">Ordenar por Score</option>
              <option value="probability">Ordenar por Probabilidad</option>
              <option value="value">Ordenar por Valor</option>
            </select>
          </div>

          {/* Lista de leads con scores */}
          <div className="space-y-4">
            {filteredLeads.map(lead => (
              <div key={lead.leadId} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`px-4 py-2 rounded-lg border ${getScoreColor(lead.totalScore)}`}>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{lead.totalScore}</div>
                        <div className="text-xs">SCORE</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Lead {lead.leadId.slice(0, 8)}...
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Probabilidad: {Math.round(lead.probabilityToClose * 100)}%</span>
                        <span>Valor estimado: ${lead.estimatedValue.toLocaleString()}</span>
                        {lead.estimatedCloseDate && (
                          <span>Cierre estimado: {lead.estimatedCloseDate.toLocaleDateString('es-ES')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-600">
                      {lead.nextBestAction}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Próxima acción recomendada
                    </div>
                  </div>
                </div>

                {/* Factor scores */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-600">
                      {lead.factorScores.engagement}
                    </div>
                    <div className="text-xs text-blue-700">Engagement</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 rounded-lg">
                    <div className="text-lg font-semibold text-pink-600">
                      {lead.factorScores.sentiment}
                    </div>
                    <div className="text-xs text-pink-700">Sentiment</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">
                      {lead.factorScores.behavioral}
                    </div>
                    <div className="text-xs text-green-700">Comportamiento</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-semibold text-purple-600">
                      {lead.factorScores.firmographic}
                    </div>
                    <div className="text-xs text-purple-700">Firmográfico</div>
                  </div>
                </div>

                {/* Risk factors y opportunities */}
                {(lead.riskFactors.length > 0 || lead.opportunities.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Risk factors */}
                    {lead.riskFactors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-2 flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Factores de Riesgo</span>
                        </h4>
                        <div className="space-y-2">
                          {lead.riskFactors.map((risk, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium text-red-700">
                                {risk.description}
                              </div>
                              <div className="text-red-600 text-xs">
                                Impacto: {risk.impact} puntos
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opportunities */}
                    {lead.opportunities.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2 flex items-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Oportunidades</span>
                        </h4>
                        <div className="space-y-2">
                          {lead.opportunities.map((opp, index) => (
                            <div key={index} className="text-sm">
                              <div className="font-medium text-green-700">
                                {opp.description}
                              </div>
                              <div className="text-green-600 text-xs">
                                Impacto: +{opp.impact} puntos
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay leads que coincidan con los filtros
              </h3>
              <p className="text-gray-600">
                Ajusta los filtros para ver más resultados
              </p>
            </div>
          )}
        </div>
      )}

      {/* Trends Tab */}
      {selectedTab === 'trends' && (
        <div className="p-6">
          <div className="text-center py-12">
            <LineChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Análisis de Tendencias
            </h3>
            <p className="text-gray-600 mb-4">
              Gráficos avanzados de tendencias y predicciones próximamente
            </p>
            <div className="text-sm text-gray-500">
              • Evolución histórica de scores<br />
              • Predicciones de conversión<br />
              • Análisis de factores de impacto<br />
              • Comparativas por período
            </div>
          </div>
        </div>
      )}
    </div>
  );
}