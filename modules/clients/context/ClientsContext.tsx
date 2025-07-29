'use client';

/**
 * CONTEXT - CLIENTS MODULE
 * 
 * Context para gestión global del estado de clientes
 * Preparado para integración con Firebase
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { IClient, ICustomerInteractions } from '../types/clients';
import { getCurrentUserData, getCurrentOrganization, getCurrentTenant } from '@/lib/auth/userState';
import { useAuth } from '@/modules/auth';

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
  // New methods for customer interactions
  getClientInteractions: (clientId: string) => ICustomerInteractions | undefined;
  // Migration methods
  getClientsWithoutInteractions: () => ExtendedClient[];
  migrateClient: (clientId: string) => Promise<void>;
  migrateAllClients: () => Promise<void>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [currentTenant, setCurrentTenant] = useState<any>(null);

  // Función para cargar clientes desde Firebase (replicando lógica del UserProfileCard)
  const fetchClients = async () => {
    if (!currentUser) {
      setClients([]);
      setCurrentOrganization(null);
      setCurrentTenant(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Obtener datos del usuario y contexto organizacional (igual que UserProfileCard)
      const [userData, organization, tenant] = await Promise.all([
        getCurrentUserData(currentUser),
        getCurrentOrganization(currentUser),
        getCurrentTenant(currentUser)
      ]);

      setCurrentOrganization(organization);
      setCurrentTenant(tenant);

      // Si no hay tenant u organización, no podemos obtener clientes
      if (!organization || !tenant) {
        console.warn('No hay organización o tenant actual para obtener clientes');
        setClients([]);
        setIsLoading(false);
        return;
      }

      // Llamar al API para obtener clientes
      const response = await fetch('/api/client/admin/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          organizationId: organization.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al obtener clientes');
      }

      // Convertir el objeto de clientes a array con soporte para customerInteractions
      const clientsArray: ExtendedClient[] = Object.values(data.data || {});
      setClients(clientsArray);

      console.log(`📋 Se cargaron ${clientsArray.length} clientes desde ${data.path}`);
      
      // Log clients with AI profiles for debugging
      const clientsWithAI = clientsArray.filter(c => c.customerInteractions?.clientAIProfiles);
      console.log(`🤖 ${clientsWithAI.length} clientes tienen perfiles de IA inicializados`);

    } catch (err) {
      console.error('Error obteniendo clientes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar clientes cuando cambie el usuario (igual que UserProfileCard)
  useEffect(() => {
    fetchClients();
  }, [currentUser]);

  // Admin functions - Implementado con Firebase API
  const addClient = async (clientData: Omit<IClient, 'id' | 'created_at' | 'updated_at'>) => {
    if (!currentOrganization || !currentTenant) {
      throw new Error('No hay organización o tenant disponible para crear el cliente');
    }

    setIsLoading(true);
    setError(null);
    try {
      // Llamar al API para crear el cliente
      const response = await fetch('/api/client/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          clientData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al crear el cliente');
      }

      console.log(`✅ Cliente creado exitosamente: ${data.data.name}`);
      
      // Refrescar la lista de clientes
      await fetchClients();
      
    } catch (err) {
      console.error('Error creando cliente:', err);
      setError(err instanceof Error ? err.message : 'Error creating client');
      throw err; // Re-throw para que el modal pueda manejarlo
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id: string, updates: Partial<IClient>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implementar con Firebase API
      console.log('Updating client:', id, updates);
      // Por ahora solo refrescamos los datos
      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating client');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implementar con Firebase API
      console.log('Deleting client:', id);
      // Por ahora solo refrescamos los datos
      await fetchClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting client');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to get customer interactions for a specific client
  const getClientInteractions = (clientId: string): ICustomerInteractions | undefined => {
    const client = clients.find(c => c.id === clientId);
    return client?.customerInteractions;
  };

  // Function to get clients without customerInteractions (need migration)
  const getClientsWithoutInteractions = (): ExtendedClient[] => {
    return clients.filter(client => !client.customerInteractions);
  };

  // Function to migrate a single client
  const migrateClient = async (clientId: string): Promise<void> => {
    if (!currentOrganization || !currentTenant) {
      throw new Error('No hay organización o tenant disponible para la migración');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/client/migrate/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          clientId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al migrar el cliente');
      }

      console.log(`✅ Cliente ${clientId} migrado exitosamente`);
      
      // Refresh the clients list
      await fetchClients();
      
    } catch (err) {
      console.error('Error migrando cliente:', err);
      setError(err instanceof Error ? err.message : 'Error migrating client');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to migrate all clients without interactions
  const migrateAllClients = async (): Promise<void> => {
    if (!currentOrganization || !currentTenant) {
      throw new Error('No hay organización o tenant disponible para la migración');
    }

    const clientsToMigrate = getClientsWithoutInteractions();
    
    if (clientsToMigrate.length === 0) {
      console.log('📋 No hay clientes que requieran migración');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/client/migrate/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          clientIds: clientsToMigrate.map(c => c.id),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al migrar los clientes');
      }

      console.log(`✅ ${data.migratedCount} clientes migrados exitosamente`);
      
      // Refresh the clients list
      await fetchClients();
      
    } catch (err) {
      console.error('Error migrando clientes:', err);
      setError(err instanceof Error ? err.message : 'Error migrating clients');
      throw err;
    } finally {
      setIsLoading(false);
    }
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