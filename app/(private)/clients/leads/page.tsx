'use client';

/**
 * GESTIÓN DE LEADS - REFACTORIZADO
 * 
 * Página principal para la gestión integral de leads
 * Ruta: /clients/leads
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Download, 
  RefreshCw, 
  TrendingUp,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

// Imports del sistema de leads
import { LeadsProvider, useLeads as useLeadsContext, type ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { useLeadsStats as useLeadsStatsHook } from '@/modules/leads/hooks/useLeadsStats';
import { BulkImportModal } from '@/components/leads/BulkImportModal';
import { BulkCallModal, BulkCallConfig } from '@/components/leads/BulkCallModal';
import { NewLeadForm } from '@/components/leads/NewLeadForm';
import { TranscriptionViewModal } from '@/components/leads/TranscriptionViewModal';
import { NotificationContainer } from '@/components/ui/notification';
import { useNotification } from '@/hooks/useNotification';
import { LeadActionsModal, ActionData } from '@/components/leads/LeadActionsModal';

// Nuevos componentes refactorizados
import { LeadsTableAdvanced } from '@/components/leads/LeadsTableAdvanced';
import { LeadsAdvancedFilters } from '@/components/leads/LeadsAdvancedFilters';
import { LeadsBulkActions } from '@/components/leads/LeadsBulkActions';
import { useConversationAnalyses } from '@/hooks/useConversationAnalyses';

import { useAuth } from '@/modules/auth';

interface AdvancedFilters {
  minScore: number;
  maxScore: number;
  sentiment: string;
  engagement: string;
  lastContactDays: number;
  selectedStatuses: string[];
  callStatus: 'all' | 'called' | 'not_called';
}

// Componente principal envuelto en el provider
export default function LeadsPage() {
  return (
    <LeadsProvider>
      <GestionDeLeads />
    </LeadsProvider>
  );
}

// Función principal de gestión de leads
function GestionDeLeads() {
  const router = useRouter();
  const { user, currentUser } = useAuth();
  const { showSuccess, showError, showInfo, notifications, removeNotification } = useNotification();

  // Estados del componente principal
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkCallModal, setShowBulkCallModal] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leads-show-advanced-filters');
      return saved === 'true';
    }
    return false;
  });
  const [showPersonalizationPanel, setShowPersonalizationPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCampaignAssignment, setShowCampaignAssignment] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'updated_at',
    direction: 'desc'
  });

  // Estados específicos para funcionalidades avanzadas con persistencia
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leads-advanced-filters');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.warn('Error parsing saved advanced filters:', e);
        }
      }
    }
    return {
      minScore: 0,
      maxScore: 100,
      sentiment: 'all',
      engagement: 'all',
      lastContactDays: 30,
      selectedStatuses: [],
      callStatus: 'all'
    };
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Estados para funciones de llamadas masivas
  const [isProcessingCalls, setIsProcessingCalls] = useState(false);

  // Estado para el tab activo
  const [activeTab, setActiveTab] = useState('all');

  // Hooks del contexto
  const { 
    leads, 
    isLoading, 
    deleteLead,
    updateLead, 
    updateLeadStatus, 
    qualifyLead, 
    convertToClient, 
    assignToAgent, 
    scheduleFollowUp 
  } = useLeadsContext();

  const { stats, loading: statsLoading, error: statsError } = useLeadsStatsHook();

  // Hook personalizado para análisis de conversación
  const { conversationAnalyses, loading: analysesLoading } = useConversationAnalyses(leads);

  // Efecto para guardar filtros avanzados en localStorage
  useEffect(() => {
    localStorage.setItem('leads-advanced-filters', JSON.stringify(advancedFilters));
  }, [advancedFilters]);

  // Efecto para guardar estado de filtros avanzados
  useEffect(() => {
    localStorage.setItem('leads-show-advanced-filters', showAdvancedFilters.toString());
  }, [showAdvancedFilters]);

  // Filtrado y ordenamiento de leads
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];

    // Filtro por tab activo
    if (activeTab !== 'all') {
      filtered = filtered.filter(lead => lead.status === activeTab);
    }

    // Filtro de búsqueda básica
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => 
        (lead.name || '').toLowerCase().includes(query) ||
        (lead.email || '').toLowerCase().includes(query) ||
        (lead.company || '').toLowerCase().includes(query) ||
        (lead.phone || '').toLowerCase().includes(query)
      );
    }

    // Filtros avanzados de IA
    if (showAdvancedFilters) {
      filtered = filtered.filter(lead => {
        // Estado múltiple filter
        if (advancedFilters.selectedStatuses.length > 0) {
          if (!advancedFilters.selectedStatuses.includes(lead.status)) {
            return false;
          }
        }

        // Score range filter
        const leadScore = lead.qualification_score || 0;
        if (leadScore < advancedFilters.minScore || leadScore > advancedFilters.maxScore) {
          return false;
        }

        // Sentiment filter
        if (advancedFilters.sentiment !== 'all') {
          // Implementar lógica de sentiment basado en conversationAnalyses
          const analysis = conversationAnalyses.get(lead.id);
          if (analysis) {
            const sentiment = analysis.sentiment?.overall?.sentiment || 
                           analysis.sentiment?.sentiment || 
                           analysis.overallSentiment || 
                           'neutral';
            if (sentiment.toLowerCase() !== advancedFilters.sentiment) {
              return false;
            }
          } else if (advancedFilters.sentiment !== 'neutral') {
            return false;
          }
        }

        // Call status filter
        if (advancedFilters.callStatus !== 'all') {
          const hasBeenCalled = lead.callLogs && lead.callLogs.length > 0;
          if (advancedFilters.callStatus === 'called' && !hasBeenCalled) {
            return false;
          }
          if (advancedFilters.callStatus === 'not_called' && hasBeenCalled) {
            return false;
          }
        }

        return true;
      });
    }

    return filtered;
  }, [leads, activeTab, searchQuery, showAdvancedFilters, advancedFilters, conversationAnalyses]);

  // Ordenamiento
  const sortedLeads = useMemo(() => {
    const sorted = [...filteredLeads];
    sorted.sort((a, b) => {
      let aValue: unknown = a[sortConfig.field as keyof ExtendedLead];
      let bValue: unknown = b[sortConfig.field as keyof ExtendedLead];

      if (aValue && typeof aValue === 'object' && '_seconds' in aValue) {
        aValue = aValue._seconds;
      }
      if (bValue && typeof bValue === 'object' && '_seconds' in bValue) {
        bValue = bValue._seconds;
      }

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    return sorted;
  }, [filteredLeads, sortConfig]);

  // Paginación
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = useMemo(() => {
    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, startIndex, endIndex]);

  // Handlers
  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = (leadsToSelect: ExtendedLead[]) => {
    // Si ya están todos seleccionados, deseleccionar todos. Si no, seleccionar todos.
    if (selectedLeads.size === leadsToSelect.length) {
      setSelectedLeads(new Set());
    } else {
      const leadIds = leadsToSelect.map(lead => lead.id);
      setSelectedLeads(new Set(leadIds));
    }
  };

  // Función para limpiar selección cuando sea necesario
  const handleClearSelection = () => {
    setSelectedLeads(new Set());
    showInfo(
      'Selección Limpiada',
      'Se han deseleccionado todos los leads'
    );
  };

  const handleDeleteSelected = async () => {
    try {
      const selectedArray = Array.from(selectedLeads);
      await Promise.all(selectedArray.map(id => deleteLead(id)));
      
      setSelectedLeads(new Set());
      setShowDeleteConfirm(false);
      showSuccess(
        'Eliminación Exitosa',
        `${selectedArray.length} leads eliminados correctamente`
      );
    } catch (error) {
      console.error('Error deleting leads:', error);
      showError('Error', 'No se pudieron eliminar algunos leads');
    }
  };

  const handleApplyFilters = () => {
    showSuccess(
      'Filtros IA Aplicados',
      `Filtrando ${filteredLeads.length} leads con criterios inteligentes`
    );
  };

  const handleClearFilters = () => {
    setAdvancedFilters({
      minScore: 0,
      maxScore: 100,
      sentiment: 'all',
      engagement: 'all',
      lastContactDays: 30,
      selectedStatuses: []
    });
    showInfo('Filtros Limpiados', 'Todos los filtros han sido reiniciados');
  };

  const handlePersonalizationComplete = (results: unknown) => {
    showSuccess(
      'Personalización Completa',
      `Se han personalizado ${selectedLeads.size} leads exitosamente`
    );
    setShowPersonalizationPanel(false);
    setSelectedLeads(new Set());
  };

  // Función para manejar llamadas masivas - abre modal de configuración
  const handleBulkCall = async () => {
    if (selectedLeads.size === 0 || isProcessingCalls) return;
    
    // Verificar que todos los leads seleccionados tengan campaña
    const selectedLeadsArray = Array.from(selectedLeads);
    const leadsWithoutCampaign = filteredLeads.filter(lead => 
      selectedLeadsArray.includes(lead.id) && !lead.campaignId
    );
    
    if (leadsWithoutCampaign.length > 0) {
      alert(`❌ No se pueden realizar llamadas a ${leadsWithoutCampaign.length} leads sin campaña asignada:\n\n${leadsWithoutCampaign.map(l => `• ${l.name}`).join('\n')}\n\nPrimero asigna campañas a estos leads.`);
      return;
    }
    
    // Abrir modal de configuración
    setShowBulkCallModal(true);
  };

  // Función para ejecutar las llamadas con la configuración del modal
  const handleConfirmBulkCall = async (config: BulkCallConfig) => {
    try {
      setIsProcessingCalls(true);
      
      showInfo(
        '🚀 Iniciando Llamadas Masivas', 
        `Procesando ${selectedLeads.size} leads seleccionados en modo ${config.mode === 'automatic' ? 'automático' : 'manual'}...`
      );

      // Obtener token del usuario actual
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      const response = await fetch('/api/leads/bulk-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          tenantId: user?.tenantId || 'default-tenant',
          organizationId: user?.organizationId || 'default-org',
          callMode: config.mode,
          callType: config.callType,
          notes: config.notes || 'Llamada masiva generada desde panel de administración'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess(
          '✅ Llamadas Masivas Completadas',
          `${result.successfulCalls}/${result.totalProcessed} llamadas exitosas`
        );
        
        // Mostrar detalles de las llamadas fallidas si las hay
        if (result.failedCalls > 0) {
          interface BulkCallResult {
            success: boolean;
            [key: string]: unknown;
          }
          const failedLeads = result.results.filter((r: BulkCallResult) => !r.success);
          console.log('Llamadas fallidas:', failedLeads);
          showInfo(
            '⚠️ Algunas llamadas fallaron',
            `${result.failedCalls} llamadas no pudieron completarse`
          );
        }

        // Limpiar selección
        setTimeout(() => {
          setSelectedLeads(new Set());
        }, 500);
        
      } else {
        const errorData = await response.json();
        showError('❌ Error en Llamadas Masivas', errorData.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error en llamadas masivas:', error);
      showError('❌ Error en Llamadas Masivas', 'Error de conexión');
    } finally {
      setIsProcessingCalls(false);
    }
  };

  // Función para manejar cambios de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para manejar cambio de items por página
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Stats calculados
  const statsByStatus = useMemo(() => {
    const statusCounts = filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: filteredLeads.length,
      new: statusCounts.new || 0,
      qualified: statusCounts.qualified || 0,
      won: statusCounts.won || 0,
      lost: statusCounts.lost || 0,
      ...statusCounts
    };
  }, [filteredLeads]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-1 sm:p-2">
      <div className="w-full max-w-[99%] mx-auto space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
              Gestión de Leads
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {statsByStatus.total} leads • {statsByStatus.qualified} calificados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" onClick={() => setShowNewLeadForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold">{statsByStatus.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Calificados</p>
                  <p className="text-2xl font-bold">{statsByStatus.qualified}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Ganados</p>
                  <p className="text-2xl font-bold">{statsByStatus.won}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Nuevos</p>
                  <p className="text-2xl font-bold">{statsByStatus.new}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="">
            <div className="">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-start sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre, email, teléfono o empresa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Advanced Filters Toggle */}
                <LeadsAdvancedFilters
                  showAdvancedFilters={showAdvancedFilters}
                  onToggleAdvancedFilters={setShowAdvancedFilters}
                  advancedFilters={advancedFilters}
                  onAdvancedFiltersChange={setAdvancedFilters}
                  filteredLeads={filteredLeads}
                  onApplyFilters={handleApplyFilters}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Bulk Actions - Aparece automáticamente con 2+ leads */}
              <LeadsBulkActions
                selectedLeads={selectedLeads}
                bulkModeActive={false} // Ya no necesario, pero mantenemos por compatibilidad
                onToggleBulkMode={() => {}} // Función vacía, ya no se usa
                showPersonalizationPanel={showPersonalizationPanel}
                onTogglePersonalizationPanel={() => setShowPersonalizationPanel(!showPersonalizationPanel)}
                showDeleteConfirm={showDeleteConfirm}
                onToggleDeleteConfirm={() => setShowDeleteConfirm(!showDeleteConfirm)}
                onDeleteSelected={handleDeleteSelected}
                user={user}
                onPersonalizationComplete={handlePersonalizationComplete}
                onBulkCall={handleBulkCall}
                isProcessingCalls={isProcessingCalls}
                showCampaignAssignment={showCampaignAssignment}
                onToggleCampaignAssignment={() => setShowCampaignAssignment(!showCampaignAssignment)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Filtros por Estado con Tabs */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="space-y-3">
              <div className="w-full">
                <TabsList className="h-10 bg-white dark:bg-black border border-gray-200 dark:border-white w-full grid grid-cols-6 lg:grid-cols-6 xl:grid-cols-12 gap-1 p-1 overflow-x-auto">
                  <TabsTrigger value="all" className="text-xs px-1 sm:px-2 h-8 min-w-0">
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="new" className="text-xs px-1 sm:px-2 h-8 min-w-0">
                    Nuevos
                  </TabsTrigger>
                  <TabsTrigger value="interested" className="text-xs px-1 sm:px-2 h-8 min-w-0">
                    Prioritarios
                  </TabsTrigger>
                  <TabsTrigger value="qualified" className="text-xs px-1 sm:px-2 h-8 min-w-0">
                    Calificados
                  </TabsTrigger>
                  <TabsTrigger value="follow_up" className="text-xs px-1 sm:px-2 h-8 min-w-0">
                    Sin Resp.
                  </TabsTrigger>
                  <TabsTrigger value="proposal_current" className="text-xs px-1 sm:px-2 h-8 min-w-0">
                    Cotizaciones
                  </TabsTrigger>
                  <TabsTrigger value="proposal_previous" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
                    Campañas Ant.
                  </TabsTrigger>
                  <TabsTrigger value="negotiation" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
                    Negociación
                  </TabsTrigger>
                  <TabsTrigger value="nurturing" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
                    En Pausa
                  </TabsTrigger>
                  <TabsTrigger value="won" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
                    Ganados
                  </TabsTrigger>
                  <TabsTrigger value="lost" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
                    Perdidos
                  </TabsTrigger>
                  <TabsTrigger value="cold" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
                    Fríos
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Leads Table */}
        <LeadsTableAdvanced
          leads={leads}
          isLoading={isLoading}
          selectedLeads={selectedLeads}
          onSelectLead={handleSelectLead}
          onSelectAll={handleSelectAll}
          onShowNewLeadForm={() => setShowNewLeadForm(true)}
          sortedLeads={paginatedLeads}
          conversationAnalyses={conversationAnalyses}
          pagination={{
            currentPage,
            totalPages,
            itemsPerPage,
            totalItems: sortedLeads.length,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange
          }}
        />

        {/* Modals */}
        {showBulkImport && (
          <BulkImportModal
            isOpen={showBulkImport}
            onClose={() => setShowBulkImport(false)}
            onImportComplete={() => {
              showSuccess(
                'Importación Exitosa',
                'Leads importados correctamente'
              );
              setShowBulkImport(false);
            }}
          />
        )}

        {showBulkCallModal && (
          <BulkCallModal
            isOpen={showBulkCallModal}
            onClose={() => setShowBulkCallModal(false)}
            selectedLeads={selectedLeads}
            leads={filteredLeads}
            onConfirm={handleConfirmBulkCall}
          />
        )}

        {showNewLeadForm && (
          <NewLeadForm
            isOpen={showNewLeadForm}
            onClose={() => setShowNewLeadForm(false)}
          />
        )}

        {/* Notification Container */}
        <NotificationContainer 
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    </div>
  );
}
