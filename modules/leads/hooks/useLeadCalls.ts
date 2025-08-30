'use client';

/**
 * HOOK PARA GESTIÓN DE LLAMADAS DE LEADS
 * 
 * Hook para gestionar llamadas realizadas a leads
 * Incluye creación, obtención y manejo de transcripciones
 */

import { useState, useCallback } from 'react';
import { ILeadCallLog } from '@/modules/leads/types/leads';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthToken } from '@/hooks/useAuthToken';

export const useLeadCalls = () => {
  const { user } = useAuth();
  const { token } = useAuthToken();
  const [callLogs, setCallLogs] = useState<ILeadCallLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper para obtener headers con autenticación
  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }, [token]);

  // Obtener todas las llamadas de un lead
  const getLeadCallLogs = useCallback(async (leadId: string): Promise<ILeadCallLog[]> => {
    if (!user?.tenantId) {
      throw new Error('Usuario no autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/calls`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener llamadas');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al obtener llamadas');
      }

      const callLogs = result.data || [];
      setCallLogs(callLogs);
      return callLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener llamadas';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, getAuthHeaders]);

  // Crear un nuevo registro de llamada
  const createCallLog = useCallback(async (callData: Omit<ILeadCallLog, 'id' | 'timestamp'>): Promise<ILeadCallLog> => {
    if (!user?.tenantId) {
      throw new Error('Usuario no autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${callData.leadId}/calls`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(callData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear registro de llamada');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al crear registro de llamada');
      }

      const newCallLog = result.data;

      // Actualizar estado local
      setCallLogs(prev => [newCallLog, ...prev]);

      return newCallLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear registro de llamada';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, getAuthHeaders]);

  // Iniciar una llamada con ElevenLabs
  const initiateCall = useCallback(async (
    leadId: string, 
    agentId: string, 
    callType: 'prospecting' | 'qualification' | 'follow_up' | 'closing' = 'prospecting',
    notes?: string
  ): Promise<{ callLogId: string; elevenLabsBatchId?: string }> => {
    if (!user?.tenantId) {
      throw new Error('Usuario no autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Iniciando llamada:', { leadId, agentId, callType, notes });

      // Llamar a la nueva API para iniciar la llamada
      const response = await fetch(`/api/leads/${leadId}/call`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          agentId,
          callType,
          notes
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al iniciar llamada');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al iniciar llamada');
      }

      console.log('Llamada iniciada exitosamente:', result);

      // Actualizar estado local si tenemos call logs
      if (result.callLog) {
        const newCallLog: ILeadCallLog = {
          id: result.callLog.id,
          leadId: result.callLog.leadId,
          timestamp: new Date(),
          callType: result.callLog.callType,
          durationMinutes: 0,
          agentId: result.callLog.agentId,
          outcome: 'answered', // Se actualizará cuando termine la llamada
          notes,
          elevenLabsJobId: result.callLog.elevenLabsBatchId,
          transcriptionStatus: 'pending'
        };

        setCallLogs(prev => [newCallLog, ...prev]);
      }

      return {
        callLogId: result.callLog.id,
        elevenLabsBatchId: result.callLog.elevenLabsBatchId
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar llamada';
      setError(errorMessage);
      console.error('Error en initiateCall:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, getAuthHeaders]);

  // Actualizar el resultado de una llamada
  const updateCallOutcome = useCallback(async (
    callLogId: string,
    outcome: ILeadCallLog['outcome'],
    durationMinutes?: number,
    transcription?: string,
    nextAction?: string
  ): Promise<void> => {
    if (!user?.tenantId) {
      throw new Error('Usuario no autenticado');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/calls/${callLogId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          outcome,
          durationMinutes,
          transcription,
          next_action: nextAction
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar llamada');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar llamada');
      }

      // Actualizar estado local
      setCallLogs(prev => prev.map(call => 
        call.id === callLogId 
          ? {
              ...call,
              outcome,
              durationMinutes: durationMinutes || call.durationMinutes,
              transcription: transcription || call.transcription,
              next_action: nextAction || call.next_action,
              transcriptionStatus: transcription ? 'completed' : call.transcriptionStatus
            }
          : call
      ));

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar llamada';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.tenantId, getAuthHeaders]);

  // Obtener estadísticas de llamadas para un lead
  const getLeadCallStats = useCallback((leadCallLogs: ILeadCallLog[]) => {
    const total = leadCallLogs.length;
    const answered = leadCallLogs.filter(call => call.outcome === 'answered').length;
    const totalDuration = leadCallLogs.reduce((sum, call) => sum + call.durationMinutes, 0);
    const lastCall = leadCallLogs.length > 0 ? leadCallLogs[0] : null;

    return {
      total,
      answered,
      answerRate: total > 0 ? (answered / total) * 100 : 0,
      totalDuration,
      averageDuration: answered > 0 ? totalDuration / answered : 0,
      lastCall
    };
  }, []);

  return {
    callLogs,
    loading,
    error,
    getLeadCallLogs,
    createCallLog,
    initiateCall,
    updateCallOutcome,
    getLeadCallStats
  };
};