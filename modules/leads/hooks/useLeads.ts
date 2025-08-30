/**
 * HOOKS - LEADS MODULE
 * 
 * Custom hooks para funcionalidades específicas de leads
 * Preparado para integración con Firebase
 */

import { useLeads as useLeadsContext } from '../context/LeadsContext';
import { LeadStatus, LeadSource, LeadPriority } from '../types/leads';

// Re-export del hook principal del context
export { useLeads } from '../context/LeadsContext';

// Hook específico para administración de leads
export function useLeadsAdmin() {
  const { 
    addLead, 
    updateLead, 
    deleteLead, 
    bulkDeleteLeads,
    bulkUpdateStatus, 
    bulkAssignAgent,
    isLoading, 
    error 
  } = useLeadsContext();
  
  return {
    addLead,
    updateLead,
    deleteLead,
    bulkDeleteLeads,
    bulkUpdateStatus,
    bulkAssignAgent,
    isLoading,
    error,
  };
}

// Hook específico para gestión de estado de leads
export function useLeadStatus() {
  const { 
    updateLeadStatus,
    qualifyLead,
    convertToClient,
    getLeadsByStatus,
    isLoading,
    error 
  } = useLeadsContext();
  
  return {
    updateLeadStatus,
    qualifyLead,
    convertToClient,
    getLeadsByStatus,
    isLoading,
    error,
  };
}

// Hook para asignación de agentes
export function useLeadAssignment() {
  const { 
    assignToAgent,
    scheduleFollowUp,
    bulkAssignAgent,
    getLeadsNeedingFollowUp,
    isLoading,
    error 
  } = useLeadsContext();
  
  return {
    assignToAgent,
    scheduleFollowUp,
    bulkAssignAgent,
    getLeadsNeedingFollowUp,
    isLoading,
    error,
  };
}

// Hook para interacciones con leads
export function useLeadInteractions() {
  const { 
    getLeadInteractions,
    addInteraction,
    isLoading,
    error 
  } = useLeadsContext();
  
  return {
    getLeadInteractions,
    addInteraction,
    isLoading,
    error,
  };
}

// Hook para estadísticas de leads
export function useLeadsStats() {
  const { 
    leads, 
    stats,
    getLeadsByStatus,
    getLeadsBySource,
    getLeadsByPriority,
    getConversionRate,
    getLeadsNeedingFollowUp 
  } = useLeadsContext();
  
  // Estadísticas calculadas en tiempo real
  const realtimeStats = {
    total: leads.length,
    newLeads: getLeadsByStatus('new').length,
    contactedLeads: getLeadsByStatus('contacted').length,
    qualifiedLeads: getLeadsByStatus('qualified').length,
    convertedLeads: getLeadsByStatus('won').length,
    lostLeads: getLeadsByStatus('lost').length,
    followUpNeeded: getLeadsNeedingFollowUp().length,
    conversionRate: getConversionRate(),
    
    // Por prioridad
    highPriority: getLeadsByPriority('high').length,
    urgentPriority: getLeadsByPriority('urgent').length,
    
    // Por fuente
    websiteLeads: getLeadsBySource('website').length,
    socialMediaLeads: getLeadsBySource('social_media').length,
    referralLeads: getLeadsBySource('referral').length,
    coldCallLeads: getLeadsBySource('cold_call').length,
  };
  
  return {
    stats, // Estadísticas del contexto (calculadas al cargar)
    realtimeStats, // Estadísticas en tiempo real
    leads,
    getLeadsByStatus,
    getLeadsBySource,
    getLeadsByPriority,
    getConversionRate,
    getLeadsNeedingFollowUp,
  };
}

