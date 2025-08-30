'use client';

/**
 * CONTEXT - CLIENTS MODULE
 * 
 * Context para gestión global del estado de clientes
 * Preparado para integración con Firebase
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IClient, ICustomerInteractions } from '../types/clients';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

// Extended client type with customer interactions
export type ExtendedClient = IClient & {
  customerInteractions?: ICustomerInteractions;
};

interface ClientsContextType {
  clients: ExtendedClient[];
  isLoading: boolean;
  error: string | null;
  currentOrganization: any;
  currentTenant: any;
  refetch: () => Promise<void>;
  addClient: (clientData: Omit<IClient, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<IClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  bulkDeleteClients: (clientIds: string[]) => Promise<void>;
  // New methods for customer interactions
  getClientInteractions: (clientId: string) => ICustomerInteractions | undefined;
  // Migration methods
  getClientsWithoutInteractions: () => ExtendedClient[];
  migrateClient: (clientId: string) => Promise<void>;
  migrateAllClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { currentTenant, currentOrganization, loading: tenantLoading } = useTenant();
  
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified function - don't load clients for now
  const fetchClients = async () => {
    if (authLoading || tenantLoading) return;
    
    // For now, just set empty state to avoid API calls
    setClients([]);
    setIsLoading(false);
    setError(null);
    console.log('📋 [CLIENTS] Context simplified - no clients loaded');
  };

  // Load clients when user or tenant changes
  useEffect(() => {
    fetchClients();
  }, [currentUser, authLoading, tenantLoading]);

  // Simplified admin functions
  const addClient = async (clientData: Omit<IClient, 'id' | 'created_at' | 'updated_at'>) => {
    throw new Error('Client functionality not implemented in simplified mode');
  };

  const updateClient = async (id: string, updates: Partial<IClient>) => {
    throw new Error('Client functionality not implemented in simplified mode');
  };

  const deleteClient = async (id: string) => {
    throw new Error('Client functionality not implemented in simplified mode');
  };

  const bulkDeleteClients = async (clientIds: string[]) => {
    throw new Error('Client functionality not implemented in simplified mode');
  };

  // Simplified functions
  const getClientInteractions = (clientId: string): ICustomerInteractions | undefined => {
    return undefined;
  };

  const getClientsWithoutInteractions = (): ExtendedClient[] => {
    return [];
  };

  const migrateClient = async (clientId: string): Promise<void> => {
    throw new Error('Migration functionality not implemented in simplified mode');
  };

  const migrateAllClients = async (): Promise<void> => {
    throw new Error('Migration functionality not implemented in simplified mode');
  };

  const value: ClientsContextType = {
    clients,
    isLoading,
    error,
    currentOrganization,
    currentTenant,
    refetch: fetchClients,
    addClient,
    updateClient,
    deleteClient,
    bulkDeleteClients,
    getClientInteractions,
    getClientsWithoutInteractions,
    migrateClient,
    migrateAllClients,
  };

  return (
    <ClientsContext.Provider value={value}>
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClients must be used within a ClientsProvider');
  }
  return context;
}