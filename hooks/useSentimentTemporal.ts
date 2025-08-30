'use client';

/**
 * HOOK: useSentimentTemporal
 * 
 * Hook personalizado para manejar análisis de sentiment temporal
 * Integra con el servicio de análisis multinivel por segmentos
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { SentimentTimeline } from '@/types/bulkCalls';

interface TemporalAnalysisConfig {
  segmentDuration?: number;
  overlap?: number;
  minSegmentLength?: number;
  model?: 'gpt-4o' | 'gpt-4o-mini';
  temperature?: number;
}

interface SentimentTemporalState {
  timeline: SentimentTimeline | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  analysisId: string | null;
  lastAnalyzedAt: Date | null;
  processingTimeMs: number | null;
}

export interface UseSentimentTemporalReturn {
  // Estado
  timeline: SentimentTimeline | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  error: string | null;
  analysisId: string | null;
  lastAnalyzedAt: Date | null;
  processingTimeMs: number | null;
  
  // Acciones
  analyzeSentimentTemporal: (
    leadId: string, 
    conversationId: string, 
    transcript: any, 
    config?: TemporalAnalysisConfig
  ) => Promise<void>;
  loadExistingAnalysis: (leadId: string, conversationId: string) => Promise<void>;
  clearAnalysis: () => void;
  
  // Utilidades
  hasAnalysis: boolean;
  canAnalyze: boolean;
}

export function useSentimentTemporal(): UseSentimentTemporalReturn {
  const { user, token } = useAuth();
  
  const [state, setState] = useState<SentimentTemporalState>({
    timeline: null,
    isAnalyzing: false,
    isLoading: false,
    error: null,
    analysisId: null,
    lastAnalyzedAt: null,
    processingTimeMs: null
  });

  // Limpiar análisis
  const clearAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeline: null,
      error: null,
      analysisId: null,
      lastAnalyzedAt: null,
      processingTimeMs: null
    }));
  }, []);

  // Cargar análisis existente
  const loadExistingAnalysis = useCallback(async (
    leadId: string, 
    conversationId: string
  ) => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'No authentication token available' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `/api/leads/${leadId}/conversations/${conversationId}/analysis/sentiment-temporal`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data?.timeline) {
          setState(prev => ({
            ...prev,
            timeline: data.data.timeline,
            analysisId: data.metadata?.analysisId || null,
            lastAnalyzedAt: data.metadata?.analyzedAt ? new Date(data.metadata.analyzedAt) : null,
            processingTimeMs: data.metadata?.processingTime || null,
            isLoading: false
          }));
        } else {
          // No hay análisis temporal disponible
          setState(prev => ({
            ...prev,
            timeline: null,
            isLoading: false
          }));
        }
      } else {
        const errorData = await response.json();
        if (response.status === 404) {
          // No hay análisis temporal disponible - no es un error
          setState(prev => ({
            ...prev,
            timeline: null,
            isLoading: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: errorData.details || 'Error loading temporal analysis',
            isLoading: false
          }));
        }
      }
    } catch (error) {
      console.error('Error loading sentiment temporal analysis:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isLoading: false
      }));
    }
  }, [token]);

  // Realizar análisis temporal de sentiment
  const analyzeSentimentTemporal = useCallback(async (
    leadId: string,
    conversationId: string,
    transcript: any,
    config: TemporalAnalysisConfig = {}
  ) => {
    if (!token) {
      setState(prev => ({ ...prev, error: 'No authentication token available' }));
      return;
    }

    if (!transcript) {
      setState(prev => ({ ...prev, error: 'Transcript is required for temporal analysis' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      error: null,
      processingTimeMs: null 
    }));

    try {
      console.log('🕐 [useSentimentTemporal] Starting temporal analysis:', {
        leadId,
        conversationId,
        hasTranscript: !!transcript,
        config
      });

      const response = await fetch(
        `/api/leads/${leadId}/conversations/${conversationId}/analysis/sentiment-temporal`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            transcript,
            config,
            includeLeadContext: true
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const timeline = data.data?.timeline;
        const summary = data.data?.summary;

        if (timeline) {
          setState(prev => ({
            ...prev,
            timeline,
            analysisId: data.analysisId || null,
            lastAnalyzedAt: new Date(),
            processingTimeMs: summary?.processingTimeMs || null,
            isAnalyzing: false
          }));

          console.log('✅ [useSentimentTemporal] Analysis completed:', {
            segmentsAnalyzed: timeline.sentimentProgression.length,
            overallSentiment: timeline.overallSentiment,
            criticalMoments: timeline.criticalMoments.length,
            processingTime: summary?.processingTimeMs
          });
        } else {
          throw new Error('Invalid response structure - missing timeline data');
        }
      } else {
        const errorMessage = data.details || data.error || 'Analysis failed';
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('❌ [useSentimentTemporal] Error in analysis:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isAnalyzing: false
      }));
    }
  }, [token]);

  // Estado derivado
  const hasAnalysis = Boolean(state.timeline);
  const canAnalyze = Boolean(token && user && !state.isAnalyzing);

  // Limpiar estado cuando no hay autenticación
  useEffect(() => {
    if (!token || !user) {
      clearAnalysis();
    }
  }, [token, user, clearAnalysis]);

  return {
    // Estado
    timeline: state.timeline,
    isAnalyzing: state.isAnalyzing,
    isLoading: state.isLoading,
    error: state.error,
    analysisId: state.analysisId,
    lastAnalyzedAt: state.lastAnalyzedAt,
    processingTimeMs: state.processingTimeMs,
    
    // Acciones
    analyzeSentimentTemporal,
    loadExistingAnalysis,
    clearAnalysis,
    
    // Estado derivado
    hasAnalysis,
    canAnalyze
  };
}

// Hook de conveniencia para auto-cargar análisis existente
export function useSentimentTemporalAutoLoad(
  leadId?: string, 
  conversationId?: string,
  autoLoad: boolean = true
): UseSentimentTemporalReturn {
  const hook = useSentimentTemporal();

  useEffect(() => {
    if (autoLoad && leadId && conversationId && hook.canAnalyze && !hook.hasAnalysis && !hook.isLoading) {
      console.log('🔄 [useSentimentTemporalAutoLoad] Auto-loading analysis:', { leadId, conversationId });
      hook.loadExistingAnalysis(leadId, conversationId);
    }
  }, [leadId, conversationId, autoLoad, hook.canAnalyze, hook.hasAnalysis, hook.isLoading]);

  return hook;
}

export default useSentimentTemporal;