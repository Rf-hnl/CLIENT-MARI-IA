'use client';

/**
 * CONTEXT - LEADS MODULE
 * 
 * Context para gestión global del estado de leads (prospectos)
 * Preparado para integración con Firebase
 * Estructura: /tenants/{tenantId}/organizations/{organizationId}/leads
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ILead, ILeadInteractions, LeadStatus, LeadSource, LeadPriority, ILeadStats, ILeadFilters, ILeadSearchParams } from '../types/leads';
import { useAuth } from '@/contexts/AuthContext';

// Extended lead type with interactions
export type ExtendedLead = ILead & {
  leadInteractions?: ILeadInteractions;
};

interface UserContext {
  id: string;
}

interface ConvertToClientData {
  value?: number;
  createClient?: boolean;
  clientData?: Record<string, unknown>;
  notes?: string;
}

interface LeadsContextType {
  // Data state
  leads: ExtendedLead[];
  isLoading: boolean;
  error: string | null;
  currentOrganization: UserContext | null;
  currentTenant: UserContext | null;
  
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
  convertToClient: (id: string, clientData?: ConvertToClientData) => Promise<{
    lead: ExtendedLead;
    clientId?: string;
  }>;
  assignToAgent: (id: string, agentId: string, agentName: string) => Promise<void>;
  scheduleFollowUp: (id: string, followUpDate: Date, notes?: string) => Promise<void>;
  
  // Interaction methods
  getLeadInteractions: (leadId: string) => ILeadInteractions | undefined;
  addInteraction: (leadId: string, interactionType: 'call' | 'email' | 'whatsapp' | 'meeting', interactionData: Record<string, unknown>) => Promise<void>;
  
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
  const { user: currentUser } = useAuth();
  const [leads, setLeads] = useState<ExtendedLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ILeadStats | null>(null);
  const [searchParams, setSearchParams] = useState<ILeadSearchParams>({});

  // Get organization and tenant from authenticated user (memoized to prevent infinite loops)
  const currentOrganization = useMemo(() => 
    currentUser ? { id: currentUser.organizationId } : null, 
    [currentUser?.organizationId]
  );
  
  const currentTenant = useMemo(() => 
    currentUser ? { id: currentUser.tenantId } : null, 
    [currentUser?.tenantId]
  );

  // Función para cargar leads desde base de datos
  const fetchLeads = async () => {
    if (!currentUser) {
      console.log('❌ [LEADS] No current user found');
      setLeads([]);
      setStats(null);
      setIsLoading(false);
      return;
    }

    console.log('👤 [LEADS] Current user:', {
      id: currentUser.id,
      email: currentUser.email,
      tenantId: currentUser.tenantId,
      organizationId: currentUser.organizationId
    });

    if (!currentOrganization || !currentTenant) {
      console.log('⏳ [LEADS] Waiting for user context to load...');
      console.log('🏢 Current organization:', currentOrganization);
      console.log('🏘️ Current tenant:', currentTenant);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [LEADS] Loading leads with real context:', {
        organization: currentOrganization?.id,
        tenant: currentTenant?.id,
        hasOrganization: !!currentOrganization,
        hasTenant: !!currentTenant
      });

      // Use real tenant and organization data
      const finalTenant = currentTenant;
      const finalOrganization = currentOrganization;

      console.log('🎯 Valores finales para la consulta:', {
        tenantId: finalTenant.id,
        organizationId: finalOrganization.id
      });

      // Llamar al API para obtener leads
      const requestBody = {
        tenantId: finalTenant.id,
        organizationId: finalOrganization.id,
      };
      
      console.log('📡 API Request URL:', '/api/leads/get');
      console.log('📡 API Request body:', requestBody);
      
      const response = await fetch('/api/leads/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('📡 API Response status:', response.status, response.statusText);
      console.log('📡 API Response URL:', response.url);

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
      // console.log(`📈 Se cargaron ${leadsArray.length} leads desde ${data.path}`);
   
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
        totalConversionValue += Number(lead.conversion_value || 0);
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
    const sortBy = searchParams.sortBy || 'updatedAt';
    const sortOrder = searchParams.sortOrder || 'desc';
    
    filtered.sort((a, b) => {
      let aValue: unknown = a[sortBy as keyof ExtendedLead];
      let bValue: unknown = b[sortBy as keyof ExtendedLead];
      
      // Handle Date objects and strings
      if (aValue instanceof Date) {
        aValue = aValue.getTime();
      } else if (typeof aValue === 'string') {
        aValue = new Date(aValue).getTime();
      }
      if (bValue instanceof Date) {
        bValue = bValue.getTime();
      } else if (typeof bValue === 'string') {
        bValue = new Date(bValue).getTime();
      }
      
      if (sortOrder === 'asc') {
        return (aValue as number|string) < (bValue as number|string) ? -1 : (aValue as number|string) > (bValue as number|string) ? 1 : 0;
      } else {
        return (aValue as number|string) > (bValue as number|string) ? -1 : (aValue as number|string) < (bValue as number|string) ? 1 : 0;
      }
    });

    return filtered;
  }, [leads, searchParams]);

  // Cargar leads cuando cambie el usuario
  useEffect(() => {
    fetchLeads();
  }, [currentUser, currentTenant, currentOrganization]);

  // Core CRUD operations
  const addLead = async (leadData: Omit<ILead, 'id' | 'created_at' | 'updated_at' | 'contact_attempts' | 'response_rate' | 'qualification_score' | 'is_qualified' | 'converted_to_client' | 'priority'>) => {
    if (!currentTenant || !currentOrganization) {
      throw new Error('No hay organización o tenant disponible para crear el lead');
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leads/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
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
    setIsLoading(true);
    setError(null);
    try {
      // Solo soportamos actualización de campaña por este endpoint
      if ('campaignId' in updates) {
        const response = await fetch('/api/leads/internal', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: id,
            campaignId: updates.campaignId || null,
          }),
        });
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Error desconocido al actualizar la campaña del lead');
        }
        console.log(`✅ Campaña asignada al lead: ${id}`);
        await fetchLeads();
      } else {
        // ...existing code for otros updates...
        throw new Error('Solo se soporta actualización de campaña por este endpoint');
      }
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
          uid: currentUser.id,
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
          uid: currentUser.id,
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
        interface BulkDeleteResultItem { success: boolean; leadId: string; }
        const successfullyDeletedIds = (result.results as BulkDeleteResultItem[])
          .filter((r) => r.success)
          .map((r) => r.leadId);
        
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
      ...(notes && { qualificationNotes: notes })
    });
  };

  const convertToClient = async (id: string, clientData?: ConvertToClientData) => {
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
      assigned_agent_name: agentName
    });
  };

  const scheduleFollowUp = async (id: string, followUpDate: Date, notes?: string) => {
    await updateLead(id, {
      next_follow_up_date: followUpDate.toISOString(),
      status: 'follow_up',
      ...(notes && { notes })
    });
  };

  // Interaction methods
  const getLeadInteractions = (leadId: string): ILeadInteractions | undefined => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.leadInteractions;
  };

  const addInteraction = async (leadId: string, interactionType: 'call' | 'email' | 'whatsapp' | 'meeting', interactionData: Record<string, unknown>) => {
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
          uid: currentUser.id,
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
          uid: currentUser.id,
          organizationId: currentOrganization.id,
          tenantId: currentTenant.id,
          leadIds,
          updates: { 
            assignedAgentId: agentId,
            assignedAgentName: agentName
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
    const now = new Date();
    return leads.filter(lead => 
      lead.next_follow_up_date && 
      new Date(lead.next_follow_up_date) <= now &&
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