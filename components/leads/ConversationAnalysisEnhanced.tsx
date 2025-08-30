'use client';

/**
 * CONVERSATION ANALYSIS ENHANCED
 * 
 * Panel mejorado que integra análisis temporal de sentiment
 * Extiende el sistema existente sin romper compatibilidad
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  Brain,
  Activity,
  BarChart3,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Download
} from 'lucide-react';

import { SentimentTimelineVisualization } from './SentimentTimelineVisualization';
import { useSentimentTemporal, useSentimentTemporalAutoLoad } from '@/hooks/useSentimentTemporal';
import { CriticalMoment } from '@/types/bulkCalls';

interface ConversationData {
  conversationId: string;
  leadId: string;
  transcript?: any;
  duration?: number;
  status?: string;
  metadata?: any;
}

interface ConversationAnalysisEnhancedProps {
  conversation: ConversationData;
  leadName?: string;
  leadCompany?: string;
  onAnalysisComplete?: (analysisId: string) => void;
  className?: string;
}

export function ConversationAnalysisEnhanced({
  conversation,
  leadName = 'Lead',
  leadCompany,
  onAnalysisComplete,
  className = ''
}: ConversationAnalysisEnhancedProps) {
  
  // Estados locales
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemporalDialog, setShowTemporalDialog] = useState(false);
  const [selectedCriticalMoment, setSelectedCriticalMoment] = useState<CriticalMoment | null>(null);

  // Hook de análisis temporal
  const {
    timeline,
    isAnalyzing,
    isLoading,
    error,
    analysisId,
    lastAnalyzedAt,
    processingTimeMs,
    analyzeSentimentTemporal,
    loadExistingAnalysis,
    clearAnalysis,
    hasAnalysis,
    canAnalyze
  } = useSentimentTemporalAutoLoad(
    conversation.leadId,
    conversation.conversationId,
    true // Auto-cargar análisis existente
  );

  // Manejar análisis temporal
  const handleRunTemporalAnalysis = async () => {
    if (!conversation.transcript) {
      console.error('No transcript available for temporal analysis');
      return;
    }

    try {
      await analyzeSentimentTemporal(
        conversation.leadId,
        conversation.conversationId,
        conversation.transcript,
        {
          segmentDuration: 30,
          overlap: 5,
          model: 'gpt-4o-mini',
          temperature: 0.3
        }
      );

      if (onAnalysisComplete && analysisId) {
        onAnalysisComplete(analysisId);
      }
    } catch (error) {
      console.error('Error running temporal analysis:', error);
    }
  };

  // Manejar click en momento crítico
  const handleCriticalMomentClick = (moment: CriticalMoment) => {
    setSelectedCriticalMoment(moment);
  };

  // Calcular estadísticas básicas
  const stats = React.useMemo(() => {
    if (!timeline) return null;

    const positiveSegments = timeline.sentimentProgression.filter(p => p.sentiment > 0.1).length;
    const negativeSegments = timeline.sentimentProgression.filter(p => p.sentiment < -0.1).length;
    const neutralSegments = timeline.sentimentProgression.length - positiveSegments - negativeSegments;

    return {
      totalSegments: timeline.sentimentProgression.length,
      positiveSegments,
      negativeSegments,
      neutralSegments,
      overallScore: timeline.overallSentiment.score,
      volatility: timeline.sentimentChanges.length,
      criticalMoments: timeline.criticalMoments.length,
      dominantSentiment: timeline.overallSentiment.label
    };
  }, [timeline]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Análisis de Conversación Avanzado</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {leadName} {leadCompany && `• ${leadCompany}`} • ID: {conversation.conversationId.slice(0, 8)}...
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {lastAnalyzedAt && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {lastAnalyzedAt.toLocaleString()}
                </Badge>
              )}
              
              {hasAnalysis ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Analizado
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Sin análisis temporal
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Estadísticas rápidas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSegments}</div>
                <div className="text-sm text-blue-700">Segmentos</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.positiveSegments}</div>
                <div className="text-sm text-green-700">Positivos</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.volatility}</div>
                <div className="text-sm text-orange-700">Cambios</div>
              </div>
              
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.criticalMoments}</div>
                <div className="text-sm text-red-700">Momentos Críticos</div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center gap-3 mb-4">
            {!hasAnalysis && canAnalyze && conversation.transcript && (
              <Button 
                onClick={handleRunTemporalAnalysis}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Análisis Temporal
                  </>
                )}
              </Button>
            )}

            {hasAnalysis && (
              <Button 
                variant="outline"
                onClick={() => setShowTemporalDialog(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Timeline Completo
              </Button>
            )}

            {hasAnalysis && (
              <Button 
                variant="outline"
                onClick={handleRunTemporalAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Reanalizar
              </Button>
            )}
          </div>

          {/* Estado de error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Error en análisis temporal</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAnalysis}
                className="mt-2 text-red-600 border-red-300"
              >
                Limpiar error
              </Button>
            </div>
          )}

          {/* Estado de carga */}
          {(isLoading || isAnalyzing) && (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-muted-foreground">
                {isAnalyzing ? 'Realizando análisis temporal...' : 'Cargando análisis...'}
              </p>
              {processingTimeMs && (
                <p className="text-xs text-muted-foreground mt-1">
                  Tiempo estimado: {Math.round(processingTimeMs / 1000)}s
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de análisis */}
      {hasAnalysis && timeline && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="critical" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Momentos Críticos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Sentiment general */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Sentiment General
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Score:</span>
                        <Badge className={
                          timeline.overallSentiment.label === 'positive' ? 'bg-green-100 text-green-800' :
                          timeline.overallSentiment.label === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {timeline.overallSentiment.score.toFixed(2)}
                        </Badge>
                      </div>
                      <Progress 
                        value={(timeline.overallSentiment.score + 1) * 50} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        Confianza: {Math.round(timeline.overallSentiment.confidence * 100)}%
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Volatilidad
                    </h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-center">
                        {timeline.sentimentChanges.length}
                      </div>
                      <div className="text-sm text-center text-muted-foreground">
                        cambios significativos
                      </div>
                      <Badge 
                        variant="outline" 
                        className="w-full justify-center"
                      >
                        {timeline.sentimentChanges.length < 2 ? 'Estable' :
                         timeline.sentimentChanges.length < 4 ? 'Moderado' : 'Volátil'}
                      </Badge>
                    </div>
                  </Card>
                </div>

                {/* Vista compacta del timeline */}
                <SentimentTimelineVisualization
                  timeline={timeline}
                  conversationDuration={conversation.duration || 300}
                  onCriticalMomentClick={handleCriticalMomentClick}
                />
              </TabsContent>

              <TabsContent value="timeline">
                <SentimentTimelineVisualization
                  timeline={timeline}
                  conversationDuration={conversation.duration || 300}
                  onCriticalMomentClick={handleCriticalMomentClick}
                />
              </TabsContent>

              <TabsContent value="critical" className="space-y-4">
                {timeline.criticalMoments.length > 0 ? (
                  <div className="space-y-3">
                    {timeline.criticalMoments.map((moment, index) => (
                      <Card key={index} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            moment.type === 'buying_signal' ? 'bg-green-100' :
                            moment.type === 'interest_peak' ? 'bg-blue-100' :
                            moment.type === 'objection' ? 'bg-orange-100' :
                            'bg-red-100'
                          }`}>
                            {moment.type === 'buying_signal' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {moment.type === 'interest_peak' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                            {moment.type === 'objection' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                            {moment.type === 'frustration' && <XCircle className="h-4 w-4 text-red-600" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {Math.floor(moment.timePoint / 60)}:{(moment.timePoint % 60).toFixed(0).padStart(2, '0')}
                              </span>
                              <Badge variant="outline" className={
                                moment.impact === 'high' ? 'border-red-300 text-red-700' :
                                moment.impact === 'medium' ? 'border-orange-300 text-orange-700' :
                                'border-blue-300 text-blue-700'
                              }>
                                {moment.impact === 'high' ? 'Alto' :
                                 moment.impact === 'medium' ? 'Medio' : 'Bajo'} impacto
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{moment.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-400" />
                    <p className="text-muted-foreground">No se detectaron momentos críticos</p>
                    <p className="text-sm text-muted-foreground">La conversación fluyó de manera estable</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Dialog para vista completa del timeline */}
      <Dialog open={showTemporalDialog} onOpenChange={setShowTemporalDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Timeline Completo de Sentiment
            </DialogTitle>
          </DialogHeader>
          {timeline && (
            <SentimentTimelineVisualization
              timeline={timeline}
              conversationDuration={conversation.duration || 300}
              onCriticalMomentClick={handleCriticalMomentClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para momento crítico seleccionado */}
      <Dialog open={Boolean(selectedCriticalMoment)} onOpenChange={() => setSelectedCriticalMoment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Momento Crítico
            </DialogTitle>
          </DialogHeader>
          {selectedCriticalMoment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Tiempo: {Math.floor(selectedCriticalMoment.timePoint / 60)}:{(selectedCriticalMoment.timePoint % 60).toFixed(0).padStart(2, '0')}</span>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{selectedCriticalMoment.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={
                  selectedCriticalMoment.impact === 'high' ? 'border-red-300 text-red-700' :
                  selectedCriticalMoment.impact === 'medium' ? 'border-orange-300 text-orange-700' :
                  'border-blue-300 text-blue-700'
                }>
                  Impacto {selectedCriticalMoment.impact === 'high' ? 'Alto' :
                           selectedCriticalMoment.impact === 'medium' ? 'Medio' : 'Bajo'}
                </Badge>
                <Badge variant="outline">
                  {selectedCriticalMoment.type === 'buying_signal' ? 'Señal de Compra' :
                   selectedCriticalMoment.type === 'interest_peak' ? 'Pico de Interés' :
                   selectedCriticalMoment.type === 'objection' ? 'Objeción' : 'Frustración'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ConversationAnalysisEnhanced;