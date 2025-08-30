import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface LeadsAnalytics {
  summary: {
    totalLeads: number;
    conversionRate: string;
    qualificationRate: string;
    pipelineValue: number;
    averageScore: string;
  };
  pipeline: Array<{
    status: string;
    count: number;
    label: string;
  }>;
  scoreDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  sourceDistribution: Array<{
    source: string;
    count: number;
  }>;
  trends: {
    thisWeek: Array<{
      date: string;
      count: number;
    }>;
    thisMonth: number;
  };
}

export interface LeadsAnalyticsState {
  analytics: LeadsAnalytics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useLeadsAnalytics() {
  const { user: currentUser } = useAuth();
  const [state, setState] = useState<LeadsAnalyticsState>({
    analytics: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchAnalytics = useCallback(async () => {
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

      // Obtener token JWT del localStorage (como lo hace AuthContext)
      const token = localStorage.getItem('auth_token');

      if (!token) {
        throw new Error('No se pudo obtener token de acceso');
      }

      console.log('📊 [useLeadsAnalytics] Fetching analytics...');
      console.log('📊 [useLeadsAnalytics] Using token:', token?.substring(0, 20) + '...');

      const response = await fetch('/api/leads/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      console.log('✅ [useLeadsAnalytics] Analytics loaded successfully');

      setState({
        analytics: data.analytics,
        loading: false,
        error: null,
        lastUpdated: new Date(data.timestamp)
      });

    } catch (error) {
      console.error('❌ [useLeadsAnalytics] Error fetching analytics:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar analytics'
      }));
    }
  }, [currentUser]);

  // Cargar analytics al montar el componente o cambiar usuario
  useEffect(() => {
    if (currentUser) {
      fetchAnalytics();
    }
  }, [currentUser, fetchAnalytics]);

  // Función para refrescar manualmente
  const refreshAnalytics = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    ...state,
    refreshAnalytics,
    isStale: state.lastUpdated ? 
      (Date.now() - state.lastUpdated.getTime()) > 5 * 60 * 1000 : // 5 minutos
      false
  };
}