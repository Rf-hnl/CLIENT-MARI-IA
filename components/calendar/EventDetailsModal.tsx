/**
 * EVENT DETAILS MODAL
 * 
 * Modal para mostrar los detalles completos de un evento de calendario
 */

"use client";

import React from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  Video, 
  MapPin, 
  User, 
  Mail, 
  Building, 
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CalendarEvent, 
  getEventStatusColor, 
  getPriorityColor, 
  formatEventTime 
} from '@/types/calendar';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
}

const getMeetingPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'phone':
      return <Phone className="w-4 h-4" />;
    case 'zoom':
    case 'teams':
    case 'meet':
      return <Video className="w-4 h-4" />;
    case 'in_person':
      return <MapPin className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'canceled':
      return <XCircle className="w-4 h-4 text-red-600" />;
    case 'rescheduled':
      return <AlertCircle className="w-4 h-4 text-orange-600" />;
    case 'no_show':
      return <XCircle className="w-4 h-4 text-gray-600" />;
    default:
      return <Clock className="w-4 h-4 text-orange-600" />;
  }
};

const formatPlatformName = (platform: string) => {
  const platforms: Record<string, string> = {
    zoom: 'Zoom',
    teams: 'Microsoft Teams',
    meet: 'Google Meet',
    phone: 'Llamada Telefónica',
    in_person: 'Presencial',
    internal: 'Sistema Interno'
  };
  return platforms[platform] || platform;
};

const formatFollowUpType = (type: string) => {
  const types: Record<string, string> = {
    demo: 'Demo del Producto',
    proposal: 'Presentación de Propuesta',
    closing: 'Reunión de Cierre',
    follow_up: 'Seguimiento General',
    nurturing: 'Llamada de Nurturing',
    technical_call: 'Consulta Técnica',
    discovery: 'Llamada de Descubrimiento',
    onboarding: 'Onboarding del Cliente'
  };
  return types[type] || type;
};

const formatStatus = (status: string) => {
  const statuses: Record<string, string> = {
    scheduled: 'Programado',
    confirmed: 'Confirmado',
    completed: 'Completado',
    canceled: 'Cancelado',
    rescheduled: 'Reprogramado',
    no_show: 'No asistió',
    pending: 'Pendiente'
  };
  return statuses[status] || status;
};

const formatPriority = (priority: string) => {
  const priorities: Record<string, string> = {
    low: 'Baja',
    medium: 'Media', 
    high: 'Alta',
    urgent: 'Urgente'
  };
  return priorities[priority] || priority;
};

export default function EventDetailsModal({
  isOpen,
  onClose,
  event,
  onEdit,
  onDelete
}: EventDetailsModalProps) {
  if (!event) return null;

  const duration = Math.round((new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getStatusIcon(event.status)}
            {event.title}
            {event.automated && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                🤖 Automático
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado y Prioridad */}
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEventStatusColor(event.status)}`}>
              {formatStatus(event.status)}
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(event.priority)}`}>
              Prioridad: {formatPriority(event.priority)}
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Fecha y Hora</h3>
            </div>
            <div className="space-y-2 ml-7">
              <div className="flex items-center gap-2">
                <span className="font-medium">Inicio:</span>
                <span>{new Date(event.startTime).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Fin:</span>
                <span>{new Date(event.endTime).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Duración: {duration} minutos</span>
              </div>
            </div>
          </div>

          {/* Detalles del Evento */}
          <div className="space-y-4">
            {event.followUpType && (
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium">Tipo de Reunión:</span>
                  <span className="ml-2">{formatFollowUpType(event.followUpType)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {getMeetingPlatformIcon(event.meetingPlatform)}
              <div>
                <span className="font-medium">Plataforma:</span>
                <span className="ml-2">{formatPlatformName(event.meetingPlatform)}</span>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <span className="font-medium">Ubicación:</span>
                  <span className="ml-2">{event.location}</span>
                </div>
              </div>
            )}

            {/* Link de la reunión o alerta */}
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <span className="font-medium">Enlace de reunión:</span>
                {event.meetingLink ? (
                  <a 
                    href={event.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-orange-600 hover:text-orange-800 underline"
                  >
                    Unirse a la reunión
                  </a>
                ) : (
                  <div className="ml-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-yellow-800">Aún no tiene link de reunión</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descripción */}
          {event.description && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Descripción</h3>
              <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                {event.description}
              </p>
            </div>
          )}

          {/* Asistentes */}
          {event.attendeeEmails && event.attendeeEmails.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Asistentes</h3>
              <div className="space-y-2">
                {event.attendeeEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recordatorio */}
          {event.reminderMinutes && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Recordatorio: {event.reminderMinutes} minutos antes</span>
            </div>
          )}

          {/* Metadatos */}
          <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
            <div>Creado: {new Date(event.createdAt).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
            <div>Actualizado: {new Date(event.updatedAt).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
            {event.rescheduledCount > 0 && (
              <div>Reprogramado: {event.rescheduledCount} {event.rescheduledCount === 1 ? 'vez' : 'veces'}</div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {onEdit && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onEdit(event);
                  onClose();
                }}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                onClick={() => {
                  if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
                    onDelete(event.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}