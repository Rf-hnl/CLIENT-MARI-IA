/**
 * LEADS COMPONENTS - INDEX
 * 
 * Exportaciones centralizadas de todos los componentes de leads
 */

// Componentes principales
export { LeadsView } from './LeadsView';
export { LeadsPipeline } from './LeadsPipeline';
export { LeadsTable } from './LeadsTable';
export { LeadsStatsCards } from './LeadsStatsCards';

// Componente de demostración
export { LeadsDemo } from './LeadsDemo';

// Re-exportar tipos útiles para componentes externos
export type { ExtendedLead } from '@/modules/leads/context/LeadsContext';
export type { LeadStatus, LeadPriority, LeadSource } from '@/modules/leads/types/leads';
export type { StatCard, LeadsStatsCardsProps } from './LeadsStatsCards';