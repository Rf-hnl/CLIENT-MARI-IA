'use client';

/**
 * CONTEXT - CLIENTS MODULE
 * 
 * Context para gestión global del estado de clientes
 * Preparado para integración con Firebase
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, ClientBilling, ClientsContextType } from '../types/clients';

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Implementar conexión con Firebase
  useEffect(() => {
    // Aquí se conectará con Firebase para cargar clientes
    console.log('ClientsProvider: Ready for Firebase integration');
  }, []);

  // Admin functions - Preparadas para Firebase
  const addClient = async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implementar con Firebase
      console.log('Adding client:', clientData);
      // Simulación temporal
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setClients(prev => [...prev, newClient]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding client');
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implementar con Firebase
      console.log('Updating client:', id, updates);
      setClients(prev => prev.map(client => 
        client.id === id ? { ...client, ...updates, updatedAt: new Date() } : client
      ));
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
      // TODO: Implementar con Firebase
      console.log('Deleting client:', id);
      setClients(prev => prev.filter(client => client.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting client');
    } finally {
      setIsLoading(false);
    }
  };

  // Billing functions - Preparadas para Firebase
  const addBilling = async (billingData: Omit<ClientBilling, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implementar con Firebase
      console.log('Adding billing:', billingData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding billing');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBilling = async (id: string, updates: Partial<ClientBilling>) => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implementar con Firebase
      console.log('Updating billing:', id, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating billing');
    } finally {
      setIsLoading(false);
    }
  };

  const getBillingByClient = (clientId: string): ClientBilling[] => {
    // TODO: Implementar con Firebase
    console.log('Getting billing for client:', clientId);
    return [];
  };

  const value: ClientsContextType = {
    clients,
    isLoading,
    error,
    addClient,
    updateClient,
    deleteClient,
    addBilling,
    updateBilling,
    getBillingByClient,
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