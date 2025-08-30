/**
 * CLIENTS MODULE - MAIN EXPORT
 * 
 * Punto de entrada principal para el módulo de clientes
 * Siguiendo la estructura modular del sistema
 */

// Context y Provider principal
export { ClientsProvider, useClients } from './context/ClientsContext';

// Hooks
export { useClientsAdmin, useClientsBilling, useClientsStats } from './hooks/useClients';

// Componentes principales
export { ProtectedClientRoute } from './components/ProtectedClientRoute';

// Tipos principales
export type { Client, ClientBilling, ClientsContextType } from './types/clients';

// Submódulos
export * as Admin from './admin';
export * as Billing from './billing';