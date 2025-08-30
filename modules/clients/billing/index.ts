/**
 * BILLING SUBMODULE - CLIENTS MODULE
 * 
 * Funcionalidades específicas para facturación de clientes
 * Preparado para integración con Firebase
 */

// Export de tipos específicos para billing
export type { ClientBilling } from '../types/clients';

// Export de hooks específicos para billing
export { useClientsBilling } from '../hooks/useClients';

// Export de componentes específicos para billing (cuando se implementen)
// export { BillingForm } from '../components/BillingForm';
// export { InvoiceList } from '../components/InvoiceList';

// Funciones utilitarias para billing
export const calculateTotal = (amount: number, tax: number = 0) => {
  return amount + (amount * tax / 100);
};

export const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const getInvoiceStatus = (status: string) => {
  const statusMap = {
    paid: { label: 'Pagada', color: 'green' },
    pending: { label: 'Pendiente', color: 'yellow' },
    overdue: { label: 'Vencida', color: 'red' },
    cancelled: { label: 'Cancelada', color: 'gray' },
  };
  
  return statusMap[status as keyof typeof statusMap] || { label: status, color: 'gray' };
};

export const isOverdue = (dueDate: Date) => {
  return new Date() > dueDate;
};