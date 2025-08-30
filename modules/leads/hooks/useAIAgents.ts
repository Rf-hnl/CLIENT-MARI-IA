/**
 * HOOK PARA GESTIÓN DE AGENTES DE IA
 * 
 * Hook personalizado para manejar agentes de IA configurables para leads
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  ILeadAIAgent, 
  IAIAgentRequest,
  IAIAgentResponse,
  ICreateAIAgentData,
  IAgentValidationResult,
  AIProvider 
} from '../types/aiAgents';

// TODO: Reemplazar con datos reales de Firebase cuando se implemente
const mockAgents: ILeadAIAgent[] = [];

export interface UseAIAgentsReturn {
  // Estados
  agents: ILeadAIAgent[];
  isLoading: boolean;
  error: string | null;
  
  // Agentes filtrados y por propósito
  activeAgents: ILeadAIAgent[];
  scoringAgents: ILeadAIAgent[];
  defaultScoringAgent: ILeadAIAgent | null;
  
  // Gestión de agentes
  createAgent: (data: ICreateAIAgentData) => Promise<ILeadAIAgent>;
  updateAgent: (id: string, updates: Partial<ILeadAIAgent>) => Promise<ILeadAIAgent>;
  deleteAgent: (id: string) => Promise<void>;
  validateAgent: (id: string) => Promise<IAgentValidationResult>;
  testAgent: (id: string, testData: any) => Promise<IAIAgentResponse>;
  
  // Uso de agentes
  callAgent: (request: IAIAgentRequest) => Promise<IAIAgentResponse>;
  getAgentById: (id: string) => ILeadAIAgent | undefined;
  setDefaultAgent: (id: string, purpose: ILeadAIAgent['purpose']) => Promise<void>;
  
  // Estadísticas y análisis
  getAgentStats: () => {
    total: number;
    active: number;
    validated: number;
    totalRequests: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
  };
  
  // Utilidades
  refreshAgents: () => Promise<void>;
}

export const useAIAgents = (): UseAIAgentsReturn => {
  const [agents, setAgents] = useState<ILeadAIAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agentes filtrados
  const activeAgents = useMemo(() => 
    agents.filter(agent => agent.usage.isActive), 
    [agents]
  );
  
  const scoringAgents = useMemo(() => 
    agents.filter(agent => agent.purpose === 'lead_scoring' && agent.usage.isActive), 
    [agents]
  );
  
  const defaultScoringAgent = useMemo(() => 
    scoringAgents.find(agent => agent.usage.isDefault) || scoringAgents[0] || null, 
    [scoringAgents]
  );

  // Crear nuevo agente
  const createAgent = useCallback(async (data: ICreateAIAgentData): Promise<ILeadAIAgent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAgent: ILeadAIAgent = {
        id: Date.now().toString(),
        tenantId: 'tenant1',
        organizationId: 'org1',
        name: data.name,
        description: data.description,
        purpose: data.purpose,
        providerConfig: {
          provider: data.provider,
          config: {
            apiKey: data.apiKey,
            model: data.model,
            maxTokens: data.maxTokens || 1000,
            temperature: data.temperature || 0.1,
            baseUrl: data.provider === 'openai' ? 'https://api.openai.com/v1' : ''
          }
        },
        systemPrompt: data.systemPrompt || 'Eres un asistente de IA especializado en análisis de leads.',
        instructions: data.instructions || 'Analiza los datos proporcionados y responde de manera clara y concisa.',
        usage: {
          isActive: true,
          isDefault: data.isDefault || false,
          priority: 1,
          maxRequestsPerDay: data.maxRequestsPerDay,
          maxCostPerMonth: data.maxCostPerMonth
        },
        validation: {
          isValidated: false
        },
        stats: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          totalCost: 0,
          averageResponseTime: 0,
          createdAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
          updatedAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 }
        },
        metadata: {
          version: '1.0',
          createdBy: 'current-user',
          updatedBy: 'current-user',
          tags: data.tags || []
        }
      };

      setAgents(prev => [...prev, newAgent]);
      return newAgent;
    } catch (err) {
      setError('Error al crear el agente');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Actualizar agente
  const updateAgent = useCallback(async (id: string, updates: Partial<ILeadAIAgent>): Promise<ILeadAIAgent> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedAgent = agents.find(a => a.id === id);
      if (!updatedAgent) throw new Error('Agente no encontrado');

      const newAgent = {
        ...updatedAgent,
        ...updates,
        metadata: {
          ...updatedAgent.metadata,
          ...updates.metadata,
          updatedBy: 'current-user'
        },
        stats: {
          ...updatedAgent.stats,
          ...updates.stats,
          updatedAt: { _seconds: Date.now() / 1000, _nanoseconds: 0 }
        }
      };

      setAgents(prev => prev.map(a => a.id === id ? newAgent : a));
      return newAgent;
    } catch (err) {
      setError('Error al actualizar el agente');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [agents]);

  // Eliminar agente
  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Error al eliminar el agente');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validar agente
  const validateAgent = useCallback(async (id: string): Promise<IAgentValidationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const agent = agents.find(a => a.id === id);
      if (!agent) throw new Error('Agente no encontrado');

      // Simular validación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const validationResult: IAgentValidationResult = {
        isValid: true,
        agent,
        issues: [],
        testResults: {
          connectionTest: { success: true, responseTime: 1200 },
          promptTest: { success: true, response: 'Test exitoso' },
          costEstimate: { perRequest: 0.002, perMonth: 50 }
        }
      };

      // Actualizar estado de validación del agente
      await updateAgent(id, {
        validation: {
          isValidated: true,
          lastValidation: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
          validationResults: {
            responseTime: 1200,
            accuracy: 90,
            reliability: 95,
            costPerRequest: 0.002
          }
        }
      });

      return validationResult;
    } catch (err) {
      setError('Error al validar el agente');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [agents, updateAgent]);

  // Probar agente
  const testAgent = useCallback(async (id: string, testData: any): Promise<IAIAgentResponse> => {
    const agent = agents.find(a => a.id === id);
    if (!agent) throw new Error('Agente no encontrado');

    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      requestId: Date.now().toString(),
      agentId: id,
      success: true,
      result: {
        score: 85,
        confidence: 92,
        explanation: 'Lead con buena completitud de datos y fuente confiable',
        factors: {
          dataCompleteness: 38,
          sourceQuality: 25,
          engagement: 15,
          timing: 7
        }
      },
      metrics: {
        responseTime: 1200,
        tokensUsed: 450,
        cost: 0.002,
        provider: agent.providerConfig.provider,
        model: agent.providerConfig.config.model
      },
      metadata: {
        timestamp: { _seconds: Date.now() / 1000, _nanoseconds: 0 },
        version: agent.metadata.version
      }
    };
  }, [agents]);

  // Llamar agente
  const callAgent = useCallback(async (request: IAIAgentRequest): Promise<IAIAgentResponse> => {
    const agent = agents.find(a => a.id === request.agentId);
    if (!agent) throw new Error('Agente no encontrado');
    if (!agent.usage.isActive) throw new Error('Agente inactivo');
    if (!agent.validation.isValidated) throw new Error('Agente no validado');

    // Simular llamada real
    const response = await testAgent(request.agentId, request.input.leadData);
    
    // Actualizar estadísticas
    await updateAgent(request.agentId, {
      stats: {
        ...agent.stats,
        totalRequests: agent.stats.totalRequests + 1,
        successfulRequests: agent.stats.successfulRequests + (response.success ? 1 : 0),
        failedRequests: agent.stats.failedRequests + (response.success ? 0 : 1),
        totalCost: agent.stats.totalCost + (response.metrics.cost || 0),
        lastUsed: { _seconds: Date.now() / 1000, _nanoseconds: 0 }
      }
    });

    return response;
  }, [agents, testAgent, updateAgent]);

  // Obtener agente por ID
  const getAgentById = useCallback((id: string) => {
    return agents.find(a => a.id === id);
  }, [agents]);

  // Establecer agente por defecto
  const setDefaultAgent = useCallback(async (id: string, purpose: ILeadAIAgent['purpose']): Promise<void> => {
    // Quitar default de otros agentes del mismo propósito
    const updates = agents
      .filter(a => a.purpose === purpose && a.id !== id)
      .map(a => updateAgent(a.id, { 
        usage: { ...a.usage, isDefault: false } 
      }));

    // Establecer como default el agente seleccionado
    updates.push(updateAgent(id, { 
      usage: { ...agents.find(a => a.id === id)!.usage, isDefault: true } 
    }));

    await Promise.all(updates);
  }, [agents, updateAgent]);

  // Estadísticas
  const getAgentStats = useCallback(() => {
    const total = agents.length;
    const active = activeAgents.length;
    const validated = agents.filter(a => a.validation.isValidated).length;
    const totalRequests = agents.reduce((sum, a) => sum + a.stats.totalRequests, 0);
    const totalCost = agents.reduce((sum, a) => sum + a.stats.totalCost, 0);
    const avgResponseTime = agents.length > 0 
      ? agents.reduce((sum, a) => sum + a.stats.averageResponseTime, 0) / agents.length 
      : 0;
    const successRate = totalRequests > 0 
      ? (agents.reduce((sum, a) => sum + a.stats.successfulRequests, 0) / totalRequests) * 100 
      : 0;

    return {
      total,
      active,
      validated,
      totalRequests,
      totalCost,
      averageResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate)
    };
  }, [agents, activeAgents]);

  // Refrescar agentes
  const refreshAgents = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Simular refresh desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // En producción: fetch agents from API
    } catch (err) {
      setError('Error al refrescar agentes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estados
    agents,
    isLoading,
    error,
    
    // Agentes filtrados
    activeAgents,
    scoringAgents,
    defaultScoringAgent,
    
    // Gestión
    createAgent,
    updateAgent,
    deleteAgent,
    validateAgent,
    testAgent,
    
    // Uso
    callAgent,
    getAgentById,
    setDefaultAgent,
    
    // Estadísticas
    getAgentStats,
    
    // Utilidades
    refreshAgents
  };
};