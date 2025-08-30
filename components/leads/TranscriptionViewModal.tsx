'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText,
  Calendar,
  Clock,
  User,
  Phone,
  Download,
  Copy,
  CheckCircle,
  Loader2,
  AlertCircle,
  Volume2
} from 'lucide-react';
import { ILeadCallLog } from '@/modules/leads/types/leads';
import { safeFormatDate } from '@/utils/dateFormat';

interface TranscriptionViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  callLog: ILeadCallLog | null;
}

interface TranscriptionData {
  transcription: string;
  confidence: number;
  status: string;
  audioUrl?: string;
  conversationId?: string;
}

export function TranscriptionViewModal({ 
  isOpen, 
  onClose, 
  callLog 
}: TranscriptionViewModalProps) {
  const [transcriptionData, setTranscriptionData] = useState<TranscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch fresh transcription data when modal opens
  useEffect(() => {
    if (isOpen && callLog?.elevenLabsBatchId) {
      fetchTranscriptionData();
    }
  }, [isOpen, callLog?.elevenLabsBatchId]);

  const fetchTranscriptionData = async () => {
    if (!callLog?.elevenLabsBatchId) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/leads/${callLog.leadId}/calls/${callLog.id}/transcription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transcription');
      }

      const data = await response.json();
      setTranscriptionData(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching transcription');
      console.error('Error fetching transcription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTranscription = async () => {
    if (!transcriptionData?.transcription) return;

    try {
      await navigator.clipboard.writeText(transcriptionData.transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadTranscription = () => {
    if (!transcriptionData?.transcription || !callLog) return;

    const content = `Transcripción de Llamada - ${callLog.leadName || 'Lead'}
Fecha: ${safeFormatDate(callLog.timestamp)}
Duración: ${callLog.durationMinutes} minutos
Tipo: ${callLog.callType}
Resultado: ${callLog.outcome}
Confianza: ${Math.round((transcriptionData.confidence || 0) * 100)}%

---

${transcriptionData.transcription}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripcion-${callLog.leadName || 'lead'}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800';
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

  if (!callLog) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcripción de Llamada - {callLog.leadName || 'Lead'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Call Information */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span>{safeFormatDate(callLog.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>{formatDuration(callLog.durationMinutes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <Badge className="text-xs">
                    {callLog.callType.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <Badge className="text-xs">
                    {callLog.outcome.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {callLog.notes && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                  <strong>Notas:</strong> {callLog.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transcription Content */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Transcripción</span>
                  {transcriptionData?.status && (
                    <Badge className={getStatusBadgeColor(transcriptionData.status)}>
                      {transcriptionData.status}
                    </Badge>
                  )}
                  {transcriptionData?.confidence && (
                    <Badge variant="outline">
                      {Math.round(transcriptionData.confidence * 100)}% confianza
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {transcriptionData?.audioUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(transcriptionData.audioUrl, '_blank')}
                    >
                      <Volume2 className="h-4 w-4 mr-1" />
                      Audio
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyTranscription}
                    disabled={!transcriptionData?.transcription}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTranscription}
                    disabled={!transcriptionData?.transcription}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Cargando transcripción...</span>
                </div>
              ) : error ? (
                <div className="text-red-600 bg-red-50 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>{error}</span>
                </div>
              ) : transcriptionData?.transcription ? (
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {transcriptionData.transcription}
                  </p>
                </div>
              ) : callLog.transcription ? (
                // Fallback to stored transcription if API call fails
                <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {callLog.transcription}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Transcripción no disponible</p>
                  <p className="text-sm mt-2">
                    La transcripción puede estar siendo procesada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ElevenLabs Details */}
          {callLog.elevenLabsBatchId && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Detalles Técnicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">Batch ID:</span>
                    <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                      {callLog.elevenLabsBatchId}
                    </div>
                  </div>
                  {transcriptionData?.conversationId && (
                    <div>
                      <span className="font-medium">Conversation ID:</span>
                      <div className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                        {transcriptionData.conversationId}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Estado transcripción:</span>
                    <div className="mt-1">
                      <Badge className={getStatusBadgeColor(callLog.transcriptionStatus || '')}>
                        {callLog.transcriptionStatus || 'pending'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Agente utilizado:</span>
                    <div className="mt-1">{callLog.agentId || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {!transcriptionData && callLog.elevenLabsBatchId && (
              <Button onClick={fetchTranscriptionData} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Actualizar Transcripción
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}