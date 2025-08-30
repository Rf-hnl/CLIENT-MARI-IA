'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Phone,
  Mail,
  Building2,
  Calendar,
  Star,
  CheckCircle,
  Edit,
  Trash2,
  MessageCircle,
  Clock,
  Bot,
  Zap,
  Target,
  Users,
  TrendingUp,
  Settings,
  Sparkles,
  Brain,
  MessageSquare,
} from 'lucide-react';

import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { CallModal } from './CallModal';
import { WhatsAppModal } from './WhatsAppModal';
import { EmailModal } from './EmailModal';

interface WorkTabProps {
  lead: ExtendedLead;
  isLoading: boolean;
  followUpDate: string;
  setFollowUpDate: (date: string) => void;
  onStatusChange: (status: string) => void;
  onAssignAgent: (agentId: string) => void;
  onQualificationChange: (score: number) => void;
  onQualifyLead: (qualified: boolean) => void;
  onConvertToClient: () => void;
  onScheduleFollowUp: () => void;
  campaigns: { id: string; name: string }[];
  updateLead: (id: string, updates: { campaignId: string | null }) => Promise<void>;
  onCall?: (lead: ExtendedLead) => void;
  onEdit?: (lead: ExtendedLead) => void;
  onDelete?: (leadId: string) => void;
  isSavingScore?: boolean;
}

