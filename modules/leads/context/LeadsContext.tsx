'use client';

/**
 * CONTEXT - LEADS MODULE
 * 
 * Context para gestión global del estado de leads (prospectos)
 * Preparado para integración con Firebase
 * Estructura: /tenants/{tenantId}/organizations/{organizationId}/leads
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ILead, ILeadInteractions, LeadStatus, LeadSource, LeadPriority, ILeadStats, ILeadFilters, ILeadSearchParams } from '../types/leads';
import { getCurrentUserData, getCurrentOrganization, getCurrentTenant } from '@/lib/auth/userState';
import { useAuth } from '@/modules/auth';

// Extended lead type with interactions
export type ExtendedLead = ILead & {
  leadInteractions?: ILeadInteractions;
};

interface LeadsContextType {
  // Data state
  leads: ExtendedLead[];
  isLoading: boolean;
  error: string | null;
  currentOrganization: any;
  currentTenant: any;
  
  // Statistics
  stats: ILeadStats | null;
  
  // Search and filtering
  searchParams: ILeadSearchParams;
  setSearchParams: (params: ILeadSearchParams) => void;
  filteredLeads: ExtendedLead[];
  
  // Core operations
  refetch: () => Promise<void>;
  addLead: (leadData: Omit<ILead, 'id' | 'created_at' | 'updated_at' | 'contact_attempts' | 'response_rate' | 'qualification_score' | 'is_qualified' | 'converted_to_client' | 'priority'>) => Promise<void>;
  updateLead: (id: string, updates: Partial<ILead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  bulkDeleteLeads: (leadIds: string[]) => Promise<void>;
  
  // Lead-specific operations
  updateLeadStatus: (id: string, status: LeadStatus, notes?: string) => Promise<void>;
  qualifyLead: (id: string, isQualified: boolean, score: number, notes?: string) => Promise<void>;
  convertToClient: (id: string, clientData?: any) => Promise<void>;
  assignToAgent: (id: string, agentId: string, agentName: string) => Promise<void>;
  scheduleFollowUp: (id: string, followUpDate: Date, notes?: string) => Promise<void>;
  
  // Interaction methods
  getLeadInteractions: (leadId: string) => ILeadInteractions | undefined;
  addInteraction: (leadId: string, interactionType: 'call' | 'email' | 'whatsapp' | 'meeting', interactionData: any) => Promise<void>;
  
  // Bulk operations
  bulkUpdateStatus: (leadIds: string[], status: LeadStatus) => Promise<void>;
  bulkAssignAgent: (leadIds: string[], agentId: string, agentName: string) => Promise<void>;
  
  // Analytics and reporting
  getLeadsByStatus: (status: LeadStatus) => ExtendedLead[];
  getLeadsBySource: (source: LeadSource) => ExtendedLead[];
  getLeadsByPriority: (priority: LeadPriority) => ExtendedLead[];
  getConversionRate: () => number;
  getLeadsNeedingFollowUp: () => ExtendedLead[];
}

const LeadsContext = createContext<LeadsContextType | undefined>(undefined);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState<ExtendedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [stats, setStats] = useState<ILeadStats | null>(null);
  const [searchParams, setSearchParams] = useState<ILeadSearchParams>({});

  // Función para cargar leads desde Firebase
  const fetchLeads = async () => {
    if (!currentUser) {
      setLeads([]);
      setCurrentOrganization(null);
      setCurrentTenant(null);
      setStats(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Obtener datos del usuario y contexto organizacional
      const [userData, organization, tenant] = await Promise.all([
        getCurrentUserData(currentUser),
        getCurrentOrganization(currentUser),
        getCurrentTenant(currentUser)
      ]);

      console.log('🔍 Valores obtenidos:', {
        organization: organization?.id,
        tenant: tenant?.id,
        hasOrganization: !!organization,
        hasTenant: !!tenant
      });

      // TEMPORAL: Usar valores hardcodeados si no se obtienen correctamente
      const finalTenant = tenant || { id: 'demo-tenant-001' };
      const finalOrganization = organization || { id: 'LvbFBJ82S5c8U9w8g6h5' };

      console.log('🎯 Valores finales para la consulta:', {
        tenantId: finalTenant.id,
        organizationId: finalOrganization.id
      });

      setCurrentOrganization(finalOrganization);
      setCurrentTenant(finalTenant);

      // Llamar al API para obtener leads
      const response = await fetch('/api/leads/admin/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: finalTenant.id,
          organizationId: finalOrganization.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al obtener leads');
      }

      // Convertir el objeto de leads a array
      const leadsArray: ExtendedLead[] = Object.values(data.data || {});
      setLeads(leadsArray);

      // Debug: mostrar leads cargados
      console.log(`📈 Se cargaron ${leadsArray.length} leads desde ${data.path}`);
      leadsArray.forEach(lead => {
        console.log(`🔍 Lead cargado: ${lead.name} - Status: ${lead.status} - ID: ${lead.id}`);
      });

      // Calcular estadísticas
      const calculatedStats = calculateStats(leadsArray);
      setStats(calculatedStats);
      
    } catch (err) {
      console.error('Error obteniendo leads:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLeads([]);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular estadísticas de leads
  const calculateStats = (leadsArray: ExtendedLead[]): ILeadStats => {
    const total = leadsArray.length;
    const byStatus: Record<LeadStatus, number> = {
      new: 0, interested: 0, qualified: 0, follow_up: 0, proposal_current: 0,
      proposal_previous: 0, negotiation: 0, nurturing: 0, won: 0, lost: 0, cold: 0
    };
    const bySource: Record<LeadSource, number> = {
      website: 0, social_media: 0, referral: 0, cold_call: 0,
      advertisement: 0, email: 0, event: 0, whatsapp: 0, other: 0
    };
    const byPriority: Record<LeadPriority, number> = {
      low: 0, medium: 0, high: 0, urgent: 0
    };

    let totalConversionValue = 0;
    let convertedCount = 0;

    leadsArray.forEach(lead => {
      byStatus[lead.status]++;
      bySource[lead.source]++;
      byPriority[lead.priority]++;
      
      if (lead.converted_to_client) {
        convertedCount++;
        totalConversionValue += lead.conversion_value || 0;
      }
    });

    const conversionRate = total > 0 ? (convertedCount / total) * 100 : 0;

    return {
      total,
      byStatus,
      bySource,
      byPriority,
      conversionRate,
      averageTimeToConversion: 0, // TODO: Calculate based on actual data
      totalConversionValue
    };
  };

  // Filtrar leads basado en parámetros de búsqueda
  const filteredLeads = React.useMemo(() => {
    let filtered = [...leads];

    // Filtrar por query de texto
    if (searchParams.query?.trim()) {
      const query = searchParams.query.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.company?.toLowerCase().includes(query)
      );
    }

    // Aplicar filtros
    if (searchParams.filters) {
      const { filters } = searchParams;
      
      if (filters.status?.length) {
        filtered = filtered.filter(lead => filters.status!.includes(lead.status));
      }
      
      if (filters.source?.length) {
        filtered = filtered.filter(lead => filters.source!.includes(lead.source));
      }
      
      if (filters.priority?.length) {
        filtered = filtered.filter(lead => filters.priority!.includes(lead.priority));
      }
      
      if (filters.assignedAgent?.length) {
        filtered = filtered.filter(lead => 
          lead.assigned_agent_id && filters.assignedAgent!.includes(lead.assigned_agent_id)
        );
      }
      
      if (filters.interestLevel?.length) {
        filtered = filtered.filter(lead => 
          lead.interest_level && filters.interestLevel!.includes(lead.interest_level)
        );
      }
      
      if (filters.isQualified !== undefined) {
        filtered = filtered.filter(lead => lead.is_qualified === filters.isQualified);
      }
      
      if (filters.convertedToClient !== undefined) {
        filtered = filtered.filter(lead => lead.converted_to_client === filters.convertedToClient);
      }
    }

    // Ordenar
    const sortBy = searchParams.sortBy || 'updated_at';
    const sortOrder = searchParams.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof ILead];
      let bValue: any = b[sortBy as keyof ILead];
      
      // Handle Firebase timestamps
      if (aValue && typeof aValue === 'object' && '_seconds' in aValue) {
        aValue = aValue._seconds;
      }
      if (bValue && typeof bValue === 'object' && '_seconds' in bValue) {
        bValue = bValue._seconds;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [leads, searchParams]);

  // Cargar leads cuando cambie el usuario
  useEffect(() => {
    fetchLeads();
  }, [currentUser]);

  // Core CRUD operations
  const addLead = async (leadData: Omit<ILead, 'id' | 'created_at' | 'updated_at' | 'contact_attempts' | 'response_rate' | 'qualification_score' | 'is_qualified' | 'converted_to_client' | 'priority'>) => {
    // Usar valores de fallback si no están disponibles
    const finalTenant = currentTenant || { id: 'demo-tenant-001' };
    const finalOrganization = currentOrganization || { id: 'LvbFBJ82S5c8U9w8g6h5' };

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: finalTenant.id,
          organizationId: finalOrganization.id,
          leadData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al crear el lead');
      }

      console.log(`✅ Lead creado exitosamente: ${data.data.name}`);
      await fetchLeads();
      
    } catch (err) {
      console.error('Error creando lead:', err);
      setError(err instanceof Error ? err.message : 'Error creating lead');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLead = async (id: string, updates: Partial<ILead>) => {
    if (!currentOrganization || !currentTenant) {
      throw new Error('No hay organización o tenant disponible para actualizar el lead');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/admin/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          leadId: id,
          updates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al actualizar el lead');
      }

      console.log(`✅ Lead actualizado: ${data.data.name}`);
      await fetchLeads();
      
    } catch (err) {
      console.error('Error actualizando lead:', err);
      setError(err instanceof Error ? err.message : 'Error updating lead');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    if (!currentUser || !currentOrganization || !currentTenant) {
      throw new Error('Usuario, organización o tenant no disponible');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/leads/admin/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          organizationId: currentOrganization.id,
          tenantId: currentTenant.id,
          leadId: id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Lead deleted successfully:', result);

      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
      
    } catch (err) {
      console.error('Error deleting lead:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando lead';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkDeleteLeads = async (leadIds: string[]) => {
    if (!currentUser || !currentOrganization || !currentTenant) {
      throw new Error('Usuario, organización o tenant no disponible');
    }

    if (leadIds.length === 0) {
      throw new Error('No se proporcionaron IDs de leads para eliminar');
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/leads/admin/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          organizationId: currentOrganization.id,
          tenantId: currentTenant.id,
          leadIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Bulk delete completed:', result);

      if (result.results) {
        const successfullyDeletedIds = result.results
          .filter((r: any) => r.success)
          .map((r: any) => r.leadId);
        
        setLeads(prevLeads => 
          prevLeads.filter(lead => !successfullyDeletedIds.includes(lead.id))
        );
      }
      
    } catch (err) {
      console.error('Error in bulk delete:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error en eliminación masiva';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Lead-specific operations
  const updateLeadStatus = async (id: string, status: LeadStatus, notes?: string) => {
    if (!currentOrganization || !currentTenant) {
      throw new Error('No hay organización o tenant disponible');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/status/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          leadId: id,
          status,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al actualizar status');
      }

      console.log(`🔄 Status actualizado: ${data.statusChange.from} → ${data.statusChange.to}`);
      
      // Actualizar estado local inmediatamente para mejor UX
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === id ? { ...lead, ...data.data } : lead
        )
      );
      
    } catch (err) {
      console.error('Error actualizando status:', err);
      setError(err instanceof Error ? err.message : 'Error updating status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const qualifyLead = async (id: string, isQualified: boolean, score: number, notes?: string) => {
    await updateLead(id, {
      is_qualified: isQualified,
      qualification_score: score,
      ...(notes && { qualification_notes: notes }),
      updated_at: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }
    });
  };

  const convertToClient = async (id: string, clientData?: any) => {
    if (!currentOrganization || !currentTenant) {
      throw new Error('No hay organización o tenant disponible');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          leadId: id,
          conversionValue: clientData?.value || null,
          createClientRecord: clientData?.createClient || false,
          clientData: clientData?.clientData || {},
          notes: clientData?.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al convertir lead');
      }

      console.log(`🎉 Lead convertido: ${data.data.lead.name} -> Cliente ${data.data.clientId || 'sin registro'}`);
      
      // Actualizar estado local
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === id ? { ...lead, ...data.data.lead } : lead
        )
      );
      
      return data.data;
      
    } catch (err) {
      console.error('Error convirtiendo lead:', err);
      setError(err instanceof Error ? err.message : 'Error converting lead');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const assignToAgent = async (id: string, agentId: string, agentName: string) => {
    await updateLead(id, {
      assigned_agent_id: agentId,
      assigned_agent_name: agentName,
      updated_at: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }
    });
  };

  const scheduleFollowUp = async (id: string, followUpDate: Date, notes?: string) => {
    await updateLead(id, {
      next_follow_up_date: { 
        _seconds: Math.floor(followUpDate.getTime() / 1000), 
        _nanoseconds: 0 
      },
      status: 'follow_up',
      ...(notes && { notes }),
      updated_at: { _seconds: Math.floor(Date.now() / 1000), _nanoseconds: 0 }
    });
  };

  // Interaction methods
  const getLeadInteractions = (leadId: string): ILeadInteractions | undefined => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.leadInteractions;
  };

  const addInteraction = async (leadId: string, interactionType: 'call' | 'email' | 'whatsapp' | 'meeting', interactionData: any) => {
    // TODO: Implement interaction addition
    console.log('Adding interaction:', leadId, interactionType, interactionData);
  };

  // Bulk operations
  const bulkUpdateStatus = async (leadIds: string[], status: LeadStatus) => {
    if (!currentUser || !currentOrganization || !currentTenant) {
      throw new Error('Usuario, organización o tenant no disponible');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/admin/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          organizationId: currentOrganization.id,
          tenantId: currentTenant.id,
          leadIds,
          updates: { status }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Bulk status update: ${data.summary.successful} exitosos`);
      
      await fetchLeads(); // Refrescar datos
      
    } catch (err) {
      console.error('Error en bulk update:', err);
      setError(err instanceof Error ? err.message : 'Error in bulk update');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const bulkAssignAgent = async (leadIds: string[], agentId: string, agentName: string) => {
    if (!currentUser || !currentOrganization || !currentTenant) {
      throw new Error('Usuario, organización o tenant no disponible');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/admin/bulk-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          organizationId: currentOrganization.id,
          tenantId: currentTenant.id,
          leadIds,
          updates: { 
            assigned_agent_id: agentId,
            assigned_agent_name: agentName
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Bulk agent assignment: ${data.summary.successful} exitosos`);
      
      await fetchLeads(); // Refrescar datos
      
    } catch (err) {
      console.error('Error en bulk assign:', err);
      setError(err instanceof Error ? err.message : 'Error in bulk assign');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Analytics and reporting
  const getLeadsByStatus = (status: LeadStatus): ExtendedLead[] => {
    return leads.filter(lead => lead.status === status);
  };

  const getLeadsBySource = (source: LeadSource): ExtendedLead[] => {
    return leads.filter(lead => lead.source === source);
  };

  const getLeadsByPriority = (priority: LeadPriority): ExtendedLead[] => {
    return leads.filter(lead => lead.priority === priority);
  };

  const getConversionRate = (): number => {
    const total = leads.length;
    const converted = leads.filter(lead => lead.converted_to_client).length;
    return total > 0 ? (converted / total) * 100 : 0;
  };

  const getLeadsNeedingFollowUp = (): ExtendedLead[] => {
    const now = Date.now() / 1000;
    return leads.filter(lead => 
      lead.next_follow_up_date && 
      lead.next_follow_up_date._seconds <= now &&
      !lead.converted_to_client
    );
  };

  const value: LeadsContextType = {
    // Data state
    leads,
    isLoading,
    error,
    currentOrganization,
    currentTenant,
    
    // Statistics
    stats,
    
    // Search and filtering
    searchParams,
    setSearchParams,
    filteredLeads,
    
    // Core operations
    refetch: fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    bulkDeleteLeads,
    
    // Lead-specific operations
    updateLeadStatus,
    qualifyLead,
    convertToClient,
    assignToAgent,
    scheduleFollowUp,
    
    // Interaction methods
    getLeadInteractions,
    addInteraction,
    
    // Bulk operations
    bulkUpdateStatus,
    bulkAssignAgent,
    
    // Analytics and reporting
    getLeadsByStatus,
    getLeadsBySource,
    getLeadsByPriority,
    getConversionRate,
    getLeadsNeedingFollowUp,
  };

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads() {
  const context = useContext(LeadsContext);
  if (context === undefined) {
    throw new Error('useLeads must be used within a LeadsProvider');
  }
  return context;
}