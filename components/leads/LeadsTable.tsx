// 'use client';

// /**
//  * LEADS TABLE COMPONENT
//  * 
//  * Vista de tabla para gestión eficiente de leads
//  * Complementa la vista Kanban con mejor visibilidad de datos
//  */

// import React, { useState, useMemo, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Checkbox } from '@/components/ui/checkbox';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { 
//   Search,
//   Filter,
//   Download,
//   Trash2,
//   Edit,
//   Eye,
//   Phone,
//   Mail,
//   MessageSquare,
//   Calendar,
//   Star,
//   TrendingUp,
//   Clock,
//   AlertCircle,
//   CheckCircle,
//   DollarSign,
//   Building,
//   User,
//   ArrowUpDown,
//   ArrowUp,
//   ArrowDown,
//   ChevronDown,
//   UserPlus,
//   RefreshCw,
//   PhoneCall,
//   Target,
//   Settings,
//   BarChart3,
//   PlayCircle,
//   Zap,
//   Brain,
//   Bot
// } from 'lucide-react';

// import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
// import { useLeads } from '@/modules/leads/hooks/useLeads';
// import { useLeadCalls } from '@/modules/leads/hooks/useLeadCalls';
// import { LeadStatus, LeadPriority, LeadSource } from '@/modules/leads/types/leads';
// import { getLeadDataStatus } from '@/modules/leads/utils/leadDataValidator';
// import { CallConfirmationModal } from './CallConfirmationModal';
// import { EnhancedLeadsFilters } from './EnhancedLeadsFilters';
// import { QuickAnalyticsPanel } from './QuickAnalyticsPanel';
// import { useRouter } from 'next/navigation';
// import { MassiveCallFilters, EligibilityStats } from '@/types/bulkCalls';
// import { useTenant } from '@/contexts/TenantContext';

// // Configuración de columnas
// interface TableColumn {
//   key: keyof ExtendedLead | 'actions' | 'select' | 'call_status' | 'campaign' | 'conversation_analysis' | 'contact_attempts';
//   label: string;
//   sortable: boolean;
//   width?: string;
//   visible: boolean;
// }

// const DEFAULT_COLUMNS: TableColumn[] = [
//   { key: 'select', label: '', sortable: false, width: '50px', visible: true },
//   { key: 'name', label: 'Lead', sortable: true, width: '200px', visible: true },
//   { key: 'phone', label: 'Contacto', sortable: true, width: '130px', visible: true },
//   { key: 'campaign', label: 'Campaña', sortable: true, width: '150px', visible: true },
//   { key: 'status', label: 'Estado', sortable: true, width: '140px', visible: true },
//   { key: 'call_status', label: 'Llamadas', sortable: true, width: '120px', visible: true },
//   { key: 'conversation_analysis', label: 'Análisis IA', sortable: true, width: '200px', visible: true },
//   { key: 'actions', label: 'Acciones', sortable: false, width: '120px', visible: true },
//   { key: 'last_contact_date', label: 'Última Actividad', sortable: true, width: '120px', visible: false },
//   { key: 'priority', label: 'Prioridad', sortable: true, width: '100px', visible: false },
//   { key: 'source', label: 'Fuente', sortable: true, width: '120px', visible: false },
//   { key: 'company', label: 'Empresa', sortable: true, width: '150px', visible: false },
//   { key: 'email', label: 'Email', sortable: false, width: '180px', visible: false },
//   { key: 'contact_attempts', label: 'Intentos', sortable: true, width: '80px', visible: false },
//   { key: 'created_at', label: 'Creado', sortable: true, width: '100px', visible: false },
//   { key: 'conversion_value', label: 'Valor', sortable: true, width: '100px', visible: false },
// ];

// // Funciones auxiliares
// const getInitials = (name: string): string => {
//   if (!name || typeof name !== 'string') return 'LD';
//   return name
//     .trim()
//     .split(' ')
//     .filter(n => n.length > 0)
//     .map(n => n[0])
//     .join('')
//     .toUpperCase()
//     .slice(0, 2) || 'LD';
// };

// const getPriorityColor = (priority: LeadPriority): string => {
//   const colors: Record<LeadPriority, string> = {
//     low: 'bg-gray-100 text-gray-800',
//     medium: 'bg-blue-100 text-blue-800',
//     high: 'bg-orange-100 text-orange-800',
//     urgent: 'bg-red-100 text-red-800'
//   };
//   return colors[priority];
// };

