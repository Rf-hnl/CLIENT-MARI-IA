'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  GlobalState,
  GlobalStateAction,
  CurrentUser,
  Organization,
  Tenant,
  createInitialGlobalState,
  getUserRoleInOrganization,
  hasPermission,
  isOwnerOrAdmin
} from '@/types/globalState';

// Context interface
interface GlobalStateContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalStateAction>;
  // Helper functions
  switchOrganization: (organizationId: string, tenantId: string) => Promise<void>;
  refreshUserData: () => Promise<void>;
  setCurrentUser: (user: CurrentUser) => void;
  clearUser: () => void;
  setError: (key: keyof GlobalState['errors'], error: string | null) => void;
  setLoading: (key: keyof GlobalState['loading'], loading: boolean) => void;
}

// Create context
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

// Reducer function
function globalStateReducer(state: GlobalState, action: GlobalStateAction): GlobalState {
  switch (action.type) {
    case 'SET_USER': {
      const user = action.payload;
      const currentOrgId = user.firestoreUser.currentOrganizationId;
      const currentTenantId = user.firestoreUser.currentTenantId;
      
      // Find current organization and tenant
      const currentOrganization = user.availableOrganizations.find(org => org.id === currentOrgId) || null;
      const currentTenant = user.availableTenants.find(tenant => tenant.id === currentTenantId) || null;
      
      // Determine user role and permissions
      const userRole = getUserRoleInOrganization(user.memberships, currentOrgId);
      const membership = user.memberships.find(m => m.organizationId === currentOrgId);
      const userPermissions = membership?.permissions || [];
      
      return {
        ...state,
        user,
        session: {
          currentOrganization,
          currentTenant,
          userRole,
          userPermissions,
          canCreateOrganizations: isOwnerOrAdmin(userRole) || hasPermission(userPermissions, 'create_organizations'),
          canSwitchOrganizations: user.availableOrganizations.length > 1,
        },
        isInitialized: true,
      };
    }

    case 'CLEAR_USER':
      return {
        ...createInitialGlobalState(),
        isInitialized: true,
      };

    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    case 'SET_CURRENT_ORGANIZATION': {
      const organization = action.payload;
      const userRole = state.user ? getUserRoleInOrganization(state.user.memberships, organization.id) : null;
      const membership = state.user?.memberships.find(m => m.organizationId === organization.id);
      const userPermissions = membership?.permissions || [];

      return {
        ...state,
        session: {
          ...state.session,
          currentOrganization: organization,
          userRole,
          userPermissions,
          canCreateOrganizations: isOwnerOrAdmin(userRole) || hasPermission(userPermissions, 'create_organizations'),
        },
      };
    }

    case 'ADD_ORGANIZATION':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          availableOrganizations: [...state.user.availableOrganizations, action.payload],
        },
        session: {
          ...state.session,
          canSwitchOrganizations: state.user.availableOrganizations.length + 1 > 1,
        },
      };

    case 'UPDATE_ORGANIZATION': {
      if (!state.user) return state;
      const { id, data } = action.payload;
      
      const updatedOrganizations = state.user.availableOrganizations.map(org =>
        org.id === id ? { ...org, ...data } : org
      );

      return {
        ...state,
        user: {
          ...state.user,
          availableOrganizations: updatedOrganizations,
        },
        session: {
          ...state.session,
          currentOrganization: state.session.currentOrganization?.id === id
            ? { ...state.session.currentOrganization, ...data }
            : state.session.currentOrganization,
        },
      };
    }

    case 'REMOVE_ORGANIZATION': {
      if (!state.user) return state;
      const organizationId = action.payload;
      
      const updatedOrganizations = state.user.availableOrganizations.filter(org => org.id !== organizationId);
      const updatedMemberships = state.user.memberships.filter(m => m.organizationId !== organizationId);

      return {
        ...state,
        user: {
          ...state.user,
          availableOrganizations: updatedOrganizations,
          memberships: updatedMemberships,
        },
        session: {
          ...state.session,
          currentOrganization: state.session.currentOrganization?.id === organizationId
            ? null
            : state.session.currentOrganization,
          canSwitchOrganizations: updatedOrganizations.length > 1,
        },
      };
    }

    case 'SET_CURRENT_TENANT':
      return {
        ...state,
        session: {
          ...state.session,
          currentTenant: action.payload,
        },
      };

    case 'ADD_TENANT':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          availableTenants: [...state.user.availableTenants, action.payload],
        },
      };

    case 'UPDATE_TENANT': {
      if (!state.user) return state;
      const { id, data } = action.payload;
      
      const updatedTenants = state.user.availableTenants.map(tenant =>
        tenant.id === id ? { ...tenant, ...data } : tenant
      );

      return {
        ...state,
        user: {
          ...state.user,
          availableTenants: updatedTenants,
        },
        session: {
          ...state.session,
          currentTenant: state.session.currentTenant?.id === id
            ? { ...state.session.currentTenant, ...data }
            : state.session.currentTenant,
        },
      };
    }

    case 'SWITCH_ORGANIZATION': {
      // This case is handled by the switchOrganization function
      return state;
    }

    case 'UPDATE_SESSION':
      return {
        ...state,
        session: {
          ...state.session,
          ...action.payload,
        },
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
      };

    case 'RESET_STATE':
      return createInitialGlobalState();

    default:
      return state;
  }
}

