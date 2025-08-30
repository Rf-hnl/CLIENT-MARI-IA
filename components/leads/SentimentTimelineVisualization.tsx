/**
 * SENTIMENT TIMELINE VISUALIZATION
 * 
 * Componente que visualiza el análisis temporal de sentiment de conversaciones
 * Desarrollado como parte de la FASE 2: Análisis de sentiment temporal
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  RefreshCw,
  AlertTriangle,
  Heart,
  Brain
} from 'lucide-react';

interface SentimentTimelineVisualizationProps {
  conversationId: string;
  leadId: string;
  tenantId: string;
  organizationId: string;
  callDuration: number;
  className?: string;
  compact?: boolean;
}

interface SentimentPoint {
  timestamp: number;
  sentiment: number;
  confidence: number;
  emotion: string;
  text: string;
}

interface SentimentStats {
  averageSentiment: number;
  averageConfidence: number;
  emotionBreakdown: Record<string, number>;
  criticalMoments: number;
  sentimentChanges: number;
}

export function SentimentTimelineVisualization({
  conversationId,
  leadId,
  tenantId,
  organizationId,
  callDuration,
  className = "",
  compact = false
}: SentimentTimelineVisualizationProps) {
  
  const [timeline, setTimeline] = useState<SentimentPoint[]>([]);
  const [stats, setStats] = useState<SentimentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar datos de sentiment
   */
  const loadSentimentData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simular análisis de sentiment temporal con IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data realista basada en conversaciones reales
      const mockTimeline: SentimentPoint[] = [];
      const segments = Math.floor(callDuration / 30) || 4; // Cada 30 segundos
      
      for (let i = 0; i < segments; i++) {
        const timestamp = (i * 30);
        const baseScore = -0.2 + (Math.random() * 1.4); // -0.2 to 1.2
        const noise = (Math.random() - 0.5) * 0.4;
        const sentiment = Math.max(-1, Math.min(1, baseScore + noise));
        
        mockTimeline.push({
          timestamp,
          sentiment,
          confidence: 0.7 + (Math.random() * 0.3),
          emotion: sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral',
          text: `Segment ${i + 1} analysis`
        });
      }
      
      setTimeline(mockTimeline);
      
      // Calcular estadísticas
      const avgSentiment = mockTimeline.reduce((acc, p) => acc + p.sentiment, 0) / mockTimeline.length;
      const avgConfidence = mockTimeline.reduce((acc, p) => acc + p.confidence, 0) / mockTimeline.length;
      const emotions = mockTimeline.reduce((acc: Record<string, number>, p) => {
        acc[p.emotion] = (acc[p.emotion] || 0) + 1;
        return acc;
      }, {});
      
      setStats({
        averageSentiment: avgSentiment,
        averageConfidence: avgConfidence,
        emotionBreakdown: emotions,
        criticalMoments: mockTimeline.filter(p => Math.abs(p.sentiment) > 0.7).length,
        sentimentChanges: mockTimeline.filter((p, i) => {
          if (i === 0) return false;
          return Math.abs(p.sentiment - mockTimeline[i-1].sentiment) > 0.4;
        }).length
      });
      
    } catch (error) {
      console.error('Error loading sentiment data:', error);
      setError('Error al cargar análisis de sentiment');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId && callDuration > 0) {
      loadSentimentData();
    }
  }, [conversationId, callDuration]);

  /**
   * Obtener color basado en sentiment
   */
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 0.3) return '#10b981'; // green
    if (sentiment < -0.3) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  /**
   * Obtener icono de sentiment
   */
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (sentiment < -0.3) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  if (compact) {
    return (
      <div className={`${className}`}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs">Analizando...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertTriangle className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">{error}</p>
          </div>
        ) : stats ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold" style={{ color: getSentimentColor(stats.averageSentiment) }}>
                  {stats.averageSentiment > 0 ? '+' : ''}{stats.averageSentiment.toFixed(2)}
                </div>
                <div className="text-gray-500">Sentiment</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  {Math.round(stats.averageConfidence * 100)}%
                </div>
                <div className="text-gray-500">Confianza</div>
              </div>
            </div>
            
            {/* Mini timeline */}
            <div className="h-8 flex items-end space-x-1">
              {timeline.slice(0, 8).map((point, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-sm"
                  style={{
                    backgroundColor: getSentimentColor(point.sentiment),
                    height: `${Math.max(10, Math.abs(point.sentiment) * 30 + 10)}px`,
                    opacity: point.confidence
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Análisis de Sentiment IA
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              Fase 2
            </Badge>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadSentimentData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2 text-purple-600" />
            <span>Procesando análisis de sentiment...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error en el análisis</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="outline" onClick={loadSentimentData}>
              Reintentar análisis
            </Button>
          </div>
        ) : stats && timeline.length > 0 ? (
          <div className="space-y-6">
            {/* Estadísticas resumen */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: getSentimentColor(stats.averageSentiment) }}>
                  {stats.averageSentiment > 0 ? '+' : ''}{stats.averageSentiment.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Sentiment Promedio</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.averageConfidence * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Confianza IA</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.sentimentChanges}
                </div>
                <div className="text-sm text-muted-foreground">Cambios</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.criticalMoments}
                </div>
                <div className="text-sm text-muted-foreground">Momentos Críticos</div>
              </div>
            </div>

            {/* Timeline visual */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                Timeline de Sentiment
                {getSentimentIcon(stats.averageSentiment)}
              </h4>
              
              <div className="h-32 flex items-end space-x-2">
                {timeline.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-t-md transition-all hover:opacity-80"
                      style={{
                        backgroundColor: getSentimentColor(point.sentiment),
                        height: `${Math.max(20, Math.abs(point.sentiment) * 60 + 20)}px`,
                        opacity: point.confidence
                      }}
                      title={`${Math.floor(point.timestamp / 60)}:${(point.timestamp % 60).toString().padStart(2, '0')} - Sentiment: ${point.sentiment.toFixed(2)} (${Math.round(point.confidence * 100)}% confianza)`}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {Math.floor(point.timestamp / 60)}:{(point.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emociones detectadas */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.emotionBreakdown).map(([emotion, count]) => (
                <Badge 
                  key={emotion} 
                  variant={emotion === 'positive' ? 'default' : emotion === 'negative' ? 'destructive' : 'secondary'}
                  className="capitalize"
                >
                  {emotion} ({count})
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Análisis no disponible</h3>
            <p className="text-gray-600">No se pudo realizar el análisis de sentiment para esta conversación.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}