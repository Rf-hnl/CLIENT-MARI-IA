/**
 * ADMIN SUBMODULE - CLIENTS MODULE
 * 
 * Funcionalidades específicas para administración de clientes
 * Preparado para integración con Firebase
 */

// Export de tipos específicos para admin
export type { Client } from '../types/clients';

// Export de hooks específicos para admin
export { useClientsAdmin } from '../hooks/useClients';

// Export de componentes específicos para admin (cuando se implementen)
// export { ClientForm } from '../components/ClientForm';
// export { ClientList } from '../components/ClientList';

// Funciones utilitarias para admin
export const validateClientData = (data: any) => {
  // TODO: Implementar validación con Zod
  const required = ['name', 'email'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};

export const formatClientStatus = (status: string) => {
  const statusMap = {
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
  };
  
  return statusMap[status as keyof typeof statusMap] || status;
};