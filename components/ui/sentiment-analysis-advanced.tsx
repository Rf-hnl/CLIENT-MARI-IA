/**
 * SENTIMENT ANALYSIS ADVANCED - IA FASE 2
 * 
 * Componente unificado y minimalista para análisis de sentimiento
 * Diseño gráfico responsivo con interfaz moderna y adaptable
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Brain,
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap,
  Eye,
  Target,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Sparkles
} from 'lucide-react';

// Tipos de datos
interface SentimentData {
  overall: {
    sentiment: string;
    score: number;
    confidence: number;
  };
  temporal: {
    timeline: Array<{
      timestamp: number;
      sentiment: number;
      confidence: number;
      emotion: string;
    }>;
    averageSentiment: number;
    sentimentTrend: 'improving' | 'declining' | 'stable';
  };
  insights: {
    keyMoments: Array<{
      time: number;
      type: 'peak' | 'valley' | 'shift';
      description: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    emotionBreakdown: Record<string, number>;
    riskFactors: string[];
    opportunities: string[];
  };
  metadata: {
    processingTime: number;
    tokensUsed: number;
    model: string;
    cost: number;
  };
}

interface SentimentAnalysisAdvancedProps {
  conversationId?: string;
  leadId?: string;
  sentimentData?: SentimentData;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Componente principal
export function SentimentAnalysisAdvanced({
  conversationId,
  leadId,
  sentimentData,
  variant = 'default',
  className,
  onRefresh,
  isLoading = false
}: SentimentAnalysisAdvancedProps) {
  const [activeView, setActiveView] = useState<'overview' | 'timeline' | 'insights'>('overview');

  // Mock data para demostración
  const mockData: SentimentData = {
    overall: {
      sentiment: "Positivo",
      score: 0.72,
      confidence: 0.89
    },
    temporal: {
      timeline: Array.from({ length: 8 }, (_, i) => ({
        timestamp: i * 30,
        sentiment: 0.3 + (Math.sin(i * 0.8) * 0.4) + (Math.random() * 0.2 - 0.1),
        confidence: 0.75 + (Math.random() * 0.2),
        emotion: ['positive', 'neutral', 'positive', 'positive', 'negative', 'neutral', 'positive', 'positive'][i]
      })),
      averageSentiment: 0.68,
      sentimentTrend: 'improving'
    },
    insights: {
      keyMoments: [
        { time: 45, type: 'peak', description: 'Entusiasmo sobre el producto', impact: 'high' },
        { time: 120, type: 'valley', description: 'Preocupación por el precio', impact: 'medium' },
        { time: 180, type: 'shift', description: 'Cambio hacia interés genuino', impact: 'high' }
      ],
      emotionBreakdown: { positive: 5, neutral: 2, negative: 1 },
      riskFactors: ['Sensibilidad al precio', 'Necesita aprobación del equipo'],
      opportunities: ['Alto interés en automatización', 'Timeline de implementación rápida']
    },
    metadata: {
      processingTime: 2.3,
      tokensUsed: 1247,
      model: 'gpt-4o-mini',
      cost: 0.012
    }
  };

  const data = sentimentData || mockData;

  // Funciones helper
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.3) return 'text-green-600 bg-green-50 border-green-200';
    if (sentiment < -0.3) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSentimentIcon = (sentiment: number, size = 'w-4 h-4') => {
    if (sentiment > 0.3) return <TrendingUp className={`${size} text-green-600`} />;
    if (sentiment < -0.3) return <TrendingDown className={`${size} text-red-600`} />;
    return <Activity className={`${size} text-gray-600`} />;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Vista compacta
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border", className)}>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm">Analizando sentiment...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-800">Sentiment IA</span>
                <Badge className="bg-purple-100 text-purple-800 text-xs">v2.0</Badge>
              </div>
              {getSentimentIcon(data.overall.score)}
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className={cn("text-lg font-bold px-2 py-1 rounded", getSentimentColor(data.overall.score))}>
                  {data.overall.score > 0 ? '+' : ''}{data.overall.score.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Score</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(data.overall.confidence * 100)}%
                </div>
                <div className="text-xs text-gray-500 mt-1">Confianza</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600">
                  {data.insights.keyMoments.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Momentos</div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Vista principal
  return (
    <Card className={cn("overflow-hidden border-0 shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                📊 Análisis de Sentiment IA
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-white/30">
                  Fase 2
                </Badge>
                <span className="text-white/80 text-sm">
                  Interfaz unificada minimalista
                </span>
              </div>
            </div>
          </div>
          
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Tabs de navegación */}
        <div className="flex gap-1 mt-4">
          {['overview', 'timeline', 'insights'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                activeView === view 
                  ? "bg-white/20 text-white border border-white/30" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {view === 'overview' && <Eye className="w-4 h-4 inline mr-1" />}
              {view === 'timeline' && <BarChart3 className="w-4 h-4 inline mr-1" />}
              {view === 'insights' && <Sparkles className="w-4 h-4 inline mr-1" />}
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
              <h3 className="font-medium mb-2">Procesando con IA Avanzada</h3>
              <p className="text-sm text-gray-500">Analizando sentiment en tiempo real...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vista Overview */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                {/* Métricas principales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      {getSentimentIcon(data.overall.score, 'w-8 h-8')}
                    </div>
                    <div className={cn("text-2xl font-bold mb-1", getSentimentColor(data.overall.score))}>
                      {data.overall.sentiment}
                    </div>
                    <div className="text-sm text-gray-500">Sentiment General</div>
                    <Progress 
                      value={(data.overall.score + 1) * 50} 
                      className="mt-2 h-2"
                    />
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {Math.round(data.overall.confidence * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Confianza IA</div>
                    <Progress 
                      value={data.overall.confidence * 100} 
                      className="mt-2 h-2 bg-blue-200"
                    />
                  </div>

                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-600 mb-1">
                      {data.temporal.averageSentiment.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">Score Promedio</div>
                    <div className="flex items-center justify-center gap-1 mt-2">
                      {getTrendIcon(data.temporal.sentimentTrend)}
                      <span className="text-xs capitalize">{data.temporal.sentimentTrend}</span>
                    </div>
                  </div>
                </div>

                {/* Distribución de emociones */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gray-600" />
                    Distribución Emocional
                  </h4>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(data.insights.emotionBreakdown).map(([emotion, count]) => (
                      <Badge 
                        key={emotion} 
                        variant={
                          emotion === 'positive' ? 'default' : 
                          emotion === 'negative' ? 'destructive' : 'secondary'
                        }
                        className="capitalize"
                      >
                        {emotion} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vista Timeline */}
            {activeView === 'timeline' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    Timeline de Sentiment Temporal
                  </h4>
                  
                  <div className="h-40 flex items-end space-x-2 bg-white rounded p-3">
                    {data.temporal.timeline.map((point, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div
                          className="w-full rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                          style={{
                            backgroundColor: point.sentiment > 0.3 ? '#10b981' : 
                                           point.sentiment < -0.3 ? '#ef4444' : '#6b7280',
                            height: `${Math.max(20, Math.abs(point.sentiment) * 80 + 20)}px`,
                            opacity: point.confidence
                          }}
                          title={`${Math.floor(point.timestamp / 60)}:${(point.timestamp % 60).toString().padStart(2, '0')} - Sentiment: ${point.sentiment.toFixed(2)} (${Math.round(point.confidence * 100)}% confianza)`}
                        />
                        <span className="text-xs text-gray-500 mt-1 group-hover:font-medium transition-all">
                          {Math.floor(point.timestamp / 60)}:{(point.timestamp % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Estadísticas Temporales</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Pico máximo:</span>
                        <span className="font-medium text-green-600">
                          +{Math.max(...data.temporal.timeline.map(p => p.sentiment)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valle mínimo:</span>
                        <span className="font-medium text-red-600">
                          {Math.min(...data.temporal.timeline.map(p => p.sentiment)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Variabilidad:</span>
                        <span className="font-medium">
                          {(Math.max(...data.temporal.timeline.map(p => p.sentiment)) - 
                            Math.min(...data.temporal.timeline.map(p => p.sentiment))).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h5 className="font-medium mb-2">Confianza Promedio</h5>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {Math.round(data.temporal.timeline.reduce((acc, p) => acc + p.confidence, 0) / data.temporal.timeline.length * 100)}%
                    </div>
                    <Progress 
                      value={data.temporal.timeline.reduce((acc, p) => acc + p.confidence, 0) / data.temporal.timeline.length * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Vista Insights */}
            {activeView === 'insights' && (
              <div className="space-y-6">
                {/* Momentos clave */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    Momentos Clave Detectados
                  </h4>
                  <div className="space-y-3">
                    {data.insights.keyMoments.map((moment, index) => (
                      <div key={index} className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border",
                        moment.impact === 'high' ? 'bg-red-50 border-red-200' :
                        moment.impact === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-gray-50 border-gray-200'
                      )}>
                        <div className={cn(
                          "p-1 rounded",
                          moment.type === 'peak' ? 'bg-green-100 text-green-600' :
                          moment.type === 'valley' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        )}>
                          {moment.type === 'peak' ? <TrendingUp className="w-4 h-4" /> :
                           moment.type === 'valley' ? <TrendingDown className="w-4 h-4" /> :
                           <Activity className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {Math.floor(moment.time / 60)}:{(moment.time % 60).toString().padStart(2, '0')}
                            </span>
                            <Badge 
                              variant={moment.impact === 'high' ? 'destructive' : 
                                       moment.impact === 'medium' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {moment.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{moment.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Factores de riesgo y oportunidades */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      Factores de Riesgo
                    </h5>
                    <div className="space-y-2">
                      {data.insights.riskFactors.map((risk, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-red-700">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-green-700">
                      <Target className="w-5 h-5" />
                      Oportunidades
                    </h5>
                    <div className="space-y-2">
                      {data.insights.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-green-700">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata (siempre visible) */}
            <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50/50 rounded-lg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>🤖 IA: {data.metadata.model}</span>
                  <span>⚡ {data.metadata.processingTime}s</span>
                  <span>🎯 {data.metadata.tokensUsed} tokens</span>
                  <span>💰 ${data.metadata.cost.toFixed(3)}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Análisis Adaptativo Responsivo
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}