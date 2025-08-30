/**
 * CONVERSATION ANALYSIS PANEL - FASE 2
 * 
 * Panel integrado que combina el análisis existente con el nuevo componente
 * de sentiment avanzado IA Fase 2 - Diseño minimalista y responsivo
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SentimentAnalysisAdvanced } from '@/components/ui/sentiment-analysis-advanced';
import { ConversationAnalysisPanelAdvanced } from './ConversationAnalysisPanelAdvanced';
import { cn } from '@/lib/utils';
import { 
  Brain,
  BarChart3,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface ConversationAnalysisPanelPhase2Props {
  leadId: string;
  conversationId?: string;
  callLogId?: string;
  className?: string;
  variant?: 'full' | 'compact';
}

interface AnalysisStatus {
  sentiment: 'loading' | 'completed' | 'error' | 'not_started';
  traditional: 'loading' | 'completed' | 'error' | 'not_started';
}

export function ConversationAnalysisPanelPhase2({
  leadId,
  conversationId,
  callLogId,
  className,
  variant = 'full'
}: ConversationAnalysisPanelPhase2Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'sentiment' | 'traditional'>('overview');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>({
    sentiment: 'not_started',
    traditional: 'not_started'
  });
  const [sentimentData, setSentimentData] = useState(null);
  const [traditionalAnalysis, setTraditionalAnalysis] = useState(null);

  // Función para ejecutar análisis de sentiment
  const runSentimentAnalysis = async () => {
    if (!conversationId) return;

    try {
      setAnalysisStatus(prev => ({ ...prev, sentiment: 'loading' }));
      
      // Simular llamada a API de análisis de sentiment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock de datos de sentiment (en producción vendría de la API)
      setSentimentData({
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
          sentimentTrend: 'improving' as const
        },
        insights: {
          keyMoments: [
            { time: 45, type: 'peak' as const, description: 'Entusiasmo sobre el producto', impact: 'high' as const },
            { time: 120, type: 'valley' as const, description: 'Preocupación por el precio', impact: 'medium' as const },
            { time: 180, type: 'shift' as const, description: 'Cambio hacia interés genuino', impact: 'high' as const }
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
      });

      setAnalysisStatus(prev => ({ ...prev, sentiment: 'completed' }));
    } catch (error) {
      console.error('Error in sentiment analysis:', error);
      setAnalysisStatus(prev => ({ ...prev, sentiment: 'error' }));
    }
  };

  // Función para ejecutar análisis tradicional
  const runTraditionalAnalysis = async () => {
    if (!conversationId) return;

    try {
      setAnalysisStatus(prev => ({ ...prev, traditional: 'loading' }));
      
      // Simular llamada a API de análisis tradicional
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTraditionalAnalysis({
        // Mock data para análisis tradicional
        completed: true
      });

      setAnalysisStatus(prev => ({ ...prev, traditional: 'completed' }));
    } catch (error) {
      console.error('Error in traditional analysis:', error);
      setAnalysisStatus(prev => ({ ...prev, traditional: 'error' }));
    }
  };

  // Auto-ejecutar análisis al montar el componente
  useEffect(() => {
    if (conversationId && leadId) {
      runSentimentAnalysis();
      runTraditionalAnalysis();
    }
  }, [conversationId, leadId]);

  // Obtener icono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Vista compacta
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Header compacto */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            <span className="font-medium">Análisis IA Fase 2</span>
            <Badge className="bg-purple-100 text-purple-800 text-xs">Unificado</Badge>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(analysisStatus.sentiment)}
            <span className="text-xs text-gray-500">
              {analysisStatus.sentiment === 'completed' ? 'Completado' : 
               analysisStatus.sentiment === 'loading' ? 'Analizando...' : 
               analysisStatus.sentiment === 'error' ? 'Error' : 'Pendiente'}
            </span>
          </div>
        </div>

        {/* Análisis de sentiment compacto */}
        {sentimentData && (
          <SentimentAnalysisAdvanced
            sentimentData={sentimentData}
            variant="compact"
            className="border-0"
          />
        )}
      </div>
    );
  }

  // Vista completa
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header principal */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  🚀 Análisis de Conversación IA - Fase 2
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-white/20 text-white border-white/30">
                    Interfaz Unificada
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Minimalista
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Responsivo
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={runSentimentAnalysis}
                disabled={analysisStatus.sentiment === 'loading'}
                className="text-white hover:bg-white/20"
              >
                {getStatusIcon(analysisStatus.sentiment)}
                <span className="ml-1 text-xs">Sentiment</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={runTraditionalAnalysis}
                disabled={analysisStatus.traditional === 'loading'}
                className="text-white hover:bg-white/20"
              >
                {getStatusIcon(analysisStatus.traditional)}
                <span className="ml-1 text-xs">Tradicional</span>
              </Button>
            </div>
          </div>

          {/* Indicadores de estado */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Análisis de Sentiment IA:</span>
              <span className={cn(
                "text-xs px-2 py-1 rounded-md",
                analysisStatus.sentiment === 'completed' ? "bg-green-100 text-green-700" :
                analysisStatus.sentiment === 'loading' ? "bg-yellow-100 text-yellow-700" :
                analysisStatus.sentiment === 'error' ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              )}>
                {analysisStatus.sentiment === 'completed' ? 'Completado' :
                 analysisStatus.sentiment === 'loading' ? 'Procesando...' :
                 analysisStatus.sentiment === 'error' ? 'Error' : 'Pendiente'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Análisis Tradicional:</span>
              <span className={cn(
                "text-xs px-2 py-1 rounded-md",
                analysisStatus.traditional === 'completed' ? "bg-green-100 text-green-700" :
                analysisStatus.traditional === 'loading' ? "bg-yellow-100 text-yellow-700" :
                analysisStatus.traditional === 'error' ? "bg-red-100 text-red-700" :
                "bg-gray-100 text-gray-700"
              )}>
                {analysisStatus.traditional === 'completed' ? 'Completado' :
                 analysisStatus.traditional === 'loading' ? 'Procesando...' :
                 analysisStatus.traditional === 'error' ? 'Error' : 'Pendiente'}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenido con tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Vista General
          </TabsTrigger>
          <TabsTrigger value="sentiment" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Sentiment IA
          </TabsTrigger>
          <TabsTrigger value="traditional" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Análisis Completo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Vista general combinada */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resumen de sentiment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Análisis de Sentiment IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisStatus.sentiment === 'loading' ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2 text-purple-600" />
                    <span>Procesando sentiment...</span>
                  </div>
                ) : sentimentData ? (
                  <SentimentAnalysisAdvanced
                    sentimentData={sentimentData}
                    variant="compact"
                    className="border-0"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Error al cargar análisis de sentiment</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen tradicional */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  Análisis Tradicional
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisStatus.traditional === 'loading' ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2 text-blue-600" />
                    <span>Procesando análisis...</span>
                  </div>
                ) : analysisStatus.traditional === 'completed' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Análisis completado</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Ver pestaña "Análisis Completo" para detalles completos.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>Error al cargar análisis tradicional</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment">
          {sentimentData ? (
            <SentimentAnalysisAdvanced
              conversationId={conversationId}
              leadId={leadId}
              sentimentData={sentimentData}
              variant="detailed"
              onRefresh={runSentimentAnalysis}
              isLoading={analysisStatus.sentiment === 'loading'}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Análisis de Sentiment no disponible</h3>
                <p className="text-gray-600 mb-4">
                  {analysisStatus.sentiment === 'loading' ? 
                    'Procesando análisis de sentiment...' :
                    'No se pudo cargar el análisis de sentiment para esta conversación.'
                  }
                </p>
                <Button onClick={runSentimentAnalysis} disabled={analysisStatus.sentiment === 'loading'}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${analysisStatus.sentiment === 'loading' ? 'animate-spin' : ''}`} />
                  Reintentar Análisis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="traditional">
          {conversationId ? (
            <ConversationAnalysisPanelAdvanced
              leadId={leadId}
              conversationId={conversationId}
              callLogId={callLogId}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Análisis no disponible</h3>
                <p className="text-gray-600">
                  Se requiere un ID de conversación para mostrar el análisis detallado.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}