// const getStatusColor = (status: LeadStatus): string => {
//   const colors: Record<LeadStatus, string> = {
//     new: 'bg-blue-100 text-blue-800',
//     interested: 'bg-green-100 text-green-800',
//     qualified: 'bg-purple-100 text-purple-800',
//     follow_up: 'bg-amber-100 text-amber-800',
//     proposal_current: 'bg-orange-100 text-orange-800',
//     proposal_previous: 'bg-orange-200 text-orange-900',
//     negotiation: 'bg-indigo-100 text-indigo-800',
//     nurturing: 'bg-cyan-100 text-cyan-800',
//     won: 'bg-green-100 text-green-800',
//     lost: 'bg-red-100 text-red-800',
//     cold: 'bg-gray-100 text-gray-800'
//   };
//   return colors[status];
// };

// const formatDate = (timestamp?: { _seconds: number }): string => {
//   if (!timestamp) return '-';
//   return new Date(timestamp._seconds * 1000).toLocaleDateString('es-ES', {
//     day: '2-digit',
//     month: 'short',
//     year: '2-digit'
//   });
// };

// const formatCurrency = (value?: number): string => {
//   if (!value || value === 0) return '-';
//   return `$${value.toLocaleString()}`;
// };

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

// // Función para obtener el estado de las llamadas
// const getCallStatusInfo = (lead: any) => {
//   const attempts = lead.contactAttempts || 0;
//   const lastResult = lead.lastCallResult;
//   const daysSinceLastCall = lead.daysSinceLastCall;
  
//   if (attempts === 0) {
//     return {
//       status: 'sin_llamar',
//       label: 'Sin llamar',
//       color: 'bg-gray-100 text-gray-800',
//       icon: '📞'
//     };
//   }
  
//   if (lastResult === 'FULL_SUCCESS') {
//     return {
//       status: 'exitosa',
//       label: 'Exitosa',
//       color: 'bg-green-100 text-green-800',
//       icon: '✅'
//     };
//   }
  
//   if (lastResult === 'NO_ANSWER') {
//     return {
//       status: 'no_contesto',
//       label: 'No contestó',
//       color: 'bg-yellow-100 text-yellow-800',
//       icon: '📵'
//     };
//   }
  
//   if (lastResult === 'FAILED') {
//     return {
//       status: 'fallida',
//       label: 'Falló',
//       color: 'bg-red-100 text-red-800',
//       icon: '❌'
//     };
//   }
  
//   if (lastResult === 'BUSY') {
//     return {
//       status: 'ocupado',
//       label: 'Ocupado',
//       color: 'bg-orange-100 text-orange-800',
//       icon: '🔕'
//     };
//   }
  
//   // Estado por defecto si hay intentos pero sin resultado específico
//   return {
//     status: 'intentando',
//     label: `${attempts} intentos`,
//     color: 'bg-blue-100 text-blue-800',
//     icon: '🔄'
//   };
// };

// // Props del componente
// interface LeadsTableProps {
//   leads: any[];
//   isLoading: boolean;
//   pagination?: any;
//   showPagination?: boolean;
//   selectedLeads?: Set<string>;
//   onSelectLead?: (leadId: string) => void;
//   onSelectAll?: (leads: any[]) => void;
//   onShowNewLeadForm?: () => void;
//   onShowLeadDetails?: (lead: any) => void;
//   onCallLead?: (lead: any) => void;
// }

// // Componente principal
// export function LeadsTable({ 
//   leads: tableLeads = [], 
//   isLoading: tableIsLoading = false, 
//   pagination, 
//   showPagination = true,
//   selectedLeads: tableSelectedLeads = new Set(),
//   onSelectLead,
//   onSelectAll,
//   onShowNewLeadForm,
//   onShowLeadDetails,
//   onCallLead
// }: LeadsTableProps) {
  
//   const { updateLead, updateLeadStatus, deleteLead, bulkDeleteLeads } = useLeads();
//   const { initiateCall, loading: callLoading } = useLeadCalls();
//   const { currentTenant, currentOrganization } = useTenant();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
//   const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
//   const [callModalOpen, setCallModalOpen] = useState(false);
//   const [selectedLeadForCall, setSelectedLeadForCall] = useState<any>(null);
//   const router = useRouter();
//   const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
//   // Cargar preferencias de ordenamiento desde localStorage
//   const [sortField, setSortField] = useState<keyof ExtendedLead>(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem('leads-table-sort-field');
//       return (saved as keyof ExtendedLead) || 'created_at';
//     }
//     return 'created_at';
//   });
  
