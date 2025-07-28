// Global State Hooks
// Custom hooks for easy access to global state functionality

import { useCallback, useMemo } from 'react';
import { useGlobalState } from '@/contexts/GlobalStateContext';
import {
  Organization,
  Tenant,
  CurrentUser,
  UserOrganizationMembership,
  CreateOrganizationData,
  UpdateOrganizationData,
  isOwnerOrAdmin,
  hasPermission
} from '@/types/globalState';
import {
  createOrganization,
  updateOrganization,
  switchUserOrganization,
  getUserOrganizations,
  getUserTenants
} from '@/lib/services/organizationService';
import { getCombinedUserData } from '@/lib/firestore/userService';
import { createFirebaseUserRecord } from '@/types/firebaseUser';

// Hook for current user data
export function useCurrentUser() {
  const { state } = useGlobalState();
  
  return useMemo(() => ({
    user: state.user,
    isAuthenticated: !!state.user,
    firebaseAuth: state.user?.firebaseAuth || null,
    firestoreUser: state.user?.firestoreUser || null,
    memberships: state.user?.memberships || [],
    isLoading: state.loading.user,
    error: state.errors.user,
  }), [state.user, state.loading.user, state.errors.user]);
}

// Hook for current session (organization/tenant)
export function useCurrentSession() {
  const { state } = useGlobalState();
  
  return useMemo(() => ({
    currentOrganization: state.session.currentOrganization,
    currentTenant: state.session.currentTenant,
    userRole: state.session.userRole,
    userPermissions: state.session.userPermissions,
    canCreateOrganizations: state.session.canCreateOrganizations,
    canSwitchOrganizations: state.session.canSwitchOrganizations,
    isLoading: state.loading.switching,
    error: state.errors.switching,
  }), [state.session, state.loading.switching, state.errors.switching]);
}

