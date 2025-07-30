'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, FileText, RotateCcw, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useClients } from '@/modules/clients/hooks/useClients';
import { IConversationDetail } from '@/types/elevenlabs';

async function fetchConversationDetail(tenantId: string, conversationId: string): Promise<IConversationDetail | null> {
  console.log(`Fetching conversation detail from ElevenLabs for tenant: ${tenantId}, conversationId: ${conversationId}`);

  try {
    const response = await fetch(`/api/client/calls/conversation-detail/${conversationId}`, {
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error fetching conversation details: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error("API returned incomplete data:", result);
      throw new Error("Datos incompletos recibidos de la API.");
    }
  } catch (error) {
    console.error("Failed to fetch conversation detail:", error);
    throw error;
  }
}

export default function IndividualCallDetailPage() {
  const params = useParams();
  const conversationId = params.conversation_id as string;
  const { currentTenant } = useClients();
  const [conversationDetail, setConversationDetail] = useState<IConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function getConversationDetail() {
      if (!conversationId || !currentTenant?.id) {
        setLoading(false);
        setError("ID de conversación o Tenant ID no disponible.");
        return;
      }
      setLoading(true);
      setError(undefined);
      try {
        const data = await fetchConversationDetail(currentTenant.id, conversationId);
        if (data) {
          setConversationDetail(data);
        } else {
          setError("No se encontraron detalles para esta conversación.");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Error al cargar los detalles de la conversación.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    getConversationDetail();
  }, [conversationId, currentTenant]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span className="text-lg">Cargando detalles de la conversación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!conversationDetail) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Conversación no encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se pudieron cargar los detalles de la conversación con ID: {conversationId}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatTimestamp = (unixSecs: number): string => {
    return new Date(unixSecs * 1000).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'initiated':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Phone className="h-8 w-8" />
        Detalles de Conversación Individual
      </h1>

      <div className="space-y-6">
        {/* Información General de la Conversación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Información General de Conversación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">ID Conversación:</span>
                <p className="text-muted-foreground font-mono text-xs">{conversationDetail.conversation_id}</p>
              </div>
              <div>
                <span className="font-medium">ID Agente:</span>
                <p className="text-muted-foreground font-mono text-xs">{conversationDetail.agent_id}</p>
              </div>
              <div>
                <span className="font-medium">Estado:</span>
                <Badge className={getStatusColor(conversationDetail.status)}>
                  {conversationDetail.status.toUpperCase()}
                </Badge>
              </div>
              {conversationDetail.user_id && (
                <div>
                  <span className="font-medium">User ID:</span>
                  <p className="text-muted-foreground font-mono text-xs">{conversationDetail.user_id}</p>
                </div>
              )}
              <div>
                <span className="font-medium">Inicio:</span>
                <p className="text-muted-foreground">
                  {formatTimestamp(conversationDetail.metadata.start_time_unix_secs)}
                </p>
              </div>
              <div>
                <span className="font-medium">Duración:</span>
                <p className="text-muted-foreground">
                  {formatDuration(conversationDetail.metadata.call_duration_secs)}
                </p>
              </div>
            </div>

            {/* Información de Audio */}
            <div className="mt-4 pt-4 border-t">
              <h3 className="font-medium text-base mb-2">Disponibilidad de Audio</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${conversationDetail.has_audio ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Audio General:</span>
                  <span className={conversationDetail.has_audio ? 'text-green-600' : 'text-red-600'}>
                    {conversationDetail.has_audio ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${conversationDetail.has_user_audio ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Audio Usuario:</span>
                  <span className={conversationDetail.has_user_audio ? 'text-green-600' : 'text-red-600'}>
                    {conversationDetail.has_user_audio ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${conversationDetail.has_response_audio ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">Audio Respuesta:</span>
                  <span className={conversationDetail.has_response_audio ? 'text-green-600' : 'text-red-600'}>
                    {conversationDetail.has_response_audio ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transcripción de la Conversación */}
        {conversationDetail.transcript && conversationDetail.transcript.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcripción de la Conversación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversationDetail.transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      entry.role === 'user' 
                        ? 'bg-blue-50 border-blue-200 ml-4' 
                        : 'bg-gray-50 border-gray-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={
                          entry.role === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }>
                          {entry.role === 'user' ? '👤 Usuario' : '🤖 Agente'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(entry.time_in_call_secs)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {entry.message}
                    </p>
                  </div>
                ))}
              </div>
              
              {conversationDetail.transcript.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay transcripción disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Datos de Configuración de Conversación */}
        {conversationDetail.conversation_initiation_client_data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuración de Conversación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {conversationDetail.conversation_initiation_client_data.conversation_config_override && (
                <div>
                  <h3 className="font-medium text-base mb-2">Configuración Personalizada:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                    {conversationDetail.conversation_initiation_client_data.conversation_config_override.tts?.voice_id && (
                      <div>
                        <span className="font-medium">Voz TTS:</span>
                        <p className="text-muted-foreground font-mono text-xs">
                          {conversationDetail.conversation_initiation_client_data.conversation_config_override.tts.voice_id}
                        </p>
                      </div>
                    )}
                    {conversationDetail.conversation_initiation_client_data.conversation_config_override.conversation?.text_only !== undefined && (
                      <div>
                        <span className="font-medium">Solo Texto:</span>
                        <p className="text-muted-foreground">
                          {conversationDetail.conversation_initiation_client_data.conversation_config_override.conversation.text_only ? 'Sí' : 'No'}
                        </p>
                      </div>
                    )}
                    {conversationDetail.conversation_initiation_client_data.conversation_config_override.agent?.first_message && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Primer Mensaje:</span>
                        <div className="bg-muted/30 p-3 rounded-md text-xs mt-1">
                          <p className="whitespace-pre-wrap">
                            {conversationDetail.conversation_initiation_client_data.conversation_config_override.agent.first_message}
                          </p>
                        </div>
                      </div>
                    )}
                    {conversationDetail.conversation_initiation_client_data.conversation_config_override.agent?.language && (
                      <div>
                        <span className="font-medium">Idioma:</span>
                        <p className="text-muted-foreground">
                          {conversationDetail.conversation_initiation_client_data.conversation_config_override.agent.language}
                        </p>
                      </div>
                    )}
                    {conversationDetail.conversation_initiation_client_data.conversation_config_override.agent?.prompt?.prompt && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Prompt del Sistema:</span>
                        <div className="bg-muted/30 p-3 rounded-md text-xs max-h-40 overflow-y-auto mt-1">
                          <p className="whitespace-pre-wrap">
                            {conversationDetail.conversation_initiation_client_data.conversation_config_override.agent.prompt.prompt}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {conversationDetail.conversation_initiation_client_data.dynamic_variables && 
               Object.keys(conversationDetail.conversation_initiation_client_data.dynamic_variables).length > 0 && (
                <div>
                  <h3 className="font-medium text-base mb-2">Variables Dinámicas:</h3>
                  <div className="bg-muted/30 p-3 rounded-md text-xs max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(conversationDetail.conversation_initiation_client_data.dynamic_variables, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {conversationDetail.conversation_initiation_client_data.source_info && (
                <div>
                  <h3 className="font-medium text-base mb-2">Información de Origen:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                    {conversationDetail.conversation_initiation_client_data.source_info.source && (
                      <div>
                        <span className="font-medium">Fuente:</span>
                        <p className="text-muted-foreground">{conversationDetail.conversation_initiation_client_data.source_info.source}</p>
                      </div>
                    )}
                    {conversationDetail.conversation_initiation_client_data.source_info.version && (
                      <div>
                        <span className="font-medium">Versión:</span>
                        <p className="text-muted-foreground">{conversationDetail.conversation_initiation_client_data.source_info.version}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Análisis de la Conversación */}
        {conversationDetail.analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Análisis de la Conversación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-3 rounded-md text-xs max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(conversationDetail.analysis, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadatos Adicionales */}
        {conversationDetail.metadata && Object.keys(conversationDetail.metadata).length > 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Metadatos Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-3 rounded-md text-xs max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(conversationDetail.metadata, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
