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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal,
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
  UserPlus
} from 'lucide-react';

// Imports del sistema de leads
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { useLeads } from '@/modules/leads/hooks/useLeads';
import { LeadStatus, LeadPriority } from '@/modules/leads/types/leads';

// Configuración de las columnas del pipeline
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
    title: 'Nuevos',
    description: 'Leads sin contactar',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    icon: UserPlus,
  },
  {
    id: 'contacted',
    title: 'Contactados',
    description: 'Primer contacto realizado',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: Phone,
  },
  {
    id: 'interested',
    title: 'Interesados',
    description: 'Muestran interés',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: Star,
  },
  {
    id: 'qualified',
    title: 'Calificados',
    description: 'Cumple criterios',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: CheckCircle,
  },
  {
    id: 'proposal',
    title: 'Propuesta',
    description: 'Propuesta enviada',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 border-orange-200',
    icon: Mail,
  },
  {
    id: 'negotiation',
    title: 'Negociación',
    description: 'En proceso de cierre',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50 border-indigo-200',
    icon: TrendingUp,
  },
  {
    id: 'won',
    title: 'Ganados',
    description: 'Convertidos a clientes',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    icon: Target,
  },
  {
    id: 'lost',
    title: 'Perdidos',
    description: 'No convertidos',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
];

// Función helper para obtener las iniciales del nombre
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
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
  const daysAgo = getDaysAgo(lead.created_at);
  const isStale = daysAgo > 7; // Lead viejo si tiene más de 7 días
  const isUrgent = lead.priority === 'urgent' || lead.priority === 'high';

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
              <h4 className="font-medium text-sm truncate">{lead.name}</h4>
              {lead.position && (
                <p className="text-xs text-muted-foreground truncate">{lead.position}</p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onViewDetails(lead)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Phone className="mr-2 h-4 w-4" />
                Llamar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Agendar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete(lead.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <span className="truncate">{lead.phone}</span>
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
            className={`text-xs ${getPriorityColor(lead.priority)}`}
          >
            {lead.priority}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {lead.source}
          </Badge>
        </div>

        {/* Qualification score if available */}
        {lead.qualification_score > 0 && (
          <div className="flex items-center text-xs">
            <Star className="h-3 w-3 mr-1 text-yellow-500" />
            <span>Score: {lead.qualification_score}/100</span>
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
              <AlertCircle className="h-3 w-3 text-amber-500" title="Lead sin actividad reciente" />
            )}
            {isUrgent && (
              <Zap className="h-3 w-3 text-red-500" title="Prioridad alta" />
            )}
            {lead.next_follow_up_date && (
              <Calendar className="h-3 w-3 text-blue-500" title="Seguimiento programado" />
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
      new: [], contacted: [], interested: [], qualified: [],
      proposal: [], negotiation: [], won: [], lost: [],
      nurturing: [], follow_up: [], cold: []
    };

    console.log('📊 Pipeline - Total leads:', leads.length);
    console.log('🔍 Estados válidos:', Object.keys(grouped));
    
    leads.forEach(lead => {
      console.log(`📋 Lead: ${lead.name} - Status: "${lead.status}" - Type: ${typeof lead.status}`);
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
        console.log(`✅ Lead ${lead.name} agregado a columna ${lead.status}`);
      } else {
        console.warn(`⚠️ Status "${lead.status}" no existe en grouped para lead ${lead.name}`);
        console.log('🔍 Estados disponibles:', Object.keys(grouped));
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
        <div>
          <h2 className="text-2xl font-bold">Pipeline de Leads</h2>
          <p className="text-muted-foreground">
            Gestiona el flujo de leads desde prospecto hasta cliente
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Total: {leads.length} leads
          </Badge>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Lead
          </Button>
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
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(selectedLead.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
                  {selectedLead.position && (
                    <p className="text-muted-foreground">{selectedLead.position}</p>
                  )}
                  {selectedLead.company && (
                    <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Información de Contacto</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedLead.phone}
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {selectedLead.email}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Estado y Prioridad</h4>
                  <div className="space-y-2">
                    <Badge className={getPriorityColor(selectedLead.priority)}>
                      {selectedLead.priority}
                    </Badge>
                    <Badge variant="outline">
                      {selectedLead.source}
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