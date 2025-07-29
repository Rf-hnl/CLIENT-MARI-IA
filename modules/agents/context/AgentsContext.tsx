'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/modules/auth';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useAgents } from '../hooks/useAgents';
import { useElevenLabsConfig } from '../hooks/useElevenLabsConfig';
import { 
  ITenantElevenLabsAgent, 
  ICreateAgentData, 
  IUpdateAgentData,
  IAgentsFilter,
  ITenantAgentsStats 
} from '@/types/agents';
import { 
  ITenantElevenLabsConfig,
  ICreateElevenLabsConfigData,
  IUpdateElevenLabsConfigData,
  IElevenLabsVoice 
} from '@/types/elevenlabs';

interface AgentsContextType {
  // Agentes
  agents: ITenantElevenLabsAgent[];
  activeAgents: ITenantElevenLabsAgent[];
  inactiveAgents: ITenantElevenLabsAgent[];
  stats: ITenantAgentsStats | null;
  loading: boolean;
  error: string | null;
  
  // Configuración ElevenLabs
  config: ITenantElevenLabsConfig | null;
  isConfigured: boolean;
  voices: IElevenLabsVoice[];
  testing: boolean;
  
  // Métodos de agentes
  fetchAgents: (filters?: IAgentsFilter, page?: number, limit?: number) => Promise<void>;
  fetchAgent: (agentId: string) => Promise<ITenantElevenLabsAgent | undefined>;
  createAgent: (agentData: ICreateAgentData) => Promise<any>;
  updateAgent: (agentId: string, updateData: IUpdateAgentData) => Promise<any>;
  deleteAgent: (agentId: string) => Promise<any>;
  toggleAgentStatus: (agentId: string) => Promise<any>;
  
  // Métodos de configuración
  fetchConfig: () => Promise<void>;
  createConfig: (configData: ICreateElevenLabsConfigData) => Promise<any>;
  updateConfig: (updateData: IUpdateElevenLabsConfigData) => Promise<any>;
  deleteConfig: () => Promise<any>;
  testConnection: (testConfig?: any) => Promise<any>;
  fetchVoices: () => Promise<void>;
  
  // Helpers
  getAgentById: (id: string) => ITenantElevenLabsAgent | undefined;
  getAgentsByScenario: (scenario: string) => ITenantElevenLabsAgent[];
  getAgentsByRisk: (riskCategory: string) => ITenantElevenLabsAgent[];
  clearError: () => void;
}

const AgentsContext = createContext<AgentsContextType | null>(null);

interface AgentsProviderProps {
  children: ReactNode;
}

export function AgentsProvider({ children }: AgentsProviderProps) {
  const { currentUser } = useAuth();
  const { currentTenant } = useClients();
  
  const tenantId = currentTenant?.id || null;
  const uid = currentUser?.uid || null;

  // Hooks para agentes y configuración
  const agentsHook = useAgents({ tenantId, uid });
  const configHook = useElevenLabsConfig({ tenantId, uid });

  const contextValue: AgentsContextType = {
    // Agentes
    agents: agentsHook.agents,
    activeAgents: agentsHook.activeAgents,
    inactiveAgents: agentsHook.inactiveAgents,
    stats: agentsHook.stats,
    loading: agentsHook.loading || configHook.loading,
    error: agentsHook.error || configHook.error,
    
    // Configuración ElevenLabs
    config: configHook.config,
    isConfigured: configHook.isConfigured,
    voices: configHook.voices,
    testing: configHook.testing,
    
    // Métodos de agentes
    fetchAgents: agentsHook.fetchAgents,
    fetchAgent: agentsHook.fetchAgent,
    createAgent: agentsHook.createAgent,
    updateAgent: agentsHook.updateAgent,
    deleteAgent: agentsHook.deleteAgent,
    toggleAgentStatus: agentsHook.toggleAgentStatus,
    
    // Métodos de configuración
    fetchConfig: configHook.fetchConfig,
    createConfig: configHook.createConfig,
    updateConfig: configHook.updateConfig,
    deleteConfig: configHook.deleteConfig,
    testConnection: configHook.testConnection,
    fetchVoices: configHook.fetchVoices,
    
    // Helpers
    getAgentById: agentsHook.getAgentById,
    getAgentsByScenario: agentsHook.getAgentsByScenario,
    getAgentsByRisk: agentsHook.getAgentsByRisk,
    clearError: () => {
      agentsHook.clearError();
      configHook.clearError();
    }
  };

  return (
    <AgentsContext.Provider value={contextValue}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgentsContext() {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgentsContext must be used within an AgentsProvider');
  }
  return context;
}

// Hook para selección automática de agente basado en cliente
export function useAgentSelection() {
  const { agents } = useAgentsContext();
  
  const selectBestAgent = (clientData: {
    daysOverdue: number;
    riskCategory: string;
    status: string;
    scenario?: string;
  }): ITenantElevenLabsAgent | null => {
    const availableAgents = agents.filter(agent => {
      // Verificar que esté activo
      if (!agent.metadata.isActive) return false;
      
      // Verificar rango de días de atraso
      const inRange = clientData.daysOverdue >= agent.usage.daysOverdueRange.min && 
                     clientData.daysOverdue <= agent.usage.daysOverdueRange.max;
      
      // Verificar categoría de riesgo
      const riskMatch = agent.usage.riskCategories.includes(clientData.riskCategory);
      
      // Verificar estado del cliente
      const statusMatch = agent.usage.clientStatuses.includes(clientData.status);
      
      // Verificar escenario si se proporciona
      const scenarioMatch = !clientData.scenario || 
                           agent.usage.targetScenarios.includes(clientData.scenario);
      
      return inRange && riskMatch && statusMatch && scenarioMatch;
    });
    
    // Ordenar por prioridad (mayor número = mayor prioridad)
    const sortedAgents = availableAgents.sort((a, b) => b.usage.priority - a.usage.priority);
    
    return sortedAgents[0] || null;
  };
  
  return { selectBestAgent };
}