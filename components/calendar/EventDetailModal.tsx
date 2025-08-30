/**
 * EVENT DETAIL MODAL
 * 
 * Modal para ver y gestionar detalles de eventos de calendario
 * Incluye funcionalidad para completar, cancelar y reprogramar eventos
 */

"use client";

import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Users, 
  Phone, 
  Video, 
  MapPin, 
  Calendar,
  User,
  Building2,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react';

import {
  CalendarEvent,
  CalendarEventStatus,
  getEventStatusColor,
  getPriorityColor,
  formatEventTime
} from '@/types/calendar';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  onComplete: (eventId: string, outcome: string, nextAction?: string) => Promise<void>;
  leadData?: {
    name: string;
    company?: string;
    email?: string;
    phone: string;
    status: string;
  };
}

export default function EventDetailModal({
  event,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
  leadData
}: EventDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [nextAction, setNextAction] = useState('');

  if (!isOpen || !event) return null;

  /**
   * Completar evento
   */
  const handleCompleteEvent = async () => {
    if (!outcomeNotes.trim()) {
      alert('Por favor, ingrese las notas del resultado');
      return;
    }

    try {
      setIsUpdating(true);
      await onComplete(event.id, outcomeNotes, nextAction || undefined);
      setShowCompleteForm(false);
      setOutcomeNotes('');
      setNextAction('');
      onClose();
    } catch (error) {
      console.error('Error completing event:', error);
      alert('Error al completar el evento');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Actualizar estado del evento
   */
  const handleStatusUpdate = async (status: CalendarEventStatus) => {
    try {
      setIsUpdating(true);
      await onUpdate(event.id, { status });
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('Error al actualizar el evento');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Eliminar evento
   */
  const handleDeleteEvent = async () => {
    if (!confirm('¿Está seguro de que desea eliminar este evento?')) {
      return;
    }

    try {
      setIsUpdating(true);
      await onDelete(event.id);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error al eliminar el evento');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Obtener icono para plataforma de reunión
   */
  const getMeetingIcon = () => {
    switch (event.meetingPlatform) {
      case 'phone':
        return <Phone className="w-5 h-5" />;
      case 'zoom':
      case 'teams':
      case 'meet':
        return <Video className="w-5 h-5" />;
      case 'in_person':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  /**
   * Obtener nombre de plataforma
   */
  const getPlatformName = () => {
    const platforms: Record<string, string> = {
      internal: 'Sistema Interno',
      phone: 'Llamada Telefónica',
      zoom: 'Zoom',
      teams: 'Microsoft Teams',
      meet: 'Google Meet',
      in_person: 'Presencial'
    };
    return platforms[event.meetingPlatform] || event.meetingPlatform;
  };

  /**
   * Obtener nombre del tipo de seguimiento
   */
  const getFollowUpTypeName = () => {
    if (!event.followUpType) return 'Reunión';
    
    const types: Record<string, string> = {
      demo: 'Demostración',
      proposal: 'Propuesta',
      closing: 'Cierre',
      follow_up: 'Seguimiento',
      nurturing: 'Nurturing',
      technical_call: 'Consulta Técnica',
      discovery: 'Descubrimiento',
      onboarding: 'Onboarding'
    };
    return types[event.followUpType] || event.followUpType;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  {getMeetingIcon()}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {event.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEventStatusColor(event.status)}`}>
                        {event.status === 'scheduled' ? 'Programado' :
                         event.status === 'confirmed' ? 'Confirmado' :
                         event.status === 'completed' ? 'Completado' :
                         event.status === 'canceled' ? 'Cancelado' :
                         event.status === 'rescheduled' ? 'Reprogramado' :
                         event.status === 'no_show' ? 'No asistió' : 'Pendiente'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                        {event.priority === 'low' ? 'Baja' :
                         event.priority === 'medium' ? 'Media' :
                         event.priority === 'high' ? 'Alta' : 'Urgente'}
                      </span>
                      {event.automated && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          🤖 Automático
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            <div className="space-y-6">
              {/* Información básica */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Detalles del Evento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Horario</p>
                      <p className="text-sm text-gray-600">{formatEventTime(event)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.startTime).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tipo</p>
                      <p className="text-sm text-gray-600">{getFollowUpTypeName()}</p>
                      <p className="text-xs text-gray-500">{getPlatformName()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del lead */}
              {leadData && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Lead</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{leadData.name}</p>
                          {leadData.email && (
                            <p className="text-sm text-gray-600">{leadData.email}</p>
                          )}
                          <p className="text-sm text-gray-600">{leadData.phone}</p>
                        </div>
                      </div>

                      {leadData.company && (
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{leadData.company}</p>
                            <p className="text-sm text-gray-600">Estado: {leadData.status}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Descripción */}
              {event.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {/* Sentiment trigger */}
              {event.sentimentTrigger && event.automated && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Análisis IA</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      🤖 Este evento fue programado automáticamente basado en análisis de sentiment
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Score de sentiment: {event.sentimentTrigger.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Enlace de reunión */}
              {event.meetingLink && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Enlace de Reunión</h4>
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm break-all"
                  >
                    {event.meetingLink}
                  </a>
                </div>
              )}

              {/* Ubicación */}
              {event.location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Ubicación</h4>
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              )}

              {/* Asistentes */}
              {event.attendeeEmails && event.attendeeEmails.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Asistentes</h4>
                  <div className="space-y-1">
                    {event.attendeeEmails.map((email, index) => (
                      <p key={index} className="text-sm text-gray-600">{email}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultado previo */}
              {event.outcomeNotes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Resultado</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-800 whitespace-pre-wrap">{event.outcomeNotes}</p>
                    {event.nextAction && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs text-green-600 font-medium">Próxima acción:</p>
                        <p className="text-sm text-green-700">{event.nextAction}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Formulario de completar evento */}
              {showCompleteForm && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Completar Evento</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas del resultado *
                      </label>
                      <textarea
                        value={outcomeNotes}
                        onChange={(e) => setOutcomeNotes(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describir el resultado de la reunión..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Próxima acción (opcional)
                      </label>
                      <input
                        type="text"
                        value={nextAction}
                        onChange={(e) => setNextAction(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ej: Enviar propuesta, Programar demo técnico..."
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleCompleteEvent}
                        disabled={isUpdating || !outcomeNotes.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? 'Completando...' : 'Completar Evento'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCompleteForm(false);
                          setOutcomeNotes('');
                          setNextAction('');
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {event.automated ? '🤖 Creado automáticamente' : 'Creado manualmente'} •{' '}
                {new Date(event.createdAt).toLocaleDateString('es-ES')}
                {event.rescheduledCount > 0 && (
                  <span> • Reprogramado {event.rescheduledCount} {event.rescheduledCount === 1 ? 'vez' : 'veces'}</span>
                )}
              </div>

              <div className="flex space-x-2">
                {/* Acciones según estado */}
                {event.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      disabled={isUpdating}
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setShowCompleteForm(true)}
                      disabled={isUpdating}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Completar
                    </button>
                  </>
                )}

                {event.status === 'confirmed' && (
                  <button
                    onClick={() => setShowCompleteForm(true)}
                    disabled={isUpdating}
                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Completar
                  </button>
                )}

                {['scheduled', 'confirmed'].includes(event.status) && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('rescheduled')}
                      disabled={isUpdating}
                      className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-1" />
                      Reprogramar
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('canceled')}
                      disabled={isUpdating}
                      className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4 inline mr-1" />
                      Cancelar
                    </button>
                  </>
                )}

                {/* Eliminar evento */}
                <button
                  onClick={handleDeleteEvent}
                  disabled={isUpdating}
                  className="bg-gray-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                  title="Eliminar evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}