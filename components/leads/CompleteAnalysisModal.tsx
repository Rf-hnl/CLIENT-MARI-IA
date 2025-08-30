'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ModalAnalysisLoading } from '@/components/ui/analysis-loading';
import {
  BarChart3,
  Clock,
  Users,
  MessageSquare,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Calendar,
  DollarSign,
  Building,
  RefreshCw,
  Loader2
} from 'lucide-react';

// Helper to get sentiment color
const getSentimentColor = (sentiment: string | undefined) => {
  switch (sentiment) {
    case 'positive': return 'bg-green-100 text-green-800';
    case 'negative': return 'bg-red-100 text-red-800';
    case 'neutral': return 'bg-gray-100 text-gray-800';
    case 'mixed': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface CompleteAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: any;
  onReAnalyze?: () => void;
  isReanalyzing?: boolean;
}

export function CompleteAnalysisModal({ isOpen, onClose, analysis, onReAnalyze, isReanalyzing }: CompleteAnalysisModalProps) {
  if (!analysis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-6 w-6 text-orange-500" />
            Análisis Completo de Conversación
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            
            {/* Resumen Principal */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-700">
              <h3 className="text-lg font-semibold mb-4 text-orange-800 dark:text-orange-200">📊 Métricas Principales</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Sentimiento</div>
                  <Badge className={`${getSentimentColor(
                    analysis.sentiment?.overall?.sentiment ||
                    analysis.sentiment?.sentiment ||
                    analysis.overallSentiment ||
                    'neutral'
                  )} text-sm px-3 py-1`}>
                    {analysis.sentiment?.overall?.sentiment ||
                     analysis.sentiment?.sentiment ||
                     analysis.overallSentiment ||
                     'neutral'}
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Interés del Lead</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {Math.round((analysis.sentiment?.overall?.score || 0) * 5 + 5)}/10
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Conversión</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Math.round((analysis.conversionProbability || 0) * 100)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Calidad</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analysis.qualityScore || analysis.callQualityScore || 50}/100
                  </div>
                </div>
              </div>
            </div>

            {/* Información de la Conversación */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Métricas de Comunicación */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    Métricas de Comunicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.speakingTimeDistribution && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Distribución del Tiempo de Habla</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Agente:</span>
                          <Badge variant="outline">{analysis.speakingTimeDistribution.agent || 0}%</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Cliente:</span>
                          <Badge variant="outline">{analysis.speakingTimeDistribution.client || 0}%</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {analysis.questionCount && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Conteo de Preguntas</h4>
                      <div className="text-2xl font-bold text-orange-600">{analysis.questionCount}</div>
                    </div>
                  )}
                  
                  {analysis.interruptionAnalysis && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Análisis de Interrupciones</h4>
                      <div className="text-sm text-gray-600">
                        {typeof analysis.interruptionAnalysis === 'object' && analysis.interruptionAnalysis.analysis
                          ? analysis.interruptionAnalysis.analysis
                          : typeof analysis.interruptionAnalysis === 'string' 
                            ? analysis.interruptionAnalysis
                            : 'No disponible'}
                      </div>
                    </div>
                  )}
                  
                  {analysis.engagementLevel && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Nivel de Engagement</h4>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">{analysis.engagementLevel}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Intelligence Comercial */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-orange-600" />
                    Intelligence Comercial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.competitorMentions && analysis.competitorMentions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Competidores Mencionados
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.competitorMentions.map((competitor: string, i: number) => (
                          <Badge key={i} variant="outline" className="border-orange-500 text-orange-700">
                            {competitor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.priceDiscussion && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Discusión de Precios
                      </h4>
                      <div className="text-sm text-gray-600">
                        {typeof analysis.priceDiscussion === 'object' 
                          ? JSON.stringify(analysis.priceDiscussion)
                          : analysis.priceDiscussion || 'No discutido'}
                      </div>
                    </div>
                  )}
                  
                  {analysis.decisionMakers && analysis.decisionMakers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Tomadores de Decisión
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {analysis.decisionMakers.map((maker: string, i: number) => (
                          <Badge key={i} className="bg-purple-100 text-purple-800">
                            {maker}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.timeframeIndicators && (Array.isArray(analysis.timeframeIndicators) ? analysis.timeframeIndicators.length > 0 : analysis.timeframeIndicators) && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Indicadores de Tiempo
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(analysis.timeframeIndicators) 
                          ? analysis.timeframeIndicators.map((indicator: string, i: number) => (
                              <Badge key={i} className="bg-amber-100 text-amber-800">
                                {indicator}
                              </Badge>
                            ))
                          : <span className="text-xs text-gray-600">
                              {typeof analysis.timeframeIndicators === 'object' 
                                ? JSON.stringify(analysis.timeframeIndicators)
                                : analysis.timeframeIndicators}
                            </span>
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Temas, Señales y Objeciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Temas Clave
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {analysis.keyTopics && analysis.keyTopics.length > 0 ? (
                      analysis.keyTopics.map((topic: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No identificados</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Señales de Compra
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {analysis.buyingSignals && analysis.buyingSignals.length > 0 ? (
                      analysis.buyingSignals.map((signal: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-green-500 text-green-700 text-xs">
                          {signal}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No identificadas</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Objeciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {analysis.objections && analysis.objections.length > 0 ? (
                      analysis.objections.map((objection: string, i: number) => (
                        <Badge key={i} variant="outline" className="border-red-500 text-red-700 text-xs">
                          {objection}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No identificadas</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones y Recomendaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Elementos de Acción */}
              {analysis.actionItems && analysis.actionItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Elementos de Acción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.actionItems.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-green-50 rounded-md">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sugerencias de Seguimiento */}
              {analysis.followUpSuggestions && analysis.followUpSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Sugerencias de Seguimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.followUpSuggestions.map((suggestion: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-yellow-50 rounded-md">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recomendaciones Finales */}
            {(analysis.recommendedNextAction || analysis.bestFollowUpTime || analysis.suggestedApproach) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Recomendaciones de IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.recommendedNextAction && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Próxima Acción Recomendada</h4>
                      <div className="p-3 bg-purple-50 rounded-md">
                        <span className="text-sm">{analysis.recommendedNextAction}</span>
                      </div>
                    </div>
                  )}
                  
                  {analysis.bestFollowUpTime && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Mejor Momento para Seguimiento
                      </h4>
                      <Badge className="bg-indigo-100 text-indigo-800">{analysis.bestFollowUpTime}</Badge>
                    </div>
                  )}
                  
                  {analysis.suggestedApproach && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Enfoque Sugerido</h4>
                      <div className="p-3 bg-blue-50 rounded-md">
                        <span className="text-sm">{analysis.suggestedApproach}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Metadata Técnica */}
            {(analysis.confidence || analysis.processingModel || analysis.processingTime || onReAnalyze) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      Información Técnica
                    </div>
                    {onReAnalyze && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReAnalyze}
                        disabled={isReanalyzing}
                        className="flex items-center gap-1 text-xs h-6 px-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50"
                        title="Re-analizar conversación"
                      >
                        {isReanalyzing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        {isReanalyzing ? 'Analizando...' : 'Re-analizar'}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.confidence && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Confianza del Análisis:</span>
                      <Badge variant="outline">{Math.round(analysis.confidence * 100)}%</Badge>
                    </div>
                  )}
                  {analysis.processingModel && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Modelo de Procesamiento:</span>
                      <Badge variant="outline">{analysis.processingModel}</Badge>
                    </div>
                  )}
                  {analysis.processingTime && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tiempo de Procesamiento:</span>
                      <Badge variant="outline">
                        {analysis.processingTime >= 1000 
                          ? `${(analysis.processingTime / 1000).toFixed(1)}s`
                          : `${analysis.processingTime}ms`}
                      </Badge>
                    </div>
                  )}
                  {isReanalyzing && (
                    <ModalAnalysisLoading message="Re-analizando conversación con IA..." />
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}