// Hook para búsqueda y filtrado de leads
export function useLeadSearch() {
  const { 
    searchParams,
    setSearchParams,
    filteredLeads,
    leads 
  } = useLeadsContext();
  
  // Función helper para aplicar filtros rápidos
  const applyQuickFilter = (filterType: 'status' | 'source' | 'priority', value: string) => {
    const currentFilters = searchParams.filters || {};
    const newFilters = {
      ...currentFilters,
      [filterType]: [value]
    };
    
    setSearchParams({
      ...searchParams,
      filters: newFilters
    });
  };
  
  // Función para limpiar filtros
  const clearFilters = () => {
    setSearchParams({
      ...searchParams,
      filters: undefined,
      query: undefined
    });
  };
  
  // Función para búsqueda por texto
  const searchByText = (query: string) => {
    setSearchParams({
      ...searchParams,
      query: query.trim() || undefined
    });
  };
  
  // Función para ordenamiento
  const sortBy = (field: 'created_at' | 'updated_at' | 'last_contact_date' | 'qualification_score' | 'name', order: 'asc' | 'desc' = 'desc') => {
    setSearchParams({
      ...searchParams,
      sortBy: field,
      sortOrder: order
    });
  };
  
  return {
    searchParams,
    setSearchParams,
    filteredLeads,
    totalLeads: leads.length,
    filteredCount: filteredLeads.length,
    
    // Helper functions
    applyQuickFilter,
    clearFilters,
    searchByText,
    sortBy,
    
    // Quick filter checks
    hasActiveFilters: !!(searchParams.filters || searchParams.query),
  };
}

// Hook para navegación de leads (paginación)
export function useLeadNavigation() {
  const { searchParams, setSearchParams, filteredLeads } = useLeadsContext();
  
  const page = searchParams.page || 1;
  const limit = searchParams.limit || 25;
  const totalItems = filteredLeads.length;
  const totalPages = Math.ceil(totalItems / limit);
  
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
  
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setSearchParams({
        ...searchParams,
        page: newPage
      });
    }
  };
  
  const setPageSize = (newLimit: number) => {
    setSearchParams({
      ...searchParams,
      limit: newLimit,
      page: 1 // Reset to first page when changing page size
    });
  };
  
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages);
  
  return {
    // Current page data
    paginatedLeads,
    page,
    limit,
    totalItems,
    totalPages,
    startIndex: startIndex + 1, // 1-based for display
    endIndex,
    
    // Navigation functions
    goToPage,
    setPageSize,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    
    // State checks
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}

// Hook para conversión de leads a clientes
export function useLeadConversion() {
  const { convertToClient, isLoading, error } = useLeadsContext();
  
  const convertLead = async (leadId: string, conversionData?: {
    clientId?: string;
    value?: number;
    notes?: string;
  }) => {
    try {
      await convertToClient(leadId, conversionData);
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error en conversión' 
      };
    }
  };
  
  return {
    convertLead,
    isLoading,
    error,
  };
}

// Hook para leads que necesitan atención
export function useLeadsAlerts() {
  const { 
    getLeadsNeedingFollowUp,
    getLeadsByStatus,
    getLeadsByPriority 
  } = useLeadsContext();
  
  const followUpNeeded = getLeadsNeedingFollowUp();
  const coldLeads = getLeadsByStatus('cold');
  const urgentLeads = getLeadsByPriority('urgent');
  const newLeads = getLeadsByStatus('new');
  
  // Leads que llevan mucho tiempo sin contacto
  const staleLeads = followUpNeeded.filter(lead => {
    if (!lead.last_contact_date) return false;
    const daysSinceContact = (Date.now() / 1000 - lead.last_contact_date._seconds) / (24 * 60 * 60);
    return daysSinceContact > 7; // Más de 7 días sin contacto
  });
  
  const totalAlerts = followUpNeeded.length + urgentLeads.length + newLeads.length;
  
  return {
    followUpNeeded,
    coldLeads,
    urgentLeads,
    newLeads,
    staleLeads,
    totalAlerts,
    
    // Helper methods
    hasAlerts: totalAlerts > 0,
    getAlertsByType: () => ({
      followUp: followUpNeeded.length,
      urgent: urgentLeads.length,
      new: newLeads.length,
      stale: staleLeads.length,
    })
  };
}