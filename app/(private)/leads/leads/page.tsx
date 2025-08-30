'use client';

/**
 * LEADS ADMINISTRATION PAGE - DISEÑO MINIMALISTA HORIZONTAL
 * 
 * Página principal para la administración de leads con diseño compacto
 * Ruta: /clients/leads
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Upload,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Check,
  X,
  User
} from 'lucide-react';

// Imports del sistema de leads
import { LeadsProvider, useLeads as useLeadsContext, ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { ILeadCallLog } from '@/modules/leads/types/leads';
import { useLeadsStats as useLeadsStatsHook } from '@/modules/leads/hooks/useLeadsStats';
import { BulkImportModal } from '@/components/leads/BulkImportModal';
import { NewLeadForm } from '@/components/leads/NewLeadForm';
import { CallConfirmationModal } from '@/components/leads/CallConfirmationModal';
import { TranscriptionViewModal } from '@/components/leads/TranscriptionViewModal';
import { NotificationContainer } from '@/components/ui/notification';
import { useNotification } from '@/hooks/useNotification';
import { LeadActionsModal, ActionData, ChangeStatusData, QualifyData, ConvertToClientData, AssignAgentData, ScheduleFollowUpData, EditData, ActionType } from '@/components/leads/LeadActionsModal';
import { UnifiedAnalyticsModal } from '@/components/leads/UnifiedAnalyticsModal';
import { useLeads } from '@/modules/leads/hooks/useLeads';

// Import ElevenLabs voice integration
import { useLeadCalls } from '@/modules/leads/hooks/useLeadCalls';
// import { useAgents } from '@/modules/agents/hooks/useAgents'; // Temporalmente deshabilitado - API no existe
import { useAuth } from '@/modules/auth';

// Feature flag hook
import { useFeatureFlag } from '@/lib/feature-flags';


// Mapeo de iconos por nombre
const iconMap = {
  Users,
  Target, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
};

// Componente principal envuelto en el provider
export default function LeadsPage() {
  return (
    <LeadsProvider>
      <LeadsAdministrationMinimal />
    </LeadsProvider>
  );
}

// Componente principal con diseño minimalista y responsivo
function LeadsAdministrationMinimal() {
  const router = useRouter();
  const { user } = useAuth();
  const { leads, isLoading, refetch } = useLeadsContext();
  const { stats, loading: statsLoading, error: statsError } = useLeadsStatsHook();
  const { leads: leadsForStats } = useLeads();
  const isMultiFormatEnabled = useFeatureFlag('IMPORT_CSV_XML_JSON_XLSX');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkCallConfirm, setShowBulkCallConfirm] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showCallConfirmation, setShowCallConfirmation] = useState(false);
  const [callLead, setCallLead] = useState<ExtendedLead | null>(null);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [selectedCallLog, setSelectedCallLog] = useState<ILeadCallLog | null>(null);

  // Notifications
  const { 
    notifications, 
    showSuccess, 
    showError, 
    showInfo, 
    removeNotification 
  } = useNotification();

  // Filtrar leads por búsqueda
  const filteredLeads = React.useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead => 
      (lead.name || '').toLowerCase().includes(query) ||
      (lead.email || '').toLowerCase().includes(query) ||
      (lead.company || '').toLowerCase().includes(query) ||
      (lead.phone || '').toLowerCase().includes(query)
    );
  }, [leads, searchQuery]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top cuando cambia de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Funciones para selección múltiple
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(leadId)) {
        newSelection.delete(leadId);
      } else {
        newSelection.add(leadId);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (leads: ExtendedLead[]) => {
    const leadIds = leads.map(lead => lead.id);
    if (selectedLeads.size === leadIds.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leadIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeads.size === 0) return;
    
    try {
      const response = await fetch('/api/leads/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads)
        }),
      });

      if (response.ok) {
        setSelectedLeads(new Set());
        setShowDeleteConfirm(false);
        refetch(); // Recargar la lista de leads
        alert(`${selectedLeads.size} leads eliminados exitosamente`);
      } else {
        alert('Error al eliminar los leads');
      }
    } catch (error) {
      console.error('Error eliminando leads:', error);
      alert('Error al eliminar los leads');
    }
  };

  const handleBulkCall = () => {
    if (selectedLeads.size === 0) return;
    setShowBulkCallConfirm(true);
  };

  const handleConfirmBulkCall = async () => {
    if (selectedLeads.size === 0) return;
    
    try {
      showInfo(`Iniciando llamadas para ${selectedLeads.size} leads...`);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        showError('No se encontró token de autorización. Por favor, inicie sesión de nuevo.');
        return;
      }

      const response = await fetch('/api/leads/bulk-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          callType: 'prospecting',
          tenantId: user?.tenantId || '',
          organizationId: user?.organizationId || ''
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedLeads(new Set());
        setShowBulkCallConfirm(false);
        showSuccess(`Llamadas iniciadas exitosamente para ${result.totalProcessed} leads`);
        refetch(); // Recargar la lista de leads
      } else {
        const errorData = await response.json();
        showError(`Error al iniciar llamadas: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error iniciando llamadas masivas:', error);
      showError('Error al iniciar las llamadas masivas');
    }
  };

  // Función para manejar llamadas
  const handleCallLead = async (lead: ExtendedLead) => {
    if (!lead) return;
    console.log('Iniciando proceso de llamada para lead:', lead.name || 'Sin nombre');
    setCallLead(lead);
    setShowCallConfirmation(true);
  };

  // Función para manejar cuando se inicia la llamada exitosamente
  const handleCallInitiated = (result: { callLogId: string; elevenLabsBatchId?: string }) => {
    console.log('Llamada iniciada exitosamente:', result);
    
    showSuccess(
      'Llamada Iniciada',
      `Llamada iniciada exitosamente para ${callLead?.name || 'Lead'}. Batch ID: ${result.elevenLabsBatchId || 'N/A'}`
    );

    // Refrescar la lista de leads para actualizar datos
    refetch();
  };

  // Función para cerrar el modal de confirmación de llamada
  const handleCloseCallConfirmation = () => {
    setShowCallConfirmation(false);
    setCallLead(null);
  };

  // Función para confirmar la llamada
  const handleConfirmCall = async (leadId: string, agentId: string, notes?: string) => {
    try {
      // Aquí iría la lógica para iniciar la llamada
      console.log('Iniciando llamada:', { leadId, agentId, notes });
      // Temporal: simular éxito
      handleCallInitiated({ callLogId: 'temp-id', elevenLabsBatchId: 'temp-batch' });
      setShowCallConfirmation(false);
      setCallLead(null);
    } catch (error) {
      console.error('Error al iniciar llamada:', error);
    }
  };

  const handleViewTranscription = (callLog: ILeadCallLog) => {
    console.log('📄 Viewing transcription for call:', callLog.id);
    setSelectedCallLog(callLog);
    setShowTranscriptionModal(true);
  };

  const handleCloseTranscriptionModal = () => {
    setShowTranscriptionModal(false);
    setSelectedCallLog(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="space-y-3 p-3 sm:p-4 lg:p-6 max-w-[100vw] mx-auto">
        {/* Header Compacto y Responsivo */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-black dark:text-white truncate">
                Administración de Leads
              </h1>
              <p className="text-xs sm:text-sm text-black dark:text-white mt-1">
                Gestiona tus prospectos y convierte leads en clientes
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                size="sm" 
                className="h-8 flex-1 sm:flex-none"
                onClick={() => setShowNewLeadForm(true)}
              >
                <Plus className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Nuevo Lead</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 sm:px-3"
                onClick={() => setShowBulkImport(true)}
                title={isMultiFormatEnabled ? 'Importar leads desde CSV, XLSX, JSON, XML' : 'Importar leads desde CSV'}
              >
                <Upload className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">
                  Importar Multi-Formato
                </span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 sm:px-3"
                onClick={() => setShowAnalyticsModal(true)}
                title="Análisis avanzado, personalización masiva y bulk calling"
              >
                <TrendingUp className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">
                  Analytics Pro
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Barra de acciones para selección múltiple */}
        {selectedLeads.size > 0 && (
          <div className="bg-orange-600 dark:bg-orange-700 rounded-lg border border-orange-700 dark:border-orange-600 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-white">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} seleccionado{selectedLeads.size > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 bg-white dark:bg-black text-orange-600 dark:text-orange-400 border-white dark:border-white hover:bg-orange-50 dark:hover:bg-black"
                  onClick={() => setSelectedLeads(new Set())}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setShowAnalyticsModal(true)}
                >
                  <Target className="h-3 w-3 mr-1" />
                  Analizar {selectedLeads.size}
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleBulkCall}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Llamar {selectedLeads.size}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-8"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Búsqueda Principal - Ahora arriba */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white h-4 w-4" />
              <Input
                placeholder="Buscar leads por nombre, email, empresa o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm w-full bg-white dark:bg-black border-gray-200 dark:border-white focus:bg-white dark:focus:bg-black focus:border-orange-500 dark:focus:border-orange-500 text-black dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-10 px-3">
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-3">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros por Estado - Reorganizados */}
        <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-3 sm:p-4">
          <Tabs defaultValue="all" className="w-full">
            <div className="space-y-3">
              {/* Tabs responsivos con scroll horizontal mejorado */}
              <div className="w-full">
                <TabsList className="h-10 bg-white dark:bg-black border border-gray-200 dark:border-white w-full grid grid-cols-6 lg:grid-cols-12 gap-1 p-1">
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
                  <TabsTrigger value="proposal_previous" className="text-xs px-1 sm:px-2 h-8 min-w-0 lg:block hidden">
                    Campañas Ant.
                  </TabsTrigger>
                  <TabsTrigger value="negotiation" className="text-xs px-1 sm:px-2 h-8 min-w-0 lg:block hidden">
                    Negociación
                  </TabsTrigger>
                  <TabsTrigger value="nurturing" className="text-xs px-1 sm:px-2 h-8 min-w-0 lg:block hidden">
                    En Pausa
                  </TabsTrigger>
                  <TabsTrigger value="won" className="text-xs px-1 sm:px-2 h-8 min-w-0 lg:block hidden">
                    Ganados
                  </TabsTrigger>
                  <TabsTrigger value="lost" className="text-xs px-1 sm:px-2 h-8 min-w-0 lg:block hidden">
                    Declinados
                  </TabsTrigger>
                  <TabsTrigger value="cold" className="text-xs px-1 sm:px-2 h-8 min-w-0 lg:block hidden">
                    Descartados
                  </TabsTrigger>
                </TabsList>
                
                {/* Tabs adicionales para móvil en segunda fila */}
                <div className="lg:hidden mt-2">
                  <TabsList className="h-8 bg-white dark:bg-black border border-gray-200 dark:border-white w-full grid grid-cols-6 gap-1 p-1">
                    <TabsTrigger value="proposal_previous" className="text-xs px-1 h-6 min-w-0">
                      Campañas
                    </TabsTrigger>
                    <TabsTrigger value="negotiation" className="text-xs px-1 h-6 min-w-0">
                      Negociación
                    </TabsTrigger>
                    <TabsTrigger value="nurturing" className="text-xs px-1 h-6 min-w-0">
                      Pausa
                    </TabsTrigger>
                    <TabsTrigger value="won" className="text-xs px-1 h-6 min-w-0">
                      Ganados
                    </TabsTrigger>
                    <TabsTrigger value="lost" className="text-xs px-1 h-6 min-w-0">
                      Declinados
                    </TabsTrigger>
                    <TabsTrigger value="cold" className="text-xs px-1 h-6 min-w-0">
                      Descartados
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Contenido de Tabs */}
              <div className="mt-3">
                <TabsContent value="all" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads} 
                    isLoading={isLoading}
                    pagination={{
                      currentPage,
                      totalPages,
                      itemsPerPage,
                      totalItems: filteredLeads.length,
                      onPageChange: handlePageChange,
                      onItemsPerPageChange: setItemsPerPage
                    }}
                    selectedLeads={selectedLeads}
                    onSelectLead={handleSelectLead}
                    onSelectAll={handleSelectAll}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="new" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'new')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="interested" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'interested')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="qualified" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'qualified')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="follow_up" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'follow_up')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="proposal_current" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'proposal_current')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="proposal_previous" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'proposal_previous')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="negotiation" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'negotiation')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="nurturing" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'nurturing')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="won" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'won')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="lost" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'lost')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
                <TabsContent value="cold" className="mt-0">
                  <LeadsTable 
                    leads={paginatedLeads.filter(lead => lead.status === 'cold')} 
                    isLoading={isLoading}
                    showPagination={false}
                    onShowNewLeadForm={() => setShowNewLeadForm(true)}
                  />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Estadísticas con el nuevo componente integrado - Movido abajo */}
        <LeadsStatsCardsIntegrated leads={leadsForStats || []} />
      </div>


      {/* Modal de confirmación de llamada */}
      {callLead && (
        <CallConfirmationModal
          open={showCallConfirmation}
          onClose={handleCloseCallConfirmation}
          lead={callLead}
          onConfirmCall={handleConfirmCall}
        />
      )}

      {/* Modal de visualización de transcripciones */}
      <TranscriptionViewModal
        isOpen={showTranscriptionModal}
        onClose={handleCloseTranscriptionModal}
        callLog={selectedCallLog}
      />

      {/* Modal de importación masiva */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onImportComplete={() => {
          setShowBulkImport(false);
          refetch();
        }}
      />

      {/* Modal de nuevo lead */}
      <NewLeadForm
        isOpen={showNewLeadForm}
        onClose={() => setShowNewLeadForm(false)}
        onLeadCreated={() => {
          setShowNewLeadForm(false);
          refetch();
        }}
      />

      {/* Modal de confirmación de eliminación múltiple */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Confirmar eliminación
                </h3>
                <p className="text-sm text-black dark:text-white">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            
            <p className="text-black dark:text-white mb-6">
              ¿Estás seguro de que deseas eliminar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}? 
              Esta acción eliminará permanentemente los datos de los leads seleccionados.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de llamadas masivas */}
      {showBulkCallConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  Confirmar llamadas masivas
                </h3>
                <p className="text-sm text-black dark:text-white">
                  Se iniciarán llamadas automáticas.
                </p>
              </div>
            </div>
            
            <p className="text-black dark:text-white mb-6">
              ¿Estás seguro de que deseas iniciar llamadas para {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}? 
              Las llamadas se procesarán automáticamente con el agente IA y se enfocarán en las campañas específicas de cada lead.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowBulkCallConfirm(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleConfirmBulkCall}
              >
                <Phone className="h-4 w-4 mr-2" />
                Llamar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Analytics Unificado */}
      <UnifiedAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        selectedLeadIds={Array.from(selectedLeads)}
        tenantId={user?.tenantId || ''}
        organizationId={user?.organizationId || ''}
      />

      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );

  // Función para manejar acciones de leads (movida dentro del componente para acceder al router)
  const handleAction = async (action: string, leadData: ExtendedLead) => {
    console.log(`Acción: ${action}`, leadData);
    
    switch (action) {
      case 'view':
        // Navegar a la página de trabajo del lead
        router.push(`/clients/leads/${leadData.id}/work`);
        break;
      case 'edit':
        // openActionModal('edit'); // Comentado por ahora
        break;
      case 'call':
        // await handleMakeCall(leadData); // Comentado por ahora
        break;
      default:
        console.log(`Acción no reconocida: ${action}`);
    }
  };
}

