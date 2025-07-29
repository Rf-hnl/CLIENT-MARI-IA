import { useState, useEffect, useCallback } from 'react';
import { 
  ITenantElevenLabsAgent, 
  ICreateAgentData, 
  IUpdateAgentData,
  IAgentOperationResult,
  IAgentsListResult,
  IAgentsFilter,
  ITenantAgentsStats 
} from '@/types/agents';

interface UseAgentsProps {
  tenantId: string | null;
  uid: string | null;
}

export const useAgents = ({ tenantId, uid }: UseAgentsProps) => {
  const [agents, setAgents] = useState<ITenantElevenLabsAgent[]>([]);
  const [stats, setStats] = useState<ITenantAgentsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });

  // Obtener lista de agentes
  const fetchAgents = useCallback(async (filters?: IAgentsFilter, page = 1, limit = 50) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tenantId,
        page: page.toString(),
        limit: limit.toString()
      });

      // Agregar filtros a los parámetros
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }
      if (filters?.scenarios && filters.scenarios.length > 0) {
        params.append('scenarios', filters.scenarios.join(','));
      }
      if (filters?.riskCategories && filters.riskCategories.length > 0) {
        params.append('riskCategories', filters.riskCategories.join(','));
      }

      const response = await fetch(`/api/tenant/agents/elevenlabs/list?${params}`);
      const result: IAgentsListResult = await response.json();

      if (result.success) {
        setAgents(result.agents);
        setPagination({
          page: result.page || 1,
          limit: result.limit || 50,
          total: result.total
        });
        calculateStats(result.agents);
      } else {
        setError(result.error || 'Error al obtener agentes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Calcular estadísticas de agentes
  const calculateStats = useCallback((agentsList: ITenantElevenLabsAgent[]) => {
    const activeAgents = agentsList.filter(a => a.metadata.isActive);
    const totalCalls = agentsList.reduce((sum, a) => sum + a.stats.totalCalls, 0);
    const totalCost = agentsList.reduce((sum, a) => sum + a.stats.totalCost, 0);
    const totalSuccessful = agentsList.reduce((sum, a) => sum + a.stats.successfulCalls, 0);
    const averageSuccessRate = totalCalls > 0 ? (totalSuccessful / totalCalls) * 100 : 0;

    // Encontrar el agente con mejor rendimiento
    const topAgent = agentsList.reduce((best, current) => {
      if (current.stats.totalCalls === 0) return best;
      if (best.stats.totalCalls === 0) return current;
      return current.stats.averageSuccessRate > best.stats.averageSuccessRate ? current : best;
    }, agentsList[0]);

    const newStats: ITenantAgentsStats = {
      totalAgents: agentsList.length,
      activeAgents: activeAgents.length,
      totalCalls,
      totalCost,
      averageSuccessRate,
      topPerformingAgent: topAgent && topAgent.stats.totalCalls > 0 ? {
        id: topAgent.id,
        name: topAgent.name,
        successRate: topAgent.stats.averageSuccessRate
      } : undefined,
      recentActivity: {
        callsToday: 0, // Esto se podría calcular con datos más específicos
        callsThisWeek: 0,
        callsThisMonth: 0
      }
    };

    setStats(newStats);
  }, []);

  // Obtener agente específico
  const fetchAgent = useCallback(async (agentId: string) => {
    if (!tenantId) throw new Error('tenantId es requerido');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/agents/elevenlabs/${agentId}?tenantId=${tenantId}`);
      const result: IAgentOperationResult = await response.json();

      if (result.success) {
        return result.agent;
      } else {
        setError(result.error || 'Error al obtener agente');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Crear agente
  const createAgent = useCallback(async (agentData: ICreateAgentData) => {
    if (!tenantId || !uid) throw new Error('tenantId y uid son requeridos');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenant/agents/elevenlabs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, uid, ...agentData })
      });

      const result: IAgentOperationResult = await response.json();

      if (result.success) {
        // Actualizar la lista de agentes
        await fetchAgents();
        return result;
      } else {
        setError(result.error || 'Error al crear agente');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, uid, fetchAgents]);

  // Actualizar agente
  const updateAgent = useCallback(async (agentId: string, updateData: IUpdateAgentData) => {
    if (!tenantId || !uid) throw new Error('tenantId y uid son requeridos');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/agents/elevenlabs/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, uid, ...updateData })
      });

      const result: IAgentOperationResult = await response.json();

      if (result.success) {
        // Actualizar el agente en la lista local
        setAgents(prev => prev.map(agent => 
          agent.id === agentId ? result.agent! : agent
        ));
        return result;
      } else {
        setError(result.error || 'Error al actualizar agente');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, uid]);

  // Eliminar agente
  const deleteAgent = useCallback(async (agentId: string) => {
    if (!tenantId || !uid) throw new Error('tenantId y uid son requeridos');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/agents/elevenlabs/${agentId}?tenantId=${tenantId}&uid=${uid}`, {
        method: 'DELETE'
      });

      const result: IAgentOperationResult = await response.json();

      if (result.success) {
        // Remover el agente de la lista local
        setAgents(prev => prev.filter(agent => agent.id !== agentId));
        return result;
      } else {
        setError(result.error || 'Error al eliminar agente');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId, uid]);

  // Toggle estado activo/inactivo de agente
  const toggleAgentStatus = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agente no encontrado');

    return await updateAgent(agentId, {
      metadata: {
        ...agent.metadata,
        isActive: !agent.metadata.isActive
      }
    });
  }, [agents, updateAgent]);

  // Cargar agentes al montar o cambiar tenantId
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    stats,
    loading,
    error,
    pagination,
    fetchAgents,
    fetchAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    clearError: () => setError(null),
    // Helpers
    activeAgents: agents.filter(a => a.metadata.isActive),
    inactiveAgents: agents.filter(a => !a.metadata.isActive),
    getAgentById: (id: string) => agents.find(a => a.id === id),
    getAgentsByScenario: (scenario: string) => agents.filter(a => 
      a.usage.targetScenarios.includes(scenario)
    ),
    getAgentsByRisk: (riskCategory: string) => agents.filter(a => 
      a.usage.riskCategories.includes(riskCategory)
    )
  };
};