// Provider component
interface GlobalStateProviderProps {
  children: ReactNode;
}

export function GlobalStateProvider({ children }: GlobalStateProviderProps) {
  const [state, dispatch] = useReducer(globalStateReducer, createInitialGlobalState());

  // Helper functions
  const switchOrganization = async (organizationId: string, tenantId: string) => {
    if (!state.user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'switching', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { key: 'switching', value: null } });

      // Find the organization and tenant
      const organization = state.user.availableOrganizations.find(org => org.id === organizationId);
      const tenant = state.user.availableTenants.find(t => t.id === tenantId);

      if (!organization) {
        throw new Error('Organización no encontrada');
      }
      if (!tenant) {
        throw new Error('Tenant no encontrado');
      }

      // Update current organization and tenant
      dispatch({ type: 'SET_CURRENT_ORGANIZATION', payload: organization });
      dispatch({ type: 'SET_CURRENT_TENANT', payload: tenant });

      // Here you would typically also update the user's current context in Firestore
      // For now, we'll just update the local state
      if (state.user.firestoreUser) {
        const updatedFirestoreUser = {
          ...state.user.firestoreUser,
          currentOrganizationId: organizationId,
          currentTenantId: tenantId,
        };

        dispatch({
          type: 'UPDATE_USER',
          payload: {
            firestoreUser: updatedFirestoreUser,
          },
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar de organización';
      dispatch({ type: 'SET_ERROR', payload: { key: 'switching', value: errorMessage } });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'switching', value: false } });
    }
  };

  const refreshUserData = async () => {
    if (!state.user) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'user', value: true } });
      dispatch({ type: 'SET_ERROR', payload: { key: 'user', value: null } });

      // Here you would typically refresh user data from your services
      // For now, this is a placeholder
      console.log('Refreshing user data...');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar datos del usuario';
      dispatch({ type: 'SET_ERROR', payload: { key: 'user', value: errorMessage } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'user', value: false } });
    }
  };

  const setCurrentUser = (user: CurrentUser) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const clearUser = () => {
    dispatch({ type: 'CLEAR_USER' });
  };

  const setError = (key: keyof GlobalState['errors'], error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { key, value: error } });
  };

  const setLoading = (key: keyof GlobalState['loading'], loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value: loading } });
  };

  // Context value
  const contextValue: GlobalStateContextType = {
    state,
    dispatch,
    switchOrganization,
    refreshUserData,
    setCurrentUser,
    clearUser,
    setError,
    setLoading,
  };

  return (
    <GlobalStateContext.Provider value={contextValue}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Hook to use the global state
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}