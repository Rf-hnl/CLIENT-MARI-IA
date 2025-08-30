/**
 * USE CALENDAR HOOK
 * 
 * Hook para gestionar calendario integrado con funcionalidades de IA
 * Incluye programación automática y gestión de eventos
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  CalendarEvent, 
  CreateCalendarEventData, 
  UseCalendarReturn,
  AutoSchedulingResult
} from '@/types/calendar';

interface UseCalendarProps {
  tenantId: string;
  organizationId: string;
  userId: string;
  initialView?: 'month' | 'week' | 'day' | 'list';
  initialDate?: Date;
}

export function useCalendar({
  tenantId,
  organizationId,
  userId,
  initialView = 'month',
  initialDate = new Date()
}: UseCalendarProps): UseCalendarReturn {
  // Estados principales
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'list'>(initialView);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener rango de fechas basado en la vista actual
   */
  const getDateRangeForView = useCallback((date: Date, view: typeof currentView) => {
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
  }, []);

  /**
   * Cargar eventos del calendario
   */
  const getEventsByDateRange = useCallback(async (
    startDate: Date, 
    endDate: Date
  ): Promise<CalendarEvent[]> => {
    try {
      console.log('📅 [useCalendar] Fetching events:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const response = await fetch(`/api/calendar/events?${new URLSearchParams({
        tenantId,
        organizationId,
        userId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })}`);

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const eventsData = await response.json();
      
      // Convertir fechas string a Date objects
      const processedEvents: CalendarEvent[] = eventsData.map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        createdAt: new Date(event.createdAt),
        updatedAt: new Date(event.updatedAt),
        canceledAt: event.canceledAt ? new Date(event.canceledAt) : undefined,
        completedAt: event.completedAt ? new Date(event.completedAt) : undefined
      }));

      return processedEvents;

    } catch (error) {
      console.error('❌ [useCalendar] Error fetching events:', error);
      throw error;
    }
  }, [tenantId, organizationId, userId]);

  /**
   * Crear nuevo evento
   */
  const createEvent = useCallback(async (data: CreateCalendarEventData): Promise<CalendarEvent> => {
    try {
      console.log('📅 [useCalendar] Creating new event:', data.title);

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          organizationId,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create calendar event');
      }

      const newEvent = await response.json();
      
      // Convertir fechas
      const processedEvent: CalendarEvent = {
        ...newEvent,
        startTime: new Date(newEvent.startTime),
        endTime: new Date(newEvent.endTime),
        createdAt: new Date(newEvent.createdAt),
        updatedAt: new Date(newEvent.updatedAt)
      };

      // Actualizar lista local de eventos
      setEvents(prev => [...prev, processedEvent].sort((a, b) => 
        a.startTime.getTime() - b.startTime.getTime()
      ));

      return processedEvent;

    } catch (error) {
      console.error('❌ [useCalendar] Error creating event:', error);
      throw error;
    }
  }, [tenantId, organizationId]);

  /**
   * Actualizar evento existente
   */
  const updateEvent = useCallback(async (
    id: string, 
    data: Partial<CalendarEvent>
  ): Promise<CalendarEvent> => {
    try {
      console.log('📅 [useCalendar] Updating event:', id);

      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          ...data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update calendar event');
      }

      const updatedEvent = await response.json();
      
      // Convertir fechas
      const processedEvent: CalendarEvent = {
        ...updatedEvent,
        startTime: new Date(updatedEvent.startTime),
        endTime: new Date(updatedEvent.endTime),
        createdAt: new Date(updatedEvent.createdAt),
        updatedAt: new Date(updatedEvent.updatedAt),
        canceledAt: updatedEvent.canceledAt ? new Date(updatedEvent.canceledAt) : undefined,
        completedAt: updatedEvent.completedAt ? new Date(updatedEvent.completedAt) : undefined
      };

      // Actualizar lista local
      setEvents(prev => prev.map(event => 
        event.id === id ? processedEvent : event
      ));

      return processedEvent;

    } catch (error) {
      console.error('❌ [useCalendar] Error updating event:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Eliminar evento
   */
  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('📅 [useCalendar] Deleting event:', id);

      const response = await fetch(`/api/calendar/events/${id}?userId=${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete calendar event');
      }

      // Actualizar lista local
      setEvents(prev => prev.filter(event => event.id !== id));

    } catch (error) {
      console.error('❌ [useCalendar] Error deleting event:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Reprogramar evento
   */
  const rescheduleEvent = useCallback(async (
    id: string,
    newStartTime: Date,
    newEndTime: Date
  ): Promise<CalendarEvent> => {
    return await updateEvent(id, {
      startTime: newStartTime,
      endTime: newEndTime,
      status: 'rescheduled',
      rescheduledCount: events.find(e => e.id === id)?.rescheduledCount + 1 || 1
    });
  }, [updateEvent, events]);

  /**
   * Completar evento
   */
  const completeEvent = useCallback(async (
    id: string,
    outcome: string,
    nextAction?: string
  ): Promise<void> => {
    try {
      console.log('📅 [useCalendar] Completing event:', id);

      const response = await fetch(`/api/calendar/events/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          outcomeNotes: outcome,
          nextAction
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete calendar event');
      }

      // Actualizar evento local
      setEvents(prev => prev.map(event => 
        event.id === id 
          ? {
              ...event,
              status: 'completed',
              completedAt: new Date(),
              outcomeNotes: outcome,
              nextAction: nextAction || event.nextAction,
              updatedAt: new Date()
            }
          : event
      ));

    } catch (error) {
      console.error('❌ [useCalendar] Error completing event:', error);
      throw error;
    }
  }, [userId]);

  /**
   * Navegación de fechas
   */
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
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
  }, [selectedDate, currentView]);

  /**
   * Obtener eventos próximos
   */
  const getUpcomingEvents = useCallback((limit: number = 10): CalendarEvent[] => {
    const now = new Date();
    return events
      .filter(event => 
        event.startTime >= now && 
        !['canceled', 'completed'].includes(event.status)
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, limit);
  }, [events]);

  /**
   * Obtener eventos por lead
   */
  const getEventsByLead = useCallback((leadId: string): CalendarEvent[] => {
    return events
      .filter(event => event.leadId === leadId)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [events]);

  /**
   * Cambiar vista
   */
  const setView = useCallback((view: 'month' | 'week' | 'day' | 'list') => {
    setCurrentView(view);
  }, []);

  /**
   * Recargar eventos cuando cambie la fecha o vista
   */
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { startDate, endDate } = getDateRangeForView(selectedDate, currentView);
        const fetchedEvents = await getEventsByDateRange(startDate, endDate);
        
        setEvents(fetchedEvents);

      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
        console.error('❌ [useCalendar] Error loading events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [selectedDate, currentView, getDateRangeForView, getEventsByDateRange]);

  return {
    // State
    events,
    currentView,
    selectedDate,
    isLoading,
    error,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    rescheduleEvent,
    completeEvent,

    // Queries
    getEventsByDateRange,
    getUpcomingEvents,
    getEventsByLead,

    // Views
    setView,
    setSelectedDate,
    navigateDate
  };
}