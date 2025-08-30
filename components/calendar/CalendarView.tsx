/**
 * CALENDAR VIEW COMPONENT
 * 
 * Componente principal de calendario integrado con:
 * - Vista mensual, semanal y diaria
 * - Eventos automáticos basados en sentiment analysis
 * - Gestión de reuniones y seguimientos
 * - Integración con leads calificados
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Clock, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Phone,
  Video,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause
} from 'lucide-react';

import CreateEventModal from './CreateEventModal';
import EventDetailsModal from './EventDetailsModal';
import EditEventModal from './EditEventModal';

import {
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventPriority,
  FollowUpType,
  CalendarMonthView,
  CalendarDayView,
  UseCalendarReturn,
  getEventStatusColor,
  getPriorityColor,
  formatEventTime,
  CreateCalendarEventData
} from '@/types/calendar';

interface CalendarViewProps {
  tenantId: string;
  organizationId: string;
  userId: string;
  className?: string;
}

type ViewType = 'month' | 'week' | 'day' | 'list';

export default function CalendarView({
  tenantId,
  organizationId,
  userId,
  className = ""
}: CalendarViewProps) {
  // Estados principales
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para crear eventos
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEventDate, setCreateEventDate] = useState<Date | null>(null);
  
  // Estados para mostrar detalles de eventos
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Estados para editar eventos
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState<CalendarEventStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<CalendarEventPriority[]>([]);
  const [typeFilter, setTypeFilter] = useState<FollowUpType[]>([]);
  const [automatedOnly, setAutomatedOnly] = useState(false);

  // Cargar eventos iniciales
  useEffect(() => {
    loadCalendarEvents();
  }, [selectedDate, currentView, statusFilter, priorityFilter, typeFilter, automatedOnly]);

  /**
   * Cargar eventos del calendario
   */
  const loadCalendarEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Determinar rango de fechas basado en vista actual
      const { startDate, endDate } = getDateRangeForView(selectedDate, currentView);

      const response = await fetch(`/api/calendar/events?${new URLSearchParams({
        tenantId,
        organizationId,
        userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
        ...(priorityFilter.length > 0 && { priority: priorityFilter.join(',') }),
        ...(typeFilter.length > 0 && { followUpType: typeFilter.join(',') }),
        ...(automatedOnly && { automated: 'true' })
      })}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load calendar events');
      }

      const eventsData = await response.json();
      setEvents(eventsData.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt)
      })));

    } catch (error) {
      console.error('Error loading calendar events:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Crear nuevo evento de calendario
   */
  const createEvent = async (eventData: CreateCalendarEventData) => {
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          tenantId,
          organizationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      const createdEvent = await response.json();
      
      // Recargar todos los eventos desde el servidor para asegurar sincronización
      await loadCalendarEvents();
      
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  /**
   * Manejar click en fecha para crear evento
   */
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCreateEventDate(date);
    setShowCreateModal(true);
  };

  /**
   * Manejar click en evento para ver detalles
   */
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  /**
   * Actualizar evento existente
   */
  const updateEvent = async (eventId: string, eventData: Partial<CalendarEvent>) => {
    try {
      // Obtener token de autenticación
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          userId,
          tenantId,
          organizationId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update calendar event');
      }

      // Recargar todos los eventos desde el servidor para asegurar sincronización
      await loadCalendarEvents();
      
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  /**
   * Manejar edición de evento
   */
  const handleEditEvent = (event: CalendarEvent) => {
    setEditEvent(event);
    setShowEditModal(true);
  };

  /**
   * Obtener rango de fechas para la vista actual
   */
  const getDateRangeForView = (date: Date, view: ViewType) => {
    const startDate = new Date(date);
    const endDate = new Date(date);

    switch (view) {
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'list':
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(endDate.getDate() + 30);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  /**
   * Navegación de fechas
   */
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'list':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 30 : -30));
        break;
    }
    
    setSelectedDate(newDate);
  };

  /**
   * Generar vista mensual
   */
  const generateMonthView = (): CalendarMonthView => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOfWeek = new Date(firstDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days: CalendarDayView[] = [];
    const current = new Date(startOfWeek);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === current.toDateString();
      });

      days.push({
        date: new Date(current),
        dayOfWeek: current.getDay(),
        isToday: current.toDateString() === new Date().toDateString(),
        isCurrentMonth: current.getMonth() === month,
        events: dayEvents,
        eventCount: dayEvents.length,
        hasHighPriorityEvents: dayEvents.some(e => ['high', 'urgent'].includes(e.priority))
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return { year, month, days };
  };

  /**
   * Formatear título de fecha
   */
  const getDateTitle = () => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (currentView) {
      case 'month':
        options.year = 'numeric';
        options.month = 'long';
        break;
      case 'week':
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'day':
        options.weekday = 'long';
        options.day = 'numeric';
        options.month = 'long';
        options.year = 'numeric';
        break;
      case 'list':
        return 'Próximos Eventos';
    }
    
    return selectedDate.toLocaleDateString('es-ES', options);
  };

  /**
   * Obtener icono para tipo de reunión
   */
  const getMeetingIcon = (platform: string, type: FollowUpType) => {
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

  /**
   * Obtener icono de estado
   */
  const getStatusIcon = (status: CalendarEventStatus) => {
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

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }, (_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar calendario</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadCalendarEvents}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const monthView = currentView === 'month' ? generateMonthView() : null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              📅 Calendario Inteligente
            </h2>
            {events.some(e => e.automated) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🤖 Con IA
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Botón Nuevo Evento */}
            <button
              onClick={() => {
                setCreateEventDate(new Date());
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nuevo Evento
            </button>

            {/* Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                showFilters 
                  ? 'bg-orange-100 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Filtros"
            >
              <Filter className="w-4 h-4" />
            </button>

            {/* Selector de vista */}
            <div className="flex rounded-md border border-gray-300">
              {(['month', 'week', 'day', 'list'] as ViewType[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-1 text-sm font-medium first:rounded-l-md last:rounded-r-md ${
                    currentView === view
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {view === 'month' ? 'Mes' : 
                   view === 'week' ? 'Semana' : 
                   view === 'day' ? 'Día' : 'Lista'}
                </button>
              ))}
            </div>

            {/* Navegación */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Hoy
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Título de fecha */}
        <h3 className="text-lg font-medium text-gray-900 mt-4 capitalize">
          {getDateTitle()}
        </h3>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  multiple
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(Array.from(e.target.selectedOptions, option => option.value as CalendarEventStatus))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="scheduled">Programado</option>
                  <option value="confirmed">Confirmado</option>
                  <option value="completed">Completado</option>
                  <option value="canceled">Cancelado</option>
                  <option value="rescheduled">Reprogramado</option>
                  <option value="no_show">No asistió</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  multiple
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(Array.from(e.target.selectedOptions, option => option.value as CalendarEventPriority))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  multiple
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(Array.from(e.target.selectedOptions, option => option.value as FollowUpType))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="demo">Demo</option>
                  <option value="proposal">Propuesta</option>
                  <option value="closing">Cierre</option>
                  <option value="follow_up">Seguimiento</option>
                  <option value="nurturing">Nurturing</option>
                  <option value="technical_call">Técnica</option>
                  <option value="discovery">Descubrimiento</option>
                  <option value="onboarding">Onboarding</option>
                </select>
              </div>

              {/* Solo automáticos */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={automatedOnly}
                    onChange={(e) => setAutomatedOnly(e.target.checked)}
                    className="border border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Solo eventos automáticos
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vista principal */}
      <div className="p-6">
        {currentView === 'month' && monthView && (
          <div className="grid grid-cols-7 gap-1">
            {/* Headers de días */}
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="p-2 text-sm font-medium text-gray-700 text-center">
                {day}
              </div>
            ))}

            {/* Días del mes */}
            {monthView.days.map((day, index) => (
              <div
                key={index}
                className={`min-h-24 p-1 border rounded-md cursor-pointer hover:bg-gray-50 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${
                  day.isToday ? 'ring-2 ring-orange-500' : 'border-gray-200'
                }`}
                onClick={() => handleDateClick(day.date)}
              >
                <div className={`text-sm font-medium ${
                  day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${
                  day.isToday ? 'text-orange-600' : ''
                }`}>
                  {day.date.getDate()}
                </div>

                {/* Eventos del día */}
                <div className="mt-1 space-y-1">
                  {day.events.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventStatusColor(event.status)}`}
                      title={`${event.title} - ${formatEventTime(event)}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Evitar que se active el click de fecha
                        handleEventClick(event);
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        {event.automated && <span>🤖</span>}
                        {getMeetingIcon(event.meetingPlatform, event.followUpType)}
                        <span className="truncate">{event.title}</span>
                        {!event.meetingLink && (
                          <span className="text-yellow-600" title="Sin link de reunión">
                            ⚠️
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {day.events.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{day.events.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentView === 'list' && (
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos</h3>
                <p className="text-gray-600">No se encontraron eventos para mostrar.</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(event.status)}
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {event.automated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            🤖 Automático
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(event.priority)}`}>
                          {event.priority === 'low' ? 'Baja' :
                           event.priority === 'medium' ? 'Media' :
                           event.priority === 'high' ? 'Alta' : 'Urgente'}
                        </span>
                        {!event.meetingLink && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            ⚠️ Sin link
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatEventTime(event)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getMeetingIcon(event.meetingPlatform, event.followUpType)}
                          <span className="capitalize">{event.meetingPlatform}</span>
                        </div>
                        {event.followUpType && (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                            {event.followUpType}
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventStatusColor(event.status)}`}>
                        {event.status === 'scheduled' ? 'Programado' :
                         event.status === 'confirmed' ? 'Confirmado' :
                         event.status === 'completed' ? 'Completado' :
                         event.status === 'canceled' ? 'Cancelado' :
                         event.status === 'rescheduled' ? 'Reprogramado' :
                         event.status === 'no_show' ? 'No asistió' : 'Pendiente'}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {new Date(event.startTime).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal para crear eventos */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateEventDate(null);
        }}
        onCreateEvent={createEvent}
        selectedDate={createEventDate || undefined}
        tenantId={tenantId}
        organizationId={organizationId}
        userId={userId}
      />

      {/* Modal para ver detalles de eventos */}
      <EventDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEdit={(event) => {
          setShowDetailsModal(false);
          handleEditEvent(event);
        }}
        onDelete={async (eventId) => {
          // TODO: Implementar eliminación de eventos
          console.log('Delete event:', eventId);
        }}
      />

      {/* Modal para editar eventos */}
      <EditEventModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditEvent(null);
        }}
        onUpdateEvent={updateEvent}
        event={editEvent}
      />
    </div>
  );
}