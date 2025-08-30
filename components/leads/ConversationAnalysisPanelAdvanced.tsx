'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversationAnalysis } from '@/hooks/useConversationAnalysis';
import { IntelligentActionGenerator, IntelligentAction } from '@/lib/ai/intelligentActions';
import { Loader2, AlertTriangle, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { CompleteAnalysisModal } from './CompleteAnalysisModal';
import { AnalysisLoading } from '@/components/ui/analysis-loading';
import { Lead } from '@/types/lead';
import { authFetch } from '@/lib/auth-interceptor';
import { toast } from 'sonner';

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

interface ConversationAnalysisPanelAdvancedProps {
  conversationId: string;
  leadId: string;
  tenantId?: string; // optional para compatibilidad
  transcript?: any; // optional para compatibilidad 
  callSuccessful?: string; // optional para compatibilidad
  onVisibilityChange?: (isVisible: boolean) => void; // Callback para informar cuando el componente se oculta/muestra
}

export function ConversationAnalysisPanelAdvanced({
  conversationId,
  leadId,
  tenantId,
  transcript,
  callSuccessful,
  onVisibilityChange
}: ConversationAnalysisPanelAdvancedProps) {
  const { analysis, loading, error, analyzeConversation } = useConversationAnalysis(leadId, conversationId);
  const [actions, setActions] = useState<IntelligentAction[]>([]);
  const [lead, setLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<IntelligentAction | null>(null);
  const [isCompleteAnalysisModalOpen, setIsCompleteAnalysisModalOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Función para determinar si hay datos suficientes para mostrar el análisis
  const hasAnalysisData = (analysis: any): boolean => {
    if (!analysis) return false;
    
    // Verificar si hay sentiment data
    const hasSentiment = analysis.sentiment?.overall?.sentiment || analysis.overallSentiment;
    
    // Verificar si hay métricas básicas
    const hasQuality = (analysis.qualityScore || analysis.callQualityScore) > 0;
    const hasConversion = (analysis.conversionProbability) > 0;
    
    // Verificar si hay contenido de análisis
    const hasContent = (analysis.keyTopics?.length > 0) || 
                      (analysis.buyingSignals?.length > 0) || 
                      (analysis.objections?.length > 0) ||
                      (analysis.actionItems?.length > 0);
    
    // Mostrar si tiene al menos sentiment o contenido significativo
    return hasSentiment || hasQuality || hasConversion || hasContent;
  };

  // Notificar cambios de visibilidad al componente padre
  useEffect(() => {
    if (!loading) {
      const isVisible = !analysis || (analysis && hasAnalysisData(analysis)) || error;
      onVisibilityChange?.(isVisible);
    }
  }, [analysis, loading, error, onVisibilityChange]);

  // Si no hay datos significativos, no mostrar nada
  if (!loading && !error && analysis && !hasAnalysisData(analysis)) {
    return null;
  }

  useEffect(() => {
    const fetchLead = async () => {
      if (leadId) {
        try {
          const response = await authFetch(`/api/leads/${leadId}`);
          if (response.ok) {
            const data = await response.json();
            setLead(data.lead);
          } else {
            throw new Error(`GET /api/leads/${leadId} → HTTP ${response.status}`);
          }
        } catch (error) {
          console.error("Failed to fetch lead data", error);
          toast.error('Error al cargar los datos del lead.');
        }
      }
    };
    fetchLead();
  }, [leadId]);

  useEffect(() => {
    if (analysis) {
      const generatedActions = IntelligentActionGenerator.generateActions(analysis, lead);
      setActions(generatedActions);
    } else {
      setActions([]);
    }
  }, [analysis, lead]);

  const handleAnalyzeAction = async () => {
    if (!leadId || !conversationId) return;
    // Don't provide transcript - let backend fetch it from ElevenLabs automatically
    await analyzeConversation({ 
      leadId, 
      conversationId
      // transcript: undefined - backend will fetch from ElevenLabs
    });
  };

  const handleReAnalyzeAction = async () => {
    if (!leadId || !conversationId) return;
    setIsReanalyzing(true);
    try {
      await analyzeConversation({ 
        leadId, 
        conversationId
        // transcript: undefined - backend will fetch from ElevenLabs
      });
    } finally {
      setIsReanalyzing(false);
    }
  };
  
  const handleActionClick = (action: IntelligentAction) => {
    const schedulableActions: IntelligentAction['type'][] = ['schedule_meeting', 'schedule_technical_call'];
    if (schedulableActions.includes(action.type)) {
      setSelectedAction(action);
      setIsModalOpen(true);
    } else {
      console.log('Intelligent Action Clicked:', action);
      toast.info(`Acción: ${action.title}`, {
        description: 'Esta acción aún no tiene una implementación automática.',
      });
    }
  };

  return (
    <>
      <Card className="w-full h-full flex flex-col max-h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-orange-500" />
            Análisis de Conversación con IA
          </CardTitle>
          <CardDescription>
            Análisis detallado y acciones inteligentes sugeridas por la IA.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col min-h-0">
          {(loading || isReanalyzing) && (
            <AnalysisLoading 
              message={isReanalyzing ? 'Re-analizando conversación...' : 'Analizando conversación...'}
              submessage={`IA procesando datos con ${isReanalyzing ? 'nuevos parámetros' : 'análisis avanzado'}`}
              size="md"
            />
          )}
          {error && (
            <div className="flex-grow flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-red-500">
                <AlertTriangle className="h-8 w-8" />
                <p className="text-sm font-semibold">Error en el Análisis</p>
                <p className="text-xs text-center">{error}</p>
                <Button variant="outline" size="sm" onClick={handleAnalyzeAction} className="mt-2">
                  Reintentar Análisis
                </Button>
              </div>
            </div>
          )}
          {!loading && !isReanalyzing && !error && !analysis && (
            <div className="flex-grow flex items-center justify-center">
              <div className="text-center">
                <p className="mb-4">No se ha realizado un análisis para esta conversación.</p>
                <Button onClick={handleAnalyzeAction} className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ejecutar Análisis Ahora
                </Button>
              </div>
            </div>
          )}
          {analysis && !loading && !isReanalyzing && (
            <>
              <ScrollArea className="flex-1 min-h-0">
                <div className="flex flex-col gap-6 pr-4">
                  {/* Columna de Análisis */}
                  <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-lg mb-4">Resumen del Análisis</h3>
                
                {/* Métricas principales en diseño mejorado */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4 mb-4 border border-orange-200 dark:border-orange-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Sentimiento General</div>
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
                  </div>
                </div>

                {/* Métricas secundarias */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Probabilidad de Conversión</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {Math.round((analysis.conversionProbability || 0) * 100)}%
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calidad de Llamada</div>
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                      {analysis.qualityScore || analysis.callQualityScore || 50}/100
                    </div>
                  </div>
                </div>
                {/* Información de la conversación */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4">
                    
                    {/* Temas Clave */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <h4 className="font-semibold text-sm text-orange-700 dark:text-orange-300">Temas Clave</h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.keyTopics && analysis.keyTopics.length > 0 ? (
                          analysis.keyTopics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200">
                              {topic}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No identificados</span>
                        )}
                      </div>
                    </div>

                    {/* Señales de Compra */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-300">Señales de Compra</h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.buyingSignals && analysis.buyingSignals.length > 0 ? (
                          analysis.buyingSignals.map((signal, i) => (
                            <Badge key={i} variant="outline" className="border-green-500 text-green-700 text-xs hover:bg-green-50">
                              {signal}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No identificadas</span>
                        )}
                      </div>
                    </div>

                    {/* Objeciones */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <h4 className="font-semibold text-sm text-red-700 dark:text-red-300">Objeciones</h4>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {analysis.objections && analysis.objections.length > 0 ? (
                          analysis.objections.map((objection, i) => (
                            <Badge key={i} variant="outline" className="border-red-500 text-red-700 text-xs hover:bg-red-50">
                              {objection}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No identificadas</span>
                        )}
                      </div>
                    </div>

                  </div>
                  </div>
                </div>
                </div>
              </ScrollArea>
              
              {/* Botón de Análisis Completo en el footer - FUERA del ScrollArea */}
              <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCompleteAnalysisModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver Análisis Completo
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <ScheduleMeetingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lead={lead}
        action={selectedAction}
      />
      <CompleteAnalysisModal
        isOpen={isCompleteAnalysisModalOpen}
        onClose={() => setIsCompleteAnalysisModalOpen(false)}
        analysis={analysis}
        onReAnalyze={handleReAnalyzeAction}
        isReanalyzing={isReanalyzing}
      />
    </>
  );
}

// Legacy export alias for backward compatibility
export const ConversationAnalysisPanel = ConversationAnalysisPanelAdvanced;

export default ConversationAnalysisPanelAdvanced;
