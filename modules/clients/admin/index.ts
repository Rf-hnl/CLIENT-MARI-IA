/**
 * ADMIN SUBMODULE - CLIENTS MODULE
 * 
 * Funcionalidades específicas para administración de clientes
 * Integrado con Firebase y sistema de validación
 */

// Import de tipos específicos para admin
import type { IClient } from '../types/clients';

// Export de tipos específicos para admin
export type { IClient, IClientDocument, IClientFieldConfig } from '../types/clients';

// Export de hooks específicos para admin
export { useClientsAdmin, useClientsStats } from '../hooks/useClients';

// Export de funciones de validación
export { validateClientData } from '../utils/clientValidation';

// Funciones utilitarias para admin actualizadas
export const formatClientStatus = (status: string) => {
  const statusMap = {
    current: 'Al día',
    overdue: 'Vencido', 
    paid: 'Pagado',
    active: 'Activo',
    inactive: 'Inactivo',
    pending: 'Pendiente',
  };
  
  return statusMap[status as keyof typeof statusMap] || status;
};

export const formatRiskCategory = (riskCategory: string) => {
  const riskMap = {
    bajo: 'Bajo',
    medio: 'Medio',
    alto: 'Alto',
    prime: 'Prime',
    'near-prime': 'Near-Prime',
    subprime: 'Subprime',
  };
  
  return riskMap[riskCategory as keyof typeof riskMap] || riskCategory;
};

export const calculateClientMetrics = (clients: IClient[]) => {
  return {
    total: clients.length,
    current: clients.filter(c => c.status === 'current').length,
    overdue: clients.filter(c => c.status === 'overdue').length,
    paid: clients.filter(c => c.status === 'paid').length,
    totalDebt: clients.reduce((sum, c) => sum + c.debt, 0),
    avgDebt: clients.length > 0 ? clients.reduce((sum, c) => sum + c.debt, 0) / clients.length : 0,
    highRisk: clients.filter(c => c.risk_category === 'alto' || c.risk_category === 'subprime').length,
    uniqueTags: [...new Set(clients.flatMap(c => c.tags || []))].length,
  };
};