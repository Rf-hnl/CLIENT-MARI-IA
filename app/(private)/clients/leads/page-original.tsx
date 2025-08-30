// 'use client';

// /**
//  * GESTIÓN DE LEADS - DISEÑO MINIMALISTA HORIZONTAL
//  * 
//  * Página principal para la gestión integral de leads con diseño compacto
//  * Ruta: /clients/leads
//  */

// import React, { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Checkbox } from '@/components/ui/checkbox';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { 
//   Search, 
//   Plus, 
//   Download, 
//   RefreshCw, 
//   TrendingUp,
//   Users,
//   Target,
//   Clock,
//   CheckCircle,
//   AlertCircle,
//   Upload,
//   Edit,
//   Trash2,
//   Eye,
//   Phone,
//   PhoneOff,
//   Mail,
//   MessageCircle,
//   ArrowUpDown,
//   ArrowUp,
//   ArrowDown,
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
//   Loader2,
//   Check,
//   X,
//   User,
//   Filter
// } from 'lucide-react';

// // Imports del sistema de leads
// import { LeadsProvider, useLeads as useLeadsContext, type ExtendedLead } from '@/modules/leads/context/LeadsContext';
// import { ILeadCallLog } from '@/modules/leads/types/leads';
// import { useLeadsStats as useLeadsStatsHook } from '@/modules/leads/hooks/useLeadsStats';
// import { BulkImportModal } from '@/components/leads/BulkImportModal';
// import { NewLeadForm } from '@/components/leads/NewLeadForm';

// // 🚀 NUEVAS FUNCIONALIDADES AVANZADAS
// import { EnhancedLeadsFilters } from '@/components/leads/EnhancedLeadsFilters';
// import { BulkPersonalizationPanel } from '@/components/personalization/BulkPersonalizationPanel';
// import { QualifiedLeadDetector } from '@/lib/services/qualifiedLeadDetector';
// // NOTE: AgentSelectionModal removed as part of agent system deprecation
// import { TranscriptionViewModal } from '@/components/leads/TranscriptionViewModal';
// import { NotificationContainer } from '@/components/ui/notification';
// import { useNotification } from '@/hooks/useNotification';
// import { LeadActionsModal, ActionData, ChangeStatusData, QualifyData, ConvertToClientData, AssignAgentData, ScheduleFollowUpData, EditData, ActionType } from '@/components/leads/LeadActionsModal';
// import { useLeadsStats } from '@/modules/leads/hooks/useLeads';

// // NOTE: Voice/Agent hooks removed as part of agent system deprecation
// import { useAuth } from '@/modules/auth';

// // Feature flag hook
// import { useFeatureFlag } from '@/lib/feature-flags';


// // Mapeo de iconos por nombre
// const iconMap = {
//   Users,
//   Target, 
//   TrendingUp,
//   CheckCircle,
//   Clock,
//   AlertCircle
// };

// // Componente principal envuelto en el provider
// export default function LeadsPage() {
//   return (
//     <LeadsProvider>
//       <GestionDeLeads />
//     </LeadsProvider>
//   );
// }

// // Componente principal con diseño minimalista y responsivo
// function GestionDeLeads() {
//   const router = useRouter();
//   const { leads, isLoading, refetch } = useLeadsContext();
//   const { stats, loading: statsLoading, error: statsError } = useLeadsStatsHook();
//   const { leads: leadsForStats } = useLeadsStats();
//   const { user } = useAuth();
//   const isMultiFormatEnabled = useFeatureFlag('IMPORT_CSV_XML_JSON_XLSX');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showBulkImport, setShowBulkImport] = useState(false);
//   const [showNewLeadForm, setShowNewLeadForm] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(25);
//   const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [showAgentSelection, setShowAgentSelection] = useState(false);
//   const [callLead, setCallLead] = useState<ExtendedLead | null>(null);
//   const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
//   const [selectedCallLog, setSelectedCallLog] = useState<ILeadCallLog | null>(null);
  
//   // 🚀 Estados para funcionalidades avanzadas
//   const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
//   const [showPersonalizationPanel, setShowPersonalizationPanel] = useState(false);
//   const [bulkModeActive, setBulkModeActive] = useState(false);
//   const [advancedFilters, setAdvancedFilters] = useState({
//     minScore: 0,
//     maxScore: 100,
//     sentiment: 'all',
//     engagement: 'all',
//     lastContactDays: 30,
//     selectedStatuses: [] as string[]
//   });

//   // Notifications
//   const { 
//     notifications, 
//     showSuccess, 
//     showError, 
//     showInfo, 
//     removeNotification 
//   } = useNotification();

//   // Activar/desactivar modo masivo automáticamente
//   React.useEffect(() => {
//     if (selectedLeads.size > 1) {
//       if (!bulkModeActive) {
//         setBulkModeActive(true);
//         showSuccess(
//           'Acciones Masivas IA Activadas',
//           'Ahora puedes seleccionar múltiples leads y aplicar acciones inteligentes'
//         );
//       }
//     } else {
//       if (bulkModeActive) {
//         setBulkModeActive(false);
//         showInfo(
//           'Acciones Masivas Desactivadas',
//           'Selecciona más de un lead para activar las acciones masivas'
//         );
//       }
//     }
//   }, [selectedLeads, bulkModeActive, showSuccess, showInfo]);


//   // 🚀 Filtrar leads por búsqueda y filtros avanzados
//   const filteredLeads = React.useMemo(() => {
//     let filtered = leads;

//     // Filtro de búsqueda básica
//     if (searchQuery.trim()) {
//       const query = searchQuery.toLowerCase();
//       filtered = filtered.filter(lead => 
//         (lead.name || '').toLowerCase().includes(query) ||
//         (lead.email || '').toLowerCase().includes(query) ||
//         (lead.company || '').toLowerCase().includes(query) ||
//         (lead.phone || '').toLowerCase().includes(query)
//       );
//     }

//     // 🧠 Filtros avanzados de IA
//     if (showAdvancedFilters) {
//       filtered = filtered.filter(lead => {
//         // Estado múltiple filter
//         if (advancedFilters.selectedStatuses.length > 0) {
//           if (!advancedFilters.selectedStatuses.includes(lead.status)) {
//             return false;
//           }
//         }

//         // Score range filter
//         const leadScore = lead.qualification_score || 0;
//         if (leadScore < advancedFilters.minScore || leadScore > advancedFilters.maxScore) {
//           return false;
//         }

//         // 📊 Sentiment filter (usando datos reales de análisis)
//         if (advancedFilters.sentiment !== 'all') {
//           const realSentiment = 0; // lastSentimentScore no está definido en el tipo
//           let sentimentCategory = 'neutral';
          
//           if (realSentiment >= 0.3) sentimentCategory = 'positive';
//           else if (realSentiment <= -0.3) sentimentCategory = 'negative';
          
//           if (sentimentCategory !== advancedFilters.sentiment) {
//             return false;
//           }
//         }

//         // 🚀 Engagement filter (usando datos reales de engagement)  
//         if (advancedFilters.engagement !== 'all') {
//           const realEngagement = lead.qualification_score || 0;
//           let engagementCategory = 'medium';
          
//           if (realEngagement >= 70) engagementCategory = 'high';
//           else if (realEngagement <= 30) engagementCategory = 'low';
          
//           if (engagementCategory !== advancedFilters.engagement) {
//             return false;
//           }
//         }

//         // Last contact filter
//         if (advancedFilters.lastContactDays > 0 && lead.updated_at) {
//           const daysSinceUpdate = (Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24);
//           if (daysSinceUpdate > advancedFilters.lastContactDays) {
//             return false;
//           }
//         }

//         return true;
//       });
//     }

//     return filtered;
//   }, [leads, searchQuery, bulkModeActive, advancedFilters]);

//   // Calcular paginación
//   const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

//   // Resetear página cuando cambia la búsqueda
//   React.useEffect(() => {
//     setCurrentPage(1);
//   }, [searchQuery]);

//   const handlePageChange = (page: number) => {
//     setCurrentPage(page);
//     // Scroll to top cuando cambia de página
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   // Funciones para selección múltiple
//   const handleSelectLead = (leadId: string) => {
//     setSelectedLeads(prev => {
//       const newSelection = new Set(prev);
//       if (newSelection.has(leadId)) {
//         newSelection.delete(leadId);
//       } else {
//         newSelection.add(leadId);
//       }
//       return newSelection;
//     });
//   };

//   const handleSelectAll = (leadsToSelect: ExtendedLead[]) => {
//     // Si ya están todos seleccionados, deseleccionar todos. Si no, seleccionar todos.
//     if (selectedLeads.size === leadsToSelect.length) {
//       setSelectedLeads(new Set());
//     } else {
//       const leadIds = leadsToSelect.map(lead => lead.id);
//       setSelectedLeads(new Set(leadIds));
//     }
//   };

//   const handleDeleteSelected = async () => {
//     if (selectedLeads.size === 0) return;
    
//     try {
//       const response = await fetch('/api/leads/bulk-delete', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           leadIds: Array.from(selectedLeads)
//         }),
//       });

//       if (response.ok) {
//         setSelectedLeads(new Set());
//         setShowDeleteConfirm(false);
//         refetch(); // Recargar la lista de leads
//         showSuccess(`${selectedLeads.size} leads eliminados exitosamente`);
//       } else {
//         showError('Error al eliminar los leads');
//       }
//     } catch (error) {
//       console.error('Error eliminando leads:', error);
//       showError('Error al eliminar los leads');
//     }
//   };

//   const [isProcessingCalls, setIsProcessingCalls] = useState(false);

//   const handleBulkCall = async () => {
//     if (selectedLeads.size === 0 || isProcessingCalls) return;
    
//     try {
//       setIsProcessingCalls(true);
      
//       showInfo(
//         '🚀 Iniciando Llamadas Masivas', 
//         `Procesando ${selectedLeads.size} leads seleccionados...`
//       );