export function WorkTab({ 
  lead, 
  isLoading, 
  followUpDate, 
  setFollowUpDate,
  onStatusChange,
  onAssignAgent,
  onQualificationChange,
  onQualifyLead,
  onConvertToClient,
  onScheduleFollowUp,
  campaigns = [],
  updateLead,
  onCall,
  onEdit,
  onDelete,
  isSavingScore = false
}: WorkTabProps) {
  // Estados para controlar los modales
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  return (
    <div className="h-full overflow-hidden bg-background">
      <div className="h-full px-3 sm:px-6 py-3 sm:py-4">
        <ScrollArea className="h-full">
          <div className="max-w-6xl mx-auto pr-1 sm:pr-4">
            
            {/* Header con información del lead - Responsive */}
            <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-background rounded-lg border border-border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent"></div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">Acciones del Lead</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-foreground pl-4">Gestiona el estado y actividades de seguimiento</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Quick Stats */}
                  <div className="flex gap-3 sm:gap-4">
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">{lead.qualification_score || 0}</div>
                      <div className="text-xs text-foreground">Calificación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-foreground">{lead.contactAttempts || 0}</div>
                      <div className="text-xs text-foreground">Contactos</div>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <div className="px-2 py-1 bg-background border border-border rounded-lg">
                    <span className="text-xs font-medium text-foreground">
                      {lead.is_qualified ? '✅ Calificado' : '⏳ En proceso'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              
              {/* Columna Izquierda: Acciones de IA */}
              <div className="space-y-3 sm:space-y-4">
                
                {/* Acciones de Contacto */}
                <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Acciones de Contacto</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto p-3 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 rounded-lg"
                      onClick={() => setIsCallModalOpen(true)}
                      disabled={!lead.phone}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Phone className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">Llamar</div>
                          <div className="text-xs text-gray-600 truncate">{lead.phone || 'Sin teléfono'}</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto p-3 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 rounded-lg"
                      onClick={() => setIsWhatsAppModalOpen(true)}
                      disabled={!lead.phone}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <MessageSquare className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">WhatsApp</div>
                          <div className="text-xs text-gray-600 truncate">Enviar mensaje</div>
                        </div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start h-auto p-3 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 rounded-lg"
                      onClick={() => setIsEmailModalOpen(true)}
                      disabled={!lead.email}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">Email</div>
                          <div className="text-xs text-gray-600 truncate">{lead.email || 'Sin email'}</div>
                        </div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Calificación */}
                <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Calificación del Lead</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-orange-800 mb-2 block">
                        Campaña asignada
                      </label>
                      <Select
                        value={lead.campaignId || 'none'}
                        onValueChange={async (value) => {
                          const newCampaignId = value === 'none' ? '' : value;
                          await updateLead(lead.id, { campaignId: newCampaignId || null });
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="border-orange-200 bg-white text-gray-900 h-10 sm:h-11 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300 transition-all duration-200">
                          <SelectValue placeholder="Sin campaña" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin campaña</SelectItem>
                          {campaigns.map((campaign) => (
                            <SelectItem key={campaign.id} value={campaign.id}>
                              {campaign.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-orange-800 mb-2 block">Puntuación de Calificación</label>
                      <div className="relative">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={lead.qualification_score || 0}
                          onChange={(e) => {
                            const newScore = parseInt(e.target.value);
                            console.log('🎯 Cambiando score a:', newScore);
                            onQualificationChange(newScore);
                          }}
                          className="w-full h-3 bg-gray-100 border border-orange-200 rounded-lg appearance-none cursor-pointer slider hover:border-orange-300 transition-all duration-200"
                          style={{
                            background: `linear-gradient(to right, #f97316 0%, #f97316 ${lead.qualification_score || 0}%, #f1f5f9 ${lead.qualification_score || 0}%, #f1f5f9 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                          <span className="text-xs">Bajo</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-orange-600">{lead.qualification_score || 0}%</span>
                            {isSavingScore && (
                              <div className="flex items-center gap-1 text-xs text-orange-600">
                                <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-orange-600">Guardando...</span>
                              </div>
                            )}
                          </div>
                          <span className="text-xs">Alto</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-xs text-orange-800 font-medium">Score</div>
                        <div className="text-base sm:text-lg font-bold text-orange-600">{lead.qualification_score || 0}</div>
                      </div>
                      <div className="p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-xs text-orange-800 font-medium">Potencial</div>
                        <div className="text-base sm:text-lg font-bold text-orange-600">
                          {lead.qualification_score > 70 ? 'Alto' : lead.qualification_score > 40 ? 'Medio' : 'Bajo'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Columna Central: Gestión */}
              <div className="space-y-3 sm:space-y-4">
                
                {/* Gestión del Lead */}
                <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Gestión del Lead</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-orange-800 mb-2 block">
                        Estado del Lead
                      </label>
                      <Select value={lead.status} onValueChange={onStatusChange} disabled={isLoading}>
                        <SelectTrigger className="border-orange-200 bg-white text-gray-900 h-10 sm:h-11 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300 transition-all duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Nuevo</SelectItem>
                          <SelectItem value="interested">Interesado</SelectItem>
                          <SelectItem value="qualified">Calificado</SelectItem>
                          <SelectItem value="follow_up">Seguimiento</SelectItem>
                          <SelectItem value="proposal_current">Propuesta Actual</SelectItem>
                          <SelectItem value="proposal_previous">Propuesta Anterior</SelectItem>
                          <SelectItem value="negotiation">Negociación</SelectItem>
                          <SelectItem value="nurturing">En Pausa</SelectItem>
                          <SelectItem value="won">Ganado</SelectItem>
                          <SelectItem value="lost">Perdido</SelectItem>
                          <SelectItem value="cold">Descartado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-orange-800 mb-2 block">
                        Agente Asignado
                      </label>
                      <Select value={lead.assigned_agent_id || 'none'} onValueChange={onAssignAgent} disabled={isLoading}>
                        <SelectTrigger className="border-orange-200 bg-white text-gray-900 h-10 sm:h-11 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-300 transition-all duration-200">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin asignar</SelectItem>
                          <SelectItem value="agent-1">Juan Pérez</SelectItem>
                          <SelectItem value="agent-2">María García</SelectItem>
                          <SelectItem value="agent-3">Carlos López</SelectItem>
                          <SelectItem value="agent-4">Ana Rodríguez</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-medium text-orange-800 mb-2 block">
                        Próximo Seguimiento
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="datetime-local"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="flex-1 px-2 sm:px-3 py-2 border border-border rounded-lg text-xs sm:text-sm bg-background text-foreground h-10 focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={onScheduleFollowUp} 
                          disabled={isLoading || !followUpDate}
                          className="h-10 w-full sm:w-auto px-3"
                        >
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0" />
                          <span className="sm:hidden ml-2">Programar</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones Avanzadas - Solo visible en pantallas menores a XL */}
                <Card className="xl:hidden border border-border shadow-sm bg-card hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Acciones Avanzadas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    {!lead.converted_to_client && (
                      <Button 
                        onClick={onConvertToClient} 
                        className="w-full bg-orange-600 text-white hover:bg-white hover:text-orange-600 border border-orange-600 h-11 sm:h-12 rounded text-sm sm:text-base transition-all duration-200"
                        disabled={isLoading}
                      >
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Convertir a Cliente
                      </Button>
                    )}
                    
                    <Button 
                      variant="secondary"
                      onClick={() => onQualifyLead(!lead.is_qualified)} 
                      className="w-full h-11 sm:h-12 text-sm sm:text-base"
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {lead.is_qualified ? 'Descalificar Lead' : 'Marcar como Calificado'}
                    </Button>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border">
                      <Button 
                        variant="outline"
                        onClick={() => onEdit?.(lead)}
                        className="h-9 sm:h-10 text-xs sm:text-sm border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 rounded-lg"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-orange-600" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este lead?')) {
                            onDelete?.(lead.id);
                          }
                        }}
                        className="h-9 sm:h-10 text-xs sm:text-sm border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200 rounded-lg"
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-600" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              {/* Columna Derecha: Acciones Avanzadas e Información del Lead - Solo visible en XL */}
              <div className="hidden xl:block space-y-3 sm:space-y-4">
                
                {/* Acciones Avanzadas */}
                <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Acciones Avanzadas</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    {!lead.converted_to_client && (
                      <Button 
                        onClick={onConvertToClient} 
                        className="w-full bg-orange-600 text-white hover:bg-white hover:text-orange-600 border border-orange-600 h-10 rounded text-sm transition-all duration-200"
                        disabled={isLoading}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Convertir a Cliente
                      </Button>
                    )}
                    
                    <Button 
                      variant="secondary"
                      onClick={() => onQualifyLead(!lead.is_qualified)} 
                      className="w-full h-10 text-sm"
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {lead.is_qualified ? 'Descalificar' : 'Calificar'}
                    </Button>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-orange-200">
                      <Button 
                        variant="outline"
                        onClick={() => onEdit?.(lead)}
                        className="h-9 text-xs border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 rounded-lg"
                      >
                        <Edit className="h-3 w-3 mr-1 text-orange-600" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este lead?')) {
                            onDelete?.(lead.id);
                          }
                        }}
                        className="h-9 text-xs border-red-200 hover:bg-red-50 hover:border-red-300 transition-all duration-200 rounded-lg"
                      >
                        <Trash2 className="h-3 w-3 mr-1 text-red-600" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Información Rápida del Lead */}
                <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Información del Lead</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-foreground font-medium mb-1">Empresa</div>
                        <div className="text-foreground">{lead.company || 'No especificada'}</div>
                      </div>
                      <div>
                        <div className="text-foreground font-medium mb-1">Fuente</div>
                        <div className="text-foreground capitalize">{lead.source?.replace('_', ' ') || 'Sin fuente'}</div>
                      </div>
                      <div>
                        <div className="text-foreground font-medium mb-1">Prioridad</div>
                        <div className="text-foreground capitalize">{lead.priority || 'Media'}</div>
                      </div>
                      <div>
                        <div className="text-foreground font-medium mb-1">Intentos de contacto</div>
                        <div className="text-foreground">{lead.contactAttempts || 0}</div>
                      </div>
                      <div>
                        <div className="text-foreground font-medium mb-1">Tasa de respuesta</div>
                        <div className="text-foreground">{lead.response_rate || 0}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline de Acciones */}
                <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-800"></div>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      <span>Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-foreground font-medium mb-1">Creado</div>
                        <div className="text-foreground">{new Date(lead.created_at).toLocaleDateString('es-ES')}</div>
                      </div>
                      <div>
                        <div className="text-foreground font-medium mb-1">Última actualización</div>
                        <div className="text-foreground">{new Date(lead.updated_at).toLocaleDateString('es-ES')}</div>
                      </div>
                      {lead.last_contact_date && (
                        <div>
                          <div className="text-foreground font-medium mb-1">Último contacto</div>
                          <div className="text-foreground">{new Date(lead.last_contact_date).toLocaleDateString('es-ES')}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
            
            {/* Espacio al final para mejor scroll */}
            <div className="h-20 sm:h-32"></div>
          </div>
        </ScrollArea>
      </div>

      {/* Modales */}
      <CallModal 
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        lead={lead}
      />
      
      <WhatsAppModal 
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        lead={lead}
      />
      
      <EmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        lead={lead}
      />
    </div>
  );
}