//   const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
//     if (typeof window !== 'undefined') {
//       const saved = localStorage.getItem('leads-table-sort-direction');
//       return (saved as 'asc' | 'desc') || 'desc';
//     }
//     return 'desc';
//   });
//   const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_COLUMNS);
//   const [campaigns, setCampaigns] = useState<{id: string; name: string}[]>([]);
//   const [conversationAnalyses, setConversationAnalyses] = useState<Map<string, any>>(new Map());
//   const [showBulkOptions, setShowBulkOptions] = useState(false);
//   const [showQuickAnalytics, setShowQuickAnalytics] = useState(false);
//   const [bulkFilters, setBulkFilters] = useState<MassiveCallFilters>({});
//   const [eligibilityStats, setEligibilityStats] = useState<EligibilityStats>({ total: 0, eligible: 0, reasons: {} });

//   useEffect(() => {
//     if (!currentTenant || !currentOrganization) return;
//     const fetchCampaigns = async () => {
//       try {
//         const queryParams = new URLSearchParams({
//           tenantId: currentTenant.id,
//           organizationId: currentOrganization.id,
//           status: 'active'
//         });
//         const response = await fetch(`/api/campaigns?${queryParams.toString()}`);
//         const data = await response.json();
//         if (data.success) {
//           setCampaigns(data.data.campaigns);
//         }
//       } catch (error) {
//         console.error('Error loading campaigns:', error);
//       }
//     };
//     fetchCampaigns();
//   }, [currentTenant, currentOrganization]);

//   // Función para obtener análisis de conversación de un lead
//   const fetchConversationAnalysis = async (leadId: string) => {
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
//   };

//   // Cargar análisis de conversación para los leads visibles
//   useEffect(() => {
//     const loadAnalyses = async () => {
//       const newAnalyses = new Map();
      
//       // Solo cargar análisis para los primeros 20 leads para rendimiento
//       const leadsToAnalyze = tableLeads.slice(0, 20);
      
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
    
//     if (tableLeads.length > 0) {
//       loadAnalyses();
//     }
//   }, [tableLeads]);

//   // Función para manejar confirmación de llamada
//   const handleConfirmCall = async (leadId: string, agentId: string, notes?: string) => {
//     try {
//       const lead = tableLeads.find(l => l.id === leadId);
//       if (!lead?.phone) {
//         throw new Error('El lead no tiene un número de teléfono válido');
//       }
//       const result = await initiateCall(leadId, agentId, lead.phone, notes);
//       console.log('Llamada iniciada exitosamente:', result);
//       alert(`Llamada iniciada exitosamente al lead ${lead.name}`);
//     } catch (error) {
//       console.error('Error al iniciar llamada:', error);
//       throw error;
//     }
//   };

//   const filteredAndSortedLeads = useMemo(() => {
//     let filtered = [...tableLeads];
//     if (searchTerm) {
//       const search = searchTerm.toLowerCase();
//       filtered = filtered.filter(lead => 
//         lead.name?.toLowerCase().includes(search) ||
//         lead.email?.toLowerCase().includes(search) ||
//         lead.phone?.includes(search) ||
//         lead.company?.toLowerCase().includes(search)
//       );
//     }
//     if (!showBulkOptions) {
//       if (statusFilter !== 'all') {
//         filtered = filtered.filter(lead => lead.status === statusFilter);
//       }
//       if (priorityFilter !== 'all') {
//         filtered = filtered.filter(lead => lead.priority === priorityFilter);
//       }
//       if (sourceFilter !== 'all') {
//         filtered = filtered.filter(lead => lead.source === sourceFilter);
//       }
//     } else {
//       filtered = applyBulkFilters(filtered, bulkFilters);
//     }
//     filtered.sort((a, b) => {
//       let aValue: any;
//       let bValue: any;
      
//       // Casos especiales de ordenamiento
//       switch (sortField) {
//         case 'campaign':
//           aValue = a.campaignId ? campaigns.find(c => c.id === a.campaignId)?.name || 'Sin campaña' : 'Sin campaña';
//           bValue = b.campaignId ? campaigns.find(c => c.id === b.campaignId)?.name || 'Sin campaña' : 'Sin campaña';
//           break;
//         case 'conversation_analysis':
//           const aAnalysis = conversationAnalyses.get(a.id);
//           const bAnalysis = conversationAnalyses.get(b.id);
//           aValue = aAnalysis?.score || 0;
//           bValue = bAnalysis?.score || 0;
//           break;
//         case 'call_status':
//           aValue = a.contactAttempts || 0;
//           bValue = b.contactAttempts || 0;
//           break;
//         default:
//           aValue = a[sortField];
//           bValue = b[sortField];
//       }
      