//   // Obtener token del usuario actual (usar 'auth_token' para compatibilidad)
//   const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
//       const response = await fetch('/api/leads/bulk-call', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           ...(token && { 'Authorization': `Bearer ${token}` })
//         },
//         body: JSON.stringify({
//           leadIds: Array.from(selectedLeads),
//           tenantId: user?.tenantId || 'default-tenant',
//           organizationId: user?.organizationId || 'default-org',
//           callType: 'prospecting',
//           notes: 'Llamada masiva generada desde panel de administración'
//         }),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         showSuccess(
//           '✅ Llamadas Masivas Completadas',
//           `${result.successfulCalls}/${result.totalProcessed} llamadas exitosas`
//         );
        
//         // Mostrar detalles de las llamadas fallidas si las hay
//         if (result.failedCalls > 0) {
//           const failedLeads = result.results.filter((r: any) => !r.success);
//           console.log('Llamadas fallidas:', failedLeads);
//           showInfo(
//             '⚠️ Algunas llamadas fallaron',
//             `${result.failedCalls} llamadas no pudieron completarse`
//           );
//         }

//         // Animación de salida suave
//         setTimeout(() => {
//           setSelectedLeads(new Set());
//         }, 500);
        
//         refetch(); // Recargar la lista de leads
//       } else {
//         const errorData = await response.json();
//         showError('❌ Error en Llamadas Masivas', errorData.error || 'Error desconocido');
//       }
//     } catch (error) {
//       console.error('Error en llamadas masivas:', error);
//       showError('❌ Error en Llamadas Masivas', 'Error de conexión');
//     } finally {
//       setIsProcessingCalls(false);
//     }
//   };


//   // Función para manejar llamadas
//   const handleCallLead = async (lead: ExtendedLead) => {
//     if (!lead) return;
//     console.log('Iniciando proceso de llamada para lead:', lead.name || 'Sin nombre');
//     setCallLead(lead);
//     setShowAgentSelection(true);
//   };

//   // Función para manejar cuando se inicia la llamada exitosamente
//   const handleCallInitiated = (result: { callLogId: string; elevenLabsBatchId?: string }) => {
//     console.log('Llamada iniciada exitosamente:', result);
    
//     showSuccess(
//       'Llamada Iniciada',
//       `Llamada iniciada exitosamente para ${callLead?.name || 'Lead'}.`
//     );

//     // Refrescar la lista de leads para actualizar datos
//     refetch();
//   };

//   // Función para cerrar el modal de selección de agentes
//   const handleCloseAgentSelection = () => {
//     setShowAgentSelection(false);
//     setCallLead(null);
//   };

//   const handleViewTranscription = (callLog: ILeadCallLog) => {
//     console.log('📄 Viewing transcription for call:', callLog.id);
//     setSelectedCallLog(callLog);
//     setShowTranscriptionModal(true);
//   };

//   const handleCloseTranscriptionModal = () => {
//     setShowTranscriptionModal(false);
//     setSelectedCallLog(null);
//   };

//   return (
//     <div className="min-h-screen bg-white dark:bg-black">
//       <div className="space-y-3 p-3 sm:p-4 lg:p-6 max-w-[100vw] mx-auto">
//         {/* Header Compacto y Responsivo */}
//         <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-3 sm:p-4">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//             <div className="min-w-0 flex-1">
//               <h1 className="text-lg sm:text-xl font-semibold text-black dark:text-white truncate">
//                 Administración de Leads
//               </h1>
//               <p className="text-xs sm:text-sm text-black dark:text-white mt-1">
//                 Gestiona tus prospectos y convierte leads en clientes
//               </p>
//             </div>
//             <div className="flex gap-2 w-full sm:w-auto">
//               <Button 
//                 size="sm" 
//                 className="h-8 flex-1 sm:flex-none transition-all duration-200 hover:scale-105 active:scale-95"
//                 onClick={() => setShowNewLeadForm(true)}
//               >
//                 <Plus className="h-3 w-3 mr-1" />
//                 <span className="hidden sm:inline">Nuevo Lead</span>
//                 <span className="sm:hidden">Nuevo</span>
//               </Button>
              
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 className="h-8 px-2 sm:px-3 transition-all duration-200 hover:scale-105 active:scale-95"
//                 onClick={() => setShowBulkImport(true)}
//                 title={isMultiFormatEnabled ? 'Importar leads desde CSV, XLSX, JSON, XML' : 'Importar leads desde CSV'}
//               >
//                 <Upload className="h-3 w-3 sm:mr-1" />
//                 <span className="hidden sm:inline">
//                   Importar
//                 </span>
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* 🚀 PANEL DE ACCIONES MASIVAS */}
//         {bulkModeActive && selectedLeads.size > 1 && (
//           <div className="bg-purple-600 dark:bg-purple-700 rounded-lg border border-purple-700 dark:border-purple-600 p-3 sm:p-4 animate-in slide-in-from-top-2 duration-300">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center gap-2 text-white">
//                   <Target className="h-4 w-4" />
//                   <span className="text-sm font-medium">
//                     {selectedLeads.size} leads seleccionados para acciones masivas
//                   </span>
//                 </div>
//               </div>
//               <div className="flex gap-2 w-full sm:w-auto">
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   className="h-8 bg-white dark:bg-black text-purple-600 dark:text-purple-400 border-white dark:border-white hover:bg-purple-50 dark:hover:bg-black"
//                   onClick={() => setShowPersonalizationPanel(true)}
//                 >
//                   <MessageCircle className="h-3 w-3 mr-1" />
//                   Personalizar Scripts
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   className="h-8 bg-white dark:bg-black text-purple-600 dark:text-purple-400 border-white dark:border-white hover:bg-purple-50 dark:hover:bg-black transition-all duration-200 hover:scale-105 active:scale-95"
//                   onClick={handleBulkCall}
//                   disabled={isProcessingCalls}
//                 >
//                   {isProcessingCalls ? (
//                     <>
//                       <Loader2 className="h-3 w-3 mr-1 animate-spin" />
//                       Procesando...
//                     </>
//                   ) : (
//                     <>
//                       <Phone className="h-3 w-3 mr-1" />
//                       Llamadas Masivas
//                     </>
//                   )}
//                 </Button>
//                 <Button 
//                   variant="destructive" 
//                   size="sm" 
//                   className="h-8"
//                   onClick={() => setShowDeleteConfirm(true)}
//                 >
//                   <Trash2 className="h-3 w-3 mr-1" />
//                   Eliminar
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm" 
//                   className="h-8 bg-white dark:bg-black text-purple-600 dark:text-purple-400 border-white dark:border-white hover:bg-purple-50 dark:hover:bg-black"
//                   onClick={() => setSelectedLeads(new Set())}
//                 >
//                   <X className="h-3 w-3 mr-1" />
//                   Cancelar
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Barra de acciones para selección múltiple (1 lead) */}
//         {!bulkModeActive && selectedLeads.size === 1 && (
//           <div className="bg-orange-600 dark:bg-orange-700 rounded-lg border border-orange-700 dark:border-orange-600 p-3 sm:p-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//               <div className="flex items-center gap-3">
//                 <div className="flex items-center gap-2 text-white">
//                   <Check className="h-4 w-4" />
//                   <span className="text-sm font-medium">
//                     1 lead seleccionado
//                   </span>
//                 </div>
//               </div>
//               <div className="flex gap-2 w-full sm:w-auto">
//                  <Button 
//                   variant="outline" 
//                   size="sm" 
//                   className="h-8 bg-white dark:bg-black text-orange-600 dark:text-orange-400 border-white dark:border-white hover:bg-orange-50 dark:hover:bg-black"
//                   onClick={() => setSelectedLeads(new Set())}
//                 >
//                   <X className="h-3 w-3 mr-1" />
//                   Cancelar
//                 </Button>
//                 <Button 
//                   variant="destructive" 
//                   size="sm" 
//                   className="h-8"
//                   onClick={() => setShowDeleteConfirm(true)}
//                 >
//                   <Trash2 className="h-3 w-3 mr-1" />
//                   Eliminar
//                 </Button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Búsqueda Principal - Ahora arriba */}
//         <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-3 sm:p-4">
//           <div className="flex flex-col sm:flex-row gap-3 items-center">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black dark:text-white h-4 w-4" />
//               <Input
//                 placeholder="Buscar leads por nombre, email, empresa o teléfono..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10 h-10 text-sm w-full bg-white dark:bg-black border-gray-200 dark:border-white focus:bg-white dark:focus:bg-black focus:border-orange-500 dark:focus:border-orange-500 text-black dark:text-white"
//               />
//             </div>
//             <div className="flex gap-2">
//               {/* 🚀 BOTÓN FILTROS AVANZADOS */}
//               {bulkModeActive && (
//                 <Button 
//                   variant={showAdvancedFilters ? "default" : "outline"}
//                   size="sm" 
//                   className="h-10 px-3"
//                   onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
//                 >
//                   <Filter className="h-4 w-4 sm:mr-2" />
//                   <span className="hidden sm:inline">Filtros IA</span>
//                   <span className="sm:hidden">Filtros</span>
//                 </Button>
//               )}
              
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 className="h-10 px-3 transition-all duration-200 hover:scale-105 active:scale-95"
//                 onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
//               >
//                 <Filter className="h-4 w-4 sm:mr-2" />
//                 <span className="hidden sm:inline">Filtros</span>
//               </Button>
//               <Button variant="outline" size="sm" className="h-10 px-3 transition-all duration-200 hover:scale-105 active:scale-95" onClick={refetch}>
//                 <RefreshCw className="h-4 w-4 sm:mr-2" />
//                 <span className="hidden sm:inline">Actualizar</span>
//               </Button>
//               <Button variant="outline" size="sm" className="h-10 px-3 transition-all duration-200 hover:scale-105 active:scale-95">
//                 <Download className="h-4 w-4 sm:mr-2" />
//                 <span className="hidden sm:inline">Exportar</span>
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* 🚀 FILTROS AVANZADOS CON IA */}
//         {showAdvancedFilters && (
//           <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-4 sm:p-6 animate-in fade-in-0 slide-in-from-top-2 duration-300">
//             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-white">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-orange-500 rounded-lg">
//                   <Filter className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-black dark:text-white">
//                     🧠 Filtros Inteligentes
//                   </h3>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">
//                     Filtra leads con criterios avanzados y análisis IA
//                   </p>
//                 </div>
//               </div>
//               <Button 
//                 variant="ghost" 
//                 size="sm" 
//                 onClick={() => setShowAdvancedFilters(false)}
//                 className="h-9 px-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
//               >
//                 <X className="h-4 w-4" />
//                 <span className="ml-1 text-xs">Cerrar</span>
//               </Button>
//             </div>
            
