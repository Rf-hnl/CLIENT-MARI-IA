/**
 * TYPES - CLIENTS MODULE
 * 
 * Definiciones de tipos para el módulo de clientes
 * Preparado para integración con Firebase
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientBilling {
  id: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientsContextType {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  // Admin functions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  // Billing functions
  addBilling: (billing: Omit<ClientBilling, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBilling: (id: string, updates: Partial<ClientBilling>) => Promise<void>;
  getBillingByClient: (clientId: string) => ClientBilling[];
}