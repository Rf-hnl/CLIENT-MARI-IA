import { useState, useEffect } from 'react';

export interface AnalysisAgent {
  id: string;
  name: string;
  provider: string;
  model: string;
  purpose: string;
}

export function useAnalysisAgents(tenantId?: string) {
  const [loading, setLoading] = useState(false);
  const [hasAgents, setHasAgents] = useState(false);
  const [agentCount, setAgentCount] = useState(0);
  const [agents, setAgents] = useState<AnalysisAgent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const checkAgents = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useAnalysisAgents] Checking agents for tenant:', tenantId);
      
      // Llamar al endpoint API en lugar de usar Prisma directamente
      const response = await fetch(`/api/analysis-agents?tenantId=${tenantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      console.log('🔍 [useAnalysisAgents] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [useAnalysisAgents] API Error:', response.status, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🔍 [useAnalysisAgents] Response data:', result);
      
      if (result.success) {
        setHasAgents(result.hasAgents);
        setAgentCount(result.agentCount);
        setAgents(result.agents);
        console.log('✅ [useAnalysisAgents] Agents loaded:', result.agentCount, 'agents found');
      } else {
        console.warn('⚠️ [useAnalysisAgents] API returned success: false:', result.error);
        setError(result.error || 'Error checking agents');
        setHasAgents(false);
        setAgentCount(0);
        setAgents([]);
      }
    } catch (err) {
      console.error('❌ [useAnalysisAgents] Error fetching analysis agents:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setHasAgents(false);
      setAgentCount(0);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      checkAgents();
    }
  }, [tenantId]);

  return {
    loading,
    hasAgents,
    agentCount,
    agents,
    error,
    checkAgents
  };
}