//             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
//               {/* Score Range */}
//               <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-4">
//                 <div className="flex items-center gap-2 mb-3">
//                   <div className="p-1.5 bg-orange-500 rounded-lg">
//                     <TrendingUp className="h-4 w-4 text-white" />
//                   </div>
//                   <label className="text-sm font-semibold text-black dark:text-white">
//                     📊 Score de Calificación
//                   </label>
//                 </div>
//                 <div className="flex gap-3">
//                   <div className="flex-1">
//                     <Input 
//                       type="number" 
//                       placeholder="Mínimo"
//                       value={advancedFilters.minScore}
//                       onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minScore: parseInt(e.target.value) || 0 }))}
//                       className="h-10 text-sm bg-white dark:bg-black border-gray-200 dark:border-white focus:border-orange-500 dark:focus:border-orange-500"
//                       min="0"
//                       max="100"
//                     />
//                   </div>
//                   <div className="flex-1">
//                     <Input 
//                       type="number" 
//                       placeholder="Máximo"
//                       value={advancedFilters.maxScore}
//                       onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))}
//                       className="h-10 text-sm bg-white dark:bg-black border-gray-200 dark:border-white focus:border-orange-500 dark:focus:border-orange-500"
//                       min="0"
//                       max="100"
//                     />
//                   </div>
//                 </div>
//                 <div className="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
//                   <span>0</span>
//                   <span>100</span>
//                 </div>
//               </div>

//               {/* Combined Sentiment & Engagement */}
//               <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-4">
//                 <div className="space-y-4">
//                   {/* Sentiment */}
//                   <div>
//                     <div className="flex items-center gap-2 mb-3">
//                       <div className="p-1.5 bg-purple-600 rounded-lg">
//                         <AlertCircle className="h-4 w-4 text-white" />
//                       </div>
//                       <label className="text-sm font-semibold text-black dark:text-white">
//                         🎭 Análisis de Sentiment
//                       </label>
//                     </div>
//                     <select
//                       value={advancedFilters.sentiment}
//                       onChange={(e) => setAdvancedFilters(prev => ({ ...prev, sentiment: e.target.value }))}
//                       className="w-full h-10 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white rounded-lg px-3 focus:border-orange-500 dark:focus:border-orange-500 text-black dark:text-white"
//                     >
//                       <option value="all">🌟 Todos los sentiments</option>
//                       <option value="positive">😊 Sentiment Positivo</option>
//                       <option value="neutral">😐 Sentiment Neutral</option>
//                       <option value="negative">😔 Sentiment Negativo</option>
//                     </select>
//                   </div>

//                   {/* Engagement */}
//                   <div>
//                     <div className="flex items-center gap-2 mb-3">
//                       <div className="p-1.5 bg-orange-500 rounded-lg">
//                         <Target className="h-4 w-4 text-white" />
//                       </div>
//                       <label className="text-sm font-semibold text-black dark:text-white">
//                         🎯 Nivel de Engagement
//                       </label>
//                     </div>
//                     <select
//                       value={advancedFilters.engagement}
//                       onChange={(e) => setAdvancedFilters(prev => ({ ...prev, engagement: e.target.value }))}
//                       className="w-full h-10 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white rounded-lg px-3 focus:border-orange-500 dark:focus:border-orange-500 text-black dark:text-white"
//                     >
//                       <option value="all">📊 Todos los niveles</option>
//                       <option value="high">🔥 Alto Engagement</option>
//                       <option value="medium">⚡ Engagement Medio</option>
//                       <option value="low">📉 Bajo Engagement</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               {/* Last Contact & Estados */}
//               <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-4">
//                 <div className="space-y-4">
//                   {/* Last Contact */}
//                   <div>
//                     <div className="flex items-center gap-2 mb-3">
//                       <div className="p-1.5 bg-purple-600 rounded-lg">
//                         <Clock className="h-4 w-4 text-white" />
//                       </div>
//                       <label className="text-sm font-semibold text-black dark:text-white">
//                         ⏰ Último Contacto
//                       </label>
//                     </div>
//                     <select
//                       value={advancedFilters.lastContactDays}
//                       onChange={(e) => setAdvancedFilters(prev => ({ ...prev, lastContactDays: parseInt(e.target.value) }))}
//                       className="w-full h-10 text-sm bg-white dark:bg-black border border-gray-200 dark:border-white rounded-lg px-3 focus:border-orange-500 dark:focus:border-orange-500 text-black dark:text-white"
//                     >
//                       <option value={7}>📅 Últimos 7 días</option>
//                       <option value={15}>📅 Últimos 15 días</option>
//                       <option value={30}>📅 Últimos 30 días</option>
//                       <option value={60}>📅 Últimos 60 días</option>
//                       <option value={0}>∞ Sin límite</option>
//                     </select>
//                   </div>

//                   {/* Estados Múltiples */}
//                   <div>
//                     <div className="flex items-center gap-2 mb-3">
//                       <div className="p-1.5 bg-orange-500 rounded-lg">
//                         <Users className="h-4 w-4 text-white" />
//                       </div>
//                       <div className="flex-1">
//                         <label className="text-sm font-semibold text-black dark:text-white">
//                           👥 Filtrar por Estados
//                         </label>
//                         {advancedFilters.selectedStatuses.length > 0 && (
//                           <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-200 ml-2">
//                             {advancedFilters.selectedStatuses.length} seleccionados
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                     <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white rounded-lg p-3">
//                       {[
//                         { value: 'new', label: 'Nuevos', emoji: '🆕', color: 'gray' },
//                         { value: 'interested', label: 'Interesados', emoji: '🔵', color: 'blue' },
//                         { value: 'qualified', label: 'Calificados', emoji: '✅', color: 'green' },
//                         { value: 'follow_up', label: 'En Seguimiento', emoji: '⏰', color: 'yellow' },
//                         { value: 'proposal_current', label: 'Propuesta Actual', emoji: '📈', color: 'orange' },
//                         { value: 'proposal_previous', label: 'Propuesta Anterior', emoji: '📊', color: 'orange' },
//                         { value: 'negotiation', label: 'Negociación', emoji: '🤝', color: 'purple' },
//                         { value: 'nurturing', label: 'Maduración', emoji: '🌱', color: 'indigo' },
//                         { value: 'won', label: 'Ganados', emoji: '🏆', color: 'green' },
//                         { value: 'lost', label: 'Perdidos', emoji: '❌', color: 'red' },
//                         { value: 'cold', label: 'Fríos', emoji: '🥶', color: 'gray' }
//                       ].map(status => (
//                         <label 
//                           key={status.value} 
//                           className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 mb-1 ${
//                             advancedFilters.selectedStatuses.includes(status.value) ? 'bg-orange-100 dark:bg-orange-900/30' : ''
//                           }`}
//                         >
//                           <Checkbox
//                             checked={advancedFilters.selectedStatuses.includes(status.value)}
//                             onCheckedChange={(checked) => {
//                               if (checked) {
//                                 setAdvancedFilters(prev => ({
//                                   ...prev,
//                                   selectedStatuses: [...prev.selectedStatuses, status.value]
//                                 }));
//                               } else {
//                                 setAdvancedFilters(prev => ({
//                                   ...prev,
//                                   selectedStatuses: prev.selectedStatuses.filter(s => s !== status.value)
//                                 }));
//                               }
//                             }}
//                             className="border-gray-400 data-[state=checked]:bg-orange-500"
//                           />
//                           <span className="text-lg">{status.emoji}</span>
//                           <span className="text-sm font-medium text-black dark:text-white">{status.label}</span>
//                         </label>
//                       ))}
//                     </div>
//                     {advancedFilters.selectedStatuses.length > 0 && (
//                       <div className="flex items-center justify-between mt-2">
//                         <span className="text-xs text-gray-600 dark:text-gray-400">
//                           Filtrando por {advancedFilters.selectedStatuses.length} estados
//                         </span>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
//                           onClick={() => setAdvancedFilters(prev => ({ ...prev, selectedStatuses: [] }))}
//                         >
//                           <X className="h-3 w-3 mr-1" />
//                           Limpiar
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-white">
//               <Button 
//                 size="default" 
//                 className="h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 rounded-lg transition-all duration-200"
//                 onClick={() => {
//                   // Los filtros se aplican automáticamente via useMemo
//                   // Mostramos feedback al usuario
//                   showSuccess(
//                     'Filtros IA Aplicados',
//                     `Filtrando ${filteredLeads.length} leads con criterios inteligentes`
//                   );
//                   setCurrentPage(1); // Reset a primera página
//                 }}
//               >
//                 <Target className="h-4 w-4 mr-2" />
//                 🎯 Aplicar Filtros IA ({filteredLeads.length} results)
//               </Button>
//               <Button 
//                 variant="outline" 
//                 size="default" 
//                 className="h-10 border-gray-200 dark:border-white text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold px-6 rounded-lg transition-all duration-200"
//                 onClick={() => {
//                   setAdvancedFilters({
//                     minScore: 0,
//                     maxScore: 100,
//                     sentiment: 'all',
//                     engagement: 'all',
//                     lastContactDays: 30,
//                     selectedStatuses: []
//                   });
//                   showInfo('Filtros Limpiados', 'Todos los filtros han sido reiniciados');
//                 }}
//               >
//                 🧹 Limpiar Filtros
//               </Button>
//             </div>
//           </div>
//         )}

