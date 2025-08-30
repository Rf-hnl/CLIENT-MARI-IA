import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth-interceptor';
import { ConversationAnalysis, UseConversationAnalysisReturn, CreateConversationAnalysisData, AnalysisConfig } from '@/types/conversationAnalysis';
import { showIAErrorToast, showAnalysisSuccessToast } from '@/lib/utils/openai-toast';

/**
 * HOOK para análisis de conversaciones
 * 
 * Maneja la obtención, creación y actualización de análisis de conversaciones con IA
 */
export function useConversationAnalysis(
  leadId: string, 
  conversationId: string | null
): UseConversationAnalysisReturn {
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener análisis existente
   */
  const fetchAnalysis = useCallback(async () => {
    if (!leadId || !conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(
        `/api/leads/${leadId}/conversations/${conversationId}/analysis`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalysis(data.analysis);
        } else {
          // No existe análisis todavía
          setAnalysis(null);
        }
      } else if (response.status === 404) {
        // No existe análisis todavía
        setAnalysis(null);
      } else {
        throw new Error(`Error: ${response.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching analysis');
      console.error('Error fetching conversation analysis:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId, conversationId]);

  /**
   * Crear o actualizar análisis
   */
  const analyzeConversation = useCallback(async (
    data: CreateConversationAnalysisData,
    config?: AnalysisConfig
  ) => {
    if (!leadId || !conversationId) {
      throw new Error('Lead ID and Conversation ID are required');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(
        `/api/leads/${leadId}/conversations/${conversationId}/analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            config,
            forceRefresh: true // Forzar análisis nuevo
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Usar utilidad para manejar errores de OpenAI
        showIAErrorToast({
          status: response.status,
          message: errorData.error || errorData.details,
          error: errorData.error,
          details: errorData.details
        });
        
        throw new Error(errorData.error || errorData.details || `Error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAnalysis(result.analysis);
        console.log('✅ Analysis completed:', {
          processingTime: result.processingTime,
          tokensUsed: result.tokensUsed,
          cost: result.cost
        });
        
        // Mostrar alerta de éxito usando utilidad
        showAnalysisSuccessToast({
          processingTime: result.processingTime,
          tokensUsed: result.tokensUsed,
          cost: result.cost
        });
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analyzing conversation');
      console.error('Error analyzing conversation:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [leadId, conversationId]);

  /**
   * Actualizar análisis existente
   */
  const updateAnalysis = useCallback(async (
    id: string, 
    updates: Partial<ConversationAnalysis>
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Actualizar localmente primero
      if (analysis && analysis.id === id) {
        setAnalysis({ ...analysis, ...updates, updatedAt: new Date().toISOString() });
      }

      // TODO: Implementar endpoint PATCH para actualizaciones parciales
      console.log('Update analysis:', { id, updates });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating analysis');
      console.error('Error updating analysis:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [analysis]);

  /**
   * Eliminar análisis
   */
  const deleteAnalysis = useCallback(async (id: string) => {
    if (!leadId || !conversationId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await authFetch(
        `/api/leads/${leadId}/conversations/${conversationId}/analysis`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setAnalysis(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting analysis');
      console.error('Error deleting analysis:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [leadId, conversationId]);

  /**
   * Recargar análisis
   */
  const refetchAnalysis = useCallback(async () => {
    await fetchAnalysis();
  }, [fetchAnalysis]);

  // Cargar análisis al montar o cambiar conversationId
  useEffect(() => {
    if (leadId && conversationId) {
      fetchAnalysis();
    }
  }, [leadId, conversationId, fetchAnalysis]);

  return {
    analysis,
    loading,
    error,
    analyzeConversation,
    refetchAnalysis,
    updateAnalysis,
    deleteAnalysis
  };
}

/**
 * HOOK para análisis masivo de conversaciones de un lead
 */
export function useLeadConversationsAnalysis(leadId: string) {
  const [analyses, setAnalyses] = useState<ConversationAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllAnalyses = useCallback(async () => {
    if (!leadId) return;

    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar endpoint para obtener todos los análisis de un lead
      const response = await authFetch(`/api/leads/${leadId}/analysis`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalyses(data.analyses || []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching analyses');
      console.error('Error fetching lead analyses:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const analyzeAllConversations = useCallback(async (conversationIds: string[]) => {
    if (!leadId || conversationIds.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const results = [];
      
      // Analizar cada conversación secuencialmente para evitar sobrecarga
      for (const conversationId of conversationIds) {
        try {
          const response = await authFetch(
            `/api/leads/${leadId}/conversations/${conversationId}/analysis`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              results.push(data.analysis);
            }
          }

          // Pequeña pausa entre análisis
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
          console.error(`Error analyzing conversation ${conversationId}:`, err);
        }
      }

      setAnalyses(results);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analyzing conversations');
      console.error('Error analyzing conversations:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const getAnalysisSummary = useCallback(() => {
    if (analyses.length === 0) return null;

    const totalAnalyses = analyses.length;
    const averageQuality = analyses.reduce((sum, a) => sum + a.callQualityScore, 0) / totalAnalyses;
    const averageSentiment = analyses.reduce((sum, a) => sum + a.sentimentScore, 0) / totalAnalyses;
    const averageConversion = analyses.reduce((sum, a) => sum + a.conversionLikelihood, 0) / totalAnalyses;

    const sentimentCounts = analyses.reduce((acc, a) => {
      acc[a.overallSentiment] = (acc[a.overallSentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonTopics = analyses
      .flatMap(a => a.keyTopics)
      .reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topTopics = Object.entries(commonTopics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);

    const commonBuyingSignals = analyses
      .flatMap(a => a.buyingSignals)
      .reduce((acc, signal) => {
        acc[signal] = (acc[signal] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topBuyingSignals = Object.entries(commonBuyingSignals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([signal]) => signal);

    return {
      totalAnalyses,
      averageQuality: Math.round(averageQuality),
      averageSentiment: Math.round(averageSentiment * 100) / 100,
      averageConversion: Math.round(averageConversion),
      sentimentDistribution: sentimentCounts,
      topTopics,
      topBuyingSignals,
      latestAnalysis: analyses.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
    };
  }, [analyses]);

  useEffect(() => {
    fetchAllAnalyses();
  }, [fetchAllAnalyses]);

  return {
    analyses,
    loading,
    error,
    fetchAllAnalyses,
    analyzeAllConversations,
    getAnalysisSummary: getAnalysisSummary()
  };
}