// Tipos para el ordenamiento
type SortField = 'name' | 'company' | 'email' | 'status' | 'qualification_score' | 'updated_at';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

// Interfaz para la paginación
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

// Tabla de leads responsiva y compacta
function LeadsTable({ 
  leads, 
  isLoading, 
  pagination, 
  showPagination = true,
  selectedLeads = new Set(),
  onSelectLead,
  onSelectAll,
  onShowNewLeadForm,
  onShowLeadDetails
}: { 
  leads: ExtendedLead[], 
  isLoading: boolean,
  pagination?: PaginationProps,
  showPagination?: boolean,
  selectedLeads?: Set<string>,
  onSelectLead?: (leadId: string) => void,
  onSelectAll?: (leads: ExtendedLead[]) => void,
  onShowNewLeadForm?: () => void,
  onShowLeadDetails?: (lead: ExtendedLead) => void
}) {
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    field: null,
    direction: 'asc'
  });

  // Función para manejar el cambio de ordenamiento
  const handleSort = (field: SortField) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  // Función para obtener el icono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-3 w-3 text-black dark:text-white" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-orange-500" />
      : <ArrowDown className="h-3 w-3 text-orange-500" />;
  };

  // Función para ordenar los leads
  const sortedLeads = React.useMemo(() => {
    if (!sortConfig.field) return leads;

    return [...leads].sort((a, b) => {
      let aValue = a[sortConfig.field!];
      let bValue = b[sortConfig.field!];

      // Manejar casos especiales
      switch (sortConfig.field) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'company':
          aValue = (a.company || '').toLowerCase();
          bValue = (b.company || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'qualification_score':
          aValue = a.qualification_score || 0;
          bValue = b.qualification_score || 0;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || 0).getTime();
          bValue = new Date(b.updated_at || 0).getTime();
          break;
        default:
          break;
      }

      // Ensure values are defined
      const finalAValue = aValue ?? '';
      const finalBValue = bValue ?? '';

      if (finalAValue < finalBValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (finalAValue > finalBValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [leads, sortConfig]);
  if (isLoading) {
    return (
      <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black overflow-hidden relative">
        {/* Skeleton para vista desktop */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white dark:bg-black border-b border-gray-200 dark:border-white">
                <tr>
                  <th className="text-left p-3 w-12 text-black dark:text-white">#</th>
                  <th className="text-left p-3 text-black dark:text-white">Lead</th>
                  <th className="text-left p-3 text-black dark:text-white">Contacto</th>
                  <th className="text-left p-3 text-black dark:text-white">Campaña</th>
                  <th className="text-left p-3 text-black dark:text-white">Estado</th>
                  <th className="text-left p-3 text-black dark:text-white">Puntuación</th>
                  <th className="text-left p-3 text-black dark:text-white">Última Actividad</th>
                  <th className="text-left p-3 text-black dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(pagination?.itemsPerPage || 10)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-white">
                    <td className="p-3">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-3">
                      <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skeleton para vista móvil */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {[...Array(pagination?.itemsPerPage || 10)].map((_, index) => (
              <div key={index} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 w-10 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading indicator centralizado */}
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white dark:bg-black px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-white">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            <span className="text-sm text-black dark:text-white">Cargando leads...</span>
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black">
        <div className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto text-black dark:text-white mb-3" />
          <p className="text-sm text-black dark:text-white mb-3">No hay leads para mostrar</p>
          <Button size="sm" onClick={onShowNewLeadForm}>
            <Plus className="h-3 w-3 mr-1" />
            Crear primer lead
          </Button>
        </div>
      </div>
    );
  }

  // Helper function to get status badge variant and text
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'new': { variant: 'secondary', label: 'Nuevo' },
      'interested': { variant: 'default', label: 'Prioritario' },
      'qualified': { variant: 'default', label: 'Calificado' },
      'follow_up': { variant: 'outline', label: 'Sin Respuesta' },
      'proposal_current': { variant: 'default', label: 'Cotización Actual' },
      'proposal_previous': { variant: 'outline', label: 'Campañas Anteriores' },
      'negotiation': { variant: 'default', label: 'Negociación' },
      'nurturing': { variant: 'outline', label: 'En Pausa' },
      'won': { variant: 'default', label: 'Ganado' },
      'lost': { variant: 'destructive', label: 'Declinado' },
      'cold': { variant: 'secondary', label: 'Descartado' }
    };
    return statusMap[status] || { variant: 'secondary', label: status };
  };

  // Helper function to format date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black overflow-hidden">
      {/* Vista Desktop */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white dark:bg-black border-b border-gray-200 dark:border-white">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white w-12">
                  {onSelectAll && (
                    <Checkbox
                      checked={selectedLeads.size > 0 && selectedLeads.size === leads.length}
                      onCheckedChange={() => onSelectAll(leads)}
                      indeterminate={selectedLeads.size > 0 && selectedLeads.size < leads.length}
                    />
                  )}
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white w-12">#</th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Lead
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
                  <button 
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Contacto
                    {getSortIcon('email')}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
                  Campaña
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
                  <button 
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Estado
                    {getSortIcon('status')}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
                  <button 
                    onClick={() => handleSort('qualification_score')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Puntuación
                    {getSortIcon('qualification_score')}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
                  <button 
                    onClick={() => handleSort('updated_at')}
                    className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                  >
                    Última Actividad
                    {getSortIcon('updated_at')}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead, index) => {
                const statusDisplay = getStatusDisplay(lead.status);
                return (
                  <tr key={lead.id} className="border-b border-gray-200 dark:border-white hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-black">
                    <td className="p-3">
                      {onSelectLead && (
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => onSelectLead(lead.id)}
                        />
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-xs font-mono text-gray-500">
                        {index + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm font-medium text-black dark:text-white">
                          {lead.name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-black dark:text-white">
                          {lead.company ? `${lead.company}` : 'Sin empresa'}
                          {lead.position ? ` • ${lead.position}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        {lead.email && (
                          <p className="text-xs text-black dark:text-white">{lead.email}</p>
                        )}
                        {lead.phone && (
                          <p className="text-xs text-black dark:text-white">{lead.phone}</p>
                        )}
                        {!lead.email && !lead.phone && (
                          <p className="text-xs text-black dark:text-white">Sin contacto</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {(lead as any).campaign ? (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {(lead as any).campaign.name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                          Sin campaña
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={statusDisplay.variant} className="text-xs">
                        {statusDisplay.label}
                      </Badge>
                      {lead.is_qualified && (
                        <Badge variant="outline" className="text-xs ml-1">
                          ✓
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-black dark:text-white">
                          {lead.qualification_score || 0}/100
                        </div>
                        {lead.ai_score && (
                          <div className="text-xs text-orange-600 dark:text-orange-400">
                            IA: {lead.ai_score}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="text-xs text-black dark:text-white">
                        {formatDate(lead.updated_at)}
                      </p>
                      {lead.next_follow_up_date && (
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Próximo: {formatDate(lead.next_follow_up_date)}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <LeadActionsDropdown lead={lead} onShowLeadDetails={onShowLeadDetails} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Mobile/Tablet */}
      <div className="lg:hidden">
        {/* Controles de ordenamiento para móvil */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-white">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {sortedLeads.length} lead{sortedLeads.length !== 1 ? 's' : ''}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-black dark:text-white">Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => handleSort('name')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Nombre</span>
                  {sortConfig.field === 'name' && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp className="h-3 w-3" />
                      : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleSort('company')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Empresa</span>
                  {sortConfig.field === 'company' && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp className="h-3 w-3" />
                      : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleSort('status')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Estado</span>
                  {sortConfig.field === 'status' && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp className="h-3 w-3" />
                      : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleSort('qualification_score')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Puntuación</span>
                  {sortConfig.field === 'qualification_score' && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp className="h-3 w-3" />
                      : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => handleSort('updated_at')}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Última actividad</span>
                  {sortConfig.field === 'updated_at' && (
                    sortConfig.direction === 'asc' 
                      ? <ArrowUp className="h-3 w-3" />
                      : <ArrowDown className="h-3 w-3" />
                  )}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedLeads.map((lead, index) => {
            const statusDisplay = getStatusDisplay(lead.status);
            return (
              <div key={lead.id} className="p-4 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-black">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {onSelectLead && (
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => onSelectLead(lead.id)}
                        />
                      )}
                      <span className="text-xs font-mono text-black dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-white px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-black dark:text-white truncate">
                      {lead.name || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-black dark:text-white mt-1">
                      {lead.company ? `${lead.company}` : 'Sin empresa'}
                      {lead.position ? ` • ${lead.position}` : ''}
                    </p>
                  </div>
                  <LeadActionsDropdown lead={lead} onShowLeadDetails={onShowLeadDetails} />
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs text-black dark:text-white mb-1">Contacto</p>
                    {lead.email && (
                      <p className="text-xs text-black dark:text-white">{lead.email}</p>
                    )}
                    {lead.phone && (
                      <p className="text-xs text-black dark:text-white">{lead.phone}</p>
                    )}
                    {!lead.email && !lead.phone && (
                      <p className="text-xs text-black dark:text-white">Sin contacto</p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-xs text-black dark:text-white mb-1">Estado</p>
                    <div className="flex items-center gap-1">
                      <Badge variant={statusDisplay.variant} className="text-xs">
                        {statusDisplay.label}
                      </Badge>
                      {lead.is_qualified && (
                        <Badge variant="outline" className="text-xs">✓</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <p className="text-xs text-black dark:text-white">Puntuación</p>
                    <p className="text-sm font-medium text-black dark:text-white">
                      {lead.qualification_score || 0}/100
                      {lead.ai_score && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                          IA: {lead.ai_score}
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-black dark:text-white">Actividad</p>
                    <p className="text-xs text-black dark:text-white">
                      {formatDate(lead.updated_at)}
                    </p>
                    {lead.next_follow_up_date && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Próximo: {formatDate(lead.next_follow_up_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paginación */}
      {showPagination && pagination && pagination.totalPages > 1 && (
        <PaginationControls pagination={pagination} />
      )}
    </div>
  );
}

// Componente de controles de paginación
function PaginationControls({ pagination }: { pagination: PaginationProps }) {
  const { currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange } = pagination;

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 dark:border-white bg-white dark:bg-black">
      {/* Info de elementos */}
      <div className="flex items-center gap-4 text-sm text-black dark:text-white">
        <span>
          Mostrando {startItem}-{endItem} de {totalItems} leads
        </span>
        
        {/* Selector de elementos por página */}
        <div className="flex items-center gap-2">
          <span>Mostrar:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 dark:border-white rounded px-2 py-1 text-sm bg-white dark:bg-black text-black dark:text-white"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Controles de navegación */}
      <div className="flex items-center gap-1">
        {/* Primera página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-3 w-3" />
        </Button>

        {/* Página anterior */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        {/* Números de página */}
        {generatePageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 py-1 text-black dark:text-white dark:text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        {/* Página siguiente */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>

        {/* Última página */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Componente de estadísticas integrado en el mismo archivo
interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  tooltip?: string;
}

interface LeadsStatsCardsIntegratedProps {
  leads: ExtendedLead[];
  onCardClick?: (cardId: string, value: number | string) => void;
  className?: string;
}

function LeadsStatsCardsIntegrated({
  leads,
  onCardClick,
  className = ''
}: LeadsStatsCardsIntegratedProps) {
  // Calcular estadísticas por estado basado en los datos reales
  const statsByStatus = React.useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        total: 0,
        new: 0,
        interested: 0,
        qualified: 0,
        follow_up: 0,
        proposal_current: 0,
        proposal_previous: 0,
        negotiation: 0,
        nurturing: 0,
        won: 0,
        lost: 0,
        cold: 0,
        cotizaciones: 0,
        descartados: 0
      };
    }

    const statusCounts = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      interested: leads.filter(l => l.status === 'interested' || (l.status as any) === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      follow_up: leads.filter(l => l.status === 'follow_up').length,
      proposal_current: leads.filter(l => l.status === 'proposal_current').length,
      proposal_previous: leads.filter(l => l.status === 'proposal_previous').length,
      negotiation: leads.filter(l => l.status === 'negotiation').length,
      nurturing: leads.filter(l => l.status === 'nurturing').length,
      won: leads.filter(l => l.status === 'won').length,
      lost: leads.filter(l => l.status === 'lost').length,
      cold: leads.filter(l => l.status === 'cold').length,
    };
    
    return {
      ...statusCounts,
      cotizaciones: statusCounts.proposal_current + statusCounts.proposal_previous + statusCounts.negotiation,
      descartados: statusCounts.cold + statusCounts.lost,
    };
  }, [leads]);

  // Calcular tendencias (simuladas por ahora)
  const getTrend = (id: string) => {
    const trends: Record<string, { value: number; isPositive: boolean; label: string }> = {
      total: { value: 12.5, isPositive: true, label: "vs mes anterior" },
      new: { value: 8.3, isPositive: true, label: "esta semana" },
      interested: { value: 15.2, isPositive: true, label: "vs promedio" },
      qualified: { value: 3.1, isPositive: false, label: "vs meta" },
      follow_up: { value: 5.7, isPositive: false, label: "pendientes" },
      cotizaciones: { value: 22.1, isPositive: true, label: "en proceso" },
      won: { value: 18.4, isPositive: true, label: "vs objetivo" },
      descartados: { value: 4.2, isPositive: false, label: "tasa descarte" }
    };
    return trends[id];
  };

  // Cards por defecto basadas en las estadísticas reales
  const defaultCards: StatCard[] = [
    {
      id: 'total',
      label: 'Total Leads',
      value: statsByStatus.total.toLocaleString(),
      icon: Users,
      trend: getTrend('total'),
      tooltip: 'Total de leads en el sistema'
    },
    {
      id: 'new',
      label: 'Nuevos',
      value: statsByStatus.new,
      icon: Plus,
      trend: getTrend('new'),
      tooltip: 'Leads recién ingresados'
    },
    {
      id: 'interested',
      label: 'Potenciales',
      value: statsByStatus.interested,
      icon: TrendingUp,
      trend: getTrend('interested'),
      tooltip: 'Leads con interés confirmado'
    },
    {
      id: 'qualified',
      label: 'Calificados',
      value: statsByStatus.qualified,
      icon: Target,
      trend: getTrend('qualified'),
      tooltip: 'Leads que cumplen criterios'
    },
    {
      id: 'follow_up',
      label: 'Seguimiento',
      value: statsByStatus.follow_up,
      icon: Clock,
      trend: getTrend('follow_up'),
      tooltip: 'Leads pendientes de contacto'
    },
    {
      id: 'cotizaciones',
      label: 'Cotizaciones',
      value: statsByStatus.cotizaciones,
      icon: Download,
      trend: getTrend('cotizaciones'),
      tooltip: 'Leads en proceso de cotización'
    },
    {
      id: 'won',
      label: 'Ganados',
      value: statsByStatus.won,
      icon: CheckCircle,
      trend: getTrend('won'),
      tooltip: 'Leads convertidos exitosamente'
    },
    {
      id: 'descartados',
      label: 'Descartados',
      value: statsByStatus.descartados,
      icon: AlertCircle,
      trend: getTrend('descartados'),
      tooltip: 'Leads no viables o perdidos'
    }
  ];

  const handleCardClick = (card: StatCard) => {
    if (onCardClick) {
      onCardClick(card.id, card.value);
    }
  };

  return (
    <div className={`max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto ${className}`}>
      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {defaultCards.map((card) => {
          const trend = card.trend;
          
          return (
            <div
              key={card.id}
              className={`
                flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-white shadow-2xs rounded-xl 
                transition-all duration-200
                ${onCardClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
              `}
              onClick={() => handleCardClick(card)}
            >
              <div className="p-4 md:p-5 flex gap-x-4">
                <div className="shrink-0 flex justify-center items-center size-11 bg-white dark:bg-black border border-gray-200 dark:border-white rounded-lg">
                  <card.icon className="shrink-0 size-5 text-black dark:text-white" />
                </div>

                <div className="grow">
                  <div className="flex items-center gap-x-2">
                    <p className="text-xs uppercase text-black dark:text-white">
                      {card.label}
                    </p>
                    {card.tooltip && (
                      <div className="hs-tooltip">
                        <div className="hs-tooltip-toggle">
                          <AlertCircle className="shrink-0 size-4 text-black dark:text-white" />
                          <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-black dark:bg-white text-xs font-medium text-white dark:text-black rounded-md shadow-2xs" role="tooltip">
                            {card.tooltip}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-x-2">
                    <h3 className="text-xl sm:text-2xl font-medium text-black dark:text-white">
                      {card.value}
                    </h3>
                    {trend && (
                      <span className={`
                        inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-xs font-medium
                        ${trend.isPositive 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300'
                        }
                      `}>
                        {trend.isPositive ? (
                          <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                            <polyline points="16 7 22 7 22 13"/>
                          </svg>
                        ) : (
                          <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
                            <polyline points="16 17 22 17 22 11"/>
                          </svg>
                        )}
                        <span className="inline-block text-xs font-medium">
                          {trend.value}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* End Grid */}
    </div>
  );
}

// Componente para el menú de acciones de cada lead
interface LeadActionsDropdownProps {
  lead: ExtendedLead;
  onShowLeadDetails?: (lead: ExtendedLead) => void;
}

function LeadActionsDropdown({ lead, onShowLeadDetails }: { lead: ExtendedLead, onShowLeadDetails?: (lead: ExtendedLead) => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const { initiateCall, loading: callLoading } = useLeadCalls();
  const { deleteLead, updateLead, updateLeadStatus, qualifyLead, convertToClient, assignToAgent, scheduleFollowUp } = useLeadsContext();
  
  // Estado para el modal de acciones
  const [actionsModalOpen, setActionsModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<'changeStatus' | 'qualify' | 'convertToClient' | 'assignAgent' | 'scheduleFollowUp' | 'edit' | null>(null);
  
  // Temporalmente deshabilitado hasta que se implemente la API correcta
  const agents: any[] = [];
  const activeAgents: any[] = [];
  const agentsLoading = false;

  // Handle voice call with ElevenLabs
  const handleMakeCall = async (leadData: ExtendedLead) => {
    try {
      // Validate lead has phone number
      if (!leadData.phone || leadData.phone === 'Sin teléfono') {
        alert('Este lead no tiene un número de teléfono válido.');
        return;
      }

      console.log('📞 Iniciando llamada a:', leadData.name, '-', leadData.phone);

      // Use the initiateCall function from useLeadCalls
      // For now, we'll use a default agent ID - this should be selected via the CallConfirmationModal
      const result = await initiateCall(
        leadData.id,
        'default-agent', // This should come from agent selection
        'prospecting', // Call type based on lead status
        `Llamada manual iniciada desde la tabla de leads para ${leadData.name}`
      );
      
      alert(`Llamada iniciada exitosamente. ID de llamada: ${result.callLogId}`);
      console.log('✅ Llamada iniciada:', result);
      
    } catch (error) {
      console.error('❌ Error al hacer la llamada:', error);
      alert(`Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Función para abrir el modal de acciones
  const openActionModal = (actionType: typeof currentAction) => {
    setCurrentAction(actionType);
    setActionsModalOpen(true);
  };

  // Función para manejar el envío del modal de acciones
  const handleActionSubmit = async (actionType: ActionType, data: ActionData) => {
    try {
      switch (actionType) {
        case 'changeStatus':
          const { status, notes } = data as ChangeStatusData;
          await updateLeadStatus(lead.id, status, notes);
          alert(`Estado actualizado a: ${status}`);
          break;
        case 'qualify':
          const { isQualified, score, notes: qualifyNotes } = data as QualifyData;
          await qualifyLead(lead.id, isQualified, score, qualifyNotes);
          alert(`Lead ${isQualified ? 'calificado' : 'descalificado'} exitosamente`);
          break;
        case 'convertToClient':
          const { notes: convertNotes, createClient } = data as ConvertToClientData;
          await convertToClient(lead.id, { notes: convertNotes, createClient });
          alert('Lead convertido a cliente exitosamente');
          break;
        case 'assignAgent':
          const { agentId, agentName } = data as AssignAgentData;
          await assignToAgent(lead.id, agentId, agentName);
          alert(`Agente ${agentName} asignado exitosamente`);
          break;
        case 'scheduleFollowUp':
          const { followUpDate, notes: followUpNotes } = data as ScheduleFollowUpData;
          const followUpDateObj = new Date(followUpDate);
          await scheduleFollowUp(lead.id, followUpDateObj, followUpNotes);
          alert('Seguimiento programado exitosamente');
          break;
        case 'edit':
          const updates = data as EditData;
          const leadUpdates: Partial<ExtendedLead> = {};
          Object.keys(updates).forEach(key => {
            if (updates[key as keyof EditData] !== lead[key as keyof ExtendedLead] && updates[key as keyof EditData] !== '') {
              (leadUpdates[key as keyof ExtendedLead] as any) = updates[key as keyof EditData];
            }
          });

          if (Object.keys(leadUpdates).length > 0) {
            await updateLead(lead.id, leadUpdates);
            alert('Lead actualizado exitosamente');
          }
          break;
      }
    } catch (error) {
      console.error('Error en acción:', error);
      alert('Error al ejecutar la acción');
    }
  };


  return (
    <>
    <Button 
      variant="outline" 
      size="sm" 
      className="h-8 px-3 text-xs border-gray-300 dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 hover:text-black"
      onClick={() => router.push(`/clients/leads/${lead.id}/work`)}
    >
      Trabajar
    </Button>
    
    {/* Modal de Acciones */}
    <LeadActionsModal
      isOpen={actionsModalOpen}
      onClose={() => {
        setActionsModalOpen(false);
        setCurrentAction(null);
      }}
      lead={lead}
      actionType={currentAction}
      onSubmit={handleActionSubmit}
    />
  </>
  );
}
