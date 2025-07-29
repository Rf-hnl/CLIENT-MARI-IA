import { useState, useEffect, useCallback } from 'react';
import { 
  ITenantElevenLabsConfig, 
  ICreateElevenLabsConfigData, 
  IUpdateElevenLabsConfigData,
  IElevenLabsConfigResult,
  IElevenLabsConnectionTest,
  IElevenLabsVoice 
} from '@/types/elevenlabs';

interface UseElevenLabsConfigProps {
  tenantId: string | null;
  uid: string | null;
}

export const useElevenLabsConfig = ({ tenantId, uid }: UseElevenLabsConfigProps) => {
  const [config, setConfig] = useState<ITenantElevenLabsConfig | null>(null);
  const [voices, setVoices] = useState<IElevenLabsVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener configuración
  const fetchConfig = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tenant/elevenlabs/config?tenantId=${tenantId}`);
      const result: IElevenLabsConfigResult = await response.json();
      
      if (result.success) {
        setConfig(result.config || null);
      } else {
        setError(result.error || 'Error al obtener configuración');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Crear configuración
  const createConfig = useCallback(async (configData: ICreateElevenLabsConfigData) => {
    if (!tenantId || !uid) throw new Error('tenantId y uid son requeridos');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenant/elevenlabs/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, uid, ...configData })
      });

      const result: IElevenLabsConfigResult = await response.json();
      
      if (result.success) {
        setConfig(result.config || null);
        return result;
      } else {
        setError(result.error || 'Error al crear configuración');
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

  // Actualizar configuración
  const updateConfig = useCallback(async (updateData: IUpdateElevenLabsConfigData) => {
    if (!tenantId || !uid) throw new Error('tenantId y uid son requeridos');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenant/elevenlabs/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, uid, ...updateData })
      });

      const result: IElevenLabsConfigResult = await response.json();
      
      if (result.success) {
        setConfig(result.config || null);
        return result;
      } else {
        setError(result.error || 'Error al actualizar configuración');
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

  // Eliminar configuración
  const deleteConfig = useCallback(async () => {
    if (!tenantId || !uid) throw new Error('tenantId y uid son requeridos');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/elevenlabs/config?tenantId=${tenantId}&uid=${uid}`, {
        method: 'DELETE'
      });

      const result: IElevenLabsConfigResult = await response.json();
      
      if (result.success) {
        setConfig(null);
        return result;
      } else {
        setError(result.error || 'Error al eliminar configuración');
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

  // Probar conexión
  const testConnection = useCallback(async (testConfig?: {
    apiKey: string;
    apiUrl: string;
    phoneId: string;
  }) => {
    if (!tenantId) throw new Error('tenantId es requerido');

    console.log('🔄 [HOOK] Iniciando testConnection para tenant:', tenantId);
    setTesting(true);
    setError(null);

    try {
      console.log('📡 [HOOK] Enviando request a API...');
      const response = await fetch('/api/tenant/elevenlabs/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, testConfig })
      });

      console.log('📨 [HOOK] Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: IElevenLabsConnectionTest = await response.json();
      console.log('🎯 [HOOK] Resultado:', result);
      
      // Si el test incluye voces, guardarlas
      if (result.voices && result.voices.length > 0) {
        console.log('🎵 [HOOK] Guardando voces del test:', result.voices.length);
        setVoices(result.voices);
      }
      
      return result;
    } catch (err) {
      console.error('🚨 [HOOK] Error en testConnection:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);
      throw err;
    } finally {
      setTesting(false);
      console.log('🔚 [HOOK] testConnection finalizado');
    }
  }, [tenantId]);

  // Obtener voces disponibles
  const fetchVoices = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tenant/elevenlabs/test-connection?tenantId=${tenantId}`);
      const result = await response.json();
      
      if (result.success) {
        setVoices(result.voices || []);
      } else {
        setError(result.error || 'Error al obtener voces');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Cargar configuración al montar o cambiar tenantId
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    voices,
    loading,
    testing,
    error,
    fetchConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    testConnection,
    fetchVoices,
    isConfigured: !!config,
    clearError: () => setError(null)
  };
};