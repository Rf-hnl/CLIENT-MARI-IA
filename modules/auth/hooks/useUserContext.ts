import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';

export interface UserContextData {
  user: any;
  tenant: any;
  organization: any;
}

export interface UserContextState {
  context: UserContextData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useUserContext() {
  const { currentUser } = useAuth();
  const [state, setState] = useState<UserContextState>({
    context: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchContext = useCallback(async () => {
    if (!currentUser) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        context: null,
        error: 'Usuario no autenticado' 
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Get current session token
      const { data: { session } } = await import('@/lib/supabase/client').then(m => 
        m.supabase.auth.getSession()
      );

      if (!session?.access_token) {
        throw new Error('No se pudo obtener token de acceso');
      }

      console.log('🔍 [USER-CONTEXT] Fetching real user context...');

      const response = await fetch('/api/auth/context', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
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

      console.log('✅ [USER-CONTEXT] Real context loaded:', {
        userId: data.user?.id,
        tenantId: data.tenant?.id,
        organizationId: data.organization?.id
      });

      setState({
        context: {
          user: data.user,
          tenant: data.tenant,
          organization: data.organization
        },
        loading: false,
        error: null,
        lastUpdated: new Date(data.timestamp)
      });

    } catch (error) {
      console.error('❌ [USER-CONTEXT] Error fetching context:', error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar contexto del usuario'
      }));
    }
  }, [currentUser]);

  // Load context when user changes
  useEffect(() => {
    if (currentUser) {
      fetchContext();
    }
  }, [currentUser, fetchContext]);

  // Refresh function
  const refreshContext = useCallback(() => {
    fetchContext();
  }, [fetchContext]);

  return {
    ...state,
    refreshContext,
    isStale: state.lastUpdated ? 
      (Date.now() - state.lastUpdated.getTime()) > 10 * 60 * 1000 : // 10 minutes
      false
  };
}