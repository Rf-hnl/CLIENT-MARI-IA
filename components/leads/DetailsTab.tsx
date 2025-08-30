'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeadCallHistory } from './LeadCallHistory';
import { ILeadCallLog } from '@/modules/leads/types/leads';
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';

interface DetailsTabProps {
  lead: ExtendedLead;
  callLogs?: ILeadCallLog[];
  onViewTranscription?: (callLog: ILeadCallLog) => void;
}

export function DetailsTab({ 
  lead, 
  callLogs = [],
  onViewTranscription 
}: DetailsTabProps) {
  
  // Funciones auxiliares para el diseño minimalista
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      'new': 'Nuevo',
      'interested': 'Interesado', 
      'qualified': 'Calificado',
      'follow_up': 'Seguimiento',
      'proposal_current': 'Propuesta Actual',
      'proposal_previous': 'Propuesta Anterior',
      'negotiation': 'Negociación',
      'nurturing': 'En Pausa',
      'won': 'Ganado',
      'lost': 'Perdido',
      'cold': 'Frío'
    };
    return statusMap[status] || status;
  };

  const getPriorityDisplay = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'urgent': 'Urgente',
      'high': 'Alta',
      'medium': 'Media', 
      'low': 'Baja'
    };
    return priorityMap[priority] || priority;
  };

  const formatDate = (timestamp: Date | string | null | undefined) => {
    if (!timestamp) return 'No especificado';
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'No especificado';
    }
    
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full overflow-x-hidden bg-orange-50/20">
      <div className="h-full px-2 sm:px-4 py-2 sm:py-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 h-full max-w-none">
        {/* Columna Izquierda */}
        <div className="flex flex-col h-full">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-1 sm:pr-2">
          
          {/* Información Personal */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-full">
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">ID del Lead</div>
                  <div className="text-xs sm:text-sm font-mono bg-orange-50 px-2 sm:px-3 py-2 rounded-lg border border-orange-200 text-orange-800 break-all select-all hover:bg-orange-100 transition-colors cursor-pointer" title="Click para seleccionar">{lead.id}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Nombre Completo</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{lead.name || 'Sin nombre'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Cédula</div>
                  <div className="text-sm text-gray-700">{lead.national_id || 'No especificada'}</div>
                </div>
                <div className="col-span-full sm:col-span-1">
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Posición</div>
                  <div className="text-sm text-gray-700">{lead.position || 'No especificada'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Contacto */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Teléfono</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{lead.phone || 'Sin teléfono'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Email</div>
                  <div className="text-sm text-gray-700 truncate">{lead.email || 'Sin email'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Método Preferido</div>
                  <div className="text-sm text-gray-700">{lead.preferred_contact_method || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Mejor Horario</div>
                  <div className="text-sm text-gray-700">{lead.best_contact_time || 'No especificado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de Empresa */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-full">
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Compañía</div>
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{lead.company || 'Sin empresa'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Rango de Presupuesto</div>
                  <div className="text-sm text-gray-700">{lead.budget_range || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Timeline de Decisión</div>
                  <div className="text-sm text-gray-700">{lead.decision_timeline || 'No especificado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="col-span-full">
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Dirección</div>
                  <div className="text-sm text-gray-700">{lead.address || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Ciudad</div>
                  <div className="text-sm text-gray-700">{lead.city || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Provincia</div>
                  <div className="text-sm text-gray-700">{lead.province || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">País</div>
                  <div className="text-sm text-gray-700">{lead.country || 'No especificado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Espacio al final para mejor scroll */}
          <div className="h-20 sm:h-32"></div>
            </div>
          </ScrollArea>
        </div>

        {/* Columna Central */}
        <div className="flex flex-col h-full">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-1 sm:pr-2">
          
          {/* Estado y Clasificación */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                Estado y Clasificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Estado</div>
                  <div className="text-sm font-semibold text-gray-900">{getStatusDisplay(lead.status)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Prioridad</div>
                  <div className="text-sm font-semibold text-gray-900">{getPriorityDisplay(lead.priority || 'medium')}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Fuente</div>
                  <div className="text-sm text-gray-700 capitalize">{lead.source?.replace('_', ' ') || 'Sin fuente'}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Nivel de Interés</div>
                  <div className="text-sm text-gray-700">{lead.interest_level ? `${lead.interest_level}/5 ⭐` : 'No especificado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas y Puntuación */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Métricas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gray-50 rounded border text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{lead.qualification_score || 0}</div>
                  <div className="text-xs text-gray-600 font-medium">Score de Calificación</div>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded border text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{lead.ai_score || 0}</div>
                  <div className="text-xs text-gray-600 font-medium">AI Score</div>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded border text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{lead.contactAttempts || 0}</div>
                  <div className="text-xs text-gray-600 font-medium">Intentos de Contacto</div>
                </div>
                <div className="p-2 sm:p-3 bg-gray-50 rounded border text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">{lead.response_rate || 0}%</div>
                  <div className="text-xs text-gray-600 font-medium">Tasa de Respuesta</div>
                </div>
              </div>
            
              {/* AI Score Detalles */}
              {lead.ai_score_updated_at && (
                <div className="p-2 sm:p-3 bg-gray-50 rounded border">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1">AI Score Actualizado</div>
                  <div className="text-sm text-gray-900 font-semibold">{formatDate(lead.ai_score_updated_at)}</div>
                </div>
              )}
              
              {lead.ai_score_factors && (
                <div className="p-2 sm:p-3 bg-gray-50 rounded border">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Factores AI Score</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completitud:</span>
                      <span className="text-gray-900 font-medium">{lead.ai_score_factors.data_completeness || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calidad:</span>
                      <span className="text-gray-900 font-medium">{lead.ai_score_factors.source_quality || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Engagement:</span>
                      <span className="text-gray-900 font-medium">{lead.ai_score_factors.engagement_level || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Timing:</span>
                      <span className="text-gray-900 font-medium">{lead.ai_score_factors.timing_factor || 0}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {lead.ai_score_breakdown && (
                <div className="p-2 sm:p-3 bg-gray-50 rounded border">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium mb-2">AI Score Explicación</div>
                  <div className="text-sm text-gray-700 leading-relaxed">{lead.ai_score_breakdown}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado de Calificación */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Calificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">¿Está Calificado?</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {lead.is_qualified ? '✅ Sí' : '❌ No'}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">¿Convertido a Cliente?</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {lead.converted_to_client ? '👑 Sí' : '⏳ No'}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Valor de Conversión</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {lead.conversion_value ? `💰 $${lead.conversion_value.toLocaleString()}` : 'No especificado'}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Cliente ID</div>
                  <div className="text-sm text-gray-700 font-mono break-all">
                    {lead.client_id || 'No convertido'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agente Asignado */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-4 h-4 rounded bg-violet-500"></div>
                Asignación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Agente Asignado</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {lead.assigned_agent_name || '🤖 Sin asignar'}
                  </div>
                  {lead.assigned_agent_id && (
                    <div className="text-xs text-gray-500 font-mono mt-1">ID: {lead.assigned_agent_id}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Importantes */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Cronología
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Fecha de Creación</div>
                  <div className="text-sm text-gray-900 font-semibold">{formatDate(lead.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Última Actualización</div>
                  <div className="text-sm text-gray-900 font-semibold">{formatDate(lead.updated_at)}</div>
                </div>
                {lead.last_contact_date && (
                  <div>
                    <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Último Contacto</div>
                    <div className="text-sm text-gray-900 font-semibold">{formatDate(lead.last_contact_date)}</div>
                  </div>
                )}
                {lead.next_follow_up_date && (
                  <div>
                    <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Próximo Seguimiento</div>
                    <div className="text-sm text-gray-900 font-semibold">{formatDate(lead.next_follow_up_date)}</div>
                  </div>
                )}
                {lead.conversion_date && (
                  <div className="col-span-full">
                    <div className="text-xs sm:text-sm text-orange-700 mb-1 font-medium">Fecha de Conversión</div>
                    <div className="text-sm text-gray-900 font-semibold">{formatDate(lead.conversion_date)}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {(lead.notes || lead.qualification_notes || lead.internal_notes) && (
            <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                  <div className="w-4 h-4 rounded bg-amber-500"></div>
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {lead.notes && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">Notas Públicas</div>
                    <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded border leading-relaxed">{lead.notes}</div>
                  </div>
                )}
                {lead.qualification_notes && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">Notas de Calificación</div>
                    <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded border leading-relaxed">{lead.qualification_notes}</div>
                  </div>
                )}
                {lead.internal_notes && (
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">Notas Internas</div>
                    <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded border leading-relaxed">{lead.internal_notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                  Etiquetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historial de Llamadas */}
          {callLogs.length > 0 && (
            <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                  <div className="w-4 h-4 rounded bg-slate-500"></div>
                  Historial de Llamadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded border">
                  <LeadCallHistory
                    leadId={lead.id}
                    callLogs={callLogs}
                    onViewTranscription={onViewTranscription}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Espacio al final para mejor scroll */}
          <div className="h-20 sm:h-32"></div>
            </div>
          </ScrollArea>
        </div>

        {/* Columna Derecha - Solo visible en XL */}
        <div className="hidden xl:flex flex-col h-full">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-1 sm:pr-2">

          {/* Metadatos Avanzados */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Metadatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-gray-500 font-medium mb-1">Lead ID Completo</div>
                  <div className="text-gray-900 font-mono text-[10px] break-all bg-gray-50 p-2 rounded border select-all hover:bg-gray-100 transition-colors cursor-pointer" title="Click para seleccionar">{lead.id}</div>
                </div>
                {lead.original_lead_id && (
                  <div>
                    <div className="text-gray-500 font-medium mb-1">Lead Original ID</div>
                    <div className="text-gray-900 font-mono text-[10px] break-all bg-gray-50 p-2 rounded border">{lead.original_lead_id}</div>
                  </div>
                )}
                {lead.external_id && (
                  <div>
                    <div className="text-gray-500 font-medium mb-1">ID Externo</div>
                    <div className="text-gray-900 font-mono text-[10px] bg-gray-50 p-2 rounded border">{lead.external_id}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datos de Marketing */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Marketing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-gray-500 font-medium mb-1">Fuente</div>
                  <div className="text-gray-900">{lead.source || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Campaña</div>
                  <div className="text-gray-900">{
                    lead.campaign 
                      ? (typeof lead.campaign === 'string' ? lead.campaign : lead.campaign.name || 'Sin nombre')
                      : 'No especificada'
                  }</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Medio</div>
                  <div className="text-gray-900">{lead.medium || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Palabra clave</div>
                  <div className="text-gray-900">{lead.keyword || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Landing page</div>
                  <div className="text-gray-900 truncate">{lead.landing_page || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Referrer</div>
                  <div className="text-gray-900 truncate">{lead.referrer || 'No especificado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scoring y Analytics */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                Scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded border text-center">
                  <div className="text-lg font-bold text-gray-900">{lead.lead_score || 0}</div>
                  <div className="text-gray-600">Lead Score</div>
                </div>
                <div className="p-2 bg-gray-50 rounded border text-center">
                  <div className="text-lg font-bold text-gray-900">{lead.engagement_score || 0}</div>
                  <div className="text-gray-600">Engagement</div>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-gray-500 font-medium mb-1">Última actividad</div>
                  <div className="text-gray-900">{lead.last_activity_date ? formatDate(lead.last_activity_date) : 'Sin actividad'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Intentos de contacto</div>
                  <div className="text-gray-900">{lead.contactAttempts || 0}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Tasa respuesta</div>
                  <div className="text-gray-900">{lead.response_rate || 0}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card className="border border-orange-200 shadow-sm bg-white hover:shadow-lg hover:shadow-orange-100 transition-all duration-200 relative overflow-hidden rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-800 uppercase tracking-wide">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-gray-500 font-medium mb-1">Género</div>
                  <div className="text-gray-900">{lead.gender || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Edad</div>
                  <div className="text-gray-900">{lead.age || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Nivel educativo</div>
                  <div className="text-gray-900">{lead.education_level || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Ingresos anuales</div>
                  <div className="text-gray-900">{lead.annual_income || 'No especificados'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Industria</div>
                  <div className="text-gray-900">{lead.industry || 'No especificada'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Tamaño empresa</div>
                  <div className="text-gray-900">{lead.company_size || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Producto interés</div>
                  <div className="text-gray-900">{lead.product_interest || 'No especificado'}</div>
                </div>
                <div>
                  <div className="text-gray-500 font-medium mb-1">Presupuesto</div>
                  <div className="text-gray-900">{lead.budget || 'No especificado'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Espacio al final */}
          <div className="h-20 sm:h-32"></div>
            </div>
          </ScrollArea>
        </div>
        </div>
      </div>
    </div>
  );
}