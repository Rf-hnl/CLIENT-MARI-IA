'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Clock, 
  MessageSquare, 
  Eye, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhoneCall,
  Copy,
  Check
} from 'lucide-react';
import { useLeadConversations, useConversationTranscript } from '@/hooks/useLeadConversations';
import { ConversationAnalysisPanel } from './ConversationAnalysisPanelAdvanced';
import { useLeads } from '@/modules/leads/context/LeadsContext';

interface LeadConversationsTabProps {
  leadId: string;
}

const LeadConversationsTab: React.FC<LeadConversationsTabProps> = ({ leadId }) => {
  const { conversations, leadInfo, loading, error, refetch } = useLeadConversations(leadId);
  const { currentTenant } = useLeads();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isAnalysisPanelVisible, setIsAnalysisPanelVisible] = useState(true);
  
  const { 
    transcript, 
    loading: transcriptLoading, 
    error: transcriptError 
  } = useConversationTranscript(leadId, selectedConversationId);

  // Auto-select the last successful conversation when conversations load and none is selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId && !loading) {
      // Find the most recent successful conversation (status: 'done' AND callSuccessful: 'success')
      const successfulConversations = conversations.filter(conv => 
        conv.status === 'done' && conv.callSuccessful === 'success'
      );
      
      if (successfulConversations.length > 0) {
        // Select the most recent successful conversation (assuming array is ordered by date)
        const lastSuccessfulConversation = successfulConversations[0];
        console.log('🔄 [AUTO-SELECT] Selecting last successful conversation:', lastSuccessfulConversation.conversationId);
        setSelectedConversationId(lastSuccessfulConversation.conversationId);
      } else {
        // If no successful conversations, select the first one anyway but log the situation
        console.log('⚠️ [AUTO-SELECT] No successful conversations found, selecting first available:', conversations[0].conversationId);
        setSelectedConversationId(conversations[0].conversationId);
      }
    }
  }, [conversations, selectedConversationId, loading]);

  const handleCopyTranscript = async () => {
    if (!transcript?.transcript.formatted) return;
    
    try {
      await navigator.clipboard.writeText(transcript.transcript.formatted);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string, callSuccessful: string) => {
    if (status === 'done') {
      if (callSuccessful === 'success') {
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Exitosa
        </Badge>;
      } else if (callSuccessful === 'failure') {
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Fallida
        </Badge>;
      }
    }
    
    return <Badge variant="secondary">
      <AlertCircle className="w-3 h-3 mr-1" />
      {status === 'in-progress' ? 'En progreso' : 
       status === 'processing' ? 'Procesando' : 
       status === 'initiated' ? 'Iniciada' : status}
    </Badge>;
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? 
      <Phone className="w-4 h-4 text-orange-500" /> : 
      <PhoneCall className="w-4 h-4 text-green-500" />;
  };

  interface TranscriptMessage {
    role: 'agent' | 'client';
    message?: string;
    text?: string;
    time_in_call_secs?: number;
    [key: string]: unknown;
  }
  
  const renderTranscriptAsChat = (transcript: { raw?: TranscriptMessage[] }) => {
    if (!transcript?.raw || !Array.isArray(transcript.raw)) {
      return null;
    }
  
    return transcript.raw.map((message: TranscriptMessage, index: number) => {
      const isAgent = message.role === 'agent';
      const messageText = message.message || message.text || '';
      
      // Debug para ver mensajes largos
      if (messageText.length > 200) {
        // console.log(`🐛 [MENSAJE LARGO] Índice ${index}, Longitud: ${messageText.length}`, messageText);
      }
      
      if (!messageText.trim()) return null;
  
      return (
        <div key={index} className={`flex mb-2 ${isAgent ? 'justify-start' : 'justify-end'}`}>
          <div className={`${messageText.length > 200 ? 'max-w-[95%]' : 'max-w-[85%]'} rounded-md px-3 py-2 ${
            isAgent 
              ? 'bg-white border border-orange-200 text-gray-900' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
          }`}>
            <div className="flex items-center mb-0.5">
              <span className={`text-[10px] font-medium ${
                isAgent ? 'text-gray-700' : 'text-orange-100'
              }`}>
                {isAgent ? '🤖 Agente' : '👤 Cliente'}
              </span>
              {message.time_in_call_secs && (
                <span className={`text-[10px] ml-2 ${
                  isAgent ? 'text-gray-600' : 'text-orange-200'
                }`}>
                  {Math.floor(message.time_in_call_secs / 60)}:{(message.time_in_call_secs % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap break-words">
              {messageText}
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-orange-600" />
        <span className="text-gray-900">Cargando conversaciones...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="h-full border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Error al cargar conversaciones</h3>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="h-full border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">No hay conversaciones disponibles</h3>
            <p className="text-gray-700 mb-4">
              Este lead puede tener llamadas que aún están procesándose o las conversaciones no están sincronizadas.
            </p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Buscar conversaciones
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4 h-full max-w-none overflow-hidden">
      {/* Lista de conversaciones - Scroll individual */}
      <div className="flex-none xl:w-60 h-80 xl:h-full">
        <Card className="flex flex-col h-full border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
          <CardHeader className="pb-2 flex-shrink-0 py-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-sm font-medium text-orange-800">
                <MessageSquare className="w-4 h-4 mr-2 text-orange-600" />
                Conversaciones ({conversations.length})
              </CardTitle>
              <Button onClick={refetch} variant="outline" size="sm" className="h-6 w-6 p-0 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 rounded">
                <RefreshCw className="w-2.5 h-2.5 text-orange-600" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {conversations.map((conversation, index) => (
                  <div
                    key={conversation.conversationId}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-orange-50 hover:border-orange-300 border ${
                      selectedConversationId === conversation.conversationId 
                        ? 'ring-2 ring-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-sm' 
                        : 'border-orange-200 bg-white'
                    }`}
                    onClick={() => setSelectedConversationId(conversation.conversationId)}
                  >
                    {/* Header ultra compacto */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1 flex-1 min-w-0">
                        {getDirectionIcon(conversation.direction)}
                        <span className="font-medium text-xs truncate text-gray-900">{conversation.agentName}</span>
                      </div>
                      <div className="scale-75 -mr-1">
                        {getStatusBadge(conversation.status, conversation.callSuccessful)}
                      </div>
                    </div>
                    
                    {/* Métricas en una sola línea */}
                    <div className="flex items-center justify-between text-xs text-gray-700 mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5 text-orange-500" />
                          <span className="text-[10px]">{conversation.duration ? formatDuration(conversation.duration) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-2.5 h-2.5 mr-0.5 text-orange-500" />
                          <span className="text-[10px]">{conversation.messageCount}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {conversation.startTime ? new Date(conversation.startTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'N/A'}
                      </span>
                    </div>
                    
                    {/* Resumen condensado - solo si existe */}
                    {conversation.callSummaryTitle && (
                      <p className="text-[10px] font-medium text-orange-600 line-clamp-1">
                        {conversation.callSummaryTitle}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de conversación seleccionada - Scroll individual */}
      <div className="flex-1 h-full min-h-0 flex flex-col lg:flex-row gap-4">
        {/* Transcripción */}
        <div className="flex-1 min-h-0">
        <Card className="flex flex-col h-full border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
        <CardHeader className="pb-2 flex-shrink-0 py-3 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
          <CardTitle className="flex items-center text-sm font-medium text-orange-800">
            <Eye className="w-4 h-4 mr-2 text-orange-600" />
            {selectedConversationId ? 'Transcripción' : 'Selecciona una conversación'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {!selectedConversationId ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                <p className="text-black dark:text-white">
                  Selecciona una conversación de la lista para ver su transcripción completa.
                </p>
              </div>
            </div>
          ) : transcriptLoading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-orange-600" />
              <span className="text-gray-900">Cargando transcripción...</span>
            </div>
          ) : transcriptError ? (
            <div className="text-center p-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 mb-4">{transcriptError}</p>
              <Button 
                onClick={() => setSelectedConversationId(null)} 
                variant="outline"
              >
                Volver
              </Button>
            </div>
          ) : transcript ? (
            <div className="flex flex-col h-full">
              {/* Información de la conversación - Compacta */}
              <div className="flex-shrink-0 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 mx-3 mt-2 mb-1 rounded-lg">
                <div className="p-2">
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-orange-700">Agente:</span>
                        <span className="text-gray-900 font-medium truncate max-w-20">{transcript.callLogInfo.agentName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span className="text-gray-900">{transcript.conversationDetails.duration_formatted || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-orange-500" />
                        <span className="text-gray-900">{transcript.conversationDetails.message_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium ${
                          transcript.conversationDetails.call_successful === 'success' ? 'text-green-600' : 
                          transcript.conversationDetails.call_successful === 'failure' ? 'text-red-600' : 
                          'text-gray-900'
                        }`}>
                          {transcript.conversationDetails.call_successful === 'success' ? 'Exitosa' : 
                           transcript.conversationDetails.call_successful === 'failure' ? 'Fallida' : transcript.conversationDetails.status}
                        </span>
                      </div>
                    </div>
                    
                    {transcript.conversationDetails.call_summary_title && (
                      <div className="mt-2 pt-2 border-t border-orange-200">
                        <p className="text-xs text-orange-800 line-clamp-2">
                          {transcript.conversationDetails.call_summary_title}
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Transcripción - Scroll individual independiente */}
              <div className="flex-1 p-2 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <h4 className="font-medium text-sm text-orange-800">Conversación:</h4>
                  <Button
                    onClick={handleCopyTranscript}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 h-6 px-2 text-xs border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 rounded"
                    disabled={!transcript?.transcript.formatted}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex-1 border border-orange-200 rounded-lg bg-orange-50/30 overflow-hidden min-h-0">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      {transcript.transcript.raw && transcript.transcript.raw.length > 0 ? (
                        <div className="space-y-1">
                          {renderTranscriptAsChat(transcript.transcript)}
                        </div>
                      ) : transcript.transcript.formatted ? (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <pre className="text-xs whitespace-pre-wrap leading-relaxed font-sans text-gray-900">
                            {transcript.transcript.formatted}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                          <p className="text-black dark:text-white italic mb-2">
                            No hay transcripción disponible para esta conversación.
                          </p>
                          {transcript.conversationDetails.call_successful === 'failure' ? (
                            <p className="text-red-500 dark:text-red-400 text-sm">
                              ❌ La llamada falló - no se generó transcripción
                            </p>
                          ) : transcript.conversationDetails.status === 'done' && transcript.conversationDetails.message_count === 0 ? (
                            <p className="text-amber-500 dark:text-amber-400 text-sm">
                              ⚠️ Llamada completada pero sin mensajes registrados
                            </p>
                          ) : (
                            <p className="text-orange-500 dark:text-orange-400 text-sm">
                              ⏳ La transcripción puede estar procesándose aún
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
        </Card>
        </div>


        {/* Panel de Inteligencia de Conversaciones - Solo mostrar si hay datos */}
        {selectedConversationId && (
          <div className={`w-full h-64 lg:h-full ${isAnalysisPanelVisible ? 'lg:w-[480px] xl:w-96' : 'lg:w-0 xl:w-0 overflow-hidden'} transition-all duration-300`}>
            <ConversationAnalysisPanel
              leadId={leadId}
              conversationId={selectedConversationId}
              tenantId={currentTenant?.id || ''}
              transcript={transcript}
              callSuccessful={conversations.find(c => c.conversationId === selectedConversationId)?.callSuccessful}
              onVisibilityChange={setIsAnalysisPanelVisible}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadConversationsTab;