'use client';

import { useEffect } from 'react';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useBatchCallDetail } from '@/hooks/useBatchCalls';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, Phone, Clock, User, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, Headphones, FileText, RotateCcw, Zap } from 'lucide-react';
import { BATCH_CALL_STATUS_COLORS, BATCH_CALL_STATUS_ICONS } from '@/types/cobros';
import { safeFormatDate } from '@/utils/dateFormat';

interface BatchCallDetailModalProps {
  batchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BatchCallDetailModal({ batchId, isOpen, onClose }: BatchCallDetailModalProps) {
  const { currentTenant } = useClients();
  const { detail, loading, error, refresh } = useBatchCallDetail(
    currentTenant?.id || null,
    batchId
  );

  // Refresh cuando se abre el modal
  useEffect(() => {
    if (isOpen && batchId) {
      refresh();
    }
  }, [isOpen, batchId, refresh]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Detalles de Llamada Batch
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Cargando detalles...</span>
          </div>
        )}

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            Error: {error}
          </div>
        )}

        {detail && (
          <div className="space-y-6">
            {/* Información General */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2 leading-tight line-clamp-2">{detail.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={BATCH_CALL_STATUS_COLORS[detail.status]}>
                          <span className="mr-1">{BATCH_CALL_STATUS_ICONS[detail.status]}</span>
                          {detail.status_display}
                        </Badge>
                        <Badge variant="outline">{detail.call_type}</Badge>
                      </div>
                      <div>
                        <span className="font-medium">ID:</span> 
                        <span className="font-mono text-xs ml-1">{detail.id}</span>
                      </div>
                      <div>
                        <span className="font-medium">Agente:</span> {detail.agent_name}
                      </div>
                      <div>
                        <span className="font-medium">Proveedor:</span> {detail.phone_provider}
                      </div>
                      {detail.workspace_id && (
                        <div>
                          <span className="font-medium">Workspace:</span> 
                          <span className="font-mono text-xs ml-1">{detail.workspace_id}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Creada:</span>
                      <p className="text-muted-foreground">{safeFormatDate(detail.created_at)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Programada:</span>
                      <p className="text-muted-foreground">{safeFormatDate(detail.scheduled_time)}</p>
                    </div>
                    <div>
                      <span className="font-medium">Última actualización:</span>
                      <p className="text-muted-foreground">{safeFormatDate(detail.last_updated_at)}</p>
                    </div>
                    {detail.total_cost_usd && detail.total_cost_usd > 0 && (
                      <div>
                        <span className="font-medium">Costo Total:</span>
                        <p className="text-green-600 font-medium">${detail.total_cost_usd.toFixed(4)} USD</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progreso</span>
                    <span className="text-sm text-muted-foreground">
                      {detail.total_calls_dispatched}/{detail.total_calls_scheduled} ({detail.progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: `${detail.progress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Conversación */}
            {detail.conversation_config && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Configuración de Conversación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Voz:</span>
                      <p className="text-muted-foreground">{detail.conversation_config.voice_name || detail.conversation_config.voice_id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Modelo:</span>
                      <p className="text-muted-foreground">{detail.conversation_config.model_id}</p>
                    </div>
                    <div>
                      <span className="font-medium">Idioma:</span>
                      <p className="text-muted-foreground">{detail.conversation_config.language}</p>
                    </div>
                    <div>
                      <span className="font-medium">Duración Máx:</span>
                      <p className="text-muted-foreground">{detail.conversation_config.max_duration_seconds}s</p>
                    </div>
                    {detail.conversation_config.webhook_url && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Webhook:</span>
                        <p className="text-muted-foreground font-mono text-xs truncate">{detail.conversation_config.webhook_url}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Configuración de Reintentos */}
            {detail.retry_settings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    Configuración de Reintentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Máx. Reintentos:</span>
                      <p className="text-muted-foreground">{detail.retry_settings.max_retries}</p>
                    </div>
                    <div>
                      <span className="font-medium">Delay entre Reintentos:</span>
                      <p className="text-muted-foreground">{detail.retry_settings.retry_delay_seconds}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estadísticas Avanzadas de Recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estadísticas Avanzadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Primera fila - Estadísticas básicas */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{detail.recipients.length}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {detail.recipients.filter(r => r.status === 'completed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {detail.recipients.filter(r => r.status === 'in_progress').length}
                    </div>
                    <div className="text-sm text-muted-foreground">En Progreso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {detail.recipients.filter(r => r.status === 'failed').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Fallidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {detail.recipients.reduce((acc, r) => acc + (r.retry_count || 0), 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Reintentos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {detail.recipients.length > 0 ? Math.round((detail.recipients.filter(r => r.status === 'completed').length / detail.recipients.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Éxito</div>
                  </div>
                </div>

                {/* Segunda fila - Métricas de tiempo y calidad */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Duración Total</span>
                    </div>
                    <div className="text-lg font-bold">
                      {Math.floor(detail.recipients.reduce((acc, r) => acc + (r.duration_minutes || 0), 0) / 60)}h {detail.recipients.reduce((acc, r) => acc + (r.duration_minutes || 0), 0) % 60}m
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Promedio</span>
                    </div>
                    <div className="text-lg font-bold">
                      {detail.recipients.length > 0 ? Math.round(detail.recipients.reduce((acc, r) => acc + (r.duration_minutes || 0), 0) / detail.recipients.length) : 0}m
                    </div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Con Transcripción</span>
                    </div>
                    <div className="text-lg font-bold">
                      {detail.recipients.filter(r => r.transcript).length}
                    </div>
                  </div>

                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Headphones className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Con Audio</span>
                    </div>
                    <div className="text-lg font-bold">
                      {detail.recipients.filter(r => r.audio_url).length}
                    </div>
                  </div>
                </div>

                {/* Tercera fila - Costos (si disponible) */}
                {detail.recipients.some(r => r.cost_usd) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Costo Total</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${detail.recipients.reduce((acc, r) => acc + (r.cost_usd || 0), 0).toFixed(4)}
                      </div>
                    </div>
                    
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Costo Promedio</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${detail.recipients.length > 0 ? (detail.recipients.reduce((acc, r) => acc + (r.cost_usd || 0), 0) / detail.recipients.length).toFixed(4) : '0.0000'}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Costo/Minuto</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${detail.recipients.reduce((acc, r) => acc + (r.duration_minutes || 0), 0) > 0 
                          ? (detail.recipients.reduce((acc, r) => acc + (r.cost_usd || 0), 0) / detail.recipients.reduce((acc, r) => acc + (r.duration_minutes || 0), 0)).toFixed(4)
                          : '0.0000'
                        }
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de Recipients */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Llamadas Individuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {detail.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{recipient.phone_number}</span>
                            <Badge
                              variant="outline"
                              className={BATCH_CALL_STATUS_COLORS[recipient.status]}
                            >
                              <span className="mr-1">{BATCH_CALL_STATUS_ICONS[recipient.status]}</span>
                              {recipient.status_display}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                            {/* Información de tiempo */}
                            <div className="space-y-1">
                              {recipient.created_at && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Creada:</span>
                                  <p className="text-foreground">{safeFormatDate(recipient.created_at)}</p>
                                </div>
                              )}
                              {recipient.started_at && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Iniciada:</span>
                                  <p className="text-foreground">{safeFormatDate(recipient.started_at)}</p>
                                </div>
                              )}
                              {recipient.ended_at && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Finalizada:</span>
                                  <p className="text-foreground">{safeFormatDate(recipient.ended_at)}</p>
                                </div>
                              )}
                            </div>

                            {/* Información de duración y costos */}
                            <div className="space-y-1">
                              {recipient.duration_minutes > 0 && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Duración:</span>
                                  <p className="text-foreground">{recipient.duration_formatted}</p>
                                </div>
                              )}
                              {recipient.cost_usd && recipient.cost_usd > 0 && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Costo:</span>
                                  <p className="text-green-600 font-medium">${recipient.cost_usd.toFixed(4)}</p>
                                </div>
                              )}
                              {recipient.retry_count && recipient.retry_count > 0 && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Reintentos:</span>
                                  <p className="text-purple-600 font-medium">{recipient.retry_count}</p>
                                </div>
                              )}
                            </div>

                            {/* Información técnica */}
                            <div className="space-y-1">
                              {recipient.conversation_id && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Conversación:</span>
                                  <p className="font-mono text-xs truncate text-foreground">{recipient.conversation_id}</p>
                                </div>
                              )}
                              {recipient.call_id && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Call ID:</span>
                                  <p className="font-mono text-xs truncate text-foreground">{recipient.call_id}</p>
                                </div>
                              )}
                              {recipient.quality_score && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Calidad:</span>
                                  <p className="text-foreground">{recipient.quality_score}/5</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Información de audio y transcripción */}
                          {(recipient.audio_url || recipient.transcript) && (
                            <div className="mt-3 pt-3 border-t border-muted">
                              <div className="flex items-center gap-4 text-xs">
                                {recipient.audio_url && (
                                  <div className="flex items-center gap-1">
                                    <Headphones className="h-3 w-3 text-blue-500" />
                                    <a 
                                      href={recipient.audio_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:text-blue-700 underline"
                                    >
                                      Audio disponible
                                    </a>
                                  </div>
                                )}
                                {recipient.transcript && (
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-green-500" />
                                    <span className="text-green-500">Transcripción disponible</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Mostrar transcripción si está disponible */}
                              {recipient.transcript && (
                                <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                  <span className="font-medium text-muted-foreground">Transcripción:</span>
                                  <p className="text-foreground mt-1 line-clamp-3">{recipient.transcript}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Mensaje de error si existe */}
                          {recipient.error_message && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="font-medium text-red-700 text-xs">Error:</span>
                                  <p className="text-red-600 text-xs mt-1">{recipient.error_message}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          {recipient.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {recipient.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                          {recipient.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-500" />}
                          {recipient.status === 'pending' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {detail.recipients.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay destinatarios registrados
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}