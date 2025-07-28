/**
 * HOOKS - CLIENTS MODULE
 * 
 * Custom hooks para funcionalidades específicas de clientes
 * Preparado para integración con Firebase
 */

import { useClients as useClientsContext } from '../context/ClientsContext';

// Re-export del hook principal del context
export { useClients } from '../context/ClientsContext';

// Hook específico para administración de clientes
export function useClientsAdmin() {
  const { addClient, updateClient, deleteClient, isLoading, error } = useClientsContext();
  
  return {
    addClient,
    updateClient,
    deleteClient,
    isLoading,
    error,
  };
}

// Hook específico para facturación de clientes
export function useClientsBilling() {
  const { addBilling, updateBilling, getBillingByClient, isLoading, error } = useClientsContext();
  
  return {
    addBilling,
    updateBilling,
    getBillingByClient,
    isLoading,
    error,
  };
}

// Hook para estadísticas de clientes (preparado para Firebase)
export function useClientsStats() {
  const { clients } = useClientsContext();
  
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    pending: clients.filter(c => c.status === 'pending').length,
  };
  
  return stats;
}