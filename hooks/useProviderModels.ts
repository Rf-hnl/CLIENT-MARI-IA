/**
 * HOOK PARA OBTENER MODELOS DE PROVEEDORES DINÁMICAMENTE
 * 
 * Hook que obtiene modelos desde las APIs de OpenAI y Gemini
 * Incluye cache para optimizar rendimiento
 */

import { useState, useCallback, useRef } from 'react';
import { AnalysisProvider, ProviderModel } from '@/types/providers';

interface UseProviderModelsReturn {
  models: ProviderModel[];
  isLoading: boolean;
  error: string | null;
  fetchModels: (provider: AnalysisProvider, apiKey?: string) => Promise<ProviderModel[]>;
  clearCache: (provider?: AnalysisProvider) => void;
}

interface ModelCache {
  [provider: string]: {
    models: ProviderModel[];
    timestamp: number;
    apiKeyHash?: string;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useProviderModels(): UseProviderModelsReturn {
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache en memoria para evitar llamadas repetitivas
  const cacheRef = useRef<ModelCache>({});

  // Hash simple para API keys (para cache)
  const hashApiKey = useCallback((apiKey: string): string => {
    return btoa(apiKey.slice(-8)); // Solo los últimos 8 caracteres
  }, []);

  // Verificar si tenemos cache válido
  const getCachedModels = useCallback((provider: AnalysisProvider, apiKey?: string): ProviderModel[] | null => {
    const cached = cacheRef.current[provider];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) return null;

    // Verificar que el hash de API key coincida (tanto para Gemini como OpenAI)
    if (apiKey) {
      const currentHash = hashApiKey(apiKey);
      if (cached.apiKeyHash !== currentHash) return null;
    }

    return cached.models;
  }, [hashApiKey]);

  // Guardar en cache
  const setCachedModels = useCallback((provider: AnalysisProvider, models: ProviderModel[], apiKey?: string) => {
    cacheRef.current[provider] = {
      models,
      timestamp: Date.now(),
      ...(apiKey && { apiKeyHash: hashApiKey(apiKey) })
    };
  }, [hashApiKey]);

  // Obtener modelos de OpenAI dinámicamente (por ahora estáticos, pero preparado para API)
  const fetchOpenAIModels = useCallback(async (apiKey?: string): Promise<ProviderModel[]> => {
    // TODO: Implementar llamada real a OpenAI API cuando tengamos la API key
    if (!apiKey) {
      throw new Error('API Key requerida para obtener modelos de OpenAI');
    }

    // Por ahora retornamos modelos estáticos, pero validando que haya API key
    console.log('🔍 [USE_PROVIDER_MODELS] Cargando modelos de OpenAI (estáticos por ahora)...');
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        name: 'gpt-4o',
        displayName: 'GPT-4o',
        description: 'Modelo más reciente y optimizado de OpenAI',
        contextWindow: 128000,
        version: '4o'
      },
      {
        name: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        description: 'Versión rápida y económica de GPT-4o',
        contextWindow: 128000,
        version: '4o-mini'
      },
      {
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        description: 'Versión turbo avanzada de GPT-4',
        contextWindow: 128000,
        version: '4-turbo'
      },
      {
        name: 'gpt-4',
        displayName: 'GPT-4',
        description: 'Modelo GPT-4 estándar',
        contextWindow: 8192,
        version: '4'
      },
      {
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        description: 'Modelo eficiente y rápido',
        contextWindow: 16385,
        version: '3.5'
      }
    ];
  }, []);

  // Obtener modelos de Gemini dinámicamente
  const fetchGeminiModels = useCallback(async (apiKey: string): Promise<ProviderModel[]> => {
    if (!apiKey) {
      throw new Error('API Key requerida para obtener modelos de Gemini');
    }

    console.log('🔍 [USE_PROVIDER_MODELS] Obteniendo modelos de Gemini...');

    try {
      const response = await fetch('/api/providers/gemini/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        const errorMsg = data.error || 'Error desconocido al obtener modelos';
        console.error('🚨 [FETCH_GEMINI_MODELS] API Error Details:', data.details);
        throw new Error(errorMsg);
      }

      console.log(`✅ [USE_PROVIDER_MODELS] Obtenidos ${data.models.length} modelos de Gemini`);
      return data.models;

    } catch (fetchError: unknown) {
      if (fetchError instanceof Error) {
        console.error('🚨 [FETCH_GEMINI_MODELS] Fetch error:', fetchError.message);
      } else {
        console.error('🚨 [FETCH_GEMINI_MODELS] Unknown fetch error:', fetchError);
      }
      
      // Re-throw para que sea capturado por el catch principal
      throw fetchError;
    }
  }, []);

  // Función principal para obtener modelos
  const fetchModels = useCallback(async (provider: AnalysisProvider, apiKey?: string): Promise<ProviderModel[]> => {
    setError(null);

    // Verificar cache primero
    const cachedModels = getCachedModels(provider, apiKey);
    if (cachedModels) {
      console.log(`💾 [USE_PROVIDER_MODELS] Usando modelos de ${provider} desde cache`);
      setModels(cachedModels);
      return cachedModels;
    }

    setIsLoading(true);

    try {
      let fetchedModels: ProviderModel[];

      switch (provider) {
        case 'openai':
          if (!apiKey) {
            throw new Error('API Key requerida para OpenAI');
          }
          fetchedModels = await fetchOpenAIModels(apiKey);
          break;
          
        case 'gemini':
          if (!apiKey) {
            throw new Error('API Key requerida para Gemini');
          }
          fetchedModels = await fetchGeminiModels(apiKey);
          break;
          
        default:
          throw new Error(`Proveedor ${provider} no soportado`);
      }

      // Guardar en cache
      setCachedModels(provider, fetchedModels, apiKey);
      
      // Actualizar estado
      setModels(fetchedModels);
      return fetchedModels;

    } catch (err: unknown) {
      let errorMessage = 'Error desconocido';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'error' in err) {
        errorMessage = String(err.error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      console.error(`❌ [USE_PROVIDER_MODELS] Error obteniendo modelos de ${provider}:`, errorMessage);
      
      setError(errorMessage);
      
      // En caso de error, intentar usar cache expirado como fallback
      const expiredCache = cacheRef.current[provider];
      if (expiredCache?.models) {
        console.log(`⚠️ [USE_PROVIDER_MODELS] Usando cache expirado como fallback para ${provider}`);
        setModels(expiredCache.models);
        return expiredCache.models;
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getCachedModels, setCachedModels, fetchOpenAIModels, fetchGeminiModels]);

  // Limpiar cache
  const clearCache = useCallback((provider?: AnalysisProvider) => {
    if (provider) {
      delete cacheRef.current[provider];
      console.log(`🗑️ [USE_PROVIDER_MODELS] Cache limpiado para ${provider}`);
    } else {
      cacheRef.current = {};
      console.log('🗑️ [USE_PROVIDER_MODELS] Cache completo limpiado');
    }
  }, []);

  return {
    models,
    isLoading,
    error,
    fetchModels,
    clearCache
  };
}