//       // Manejar objetos timestamp
//       if (aValue && typeof aValue === 'object' && '_seconds' in aValue) {
//         aValue = aValue._seconds;
//       }
//       if (bValue && typeof bValue === 'object' && '_seconds' in bValue) {
//         bValue = bValue._seconds;
//       }
      
//       // Comparación
//       if (aValue == null && bValue == null) return 0;
//       if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
//       if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      
//       // Comparación de strings (case insensitive)
//       if (typeof aValue === 'string' && typeof bValue === 'string') {
//         const aLower = aValue.toLowerCase();
//         const bLower = bValue.toLowerCase();
//         if (sortDirection === 'asc') {
//           return aLower < bLower ? -1 : aLower > bLower ? 1 : 0;
//         } else {
//           return aLower > bLower ? -1 : aLower < bLower ? 1 : 0;
//         }
//       }
      
//       // Comparación numérica
//       if (sortDirection === 'asc') {
//         return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
//       } else {
//         return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
//       }
//     });
//     return filtered;
//   }, [tableLeads, searchTerm, statusFilter, priorityFilter, sourceFilter, sortField, sortDirection, showBulkOptions, bulkFilters]);

//   const handleSort = (field: keyof ExtendedLead) => {
//     let newDirection: 'asc' | 'desc';
    
//     if (sortField === field) {
//       newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
//       setSortDirection(newDirection);
//     } else {
//       setSortField(field);
//       newDirection = 'asc';
//       setSortDirection('asc');
//     }
    
//     // Guardar preferencias en localStorage
//     localStorage.setItem('leads-table-sort-field', field);
//     localStorage.setItem('leads-table-sort-direction', newDirection);
//   };

//   const handleSelectAll = (checked: boolean) => {
//     if (onSelectAll) {
//       onSelectAll(filteredAndSortedLeads);
//     }
//   };

//   const handleSelectLead = (leadId: string, checked: boolean) => {
//     if (onSelectLead) {
//       onSelectLead(leadId);
//     }
//   };

//   const handleBulkDelete = async () => {
//     if (tableSelectedLeads.size === 0) return;
//     try {
//       await bulkDeleteLeads(Array.from(tableSelectedLeads));
//     } catch (error) {
//       console.error('Error en eliminación masiva:', error);
//     }
//   };

//   const handleToggleBulkMode = () => {
//     setShowBulkOptions(!showBulkOptions);
//     if (!showBulkOptions) {
//       setStatusFilter('all');
//       setPriorityFilter('all');
//       setSourceFilter('all');
//     } else {
//       setBulkFilters({});
//     }
//   };

//   const handleBulkFiltersChange = (filters: MassiveCallFilters) => {
//     setBulkFilters(filters);
//     updateEligibilityStats(filters);
//   };

//   const updateEligibilityStats = (filters: MassiveCallFilters) => {
//     const totalFiltered = applyBulkFilters(tableLeads, filters).length;
//     const eligible = applyBulkFilters(tableLeads, {
//       ...filters,
//       eligibleForCall: true,
//       blacklistedForCalls: false
//     }).length;
//     setEligibilityStats({
//       total: totalFiltered,
//       eligible,
//       reasons: {}
//     });
//   };

//   const handleBulkCall = async () => {
//     if (tableSelectedLeads.size === 0) {
//       alert('Por favor selecciona al menos un lead para las llamadas masivas');
//       return;
//     }
//     console.log('Iniciando llamadas masivas para leads:', Array.from(tableSelectedLeads));
//     alert(`Preparando llamadas masivas para ${tableSelectedLeads.size} leads...`);
//   };

//   const handleCreateCallQueue = async () => {
//     if (tableSelectedLeads.size === 0) {
//       alert('Por favor selecciona al menos un lead para crear la cola de llamadas');
//       return;
//     }
//     console.log('Creando cola de llamadas para leads:', Array.from(tableSelectedLeads));
//     console.log('Con filtros aplicados:', bulkFilters);
//     alert(`Creando cola de llamadas para ${tableSelectedLeads.size} leads...`);
//   };

