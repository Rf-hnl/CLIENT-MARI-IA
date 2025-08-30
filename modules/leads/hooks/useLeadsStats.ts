import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface LeadStat {
  label: string;
  value: number;
  change: string;
  icon: string;
  color: string;
  description: string;
}

export interface LeadsStatsState {
  stats: LeadStat[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useLeadsStats() {
  const { user: currentUser } = useAuth();
  const [state, setState] = useState<LeadsStatsState>({
    stats: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchStats = useCallback(async () => {
    if (!currentUser) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Usuario no autenticado' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('📊 [useLeadsStats] Fetching real statistics...');

      // Get tenant and organization from currentUser context
      if (!currentUser?.tenantId || !currentUser?.organizationId) {
        throw new Error('No se pudo obtener información de tenant/organización');
      }

      const requestBody = {
        tenantId: currentUser.tenantId,
        organizationId: currentUser.organizationId,
      };

      const response = await fetch('/api/leads/stats-web', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid - clear it and trigger re-auth
          localStorage.removeItem('auth_token');
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      console.log('✅ [useLeadsStats] Real statistics loaded:', data.stats.length, 'metrics');

      setState({
        stats: data.stats,
        loading: false,
        error: null,
        lastUpdated: new Date(data.timestamp)
      });

    } catch (error) {
      console.error('❌ [useLeadsStats] Error fetching stats:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar estadísticas'
      }));
    }
  }, [currentUser]);

  // Cargar estadísticas al montar el componente o cambiar usuario
  useEffect(() => {
    if (currentUser) {
      fetchStats();
    }
  }, [currentUser, fetchStats]);

  // Función para refrescar manualmente
  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refreshStats,
    isStale: state.lastUpdated ? 
      (Date.now() - state.lastUpdated.getTime()) > 5 * 60 * 1000 : // 5 minutos
      false
  };
}