//         {/* Filtros por Estado - Reorganizados */}
//         <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-white p-3 sm:p-4">
//           <Tabs defaultValue="all" className="w-full">
//             <div className="space-y-3">
//               {/* Tabs responsivos con scroll horizontal mejorado */}
//               <div className="w-full">
//                 <TabsList className="h-10 bg-white dark:bg-black border border-gray-200 dark:border-white w-full grid grid-cols-6 lg:grid-cols-6 xl:grid-cols-12 gap-1 p-1 overflow-x-auto">
//                   <TabsTrigger value="all" className="text-xs px-1 sm:px-2 h-8 min-w-0">
//                     Todos
//                   </TabsTrigger>
//                   <TabsTrigger value="new" className="text-xs px-1 sm:px-2 h-8 min-w-0">
//                     Nuevos
//                   </TabsTrigger>
//                   <TabsTrigger value="interested" className="text-xs px-1 sm:px-2 h-8 min-w-0">
//                     Prioritarios
//                   </TabsTrigger>
//                   <TabsTrigger value="qualified" className="text-xs px-1 sm:px-2 h-8 min-w-0">
//                     Calificados
//                   </TabsTrigger>
//                   <TabsTrigger value="follow_up" className="text-xs px-1 sm:px-2 h-8 min-w-0">
//                     Sin Resp.
//                   </TabsTrigger>
//                   <TabsTrigger value="proposal_current" className="text-xs px-1 sm:px-2 h-8 min-w-0">
//                     Cotizaciones
//                   </TabsTrigger>
//                   <TabsTrigger value="proposal_previous" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
//                     Campañas Ant.
//                   </TabsTrigger>
//                   <TabsTrigger value="negotiation" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
//                     Negociación
//                   </TabsTrigger>
//                   <TabsTrigger value="nurturing" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
//                     En Pausa
//                   </TabsTrigger>
//                   <TabsTrigger value="won" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
//                     Ganados
//                   </TabsTrigger>
//                   <TabsTrigger value="lost" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
//                     Declinados
//                   </TabsTrigger>
//                   <TabsTrigger value="cold" className="text-xs px-1 sm:px-2 h-8 min-w-0 xl:block hidden">
//                     Descartados
//                   </TabsTrigger>
//                 </TabsList>
                
//                 {/* Tabs adicionales para móvil en segunda fila */}
//                 <div className="xl:hidden mt-2">
//                   <TabsList className="h-8 bg-white dark:bg-black border border-gray-200 dark:border-white w-full grid grid-cols-6 gap-1 p-1">
//                     <TabsTrigger value="proposal_previous" className="text-xs px-1 h-6 min-w-0">
//                       Campañas
//                     </TabsTrigger>
//                     <TabsTrigger value="negotiation" className="text-xs px-1 h-6 min-w-0">
//                       Negociación
//                     </TabsTrigger>
//                     <TabsTrigger value="nurturing" className="text-xs px-1 h-6 min-w-0">
//                       Pausa
//                     </TabsTrigger>
//                     <TabsTrigger value="won" className="text-xs px-1 h-6 min-w-0">
//                       Ganados
//                     </TabsTrigger>
//                     <TabsTrigger value="lost" className="text-xs px-1 h-6 min-w-0">
//                       Declinados
//                     </TabsTrigger>
//                     <TabsTrigger value="cold" className="text-xs px-1 h-6 min-w-0">
//                       Descartados
//                     </TabsTrigger>
//                   </TabsList>
//                 </div>
//               </div>

//               {/* Contenido de Tabs */}
//               <div className="mt-3">
//                 <TabsContent value="all" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads} 
//                     isLoading={isLoading}
//                     pagination={{
//                       currentPage,
//                       totalPages,
//                       itemsPerPage,
//                       totalItems: filteredLeads.length,
//                       onPageChange: handlePageChange,
//                       onItemsPerPageChange: setItemsPerPage
//                     }}
//                     selectedLeads={selectedLeads}
//                     onSelectLead={handleSelectLead}
//                     onSelectAll={() => handleSelectAll(paginatedLeads)}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="new" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'new')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="interested" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'interested')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="qualified" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'qualified')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="follow_up" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'follow_up')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="proposal_current" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'proposal_current')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="proposal_previous" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'proposal_previous')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="negotiation" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'negotiation')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="nurturing" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'nurturing')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="won" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'won')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="lost" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'lost')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//                 <TabsContent value="cold" className="mt-0">
//                   <LeadsTable 
//                     leads={paginatedLeads.filter(lead => lead.status === 'cold')} 
//                     isLoading={isLoading}
//                     showPagination={false}
//                     onShowNewLeadForm={() => setShowNewLeadForm(true)}
//                   />
//                 </TabsContent>
//               </div>
//             </div>
//           </Tabs>
//         </div>

//         {/* Estadísticas con el nuevo componente integrado - Movido abajo */}
//         <LeadsStatsCardsIntegrated leads={leadsForStats || []} />
//       </div>


//       {/* NOTE: Agent selection modal removed - calls now use ENV agent */}

//       {/* Modal de visualización de transcripciones */}
//       <TranscriptionViewModal
//         isOpen={showTranscriptionModal}
//         onClose={handleCloseTranscriptionModal}
//         callLog={selectedCallLog}
//       />

//       {/* Modal de importación masiva */}
//       <BulkImportModal
//         isOpen={showBulkImport}
//         onClose={() => setShowBulkImport(false)}
//         onImportComplete={() => {
//           setShowBulkImport(false);
//           refetch();
//         }}
//       />

//       {/* Modal de nuevo lead */}
//       <NewLeadForm
//         isOpen={showNewLeadForm}
//         onClose={() => setShowNewLeadForm(false)}
//         onLeadCreated={() => {
//           setShowNewLeadForm(false);
//           refetch();
//         }}
//       />

//       {/* Modal de confirmación de eliminación múltiple */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-black rounded-lg p-6 max-w-md w-full mx-4">
//             <div className="flex items-center gap-3 mb-4">
//               <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
//                 <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
//               </div>
//               <div>
//                 <h3 className="text-lg font-medium text-black dark:text-white">
//                   Confirmar eliminación
//                 </h3>
//                 <p className="text-sm text-black dark:text-white">
//                   Esta acción no se puede deshacer.
//                 </p>
//               </div>
//             </div>
            
//             <p className="text-black dark:text-white mb-6">
//               ¿Estás seguro de que deseas eliminar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}? 
//               Esta acción eliminará permanentemente los datos de los leads seleccionados.
//             </p>
            
//             <div className="flex gap-3 justify-end">
//               <Button 
//                 variant="outline" 
//                 onClick={() => setShowDeleteConfirm(false)}
//               >
//                 Cancelar
//               </Button>
//               <Button 
//                 variant="destructive" 
//                 onClick={handleDeleteSelected}
//               >
//                 <Trash2 className="h-4 w-4 mr-2" />
//                 Eliminar {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''}
//               </Button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 🚀 MODAL DE PERSONALIZACIÓN MASIVA */}
//       {showPersonalizationPanel && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-black rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white">
//               <h3 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
//                 <MessageCircle className="w-6 h-6 text-purple-600" />
//                 🎯 Personalización Masiva
//               </h3>
//               <Button 
//                 variant="ghost" 
//                 size="sm" 
//                 onClick={() => setShowPersonalizationPanel(false)}
//                 className="h-8 px-2"
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>
            
//             <div className="p-6 max-h-[70vh] overflow-y-auto">
//               <BulkPersonalizationPanel
//                 leadIds={Array.from(selectedLeads)}
//                 tenantId={user?.tenantId || "default-tenant"}
//                 organizationId={user?.organizationId || "default-org"}
//                 onClose={() => setShowPersonalizationPanel(false)}
//                 onComplete={(results) => {
//                   console.log('Personalización completada:', results);
//                   setShowPersonalizationPanel(false);
//                   setSelectedLeads(new Set());
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Notification Container */}
//       <NotificationContainer 
//         notifications={notifications}
//         onRemove={removeNotification}
//       />
//     </div>
//   );

//   // Función para manejar acciones de leads (movida dentro del componente para acceder al router)
//   const handleAction = async (action: string, leadData: ExtendedLead) => {
//     console.log(`Acción: ${action}`, leadData);
    
//     switch (action) {
//       case 'view':
//         // Navegar a la página de trabajo del lead
//         router.push(`/clients/leads/${leadData.id}/work`);
//         break;
//       case 'edit':
//         // openActionModal('edit'); // Comentado por ahora
//         break;
//       case 'call':
//         // await handleMakeCall(leadData); // Comentado por ahora
//         break;
//       default:
//         console.log(`Acción no reconocida: ${action}`);
//     }
//   };
// }

// // Tipos para el ordenamiento
// type SortField = 'name' | 'company' | 'email' | 'status' | 'qualification_score' | 'updated_at' | 'campaign';
// type SortDirection = 'asc' | 'desc';

// interface SortConfig {
//   field: SortField | null;
//   direction: SortDirection;
// }

// // Interfaz para la paginación
// interface PaginationProps {
//   currentPage: number;
//   totalPages: number;
//   itemsPerPage: number;
//   totalItems: number;
//   onPageChange: (page: number) => void;
//   onItemsPerPageChange: (items: number) => void;
// }

// // Helper para obtener color del sentimiento
// const getSentimentColor = (sentiment: string | undefined) => {
//   switch (sentiment?.toLowerCase()) {
//     case 'positive': return 'bg-green-100 text-green-800';
//     case 'negative': return 'bg-red-100 text-red-800';
//     case 'neutral': return 'bg-gray-100 text-gray-800';
//     case 'mixed': return 'bg-yellow-100 text-yellow-800';
//     default: return 'bg-gray-100 text-gray-800';
//   }
// };

