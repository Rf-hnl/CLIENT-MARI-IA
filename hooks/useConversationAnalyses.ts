import { useState, useEffect } from 'react';
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';

export interface ConversationAnalysis {
  sentiment?: {
    overall?: {
      sentiment: string;
      score: number;
    };
    sentiment?: string;
  };
  overallSentiment?: string;
  conversionProbability?: number;
  qualityScore?: number;
  callQualityScore?: number;
}

export function useConversationAnalyses(leads: ExtendedLead[]) {
  const [conversationAnalyses, setConversationAnalyses] = useState<Map<string, ConversationAnalysis>>(new Map());
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [processedLeadIds, setProcessedLeadIds] = useState<Set<string>>(new Set());

  // Función para obtener análisis en batch para múltiples leads
  const fetchBatchAnalyses = async (leadIds: string[]): Promise<Map<string, ConversationAnalysis>> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return new Map();

      // Llamada batch para obtener todos los análisis de una vez
      const response = await fetch('/api/leads/batch-analyses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadIds }),
      });
      
      if (!response.ok) return new Map();
      
      const data = await response.json();
      if (!data.success) return new Map();
      
      const analysesMap = new Map();
      data.analyses.forEach((item: { leadId: string; analysis: ConversationAnalysis }) => {
        if (item.analysis) {
          analysesMap.set(item.leadId, item.analysis);
        }
      });
      
      return analysesMap;
    } catch (error) {
      console.error('Error fetching batch conversation analyses:', error);
      return new Map();
    }
  };

  // Función para obtener análisis de conversación de un lead individual (fallback)
  const fetchConversationAnalysis = async (leadId: string): Promise<ConversationAnalysis | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      // Obtener conversaciones del lead
      const conversationsResponse = await fetch(`/api/leads/${leadId}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!conversationsResponse.ok) return null;
      
      const conversationsData = await conversationsResponse.json();
      if (!conversationsData.success || !conversationsData.conversations?.length) return null;
      
      // Tomar la conversación más reciente
      const latestConversation = conversationsData.conversations[0];
      
      // Obtener análisis de la conversación
      const analysisResponse = await fetch(`/api/leads/${leadId}/conversations/${latestConversation.conversationId}/analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!analysisResponse.ok) return null;
      
      const analysisData = await analysisResponse.json();
      return analysisData.success ? analysisData.analysis : null;
    } catch (error) {
      console.error('Error fetching conversation analysis:', error);
      return null;
    }
  };

  // Cargar análisis de conversación de forma más inteligente y espaciada
  useEffect(() => {
    const loadAnalyses = async () => {
      if (leads.length === 0) return;
      
      const currentTime = Date.now();
      // Aumentar el tiempo entre llamadas a 5 segundos para reducir carga
      if (currentTime - lastFetchTime < 5000) {
        return;
      }
      
      // Solo cargar análisis para los primeros 10 leads visibles
      const leadsToAnalyze = leads.slice(0, 10);
      
      // Filtrar leads que ya procesamos (exitosos o fallidos)
      const leadIdsToFetch = leadsToAnalyze
        .filter(lead => !conversationAnalyses.has(lead.id) && !processedLeadIds.has(lead.id))
        .map(lead => lead.id);
      
      if (leadIdsToFetch.length === 0) {
        return;
      }
      
      // Solo procesar 1 lead a la vez para no sobrecargar
      const leadToProcess = leadIdsToFetch[0];
      
      setLastFetchTime(currentTime);
      setLoading(true);
      
      try {
        const analysis = await fetchConversationAnalysis(leadToProcess);
        
        if (analysis) {
          setConversationAnalyses(prev => new Map([...prev, [leadToProcess, analysis]]));
        }
        
        // Marcar este lead como procesado (exitoso o no)
        setProcessedLeadIds(prev => new Set([...prev, leadToProcess]));
        
      } catch (error) {
        console.error('Error loading conversation analysis:', error);
        // Marcar como procesado para evitar reintentarlo
        setProcessedLeadIds(prev => new Set([...prev, leadToProcess]));
      } finally {
        setLoading(false);
      }
    };
    
    // Aumentar debounce a 2 segundos para espaciar más las llamadas
    const timeoutId = setTimeout(loadAnalyses, 2000);
    return () => clearTimeout(timeoutId);
  }, [leads, conversationAnalyses, processedLeadIds, lastFetchTime]);

  // Función para refrescar análisis de un lead específico
  const refreshAnalysis = async (leadId: string) => {
    const analysis = await fetchConversationAnalysis(leadId);
    if (analysis) {
      setConversationAnalyses(prev => new Map([...prev, [leadId, analysis]]));
    }
    return analysis;
  };

  // Función para limpiar análisis y cache
  const clearAnalyses = () => {
    setConversationAnalyses(new Map());
    setProcessedLeadIds(new Set());
    setLastFetchTime(0);
  };

  return {
    conversationAnalyses,
    loading,
    refreshAnalysis,
    clearAnalyses,
    fetchConversationAnalysis
  };
}