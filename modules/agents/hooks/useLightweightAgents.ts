import { useState, useCallback } from 'react';
import { ILocalAgentReference, IAgentsListResult } from '@/types/agents';

interface UseLightweightAgentsProps {
  tenantId: string | null;
}

/**
 * Hook ligero que solo obtiene las referencias locales de Firebase
 * SIN hacer llamadas a ElevenLabs API
 * Útil para Dashboard, estadísticas, etc.
 */
export const useLightweightAgents = ({ tenantId }: UseLightweightAgentsProps) => {
  const [agents, setAgents] = useState<ILocalAgentReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLightweightAgents = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('📊 [LIGHTWEIGHT_AGENTS] Fetching basic agent references for dashboard...');
      
      const params = new URLSearchParams({
        tenantId,
        lightweight: 'true' // Parámetro para indicar que solo queremos datos básicos
      });

      const response = await fetch(`/api/tenant/agents/elevenlabs/list?${params}`);
      const result: IAgentsListResult = await response.json();

      if (!result.success) {
        setError(result.error || 'Error al obtener agentes');
        return;
      }

      const lightweightAgents = result.agents as ILocalAgentReference[];
      console.log(`📊 [LIGHTWEIGHT_AGENTS] Loaded ${lightweightAgents.length} agent references`);
      
      setAgents(lightweightAgents);

    } catch (err) {
      console.error('🚨 [LIGHTWEIGHT_AGENTS] Error:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Estadísticas básicas sin consultar ElevenLabs
  const getBasicStats = useCallback(() => {
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.metadata.isActive).length;
    const inactiveAgents = totalAgents - activeAgents;
    
    return {
      totalAgents,
      activeAgents,
      inactiveAgents,
      // Estadísticas del cache local
      agentsWithCache: agents.filter(a => a.cache?.name).length,
      lastSyncAvg: agents
        .filter(a => a.cache?.lastSyncAt)
        .reduce((acc, a, _, arr) => {
          const syncTime = a.cache!.lastSyncAt!.toDate().getTime();
          return acc + syncTime / arr.length;
        }, 0)
    };
  }, [agents]);

  return {
    agents,
    loading,
    error,
    fetchLightweightAgents,
    getBasicStats,
    clearError: () => setError(null)
  };
};