// // Componente para mostrar análisis de conversación
// const ConversationAnalysisCell = ({ analysis }: { analysis: any }) => {
//   if (!analysis) {
//     return (
//       <div className="text-xs text-gray-400 italic">
//         Sin análisis
//       </div>
//     );
//   }

//   const sentiment = analysis.sentiment?.overall?.sentiment || 
//                    analysis.sentiment?.sentiment || 
//                    analysis.overallSentiment || 
//                    'neutral';
  
//   const leadInterest = Math.round((analysis.sentiment?.overall?.score || 0) * 5 + 5);
//   const conversionProb = Math.round((analysis.conversionProbability || 0) * 100);
//   const qualityScore = analysis.qualityScore || analysis.callQualityScore || 0;

//   return (
//     <div className="space-y-1">
//       <div className="flex items-center gap-2">
//         <Badge className={`${getSentimentColor(sentiment)} text-xs px-2 py-0.5`}>
//           {sentiment}
//         </Badge>
//       </div>
//       <div className="text-xs text-gray-600 space-y-0.5">
//         <div>Interés: {leadInterest}/10</div>
//         <div>Conversión: {conversionProb}%</div>
//         <div>Calidad: {qualityScore}/100</div>
//       </div>
//     </div>
//   );
// };

// // Tabla de leads responsiva y compacta
// function LeadsTable({ 
//   leads, 
//   isLoading, 
//   pagination, 
//   showPagination = true,
//   selectedLeads = new Set(),
//   onSelectLead,
//   onSelectAll,
//   onShowNewLeadForm,
//   onShowLeadDetails
// }: { 
//   leads: ExtendedLead[], 
//   isLoading: boolean,
//   pagination?: PaginationProps,
//   showPagination?: boolean,
//   selectedLeads?: Set<string>,
//   onSelectLead?: (leadId: string) => void,
//   onSelectAll?: (leads: ExtendedLead[]) => void,
//   onShowNewLeadForm?: () => void,
//   onShowLeadDetails?: (lead: ExtendedLead) => void
// }) {
//   const [sortConfig, setSortConfig] = React.useState<SortConfig>({
//     field: null,
//     direction: 'asc'
//   });

//   // Estado para análisis de conversación
//   const [conversationAnalyses, setConversationAnalyses] = React.useState<Map<string, any>>(new Map());

//   // Función para manejar el cambio de ordenamiento
//   const handleSort = (field: SortField) => {
//     let direction: SortDirection = 'asc';
//     if (sortConfig.field === field && sortConfig.direction === 'asc') {
//       direction = 'desc';
//     }
//     setSortConfig({ field, direction });
//   };

//   // Función para obtener el icono de ordenamiento
//   const getSortIcon = (field: SortField) => {
//     if (sortConfig.field !== field) {
//       return <ArrowUpDown className="h-3 w-3 text-black dark:text-white" />;
//     }
//     return sortConfig.direction === 'asc' 
//       ? <ArrowUp className="h-3 w-3 text-orange-500" />
//       : <ArrowDown className="h-3 w-3 text-orange-500" />;
//   };

//   // Función para ordenar los leads
//   const sortedLeads = React.useMemo(() => {
//     if (!sortConfig.field) return leads;

//     return [...leads].sort((a, b) => {
//       let aValue = a[sortConfig.field!];
//       let bValue = b[sortConfig.field!];

//       // Manejar casos especiales
//       switch (sortConfig.field) {
//         case 'name':
//           aValue = (a.name || '').toLowerCase();
//           bValue = (b.name || '').toLowerCase();
//           break;
//         case 'company':
//           aValue = (a.company || '').toLowerCase();
//           bValue = (b.company || '').toLowerCase();
//           break;
//         case 'email':
//           aValue = (a.email || '').toLowerCase();
//           bValue = (b.email || '').toLowerCase();
//           break;
//         case 'qualification_score':
//           aValue = a.qualification_score || 0;
//           bValue = b.qualification_score || 0;
//           break;
//         case 'updated_at':
//           aValue = new Date(a.updated_at || 0).getTime();
//           bValue = new Date(b.updated_at || 0).getTime();
//           break;
//         case 'campaign':
//           aValue = (a.campaign ? a.campaign.name || '' : '').toLowerCase();
//           bValue = (b.campaign ? b.campaign.name || '' : '').toLowerCase();
//           break;
//         default:
//           break;
//       }

//       if (aValue < bValue) {
//         return sortConfig.direction === 'asc' ? -1 : 1;
//       }
//       if (aValue > bValue) {
//         return sortConfig.direction === 'asc' ? 1 : -1;
//       }
//       return 0;
//     });
//   }, [leads, sortConfig]);

//   // Función para obtener análisis de conversación de un lead
//   const fetchConversationAnalysis = React.useCallback(async (leadId: string) => {
//     try {
//       const token = localStorage.getItem('auth_token');
//       if (!token) return null;

//       // Obtener conversaciones del lead
//       const conversationsResponse = await fetch(`/api/leads/${leadId}/conversations`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });
//       if (!conversationsResponse.ok) return null;
      
//       const conversationsData = await conversationsResponse.json();
//       if (!conversationsData.success || !conversationsData.conversations?.length) return null;
      
//       // Tomar la conversación más reciente
//       const latestConversation = conversationsData.conversations[0];
      
//       // Obtener análisis de la conversación
//       const analysisResponse = await fetch(`/api/leads/${leadId}/conversations/${latestConversation.conversationId}/analysis`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });
//       if (!analysisResponse.ok) return null;
      
//       const analysisData = await analysisResponse.json();
//       return analysisData.success ? analysisData.analysis : null;
//     } catch (error) {
//       console.error('Error fetching conversation analysis:', error);
//       return null;
//     }
//   }, []);

//   // Cargar análisis de conversación para los leads visibles
//   React.useEffect(() => {
//     const loadAnalyses = async () => {
//       const newAnalyses = new Map();
      
//       // Solo cargar análisis para los primeros 20 leads para rendimiento
//       const leadsToAnalyze = sortedLeads.slice(0, 20);
      
//       for (const lead of leadsToAnalyze) {
//         if (!conversationAnalyses.has(lead.id)) {
//           const analysis = await fetchConversationAnalysis(lead.id);
//           if (analysis) {
//             newAnalyses.set(lead.id, analysis);
//           }
//         }
//       }
      
//       if (newAnalyses.size > 0) {
//         setConversationAnalyses(prev => new Map([...prev, ...newAnalyses]));
//       }
//     };
    
//     if (sortedLeads.length > 0) {
//       loadAnalyses();
//     }
//   }, [sortedLeads, fetchConversationAnalysis, conversationAnalyses]);

//   if (isLoading) {
//     return (
//       <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black overflow-hidden relative">
//         {/* Skeleton para vista desktop */}
//         <div className="hidden lg:block">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-white dark:bg-black border-b border-gray-200 dark:border-white">
//                 <tr>
//                   <th className="text-left p-3 w-12 text-black dark:text-white">#</th>
//                   <th className="text-left p-3 text-black dark:text-white">Lead</th>
//                   <th className="text-left p-3 text-black dark:text-white">Contacto</th>
//                   <th className="text-left p-3 text-black dark:text-white">Campaña</th>
//                   <th className="text-left p-3 text-black dark:text-white">Estado</th>
//                   <th className="text-left p-3 text-black dark:text-white">Llamadas</th>
//                   <th className="text-left p-3 text-black dark:text-white">Análisis IA</th>
//                   <th className="text-left p-3 text-black dark:text-white">Acciones</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {[...Array(pagination?.itemsPerPage || 10)].map((_, index) => (
//                   <tr key={index} className="border-b border-gray-200 dark:border-white">
//                     <td className="p-3">
//                       <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
//                     </td>
//                     <td className="p-3">
//                       <div className="space-y-2">
//                         <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
//                         <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className="space-y-1">
//                         <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
//                         <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
//                     </td>
//                     <td className="p-3">
//                       <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
//                     </td>
//                     <td className="p-3">
//                       <div className="space-y-1">
//                         <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
//                         <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
//                         <div className="h-3 w-14 bg-gray-200 rounded animate-pulse"></div>
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
//                     </td>
//                     <td className="p-3">
//                       <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Skeleton para vista móvil */}
//         <div className="lg:hidden">
//           <div className="divide-y divide-gray-200">
//             {[...Array(pagination?.itemsPerPage || 10)].map((_, index) => (
//               <div key={index} className="p-4">
//                 <div className="flex items-start justify-between mb-2">
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
//                     </div>
//                     <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
//                     <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
//                   </div>
//                   <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-3 mt-3">
//                   <div>
//                     <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1"></div>
//                     <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
//                   </div>
//                   <div>
//                     <div className="h-3 w-10 bg-gray-200 rounded animate-pulse mb-1"></div>
//                     <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Loading indicator centralizado */}
//         <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
//           <div className="flex items-center gap-2 bg-white dark:bg-black px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-white">
//             <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
//             <span className="text-sm text-black dark:text-white">Cargando leads...</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (leads.length === 0) {
//     return (
//       <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black">
//         <div className="p-6 text-center">
//           <Users className="h-8 w-8 mx-auto text-black dark:text-white mb-3" />
//           <p className="text-sm text-black dark:text-white mb-3">No hay leads para mostrar</p>
//           <Button size="sm" onClick={onShowNewLeadForm}>
//             <Plus className="h-3 w-3 mr-1" />
//             Crear primer lead
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   // Helper function to get status badge variant and text
//   const getStatusDisplay = (status: string) => {
//     const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
//       'new': { variant: 'secondary', label: 'Nuevo' },
//       'interested': { variant: 'default', label: 'Prioritario' },
//       'qualified': { variant: 'default', label: 'Calificado' },
//       'follow_up': { variant: 'outline', label: 'Sin Respuesta' },
//       'proposal_current': { variant: 'default', label: 'Cotización Actual' },
//       'proposal_previous': { variant: 'outline', label: 'Campañas Anteriores' },
//       'negotiation': { variant: 'default', label: 'Negociación' },
//       'nurturing': { variant: 'outline', label: 'En Pausa' },
//       'won': { variant: 'default', label: 'Ganado' },
//       'lost': { variant: 'destructive', label: 'Declinado' },
//       'cold': { variant: 'secondary', label: 'Descartado' }
//     };
//     return statusMap[status] || { variant: 'secondary', label: status };
//   };

