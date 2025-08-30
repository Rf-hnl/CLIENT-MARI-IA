'use client';

/**
 * HISTORIAL DE LLAMADAS DE LEAD
 * 
 * Componente para mostrar todas las llamadas realizadas a un lead específico
 * Incluye transcripciones, duración, resultados, etc.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Clock, 
  FileText, 
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Volume2,
  Eye
} from 'lucide-react';
import { ILeadCallLog } from '@/modules/leads/types/leads';
import { safeFormatDate } from '@/utils/dateFormat';

interface LeadCallHistoryProps {
  leadId: string;
  callLogs: ILeadCallLog[];
  onViewTranscription?: (callLog: ILeadCallLog) => void;
}

export function LeadCallHistory({ 
  leadId, 
  callLogs, 
  onViewTranscription 
}: LeadCallHistoryProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'answered':
      case 'interested':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'not_interested':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'no_answer':
      case 'voicemail':
      case 'busy':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'callback_requested':
        return <Phone className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOutcomeBadgeColor = (outcome: string) => {
    switch (outcome) {
      case 'answered':
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'not_interested':
        return 'bg-red-100 text-red-800';
      case 'no_answer':
      case 'voicemail':
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      case 'callback_requested':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallTypeColor = (callType: string) => {
    switch (callType) {
      case 'prospecting':
        return 'bg-blue-100 text-blue-800';
      case 'qualification':
        return 'bg-purple-100 text-purple-800';
      case 'follow_up':
        return 'bg-orange-100 text-orange-800';
      case 'closing':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  const sortedCallLogs = [...callLogs].sort((a, b) => 
    b.timestamp._seconds - a.timestamp._seconds
  );

  if (callLogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No se han realizado llamadas a este lead</p>
            <p className="text-sm mt-2">Las llamadas aparecerán aquí una vez que se realicen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Historial de Llamadas ({callLogs.length})
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Total: {formatDuration(callLogs.reduce((acc, call) => acc + call.durationMinutes, 0))}
        </div>
      </div>

      <div className="space-y-3">
        {sortedCallLogs.map((callLog, index) => (
          <Card key={callLog.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header de la llamada */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Phone className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Llamada #{callLogs.length - index}
                      </span>
                      <Badge className={getCallTypeColor(callLog.callType)}>
                        {callLog.callType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {safeFormatDate(callLog.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(callLog.durationMinutes)}
                      </div>
                      {callLog.agentId && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Agente
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getOutcomeIcon(callLog.outcome)}
                  <Badge className={getOutcomeBadgeColor(callLog.outcome)}>
                    {callLog.outcome.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Notas de la llamada */}
              {callLog.notes && (
                <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">{callLog.notes}</p>
                </div>
              )}

              {/* Próxima acción */}
              {callLog.next_action && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">Próxima acción:</span> {callLog.next_action}
                  </p>
                </div>
              )}

              {/* Transcripción y audio */}
              {(callLog.transcription || callLog.audioUrl) && (
                <>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {callLog.transcription && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span>Transcripción disponible</span>
                          {callLog.transcriptionConfidence && (
                            <Badge variant="outline" className="ml-1">
                              {Math.round(callLog.transcriptionConfidence * 100)}% confianza
                            </Badge>
                          )}
                        </div>
                      )}
                      {callLog.audioUrl && (
                        <div className="flex items-center gap-1 text-green-600">
                          <Volume2 className="h-4 w-4" />
                          <span>Audio disponible</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {callLog.transcription && onViewTranscription && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTranscription(callLog)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Transcripción
                        </Button>
                      )}
                      {expandedCall === callLog.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCall(null)}
                        >
                          Ocultar detalles
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCall(callLog.id)}
                        >
                          Ver detalles
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  {expandedCall === callLog.id && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2 text-sm">
                      {callLog.elevenLabsJobId && (
                        <p><span className="font-medium">Job ID:</span> {callLog.elevenLabsJobId}</p>
                      )}
                      {callLog.transcriptionStatus && (
                        <p>
                          <span className="font-medium">Estado transcripción:</span> 
                          <Badge variant="outline" className="ml-1">
                            {callLog.transcriptionStatus}
                          </Badge>
                        </p>
                      )}
                      {callLog.transcription && (
                        <div>
                          <p className="font-medium mb-1">Transcripción:</p>
                          <div className="bg-background p-2 rounded border max-h-32 overflow-y-auto">
                            <p className="text-sm">{callLog.transcription}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}