// Hook for organization management
export function useOrganizations() {
  const { state, dispatch, switchOrganization, setLoading, setError } = useGlobalState();
  
  const availableOrganizations = useMemo(() => 
    state.user?.availableOrganizations || [], 
    [state.user?.availableOrganizations]
  );
  
  const availableTenants = useMemo(() => 
    state.user?.availableTenants || [], 
    [state.user?.availableTenants]
  );

  // Create new organization
  const createNewOrganization = useCallback(async (organizationData: CreateOrganizationData) => {
    if (!state.user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setLoading('organizations', true);
      setError('organizations', null);

      const result = await createOrganization(state.user.firebaseAuth.uid, organizationData);
      
      if (result.success && result.organization) {
        // Add organization to state
        dispatch({ type: 'ADD_ORGANIZATION', payload: result.organization });
        
        // Optionally switch to the new organization
        if (organizationData.tenantId) {
          await switchOrganization(result.organization.id, organizationData.tenantId);
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear organización';
      setError('organizations', errorMessage);
      throw error;
    } finally {
      setLoading('organizations', false);
    }
  }, [state.user, dispatch, switchOrganization, setLoading, setError]);

  // Update organization
  const updateExistingOrganization = useCallback(async (
    organizationId: string,
    updateData: UpdateOrganizationData
  ) => {
    if (!state.session.currentTenant) {
      throw new Error('No hay tenant actual');
    }

    try {
      setLoading('organizations', true);
      setError('organizations', null);

      const result = await updateOrganization(
        state.session.currentTenant.id,
        organizationId,
        updateData
      );
      
      if (result.success && result.organization) {
        // Update organization in state
        dispatch({
          type: 'UPDATE_ORGANIZATION',
          payload: { id: organizationId, data: result.organization }
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar organización';
      setError('organizations', errorMessage);
      throw error;
    } finally {
      setLoading('organizations', false);
    }
  }, [state.session.currentTenant, dispatch, setLoading, setError]);

  // Switch to different organization
  const switchToOrganization = useCallback(async (organizationId: string, tenantId: string) => {
    try {
      await switchOrganization(organizationId, tenantId);
    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  }, [switchOrganization]);

  return {
    availableOrganizations,
    availableTenants,
    currentOrganization: state.session.currentOrganization,
    currentTenant: state.session.currentTenant,
    isLoading: state.loading.organizations || state.loading.switching,
    error: state.errors.organizations || state.errors.switching,
    createNewOrganization,
    updateExistingOrganization,
    switchToOrganization,
  };
}

// Hook for user permissions
export function usePermissions() {
  const { state } = useGlobalState();
  
  const checkPermission = useCallback((permission: string) => {
    return hasPermission(state.session.userPermissions, permission);
  }, [state.session.userPermissions]);

  const isOwnerOrAdminRole = useMemo(() => 
    isOwnerOrAdmin(state.session.userRole), 
    [state.session.userRole]
  );

  return {
    userRole: state.session.userRole,
    userPermissions: state.session.userPermissions,
    checkPermission,
    isOwnerOrAdmin: isOwnerOrAdminRole,
    canCreateOrganizations: state.session.canCreateOrganizations,
    canSwitchOrganizations: state.session.canSwitchOrganizations,
  };
}

// Hook for initializing global state from authentication
export function useGlobalStateInitializer() {
  const { state, setCurrentUser, clearUser, setLoading, setError } = useGlobalState();

  const initializeFromUser = useCallback(async (firebaseUser: any) => {
    try {
      setLoading('user', true);
      setError('user', null);

      // Convert Firebase user to our format
      const firebaseUserRecord = createFirebaseUserRecord(firebaseUser);
      
      // Get combined user data (Firebase Auth + Firestore)
      const combinedData = await getCombinedUserData(firebaseUserRecord);
      
      if (!combinedData.firestoreUser) {
        throw new Error('Usuario no encontrado en Firestore');
      }

      // Get user's organizations and tenants
      const [organizations, tenants] = await Promise.all([
        getUserOrganizations(combinedData.firestoreUser.organizationMemberships),
        getUserTenants(combinedData.firestoreUser.organizationMemberships)
      ]);

      // Create current user object
      const currentUser: CurrentUser = {
        firebaseAuth: firebaseUserRecord,
        firestoreUser: combinedData.firestoreUser,
        memberships: combinedData.firestoreUser.organizationMemberships,
        availableOrganizations: organizations,
        availableTenants: tenants,
      };

      // Set in global state
      setCurrentUser(currentUser);

    } catch (error) {
      console.error('Error initializing global state:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al inicializar estado';
      setError('user', errorMessage);
      throw error;
    } finally {
      setLoading('user', false);
    }
  }, [setCurrentUser, setLoading, setError]);

  const clearGlobalState = useCallback(() => {
    clearUser();
  }, [clearUser]);

  return {
    isInitialized: state.isInitialized,
    isLoading: state.loading.user,
    error: state.errors.user,
    initializeFromUser,
    clearGlobalState,
  };
}

// Hook for organization filtering and searching
export function useOrganizationFilters() {
  const { state } = useGlobalState();
  
  const filterOrganizationsByTenant = useCallback((tenantId: string) => {
    if (!state.user) return [];
    
    return state.user.availableOrganizations.filter(org => {
      const membership = state.user?.memberships.find(m => m.organizationId === org.id);
      return membership?.tenantId === tenantId;
    });
  }, [state.user]);

  const searchOrganizations = useCallback((query: string) => {
    if (!state.user || !query.trim()) return state.user?.availableOrganizations || [];
    
    const lowercaseQuery = query.toLowerCase();
    return state.user.availableOrganizations.filter(org =>
      org.name.toLowerCase().includes(lowercaseQuery) ||
      org.description.toLowerCase().includes(lowercaseQuery)
    );
  }, [state.user]);

  const getOrganizationsByRole = useCallback((role: 'owner' | 'admin' | 'member') => {
    if (!state.user) return [];
    
    return state.user.availableOrganizations.filter(org => {
      const membership = state.user?.memberships.find(m => m.organizationId === org.id);
      return membership?.role === role;
    });
  }, [state.user]);

  return {
    filterOrganizationsByTenant,
    searchOrganizations,
    getOrganizationsByRole,
  };
}

// Hook for loading states
export function useGlobalLoadingStates() {
  const { state } = useGlobalState();
  
  return {
    isLoadingUser: state.loading.user,
    isLoadingOrganizations: state.loading.organizations,
    isLoadingTenants: state.loading.tenants,
    isSwitching: state.loading.switching,
    isLoadingAny: Object.values(state.loading).some(Boolean),
  };
}

// Hook for error states
export function useGlobalErrors() {
  const { state } = useGlobalState();
  
  return {
    userError: state.errors.user,
    organizationsError: state.errors.organizations,
    tenantsError: state.errors.tenants,
    switchingError: state.errors.switching,
    hasAnyError: Object.values(state.errors).some(Boolean),
  };
}