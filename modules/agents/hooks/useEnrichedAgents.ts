import { useState, useCallback, useEffect } from 'react';
import { 
  ILocalAgentReference,
  ITenantElevenLabsAgent,
  IAgentsListResult,
  IAgentsFilter
} from '@/types/agents';
import { IElevenLabsAgentInfo } from '@/types/elevenlabs';

interface UseEnrichedAgentsProps {
  tenantId: string | null;
  uid: string | null;
}

export const useEnrichedAgents = ({ tenantId, uid }: UseEnrichedAgentsProps) => {
  const [agents, setAgents] = useState<ITenantElevenLabsAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener referencias locales y enriquecerlas con datos de ElevenLabs
  const fetchEnrichedAgents = useCallback(async (filters?: IAgentsFilter, page = 1, limit = 50) => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 [ENRICHED_AGENTS] Fetching local references...');
      
      // 1. Obtener referencias locales de Firebase
      const params = new URLSearchParams({
        tenantId,
        page: page.toString(),
        limit: limit.toString()
      });

      // Agregar filtros
      if (filters?.isActive !== undefined) {
        params.append('isActive', filters.isActive.toString());
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.tags && filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      const response = await fetch(`/api/tenant/agents/elevenlabs/list?${params}`);
      const result: IAgentsListResult = await response.json();

      if (!result.success) {
        setError(result.error || 'Error al obtener agentes');
        return;
      }

      const localReferences = result.agents as ILocalAgentReference[];
      console.log(`🔍 [ENRICHED_AGENTS] Found ${localReferences.length} local references`);

      // 2. Enriquecer cada referencia con datos frescos de ElevenLabs
      const enrichedAgents: ITenantElevenLabsAgent[] = [];
      
      for (const reference of localReferences) {
        try {
          console.log(`🎯 [ENRICHED_AGENTS] Enriching agent: ${reference.elevenLabsConfig.agentId}`);
          
          // Obtener datos frescos de ElevenLabs
          const agentInfoResponse = await fetch('/api/tenant/elevenlabs/agent-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              tenantId, 
              agentId: reference.elevenLabsConfig.agentId 
            })
          });

          const agentInfoResult = await agentInfoResponse.json();

          if (agentInfoResult.success && agentInfoResult.agent) {
            const elevenLabsData: IElevenLabsAgentInfo = agentInfoResult.agent;
            
            // Combinar referencia local + datos frescos
            const enrichedAgent: ITenantElevenLabsAgent = {
              ...reference,
              name: elevenLabsData.name,
              description: `Agente ElevenLabs: ${elevenLabsData.name}`,
              // Reconstruir la estructura completa de ElevenLabs
              elevenLabsConfig: {
                ...reference.elevenLabsConfig,
                agentId: reference.elevenLabsConfig.agentId,
                voice: {
                  voiceId: elevenLabsData.conversation_config?.tts?.voice_id || '',
                  voiceName: 'Voz ElevenLabs',
                  stability: elevenLabsData.conversation_config?.tts?.stability || 0.5,
                  similarityBoost: elevenLabsData.conversation_config?.tts?.similarity_boost || 0.8,
                  style: 0.0
                },
                conversation: {
                  model: elevenLabsData.conversation_config?.tts?.model_id || 'eleven_turbo_v2_5',
                  temperature: elevenLabsData.conversation_config?.agent?.prompt?.temperature || 0,
                  maxTokens: elevenLabsData.conversation_config?.agent?.prompt?.max_tokens || -1,
                  systemPrompt: elevenLabsData.conversation_config?.agent?.prompt?.prompt || '',
                  firstMessage: elevenLabsData.conversation_config?.agent?.first_message || ''
                }
              },
              elevenLabsData
            };

            enrichedAgents.push(enrichedAgent);
            
            // Actualizar cache opcional
            if (reference.cache?.name !== elevenLabsData.name) {
              await updateAgentCache(reference.id, {
                name: elevenLabsData.name,
                lastSyncAt: new Date()
              });
            }
            
          } else {
            console.warn(`⚠️ [ENRICHED_AGENTS] Failed to fetch ElevenLabs data for agent: ${reference.elevenLabsConfig.agentId}. Skipping this agent.`);
          }
          
        } catch (agentError) {
          console.error(`🚨 [ENRICHED_AGENTS] Error enriching agent ${reference.elevenLabsConfig.agentId}:`, agentError);
        }
      }

      console.log(`✅ [ENRICHED_AGENTS] Successfully enriched ${enrichedAgents.length} agents`);
      setAgents(enrichedAgents);

    } catch (err) {
      console.error('🚨 [ENRICHED_AGENTS] General error:', err);
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Actualizar cache de agente
  const updateAgentCache = async (localAgentId: string, cache: { name: string; lastSyncAt: Date }) => {
    try {
      await fetch(`/api/tenant/agents/elevenlabs/${localAgentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tenantId, 
          uid,
          cache 
        })
      });
    } catch (error) {
      console.warn('Failed to update agent cache:', error);
    }
  };

  // DESHABILITADO: No cargar agentes automáticamente para evitar consultas innecesarias
  // Solo cargar cuando se llame explícitamente a fetchEnrichedAgents()
  // useEffect(() => {
  //   if (tenantId) {
  //     console.log('🔄 [ENRICHED_AGENTS] Auto-loading on mount or tenantId change');
  //     fetchEnrichedAgents();
  //   }
  // }, [tenantId, fetchEnrichedAgents]);

  return {
    agents,
    loading,
    error,
    fetchEnrichedAgents,
    clearError: () => setError(null)
  };
};