//   // Helper function to format date
//   const formatDate = (dateString: string | Date | null) => {
//     if (!dateString) return '—';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('es-ES', { 
//       day: '2-digit', 
//       month: 'short',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   return (
//     <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black overflow-hidden animate-in fade-in-0 duration-500">
//       {/* Vista Desktop */}
//       <div className="hidden lg:block">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-white dark:bg-black border-b border-gray-200 dark:border-white">
//               <tr>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white w-12">
//                   {onSelectAll && (
//                     <Checkbox
//                       checked={selectedLeads.size > 0 && selectedLeads.size === leads.length}
//                       onCheckedChange={() => onSelectAll(leads)}
//                       indeterminate={selectedLeads.size > 0 && selectedLeads.size < leads.length}
//                     />
//                   )}
//                 </th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white w-12">#</th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
//                   <button 
//                     onClick={() => handleSort('name')}
//                     className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//                   >
//                     Lead
//                     {getSortIcon('name')}
//                   </button>
//                 </th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
//                   <button 
//                     onClick={() => handleSort('email')}
//                     className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//                   >
//                     Contacto
//                     {getSortIcon('email')}
//                   </button>
//                 </th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
//                   <button 
//                     onClick={() => handleSort('campaign')}
//                     className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//                   >
//                     Campaña
//                     {getSortIcon('campaign')}
//                   </button>
//                 </th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
//                   <button 
//                     onClick={() => handleSort('status')}
//                     className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//                   >
//                     Estado
//                     {getSortIcon('status')}
//                   </button>
//                 </th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">Análisis IA</th>
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">
//                   <button 
//                     onClick={() => handleSort('qualification_score')}
//                     className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
//                   >
//                     Puntuación
//                     {getSortIcon('qualification_score')}
//                   </button>
//                 </th>
             
//                 <th className="text-left p-3 text-xs font-medium text-black dark:text-white">Acciones</th>
//               </tr>
//             </thead>
//             <tbody>
//               {sortedLeads.map((lead, index) => {
//                 const statusDisplay = getStatusDisplay(lead.status);
//                 return (
//                   <tr key={lead.id} className="border-b border-gray-200 dark:border-white hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-sm">
//                     <td className="p-3">
//                       {onSelectLead && (
//                         <Checkbox
//                           checked={selectedLeads.has(lead.id)}
//                           onCheckedChange={() => onSelectLead(lead.id)}
//                         />
//                       )}
//                     </td>
//                     <td className="p-3">
//                       <span className="text-xs font-mono text-gray-500">
//                         {index + 1}
//                       </span>
//                     </td>
//                     <td className="p-3">
//                       <div>
//                         <p className="text-sm font-medium text-black dark:text-white">
//                           {lead.name || 'Sin nombre'}
//                         </p>
//                         <p className="text-xs text-black dark:text-white">
//                           {lead.company ? `${lead.company}` : 'Sin empresa'}
//                           {lead.position ? ` • ${lead.position}` : ''}
//                         </p>
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       <div className="space-y-1">
//                         {lead.email && (
//                           <p className="text-xs text-black dark:text-white">{lead.email}</p>
//                         )}
//                         {lead.phone && (
//                           <p className="text-xs text-black dark:text-white">{lead.phone}</p>
//                         )}
//                         {!lead.email && !lead.phone && (
//                           <p className="text-xs text-black dark:text-white">Sin contacto</p>
//                         )}
//                       </div>
//                     </td>
//                     <td className="p-3">
//                       {lead.campaign ? (
//                         <span className="text-xs text-black dark:text-white">{lead.campaign.name || 'Sin nombre'}</span>
//                       ) : (
//                         <span className="text-xs text-red-500">Falta Campaña</span>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       <Badge variant={statusDisplay.variant} className="text-xs">
//                         {statusDisplay.label}
//                       </Badge>
//                       {lead.is_qualified && (
//                         <Badge variant="outline" className="text-xs ml-1">
//                           ✓
//                         </Badge>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       {(lead.contactAttempts || 0) > 0 ? (
//                         <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
//                           <Phone className="h-3 w-3 mr-1" />
//                           {lead.contactAttempts === 1 ? '1 llamada' : `${lead.contactAttempts} llamadas`}
//                         </Badge>
//                       ) : (
//                         <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
//                           <PhoneOff className="h-3 w-3 mr-1" />
//                           Sin llamadas
//                         </Badge>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       <ConversationAnalysisCell analysis={conversationAnalyses.get(lead.id)} />
//                     </td>
//                     <td className="p-3">
//                       <p className="text-xs text-black dark:text-white">
//                         {formatDate(lead.updated_at)}
//                       </p>
//                       {lead.next_follow_up_date && (
//                         <p className="text-xs text-orange-600 dark:text-orange-400">
//                           Próximo: {formatDate(lead.next_follow_up_date)}
//                         </p>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       <LeadActionsDropdown lead={lead} onShowLeadDetails={onShowLeadDetails} />
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Vista Mobile/Tablet */}
//       <div className="lg:hidden">
//         {/* Controles de ordenamiento para móvil */}
//         <div className="flex justify-between items-center p-4 bg-white dark:bg-black border-b border-gray-200 dark:border-white">
//           <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
//             {sortedLeads.length} lead{sortedLeads.length !== 1 ? 's' : ''}
//           </span>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button variant="outline" size="sm" className="h-8">
//                 <ArrowUpDown className="h-3 w-3 mr-1" />
//                 Ordenar
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-48">
//               <DropdownMenuLabel className="text-black dark:text-white">Ordenar por</DropdownMenuLabel>
//               <DropdownMenuSeparator />
              
//               <DropdownMenuItem 
//                 onClick={() => handleSort('name')}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-center justify-between w-full">
//                   <span>Nombre</span>
//                   {sortConfig.field === 'name' && (
//                     sortConfig.direction === 'asc' 
//                       ? <ArrowUp className="h-3 w-3" />
//                       : <ArrowDown className="h-3 w-3" />
//                   )}
//                 </div>
//               </DropdownMenuItem>
              
//               <DropdownMenuItem 
//                 onClick={() => handleSort('company')}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-center justify-between w-full">
//                   <span>Empresa</span>
//                   {sortConfig.field === 'company' && (
//                     sortConfig.direction === 'asc' 
//                       ? <ArrowUp className="h-3 w-3" />
//                       : <ArrowDown className="h-3 w-3" />
//                   )}
//                 </div>
//               </DropdownMenuItem>

//               <DropdownMenuItem 
//                 onClick={() => handleSort('campaign')}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-center justify-between w-full">
//                   <span>Campaña</span>
//                   {sortConfig.field === 'campaign' && (
//                     sortConfig.direction === 'asc' 
//                       ? <ArrowUp className="h-3 w-3" />
//                       : <ArrowDown className="h-3 w-3" />
//                   )}
//                 </div>
//               </DropdownMenuItem>
              
//               <DropdownMenuItem 
//                 onClick={() => handleSort('status')}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-center justify-between w-full">
//                   <span>Estado</span>
//                   {sortConfig.field === 'status' && (
//                     sortConfig.direction === 'asc' 
//                       ? <ArrowUp className="h-3 w-3" />
//                       : <ArrowDown className="h-3 w-3" />
//                   )}
//                 </div>
//               </DropdownMenuItem>
              
//               <DropdownMenuItem 
//                 onClick={() => handleSort('qualification_score')}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-center justify-between w-full">
//                   <span>Puntuación</span>
//                   {sortConfig.field === 'qualification_score' && (
//                     sortConfig.direction === 'asc' 
//                       ? <ArrowUp className="h-3 w-3" />
//                       : <ArrowDown className="h-3 w-3" />
//                   )}
//                 </div>
//               </DropdownMenuItem>
              
//               <DropdownMenuItem 
//                 onClick={() => handleSort('updated_at')}
//                 className="cursor-pointer"
//               >
//                 <div className="flex items-center justify-between w-full">
//                   <span>Última actividad</span>
//                   {sortConfig.field === 'updated_at' && (
//                     sortConfig.direction === 'asc' 
//                       ? <ArrowUp className="h-3 w-3" />
//                       : <ArrowDown className="h-3 w-3" />
//                   )}
//                 </div>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
        