//   const applyBulkFilters = (leads: any[], filters: MassiveCallFilters): any[] => {
//     let filtered = [...leads];
//     if (filters.status?.length) {
//       filtered = filtered.filter(lead => filters.status!.includes(lead.status));
//     }
//     if (filters.priority?.length) {
//       filtered = filtered.filter(lead => filters.priority!.includes(lead.priority));
//     }
//     if (filters.source?.length) {
//       filtered = filtered.filter(lead => filters.source!.includes(lead.source));
//     }
//     if (filters.qualificationScore) {
//       const { min, max } = filters.qualificationScore;
//       filtered = filtered.filter(lead => {
//         const score = lead.qualification_score || 0;
//         return score >= min && score <= max;
//       });
//     }
//     if (filters.engagementScore) {
//       const { min, max } = filters.engagementScore;
//       filtered = filtered.filter(lead => {
//         const score = lead.last_engagement_score || 0;
//         return score >= min && score <= max;
//       });
//     }
//     if (filters.eligibleForCall === true) {
//       filtered = filtered.filter(lead => {
//         return !lead.blacklisted_for_calls && 
//                lead.phone && 
//                (lead.consecutive_failures || 0) < 5;
//       });
//     }
//     if (filters.blacklistedForCalls === false) {
//       filtered = filtered.filter(lead => !lead.blacklisted_for_calls);
//     }
//     return filtered;
//   };

//   const stats = useMemo(() => {
//     const total = filteredAndSortedLeads.length;
//     const qualified = filteredAndSortedLeads.filter(l => l.is_qualified).length;
//     const totalValue = filteredAndSortedLeads.reduce((sum, l) => sum + (l.conversion_value || 0), 0);
//     const avgScore = total > 0 ? 
//       filteredAndSortedLeads.reduce((sum, l) => sum + (l.qualification_score || 0), 0) / total : 0;
//     return { total, qualified, totalValue, avgScore };
//   }, [filteredAndSortedLeads]);

//   useEffect(() => {
//     if (showBulkOptions) {
//       updateEligibilityStats(bulkFilters);
//     }
//   }, [filteredAndSortedLeads, showBulkOptions, bulkFilters]);

