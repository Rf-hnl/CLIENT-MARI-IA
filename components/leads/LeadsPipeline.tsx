'use client';

/**
 * LEADS PIPELINE COMPONENT
 * 
 * Vista de pipeline visual tipo Kanban para gestión de leads
 * Drag & Drop, actualización en tiempo real, estadísticas por columna
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  User,
  Building,
  MapPin,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserX
} from 'lucide-react';

// Imports del sistema de leads
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { useLeads } from '@/modules/leads/hooks/useLeads';
import { LeadStatus, LeadPriority } from '@/modules/leads/types/leads';
import { getLeadDataStatus } from '@/modules/leads/utils/leadDataValidator';

// Configuración de las columnas del pipeline basada en los estados reales del CSV
const PIPELINE_COLUMNS: Array<{
  id: LeadStatus;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
}> = [
  {
    id: 'new',
    title: 'Nuevos Leads',
    description: 'Pendientes de contacto inicial',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: UserPlus,
  },
  {
    id: 'interested',
    title: 'Leads Potenciales',
    description: 'Prioritarios para seguimiento',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: Star,
  },
  {
    id: 'qualified',
    title: 'Calificado',
    description: 'En seguimiento activo',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: CheckCircle,
  },
  {
    id: 'follow_up',
    title: 'En Seguimiento',
    description: 'Sin respuesta del cliente',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: Clock,
  },
  {
    id: 'proposal_current',
    title: 'Cotizaciones Actuales',
    description: 'Campaña Jun - Jul',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: Mail,
  },
  {
    id: 'proposal_previous',
    title: 'Cotizaciones Anteriores',
    description: 'Campañas previas',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 border-orange-300',
    icon: MessageSquare,
  },
  {
    id: 'negotiation',
    title: 'Negociación',
    description: 'En proceso de ajustes',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    icon: TrendingUp,
  },
  {
    id: 'nurturing',
    title: 'A Futuro',
    description: 'En pausa temporal',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 border-cyan-200',
    icon: Calendar,
  },
  {
    id: 'won',
    title: 'Ganado',
    description: 'Cerrado exitosamente',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: Target,
  },
  {
    id: 'lost',
    title: 'Propuesta Declinada',
    description: 'No convertidos',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
  {
    id: 'cold',
    title: 'Descartados',
    description: 'No calificados',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50 border-gray-200',
    icon: UserX,
  },
];

// Función helper para obtener las iniciales del nombre
const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return 'LD'; // Default for Lead
  }
  
  return name
    .trim()
    .split(' ')
    .filter(n => n.length > 0) // Remove empty strings
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'LD';
};

// Función helper para obtener el color de la prioridad
const getPriorityColor = (priority: LeadPriority): string => {
  const colors: Record<LeadPriority, string> = {
    low: 'bg-gray-100 text-gray-800 border-gray-300',
    medium: 'bg-blue-100 text-blue-800 border-blue-300',
    high: 'bg-orange-100 text-orange-800 border-orange-300',
    urgent: 'bg-red-100 text-red-800 border-red-300'
  };
  return colors[priority];
};

// Función helper para formatear fecha
const formatDate = (timestamp?: { _seconds: number }): string => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp._seconds * 1000).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });
};

// Función helper para calcular días desde la creación
const getDaysAgo = (timestamp?: { _seconds: number }): number => {
  if (!timestamp) return 0;
  const now = Date.now();
  const created = timestamp._seconds * 1000;
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
};

// Componente de tarjeta de lead
interface LeadCardProps {
  lead: ExtendedLead;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onEdit: (lead: ExtendedLead) => void;
  onDelete: (leadId: string) => void;
  onViewDetails: (lead: ExtendedLead) => void;
}

function LeadCard({ lead, onStatusChange, onEdit, onDelete, onViewDetails }: LeadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Defensive checks for lead properties
  if (!lead || !lead.id) {
    console.warn('LeadCard: Invalid lead data', lead);
    return null;
  }
  
  const daysAgo = getDaysAgo(lead.created_at);
  const isStale = daysAgo > 7; // Lead viejo si tiene más de 7 días
  const isUrgent = lead.priority === 'urgent' || lead.priority === 'high';
  
  // Obtener estado de completitud de datos
  const dataStatus = getLeadDataStatus(lead);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      leadId: lead.id,
      currentStatus: lead.status
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card 
      className={`
        cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${isUrgent ? 'ring-2 ring-red-200' : ''}
        ${isStale ? 'border-l-4 border-l-amber-400' : ''}
      `}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header con nombre y avatar */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="text-xs font-medium">
                {getInitials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h4 className="font-medium text-sm truncate">{lead.name || 'Sin nombre'}</h4>
                {dataStatus.status !== 'complete' && (
                  <span className="text-xs" title={`${dataStatus.missingCount} datos faltantes`}>
                    {dataStatus.statusIcon}
                  </span>
                )}
              </div>
              {lead.position && (
                <p className="text-xs text-muted-foreground truncate">{lead.position}</p>
              )}
              {dataStatus.status !== 'complete' && (
                <p className="text-xs text-muted-foreground">
                  {dataStatus.completeness}% completo
                </p>
              )}
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs border-gray-300"
            onClick={() => onViewDetails(lead)}
          >
            Trabajar
          </Button>
        </div>

        {/* Company info */}
        {lead.company && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Building className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}

        {/* Contact info */}
        <div className="space-y-1">
          <div className="flex items-center text-xs">
            <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">{lead.phone || 'Sin teléfono'}</span>
          </div>
          {lead.email && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
        </div>

        {/* Priority and source badges */}
        <div className="flex items-center justify-between gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${getPriorityColor(lead.priority || 'medium')}`}
          >
            {lead.priority || 'medium'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {lead.source || 'other'}
          </Badge>
        </div>

        {/* AI Score if available */}
        {(lead.ai_score || 0) > 0 && (
          <div className="flex items-center text-xs">
            <Zap className="h-3 w-3 mr-1 text-blue-500" />
            <span>AI Score: {lead.ai_score || 0}/100</span>
          </div>
        )}

        {/* Qualification score if available */}
        {(lead.qualification_score || 0) > 0 && !(lead.ai_score || 0) && (
          <div className="flex items-center text-xs">
            <Star className="h-3 w-3 mr-1 text-yellow-500" />
            <span>Score: {lead.qualification_score || 0}/100</span>
          </div>
        )}

        {/* Conversion value if available */}
        {lead.conversion_value && lead.conversion_value > 0 && (
          <div className="flex items-center text-xs text-green-600">
            <DollarSign className="h-3 w-3 mr-1" />
            <span>${lead.conversion_value.toLocaleString()}</span>
          </div>
        )}

        {/* Footer with date and alerts */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formatDate(lead.created_at)}</span>
            {daysAgo > 0 && (
              <span className="ml-1">({daysAgo}d)</span>
            )}
          </div>
          
          {/* Alert indicators */}
          <div className="flex items-center space-x-1">
            {isStale && (
              <span title="Lead sin actividad reciente">
                <AlertCircle className="h-3 w-3 text-amber-500" />
              </span>
            )}
            {isUrgent && (
              <span title="Prioridad alta">
                <Zap className="h-3 w-3 text-red-500" />
              </span>
            )}
            {lead.next_follow_up_date && (
              <span title="Seguimiento programado">
                <Calendar className="h-3 w-3 text-blue-500" />
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente de columna del pipeline
interface PipelineColumnProps {
  column: typeof PIPELINE_COLUMNS[0];
  leads: ExtendedLead[];
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
  onEdit: (lead: ExtendedLead) => void;
  onDelete: (leadId: string) => void;
  onViewDetails: (lead: ExtendedLead) => void;
  onAddLead: (status: LeadStatus) => void;
}

function PipelineColumn({ 
  column, 
  leads, 
  onStatusChange, 
  onEdit, 
  onDelete, 
  onViewDetails,
  onAddLead 
}: PipelineColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const Icon = column.icon;
  
  // Calcular estadísticas de la columna
  const totalValue = leads.reduce((sum, lead) => sum + (lead.conversion_value || 0), 0);
  const urgentCount = leads.filter(lead => lead.priority === 'urgent' || lead.priority === 'high').length;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { leadId, currentStatus } = data;
      
      if (currentStatus !== column.id) {
        onStatusChange(leadId, column.id);
      }
    } catch (error) {
      console.error('Error processing drop:', error);
    }
  };

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column Header */}
      <Card className={`${column.bgColor} border-2 ${isDragOver ? 'border-blue-400 bg-blue-100' : ''}`}>
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg bg-white ${column.color} flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className={`text-sm font-semibold ${column.color} leading-tight`}>
                  {column.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                  {column.description}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-bold ml-2 flex-shrink-0">
              {leads.length}
            </Badge>
          </div>
          
          {/* Column stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {totalValue > 0 && (
                <div className="flex items-center min-w-0">
                  <DollarSign className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">${totalValue.toLocaleString()}</span>
                </div>
              )}
              {urgentCount > 0 && (
                <div className="flex items-center text-red-600 min-w-0">
                  <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{urgentCount}</span>
                </div>
              )}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={() => onAddLead(column.id)}
            >
              <UserPlus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Drop Zone */}
      <div
        className={`
          flex-1 p-3 space-y-3 min-h-96 rounded-lg transition-colors
          ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-center">
            <Icon className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm mb-2">No hay leads</p>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 px-3 text-xs"
              onClick={() => onAddLead(column.id)}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Agregar
            </Button>
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Componente principal del pipeline
export function LeadsPipeline() {
  const { leads, updateLeadStatus, isLoading } = useLeads();
  const [selectedLead, setSelectedLead] = useState<ExtendedLead | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Agrupar leads por status
  const leadsByStatus = React.useMemo(() => {
    const grouped: Record<LeadStatus, ExtendedLead[]> = {
      new: [], interested: [], qualified: [], follow_up: [],
      proposal_current: [], proposal_previous: [], negotiation: [], 
      nurturing: [], won: [], lost: [], cold: []
    };

    console.log('📊 Pipeline - Total leads:', leads.length);
    console.log('🔍 Estados válidos:', Object.keys(grouped));
    
    leads.forEach(lead => {
      console.log(`📋 Lead: ${lead.name} - Status: "${lead.status}" - Type: ${typeof lead.status}`);
      
      // Mapear "contacted" a "interested" si es necesario
      let actualStatus = lead.status;
      if ((lead.status as unknown as string) === 'contacted') {
        actualStatus = 'interested';
        console.log(`🔄 Mapeando "contacted" → "interested" para ${lead.name}`);
      }
      
      if (grouped[actualStatus]) {
        grouped[actualStatus].push(lead);
        console.log(`✅ Lead ${lead.name} agregado a columna ${actualStatus}`);
      } else {
        console.warn(`⚠️ Status "${lead.status}" no existe en grouped para lead ${lead.name}`);
        console.log('🔍 Estados disponibles:', Object.keys(grouped));
        // Agregar a "new" como fallback
        grouped['new'].push(lead);
        console.log(`🔄 Lead ${lead.name} agregado a columna "new" como fallback`);
      }
    });

    console.log('🗂️ Leads agrupados por status:');
    Object.entries(grouped).forEach(([status, items]) => {
      console.log(`  ${status}: ${items.length} leads`);
      items.forEach(lead => console.log(`    - ${lead.name}`));
    });
    return grouped;
  }, [leads]);

  // Handlers
  const handleStatusChange = useCallback(async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      console.log(`Lead ${leadId} moved to ${newStatus}`);
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  }, [updateLeadStatus]);

  const handleEdit = useCallback((lead: ExtendedLead) => {
    console.log('Edit lead:', lead);
    // TODO: Abrir modal de edición
  }, []);

  const handleDelete = useCallback((leadId: string) => {
    console.log('Delete lead:', leadId);
    // TODO: Confirmar y eliminar lead
  }, []);

  const handleViewDetails = useCallback((lead: ExtendedLead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  }, []);

  const handleAddLead = useCallback((status: LeadStatus) => {
    console.log('Add lead with status:', status);
    // TODO: Abrir modal de creación con status pre-seleccionado
  }, []);

  if (isLoading) {
    console.log('⏳ Pipeline en estado de carga...');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando pipeline...</p>
        </div>
      </div>
    );
  }

  console.log('🚀 Pipeline renderizado - Leads disponibles:', leads.length);

  return (
    <div className="space-y-6">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Total: {leads.length} leads
          </Badge>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-6 min-w-max px-2">
          {PIPELINE_COLUMNS.map((column) => (
            <PipelineColumn
              key={column.id}
              column={column}
              leads={leadsByStatus[column.id] || []}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
              onAddLead={handleAddLead}
            />
          ))}
        </div>
      </div>

      {/* Lead Details Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              {/* Header del lead */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(selectedLead.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                  {selectedLead.position && (
                    <p className="text-muted-foreground">{selectedLead.position}</p>
                  )}
                  {selectedLead.company && (
                    <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
                  )}
                </div>
                {(() => {
                  const detailDataStatus = getLeadDataStatus(selectedLead);
                  return detailDataStatus.status !== 'complete' && (
                    <div className={`px-3 py-1 rounded-lg ${detailDataStatus.statusBg}`}>
                      <div className="flex items-center gap-2">
                        <span>{detailDataStatus.statusIcon}</span>
                        <div className="text-sm">
                          <div className={`font-medium ${detailDataStatus.statusColor}`}>
                            {detailDataStatus.completeness}% completo
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {detailDataStatus.missingCount} datos faltantes
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {(() => {
                const detailDataStatus = getLeadDataStatus(selectedLead);
                const { categorized } = detailDataStatus;
                
                return detailDataStatus.status !== 'complete' && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        Datos Faltantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categorized.critical.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-red-700 mb-1">🚨 Críticos</h5>
                          <div className="space-y-1">
                            {categorized.critical.map(field => (
                              <div key={field.field} className="text-xs text-red-600">
                                • {field.label}: {field.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {categorized.important.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-orange-700 mb-1">⚠️ Importantes</h5>
                          <div className="space-y-1">
                            {categorized.important.map(field => (
                              <div key={field.field} className="text-xs text-orange-600">
                                • {field.label}: {field.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {categorized.optional.length > 0 && (
                        <div>
                          <h5 className="text-xs font-medium text-blue-700 mb-1">📝 Opcionales</h5>
                          <div className="space-y-1">
                            {categorized.optional.map(field => (
                              <div key={field.field} className="text-xs text-blue-600">
                                • {field.label}: {field.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t border-amber-200">
                        <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700">
                          <Edit className="h-3 w-3 mr-1" />
                          Completar Datos Faltantes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Información de Contacto</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedLead.phone || 'No proporcionado'}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedLead.email || 'No proporcionado'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Estado y Prioridad</h4>
                  <div className="space-y-2">
                    <Badge className={getPriorityColor(selectedLead.priority || 'medium')}>
                      {selectedLead.priority || 'medium'}
                    </Badge>
                    <Badge variant="outline">
                      {selectedLead.source || 'other'}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedLead.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">{selectedLead.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}