//         <div className="divide-y divide-gray-200">
//           {sortedLeads.map((lead, index) => {
//             const statusDisplay = getStatusDisplay(lead.status);
//             return (
//               <div key={lead.id} className="p-4 hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-black transition-all duration-200 hover:scale-[1.01] hover:shadow-md rounded-lg mx-2">
//                 <div className="flex items-start justify-between mb-2">
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       {onSelectLead && (
//                         <Checkbox
//                           checked={selectedLeads.has(lead.id)}
//                           onCheckedChange={() => onSelectLead(lead.id)}
//                         />
//                       )}
//                       <span className="text-xs font-mono text-black dark:text-white bg-white dark:bg-black border border-gray-200 dark:border-white px-2 py-1 rounded">
//                         #{index + 1}
//                       </span>
//                     </div>
//                     <p className="text-sm font-medium text-black dark:text-white truncate">
//                       {lead.name || 'Sin nombre'}
//                     </p>
//                     <p className="text-xs text-black dark:text-white mt-1">
//                       {lead.company ? `${lead.company}` : 'Sin empresa'}
//                       {lead.position ? ` • ${lead.position}` : ''}
//                     </p>
//                   </div>
//                   <LeadActionsDropdown lead={lead} onShowLeadDetails={onShowLeadDetails} />
//                 </div>
                
//                 <div className="grid grid-cols-2 gap-3 mt-3">
//                   <div>
//                     <p className="text-xs text-black dark:text-white mb-1">Contacto</p>
//                     {lead.email && (
//                       <p className="text-xs text-black dark:text-white">{lead.email}</p>
//                     )}
//                     {lead.phone && (
//                       <p className="text-xs text-black dark:text-white">{lead.phone}</p>
//                     )}
//                     {!lead.email && !lead.phone && (
//                       <p className="text-xs text-black dark:text-white">Sin contacto</p>
//                     )}
//                   </div>
                  
//                   <div>
//                     <p className="text-xs text-black dark:text-white mb-1">Estado</p>
//                     <div className="flex items-center gap-1">
//                       <Badge variant={statusDisplay.variant} className="text-xs">
//                         {statusDisplay.label}
//                       </Badge>
//                       {lead.is_qualified && (
//                         <Badge variant="outline" className="text-xs">✓</Badge>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="mt-2">
//                   <p className="text-xs text-black dark:text-white mb-1">Llamadas</p>
//                   {(lead.contactAttempts || 0) > 0 ? (
//                     <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
//                       <Phone className="h-3 w-3 mr-1" />
//                       {lead.contactAttempts === 1 ? '1 llamada' : `${lead.contactAttempts} llamadas`}
//                     </Badge>
//                   ) : (
//                     <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
//                       <PhoneOff className="h-3 w-3 mr-1" />
//                       Sin llamadas
//                     </Badge>
//                   )}
//                 </div>
                
//                 <div className="grid grid-cols-1 gap-3 mt-2">
//                   <div>
//                     <p className="text-xs text-black dark:text-white">Actividad</p>
//                     <p className="text-xs text-black dark:text-white">
//                       {formatDate(lead.updated_at)}
//                     </p>
//                     {lead.next_follow_up_date && (
//                       <p className="text-xs text-orange-600 dark:text-orange-400">
//                         Próximo: {formatDate(lead.next_follow_up_date)}
//                       </p>
//                     )}
//                   </div>
//                 </div>

//                 <div className="mt-2">
//                     <p className="text-xs text-black dark:text-white">Campaña</p>
//                     <p className="text-sm font-medium text-black dark:text-white">
//                         {lead.campaign ? (lead.campaign.name || 'Sin nombre') : 'Falta Campaña'}
//                     </p>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Paginación */}
//       {showPagination && pagination && pagination.totalPages > 1 && (
//         <PaginationControls pagination={pagination} />
//       )}
//     </div>
//   );
// }

// // Componente de controles de paginación
// function PaginationControls({ pagination }: { pagination: PaginationProps }) {
//   const { currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange } = pagination;

//   const generatePageNumbers = () => {
//     const pages = [];
//     const maxVisiblePages = 5;
    
//     if (totalPages <= maxVisiblePages) {
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       if (currentPage <= 3) {
//         pages.push(1, 2, 3, 4, '...', totalPages);
//       } else if (currentPage >= totalPages - 2) {
//         pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
//       } else {
//         pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
//       }
//     }
    
//     return pages;
//   };

//   const startItem = (currentPage - 1) * itemsPerPage + 1;
//   const endItem = Math.min(currentPage * itemsPerPage, totalItems);

//   return (
//     <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200 dark:border-white bg-white dark:bg-black">
//       {/* Info de elementos */}
//       <div className="flex items-center gap-4 text-sm text-black dark:text-white">
//         <span>
//           Mostrando {startItem}-{endItem} de {totalItems} leads
//         </span>
        
//         {/* Selector de elementos por página */}
//         <div className="flex items-center gap-2">
//           <span>Mostrar:</span>
//           <select
//             value={itemsPerPage}
//             onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
//             className="border border-gray-300 dark:border-white rounded px-2 py-1 text-sm bg-white dark:bg-black text-black dark:text-white"
//           >
//             <option value={10}>10</option>
//             <option value={25}>25</option>
//             <option value={50}>50</option>
//             <option value={100}>100</option>
//           </select>
//         </div>
//       </div>

//       {/* Controles de navegación */}
//       <div className="flex items-center gap-1">
//         {/* Primera página */}
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => onPageChange(1)}
//           disabled={currentPage === 1}
//           className="h-8 w-8 p-0"
//         >
//           <ChevronsLeft className="h-3 w-3" />
//         </Button>

//         {/* Página anterior */}
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => onPageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className="h-8 w-8 p-0"
//         >
//           <ChevronLeft className="h-3 w-3" />
//         </Button>

//         {/* Números de página */}
//         {generatePageNumbers().map((page, index) => (
//           <React.Fragment key={index}>
//             {page === '...' ? (
//               <span className="px-2 py-1 text-black dark:text-white dark:text-gray-500">...</span>
//             ) : (
//               <Button
//                 variant={currentPage === page ? "default" : "outline"}
//                 size="sm"
//                 onClick={() => onPageChange(page as number)}
//                 className="h-8 w-8 p-0"
//               >
//                 {page}
//               </Button>
//             )}
//           </React.Fragment>
//         ))}

//         {/* Página siguiente */}
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => onPageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className="h-8 w-8 p-0"
//         >
//           <ChevronRight className="h-3 w-3" />
//         </Button>

//         {/* Última página */}
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => onPageChange(totalPages)}
//           disabled={currentPage === totalPages}
//           className="h-8 w-8 p-0"
//         >
//           <ChevronsRight className="h-3 w-3" />
//         </Button>
//       </div>
//     </div>
//   );
// }

// // Componente de estadísticas integrado en el mismo archivo
// interface StatCard {
//   id: string;
//   label: string;
//   value: number | string;
//   icon: React.ElementType;
//   trend?: {
//     value: number;
//     isPositive: boolean;
//     label: string;
//   };
//   tooltip?: string;
// }

// interface LeadsStatsCardsIntegratedProps {
//   leads: ExtendedLead[];
//   onCardClick?: (cardId: string, value: number | string) => void;
//   className?: string;
// }

// function LeadsStatsCardsIntegrated({
//   leads,
//   onCardClick,
//   className = ''
// }: LeadsStatsCardsIntegratedProps) {
//   // Calcular estadísticas por estado basado en los datos reales
//   const statsByStatus = React.useMemo(() => {
//     if (!leads || leads.length === 0) {
//       return {
//         total: 0,
//         new: 0,
//         interested: 0,
//         qualified: 0,
//         follow_up: 0,
//         proposal_current: 0,
//         proposal_previous: 0,
//         negotiation: 0,
//         nurturing: 0,
//         won: 0,
//         lost: 0,
//         cold: 0,
//         cotizaciones: 0,
//         descartados: 0
//       };
//     }

//     const statusCounts = {
//       total: leads.length,
//       new: leads.filter(l => l.status === 'new').length,
//       interested: leads.filter(l => l.status === 'interested' || (l.status as any) === 'contacted').length,
//       qualified: leads.filter(l => l.status === 'qualified').length,
//       follow_up: leads.filter(l => l.status === 'follow_up').length,
//       proposal_current: leads.filter(l => l.status === 'proposal_current').length,
//       proposal_previous: leads.filter(l => l.status === 'proposal_previous').length,
//       negotiation: leads.filter(l => l.status === 'negotiation').length,
//       nurturing: leads.filter(l => l.status === 'nurturing').length,
//       won: leads.filter(l => l.status === 'won').length,
//       lost: leads.filter(l => l.status === 'lost').length,
//       cold: leads.filter(l => l.status === 'cold').length,
//     };
    
//     return {
//       ...statusCounts,
//       cotizaciones: statusCounts.proposal_current + statusCounts.proposal_previous + statusCounts.negotiation,
//       descartados: statusCounts.cold + statusCounts.lost,
//     };
//   }, [leads]);

//   // Calcular tendencias (simuladas por ahora)
//   const getTrend = (id: string) => {
//     const trends: Record<string, { value: number; isPositive: boolean; label: string }> = {
//       total: { value: 12.5, isPositive: true, label: "vs mes anterior" },
//       new: { value: 8.3, isPositive: true, label: "esta semana" },
//       interested: { value: 15.2, isPositive: true, label: "vs promedio" },
//       qualified: { value: 3.1, isPositive: false, label: "vs meta" },
//       follow_up: { value: 5.7, isPositive: false, label: "pendientes" },
//       cotizaciones: { value: 22.1, isPositive: true, label: "en proceso" },
//       won: { value: 18.4, isPositive: true, label: "vs objetivo" },
//       descartados: { value: 4.2, isPositive: false, label: "tasa descarte" }
//     };
//     return trends[id];
//   };

//   // Cards por defecto basadas en las estadísticas reales
//   const defaultCards: StatCard[] = [
//     {
//       id: 'total',
//       label: 'Total Leads',
//       value: statsByStatus.total.toLocaleString(),
//       icon: Users,
//       trend: getTrend('total'),
//       tooltip: 'Total de leads en el sistema'
//     },
//     {
//       id: 'new',
//       label: 'Nuevos',
//       value: statsByStatus.new,
//       icon: Plus,
//       trend: getTrend('new'),
//       tooltip: 'Leads recién ingresados'
//     },
//     {
//       id: 'interested',
//       label: 'Potenciales',
//       value: statsByStatus.interested,
//       icon: TrendingUp,
//       trend: getTrend('interested'),
//       tooltip: 'Leads con interés confirmado'
//     },
//     {
//       id: 'qualified',
//       label: 'Calificados',
//       value: statsByStatus.qualified,
//       icon: Target,
//       trend: getTrend('qualified'),
//       tooltip: 'Leads que cumplen criterios'
//     },
//     {
//       id: 'follow_up',
//       label: 'Seguimiento',
//       value: statsByStatus.follow_up,
//       icon: Clock,
//       trend: getTrend('follow_up'),
//       tooltip: 'Leads pendientes de contacto'
//     },
//     {
//       id: 'cotizaciones',
//       label: 'Cotizaciones',
//       value: statsByStatus.cotizaciones,
//       icon: Download,
//       trend: getTrend('cotizaciones'),
//       tooltip: 'Leads en proceso de cotización'
//     },
//     {
//       id: 'won',
//       label: 'Ganados',
//       value: statsByStatus.won,
//       icon: CheckCircle,
//       trend: getTrend('won'),
//       tooltip: 'Leads convertidos exitosamente'
//     },
//     {
//       id: 'descartados',
//       label: 'Descartados',
//       value: statsByStatus.descartados,
//       icon: AlertCircle,
//       trend: getTrend('descartados'),
//       tooltip: 'Leads no viables o perdidos'
//     }
//   ];

//   const handleCardClick = (card: StatCard) => {
//     if (onCardClick) {
//       onCardClick(card.id, card.value);
//     }
//   };

//   return (
//     <div className={`max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto ${className}`}>
//       {/* Grid */}
//       <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
//         {defaultCards.map((card) => {
//           const trend = card.trend;
          
//           return (
//             <div
//               key={card.id}
//               className={`
//                 flex flex-col bg-white dark:bg-black border border-gray-200 dark:border-white shadow-2xs rounded-xl 
//                 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-orange-500 dark:hover:border-orange-500
//                 ${onCardClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'hover:scale-102'}
//                 group
//               `}
//               onClick={() => handleCardClick(card)}
//             >
//               <div className="p-4 md:p-5 flex gap-x-4">
//                 <div className="shrink-0 flex justify-center items-center size-11 bg-white dark:bg-black border border-gray-200 dark:border-white rounded-lg transition-all duration-200 group-hover:border-orange-500 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/20">
//                   <card.icon className="shrink-0 size-5 text-black dark:text-white group-hover:text-orange-500 transition-colors duration-200" />
//                 </div>

//                 <div className="grow">
//                   <div className="flex items-center gap-x-2">
//                     <p className="text-xs uppercase text-black dark:text-white">
//                       {card.label}
//                     </p>
//                     {card.tooltip && (
//                       <div className="hs-tooltip">
//                         <div className="hs-tooltip-toggle">
//                           <AlertCircle className="shrink-0 size-4 text-black dark:text-white" />
//                           <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-black dark:bg-white text-xs font-medium text-white dark:text-black rounded-md shadow-2xs" role="tooltip">
//                             {card.tooltip}
//                           </span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                   <div className="mt-1 flex items-center gap-x-2">
//                     <h3 className="text-xl sm:text-2xl font-medium text-black dark:text-white">
//                       {card.value}
//                     </h3>
//                     {trend && (
//                       <span className={`
//                         inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-xs font-medium
//                         ${trend.isPositive 
//                           ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-300' 
//                           : 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300'
//                         }
//                       `}>
//                         {trend.isPositive ? (
//                           <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
//                             <polyline points="16 7 22 7 22 13"/>
//                           </svg>
//                         ) : (
//                           <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
//                             <polyline points="16 17 22 17 22 11"/>
//                           </svg>
//                         )}
//                         <span className="inline-block text-xs font-medium">
//                           {trend.value}%
//                         </span>
//                       </span>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//       {/* End Grid */}
//     </div>
//   );
// }

// // Componente para el menú de acciones de cada lead
// interface LeadActionsDropdownProps {
//   lead: ExtendedLead;
//   onShowLeadDetails?: (lead: ExtendedLead) => void;
// }

// function LeadActionsDropdown({ lead, onShowLeadDetails }: { lead: ExtendedLead, onShowLeadDetails?: (lead: ExtendedLead) => void }) {
//   const router = useRouter();
//   const { user } = useAuth();
//   // NOTE: Voice manager removed - now calls are handled by CallModal with ENV agent
//   const { deleteLead, updateLead, updateLeadStatus, qualifyLead, convertToClient, assignToAgent, scheduleFollowUp } = useLeadsContext();
  
//   // Estado para el modal de acciones
//   const [actionsModalOpen, setActionsModalOpen] = useState(false);
//   const [currentAction, setCurrentAction] = useState<'changeStatus' | 'qualify' | 'convertToClient' | 'assignAgent' | 'scheduleFollowUp' | 'edit' | null>(null);
  
//   // Temporalmente deshabilitado hasta que se implemente la API correcta
//   const agents: any[] = [];
//   const activeAgents: any[] = [];
//   const agentsLoading = false;

//   // NOTE: Direct calling removed - now handled by CallModal component
//   const handleMakeCall = async (leadData: ExtendedLead) => {
//     // Redirect to using CallModal for all calls
//     console.log('Direct call functionality deprecated, use CallModal instead');
//   };

//   // Función para abrir el modal de acciones
//   const openActionModal = (actionType: typeof currentAction) => {
//     setCurrentAction(actionType);
//     setActionsModalOpen(true);
//   };

//   // Función para manejar el envío del modal de acciones
//   const handleActionSubmit = async (actionType: ActionType, data: ActionData) => {
//     try {
//       switch (actionType) {
//         case 'changeStatus':
//           const { status, notes } = data as ChangeStatusData;
//           await updateLeadStatus(lead.id, status, notes);
//           alert(`Estado actualizado a: ${status}`);
//           break;
//         case 'qualify':
//           const { isQualified, score, notes: qualifyNotes } = data as QualifyData;
//           await qualifyLead(lead.id, isQualified, score, qualifyNotes);
//           alert(`Lead ${isQualified ? 'calificado' : 'descalificado'} exitosamente`);
//           break;
//         case 'convertToClient':
//           const { notes: convertNotes, createClient } = data as ConvertToClientData;
//           await convertToClient(lead.id, { notes: convertNotes, createClient });
//           alert('Lead convertido a cliente exitosamente');
//           break;
//         case 'assignAgent':
//           const { agentId, agentName } = data as AssignAgentData;
//           await assignToAgent(lead.id, agentId, agentName);
//           alert(`Agente ${agentName} asignado exitosamente`);
//           break;
//         case 'scheduleFollowUp':
//           const { followUpDate, notes: followUpNotes } = data as ScheduleFollowUpData;
//           const followUpDateObj = new Date(followUpDate);
//           await scheduleFollowUp(lead.id, followUpDateObj, followUpNotes);
//           alert('Seguimiento programado exitosamente');
//           break;
//         case 'edit':
//           const updates = data as EditData;
//           const leadUpdates: Partial<ExtendedLead> = {};
//           Object.keys(updates).forEach(key => {
//             if (updates[key as keyof EditData] !== lead[key as keyof ExtendedLead] && updates[key as keyof EditData] !== '') {
//               (leadUpdates[key as keyof ExtendedLead] as any) = updates[key as keyof EditData];
//             }
//           });

//           if (Object.keys(leadUpdates).length > 0) {
//             await updateLead(lead.id, leadUpdates);
//             alert('Lead actualizado exitosamente');
//           }
//           break;
//       }
//     } catch (error) {
//       console.error('Error en acción:', error);
//       alert('Error al ejecutar la acción');
//     }
//   };


//   const handleQuickStatusChange = async (newStatus: string) => {
//     try {
//       await updateLeadStatus(lead.id, newStatus, `Estado cambiado a ${newStatus} desde tabla`);
//       // Mostrar notificación de éxito aquí si tienes sistema de notificaciones
//     } catch (error) {
//       console.error('Error cambiando estado:', error);
//       alert('Error al cambiar el estado');
//     }
//   };

//   return (
//     <>
//     <div className="flex items-center gap-1">
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <Button 
//             variant="outline" 
//             size="sm" 
//             className="h-8 px-2 text-xs border-gray-300 dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 hover:text-black transition-all duration-200 hover:scale-105 active:scale-95"
//           >
//             <Edit className="h-3 w-3" />
//           </Button>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent align="end" className="w-48">
//           <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
//           <DropdownMenuSeparator />
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('new')}>
//             <AlertCircle className="h-3 w-3 mr-2 text-gray-500" />
//             Nuevo
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('interested')}>
//             <Clock className="h-3 w-3 mr-2 text-blue-500" />
//             Interesado
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('qualified')}>
//             <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
//             Calificado
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('follow_up')}>
//             <Clock className="h-3 w-3 mr-2 text-yellow-500" />
//             En Seguimiento
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('proposal_current')}>
//             <TrendingUp className="h-3 w-3 mr-2 text-orange-500" />
//             Propuesta Actual
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('proposal_previous')}>
//             <TrendingUp className="h-3 w-3 mr-2 text-orange-400" />
//             Propuesta Anterior
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('negotiation')}>
//             <Users className="h-3 w-3 mr-2 text-purple-500" />
//             Negociación
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('nurturing')}>
//             <Clock className="h-3 w-3 mr-2 text-indigo-500" />
//             Maduración
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('won')}>
//             <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
//             Ganado
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('lost')}>
//             <X className="h-3 w-3 mr-2 text-red-500" />
//             Perdido
//           </DropdownMenuItem>
//           <DropdownMenuItem onClick={() => handleQuickStatusChange('cold')}>
//             <AlertCircle className="h-3 w-3 mr-2 text-gray-400" />
//             Frío
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
      
//       <Button 
//         variant="outline" 
//         size="sm" 
//         className="h-8 px-3 text-xs border-gray-300 dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 hover:text-black transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md"
//         onClick={() => router.push(`/clients/leads/${lead.id}/work`)}
//       >
//         Trabajar
//       </Button>
//     </div>
    
//     {/* Modal de Acciones */}
//     <LeadActionsModal
//       isOpen={actionsModalOpen}
//       onClose={() => {
//         setActionsModalOpen(false);
//         setCurrentAction(null);
//       }}
//       lead={lead}
//       actionType={currentAction}
//       onSubmit={handleActionSubmit}
//     />
//     </>
//   );
// }