//   if (tableIsLoading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="text-center">
//           <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
//           <p className="text-muted-foreground">Cargando tabla de leads...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {showBulkOptions && (
//         <div className="space-y-4">
//           <EnhancedLeadsFilters
//             onFiltersChange={handleBulkFiltersChange}
//             eligibilityStats={eligibilityStats}
//             showBulkOptions={showBulkOptions}
//             isLoading={tableIsLoading}
//           />
//         </div>
//       )}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <User className="h-4 w-4 text-blue-600" />
//               <div>
//                 <p className="text-sm font-medium">Total Leads</p>
//                 <p className="text-2xl font-bold">{stats.total}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <CheckCircle className="h-4 w-4 text-green-600" />
//               <div>
//                 <p className="text-sm font-medium">Calificados</p>
//                 <p className="text-2xl font-bold">{stats.qualified}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               <DollarSign className="h-4 w-4 text-green-600" />
//               <div>
//                 <p className="text-sm font-medium">Valor Total</p>
//                 <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center space-x-2">
//               {showBulkOptions ? (
//                 <>
//                   <Target className="h-4 w-4 text-green-600" />
//                   <div>
//                     <p className="text-sm font-medium">Elegibles</p>
//                     <p className="text-2xl font-bold">{eligibilityStats.eligible}</p>
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   <Star className="h-4 w-4 text-yellow-600" />
//                   <div>
//                     <p className="text-sm font-medium">Score Promedio</p>
//                     <p className="text-2xl font-bold">{stats.avgScore.toFixed(0)}</p>
//                   </div>
//                 </>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//       <Card>
//         <CardHeader className="pb-4">
//           <div className="flex flex-col gap-4">
//             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
//               <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
//                 <div className="relative w-full sm:w-80">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                   <Input
//                     placeholder="Buscar leads..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//                 <Button
//                   variant={showBulkOptions ? "default" : "outline"}
//                   size="sm"
//                   onClick={handleToggleBulkMode}
//                   className={showBulkOptions ? "bg-blue-600 text-white" : ""}
//                 >
//                   <PhoneCall className="h-4 w-4 mr-2" />
//                   {showBulkOptions ? 'Modo Masivo Activo' : 'Llamadas Masivas'}
//                 </Button>
//               </div>
//               <div className="flex gap-2">
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={() => setShowQuickAnalytics(!showQuickAnalytics)}
//                   className={showQuickAnalytics ? "bg-purple-50 border-purple-200 text-purple-700" : ""}
//                 >
//                   <Target className="h-4 w-4 mr-2" />
//                   {showQuickAnalytics ? 'Ocultar Métricas' : 'Mostrar Métricas'}
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   size="sm"
//                   onClick={async () => {
//                     try {
//                       const response = await fetch('/api/analytics/auto-progression', {
//                         method: 'POST',
//                         headers: { 'Content-Type': 'application/json' },
//                         body: JSON.stringify({ action: 'start', config: { intervalMinutes: 15 } })
//                       });
//                       const result = await response.json();
//                       if (result.success) {
//                         alert('🤖 Motor de automatización iniciado! Se ejecutará cada 15 minutos.');
//                       } else {
//                         alert('❌ Error: ' + result.error);
//                       }
//                     } catch (error) {
//                       alert('❌ Error al iniciar automatización');
//                     }
//                   }}
//                   className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
//                 >
//                   <Bot className="h-4 w-4 mr-2" />
//                   Iniciar Automatización IA
//                 </Button>
//                 <Button variant="outline" size="sm">
//                   <Download className="h-4 w-4 mr-2" />
//                   Exportar
//                 </Button>
//                 <Button size="sm">
//                   <UserPlus className="h-4 w-4 mr-2" />
//                   Nuevo Lead
//                 </Button>
//               </div>
//             </div>
//             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
//               {!showBulkOptions && (
//                 <div className="flex gap-2">
//                   <Select value={statusFilter} onValueChange={(value: LeadStatus | 'all') => setStatusFilter(value)}>
//                     <SelectTrigger className="w-40">
//                       <SelectValue placeholder="Estado" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">Todos los estados</SelectItem>
//                       <SelectItem value="new">Nuevo</SelectItem>
//                       <SelectItem value="interested">Interesado</SelectItem>
//                       <SelectItem value="qualified">Calificado</SelectItem>
//                       <SelectItem value="follow_up">Seguimiento</SelectItem>
//                       <SelectItem value="proposal_current">Cotización Actual</SelectItem>
//                       <SelectItem value="negotiation">Negociación</SelectItem>
//                       <SelectItem value="won">Ganado</SelectItem>
//                       <SelectItem value="lost">Perdido</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <Select value={priorityFilter} onValueChange={(value: LeadPriority | 'all') => setPriorityFilter(value)}>
//                     <SelectTrigger className="w-36">
//                       <SelectValue placeholder="Prioridad" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">Todas</SelectItem>
//                       <SelectItem value="urgent">Urgente</SelectItem>
//                       <SelectItem value="high">Alta</SelectItem>
//                       <SelectItem value="medium">Media</SelectItem>
//                       <SelectItem value="low">Baja</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               )}
//               {showBulkOptions && (
//                 <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
//                   <div className="flex items-center gap-4">
//                     <div className="text-sm text-muted-foreground">
//                       <span className="font-medium">{stats.total}</span> leads filtrados •{' '}
//                       <span className="font-medium text-green-600">{eligibilityStats.eligible}</span> elegibles para llamadas
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     {tableSelectedLeads.size > 0 && (
//                       <>
//                         <Button 
//                           variant="destructive" 
//                           size="sm"
//                           onClick={handleBulkDelete}
//                         >
//                           <Trash2 className="h-4 w-4 mr-2" />
//                           Eliminar ({tableSelectedLeads.size})
//                         </Button>
//                         <Button 
//                           variant="default" 
//                           size="sm"
//                           onClick={handleBulkCall}
//                           className="bg-green-600 hover:bg-green-700"
//                         >
//                           <PlayCircle className="h-4 w-4 mr-2" />
//                           Llamar Ahora ({tableSelectedLeads.size})
//                         </Button>
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           onClick={handleCreateCallQueue}
//                         >
//                           <BarChart3 className="h-4 w-4 mr-2" />
//                           Crear Cola ({tableSelectedLeads.size})
//                         </Button>
//                         <Button 
//                           variant="outline" 
//                           size="sm"
//                           onClick={() => {
//                             alert(`Programar reuniones para ${tableSelectedLeads.size} leads`);
//                           }}
//                           className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-teal-100"
//                         >
//                           <Calendar className="h-4 w-4 mr-2" />
//                           Agendar ({tableSelectedLeads.size})
//                         </Button>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               )}
//               {!showBulkOptions && tableSelectedLeads.size > 0 && (
//                 <Button 
//                   variant="destructive" 
//                   size="sm"
//                   onClick={handleBulkDelete}
//                 >
//                   Eliminar ({tableSelectedLeads.size})
//                 </Button>
//               )}
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   {columns.filter(col => col.visible).map((column) => (
//                     <TableHead 
//                       key={column.key} 
//                       style={{ width: column.width }}
//                       className={column.sortable ? "cursor-pointer select-none" : ""}
//                       onClick={() => column.sortable && column.key !== 'select' && column.key !== 'actions' && handleSort(column.key as keyof ExtendedLead)}
//                     >
//                       <div className="flex items-center gap-2">
//                         {column.key === 'select' ? (
//                           <Checkbox
//                             checked={tableSelectedLeads.size === filteredAndSortedLeads.length && filteredAndSortedLeads.length > 0}
//                             indeterminate={tableSelectedLeads.size > 0 && tableSelectedLeads.size < filteredAndSortedLeads.length}
//                             onCheckedChange={handleSelectAll}
//                           />
//                         ) : (
//                           <>
//                             {column.label}
//                             {column.sortable && (
//                               <div className="ml-1">
//                                 {column.key === sortField ? (
//                                   sortDirection === 'asc' ? (
//                                     <ArrowUp className="h-3 w-3 text-orange-600" />
//                                   ) : (
//                                     <ArrowDown className="h-3 w-3 text-orange-600" />
//                                   )
//                                 ) : (
//                                   <ArrowUpDown className="h-3 w-3 text-gray-400" />
//                                 )}
//                               </div>
//                             )}
//                           </>
//                         )}
//                       </div>
//                     </TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredAndSortedLeads.map((lead) => {
//                   const dataStatus = getLeadDataStatus(lead);
//                   return (
//                     <TableRow key={lead.id} className="hover:bg-muted/50">
//                       {columns.find(c => c.key === 'select')?.visible && (
//                         <TableCell>
//                           <Checkbox
//                             checked={tableSelectedLeads.has(lead.id)}
//                             onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
//                           />
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'name')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center space-x-3">
//                             <Avatar className="h-8 w-8">
//                               <AvatarFallback className="text-xs">
//                                 {getInitials(lead.name)}
//                               </AvatarFallback>
//                             </Avatar>
//                             <div className="min-w-0">
//                               <div className="flex items-center gap-2">
//                                 <p className="font-medium truncate">{lead.name}</p>
//                                 {dataStatus.status !== 'complete' && (
//                                   <span className="text-xs" title={`${dataStatus.missingCount} datos faltantes`}>
//                                     {dataStatus.statusIcon}
//                                   </span>
//                                 )}
//                               </div>
//                               {lead.position && (
//                                 <p className="text-xs text-muted-foreground truncate">{lead.position}</p>
//                               )}
//                             </div>
//                           </div>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'status')?.visible && (
//                         <TableCell>
//                           <Badge className={getStatusColor(lead.status)} variant="secondary">
//                             {lead.status}
//                           </Badge>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'call_status')?.visible && (
//                         <TableCell>
//                           {(() => {
//                             const callInfo = getCallStatusInfo(lead);
//                             return (
//                               <div className="flex items-center gap-2">
//                                 <Badge className={callInfo.color} variant="outline">
//                                   <span className="mr-1">{callInfo.icon}</span>
//                                   {callInfo.label}
//                                 </Badge>
//                                 {lead.daysSinceLastCall && lead.daysSinceLastCall > 0 && (
//                                   <span className="text-xs text-muted-foreground">
//                                     {lead.daysSinceLastCall}d
//                                   </span>
//                                 )}
//                               </div>
//                             );
//                           })()}
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'conversation_analysis')?.visible && (
//                         <TableCell>
//                           <ConversationAnalysisCell analysis={conversationAnalyses.get(lead.id)} />
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'priority')?.visible && (
//                         <TableCell>
//                           <Badge className={getPriorityColor(lead.priority || 'medium')} variant="outline">
//                             {lead.priority || 'medium'}
//                           </Badge>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'source')?.visible && (
//                         <TableCell>
//                           <Badge variant="outline" className="text-xs">
//                             {lead.source}
//                           </Badge>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'company')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             {lead.company ? (
//                               <>
//                                 <Building className="h-3 w-3 text-muted-foreground" />
//                                 <span className="truncate">{lead.company}</span>
//                               </>
//                             ) : (
//                               <span className="text-muted-foreground">-</span>
//                             )}
//                           </div>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'campaign')?.visible && (
//                         <TableCell>
//                           <Select
//                             value={lead.campaignId || 'none'}
//                             onValueChange={async (value) => {
//                               const newCampaignId = value === 'none' ? '' : value;
//                               try {
//                                 await updateLead(lead.id, { campaignId: newCampaignId || undefined });
//                               } catch (error) {
//                                 console.error('Error updating campaign:', error);
//                               }
//                             }}
//                           >
//                             <SelectTrigger className="w-full">
//                               <SelectValue placeholder="Seleccionar campaña" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="none">Sin campaña</SelectItem>
//                               {campaigns.map((campaign) => (
//                                 <SelectItem key={campaign.id} value={campaign.id}>
//                                   {campaign.name}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'phone')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center gap-2">
//                             <Phone className="h-3 w-3 text-muted-foreground" />
//                             <span className="truncate">{lead.phone}</span>
//                           </div>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'email')?.visible && (
//                         <TableCell>
//                           {lead.email ? (
//                             <div className="flex items-center gap-2">
//                               <Mail className="h-3 w-3 text-muted-foreground" />
//                               <span className="truncate">{lead.email}</span>
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">-</span>
//                           )}
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'contact_attempts')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center gap-1">
//                             <Phone className="h-3 w-3 text-blue-500" />
//                             <span className="font-medium">{lead.contactAttempts || 0}</span>
//                           </div>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'qualification_score')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center gap-1">
//                             <Star className="h-3 w-3 text-yellow-500" />
//                             <span>{lead.qualification_score || 0}</span>
//                           </div>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'created_at')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center gap-1">
//                             <Clock className="h-3 w-3 text-muted-foreground" />
//                             <span className="text-xs">{formatDate(lead.created_at)}</span>
//                           </div>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'last_contact_date')?.visible && (
//                         <TableCell>
//                           <span className="text-xs">{formatDate(lead.last_contact_date)}</span>
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'conversion_value')?.visible && (
//                         <TableCell>
//                           {lead.conversion_value ? (
//                             <div className="flex items-center gap-1">
//                               <DollarSign className="h-3 w-3 text-green-600" />
//                               <span className="font-medium">{formatCurrency(lead.conversion_value)}</span>
//                             </div>
//                           ) : (
//                             <span className="text-muted-foreground">-</span>
//                           )}
//                         </TableCell>
//                       )}
//                       {columns.find(c => c.key === 'actions')?.visible && (
//                         <TableCell>
//                           <div className="flex items-center gap-1">
//                             {lead.phone && onCallLead && (
//                               <Button 
//                                 variant="outline" 
//                                 size="sm" 
//                                 className={`h-8 px-2 text-xs ${
//                                   lead.campaignId 
//                                     ? "border-green-300 text-green-700 hover:bg-green-50" 
//                                     : "border-red-300 text-red-700 hover:bg-red-50"
//                                 }`}
//                                 onClick={(e) => {
//                                   e.preventDefault();
//                                   e.stopPropagation();
//                                   if (!lead.campaignId) {
//                                     alert('❌ Este lead no tiene campaña asignada. Debe asignar una campaña antes de realizar la llamada.');
//                                     return;
//                                   }
//                                   onCallLead(lead);
//                                 }}
//                                 title={lead.campaignId ? "Llamar a este lead" : "Requiere campaña asignada"}
//                               >
//                                 <Phone className="h-3 w-3" />
//                               </Button>
//                             )}
//                             <Button 
//                               variant="outline" 
//                               size="sm" 
//                               className="h-8 px-3 text-xs border-gray-300"
//                               onClick={(e) => {
//                                 e.preventDefault();
//                                 e.stopPropagation();
//                                 router.push(`/clients/leads/${lead.id}/work`);
//                               }}
//                             >
//                               Trabajar
//                             </Button>
//                             {showBulkOptions && (
//                               <div className="ml-1">
//                                 {!lead.blacklisted_for_calls && lead.phone && (lead.consecutive_failures || 0) < 5 ? (
//                                   <div className="w-2 h-2 rounded-full bg-green-500" title="Elegible para llamadas" />
//                                 ) : (
//                                   <div className="w-2 h-2 rounded-full bg-red-500" title="No elegible para llamadas" />
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         </TableCell>
//                       )}
//                     </TableRow>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </div>
//           {filteredAndSortedLeads.length === 0 && (
//             <div className="text-center py-12">
//               <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
//               <h3 className="font-medium text-lg mb-2">No se encontraron leads</h3>
//               <p className="text-muted-foreground mb-4">
//                 Intenta ajustar los filtros o agregar nuevos leads
//               </p>
//               <Button>
//                 <UserPlus className="h-4 w-4 mr-2" />
//                 Agregar Primer Lead
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//       {showQuickAnalytics && (
//         <QuickAnalyticsPanel
//           selectedLeadIds={Array.from(tableSelectedLeads)}
//           tenantId="tenant_123"
//           organizationId="org_456"
//           className="mt-6"
//         />
//       )}
//       <CallConfirmationModal
//         open={callModalOpen}
//         onClose={() => {
//           setCallModalOpen(false);
//           setSelectedLeadForCall(null);
//         }}
//         lead={selectedLeadForCall}
//         onConfirmCall={handleConfirmCall}
//       />
//     </div>
//   );
// }
