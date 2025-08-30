'use client';

/**
 * TARJETA DE ESTADÍSTICAS DE LLAMADAS DE LEAD
 * 
 * Componente pequeño para mostrar estadísticas rápidas de llamadas
 * Se puede usar en tooltips, cards, etc.
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Calendar
} from 'lucide-react';
import { ILeadCallLog } from '@/modules/leads/types/leads';

interface LeadCallStatsCardProps {
  callLogs: ILeadCallLog[];
  compact?: boolean;
}

export function LeadCallStatsCard({ callLogs, compact = false }: LeadCallStatsCardProps) {
  const stats = React.useMemo(() => {
    const total = callLogs.length;
    const answered = callLogs.filter(call => call.outcome === 'answered' || call.outcome === 'interested').length;
    const totalDuration = callLogs.reduce((sum, call) => sum + call.durationMinutes, 0);
    const lastCall = callLogs.length > 0 ? callLogs[0] : null;

    return {
      total,
      answered,
      answerRate: total > 0 ? Math.round((answered / total) * 100) : 0,
      totalDuration: Math.round(totalDuration),
      lastCall
    };
  }, [callLogs]);

  const formatLastCallDate = (lastCall: ILeadCallLog | null) => {
    if (!lastCall) return 'Nunca';
    const date = new Date(lastCall.timestamp._seconds * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
  };

  const getAnswerRateColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600';
    if (rate >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3 text-blue-500" />
          <span className="font-medium">{stats.total}</span>
        </div>
        {stats.total > 0 && (
          <>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className={`font-medium ${getAnswerRateColor(stats.answerRate)}`}>
                {stats.answerRate}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span>{stats.totalDuration}min</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-muted/50 p-3 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Estadísticas de Llamadas</h4>
        {stats.total > 0 && (
          <Badge variant="outline" className="text-xs">
            {stats.total} llamada{stats.total !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {stats.total === 0 ? (
        <p className="text-xs text-muted-foreground">No se han realizado llamadas</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3 text-blue-500" />
              <span>Total: {stats.total}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Contestadas: {stats.answered}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`font-medium ${getAnswerRateColor(stats.answerRate)}`}>
                Tasa respuesta: {stats.answerRate}%
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span>Duración total: {stats.totalDuration}min</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-purple-500" />
              <span>Última: {formatLastCallDate(stats.lastCall)}</span>
            </div>
            {stats.lastCall && (
              <div className="flex items-center gap-1">
                {stats.lastCall.outcome === 'answered' || stats.lastCall.outcome === 'interested' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="capitalize">
                  {stats.lastCall.outcome.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}