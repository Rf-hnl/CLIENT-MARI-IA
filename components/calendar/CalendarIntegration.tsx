/**
 * CALENDAR INTEGRATION COMPONENT
 * 
 * Componente para integrar el calendario con la página de leads
 * Se agrega como una nueva pestaña en la interfaz existente
 */

"use client";

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Zap,
  Users,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/modules/auth';
import CalendarView from './CalendarView';
import EventDetailModal from './EventDetailModal';
import { CalendarEvent } from '@/types/calendar';
import { useCalendar } from '@/hooks/useCalendar';

interface CalendarIntegrationProps {
  className?: string;
}

export default function CalendarIntegration({ className = "" }: CalendarIntegrationProps) {
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAutoSchedulePrompt, setShowAutoSchedulePrompt] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // Usar el hook de calendario
  const {
    events,
    isLoading,
    error,
    updateEvent,
    deleteEvent,
    completeEvent
  } = useCalendar({
    tenantId: user?.tenantId || '',
    organizationId: user?.organizationId || '',
    userId: user?.id || '',
    initialView: 'month'
  });

  /**
   * Ejecutar programación automática batch
   */
  const handleBatchAutoSchedule = async () => {
    if (!user?.tenantId || !user?.organizationId || !user?.id) {
      alert('Información de usuario no disponible');
      return;
    }

    try {
      setIsAutoScheduling(true);
      
      const response = await fetch('/api/calendar/batch-auto-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: user.tenantId,
          organizationId: user.organizationId,
          userId: user.id
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`🤖 Programación automática completada:
        
✅ ${result.summary.successfullyScheduled} reuniones programadas
📊 ${result.summary.totalProcessed} leads procesados
📈 ${result.summary.successRate}% tasa de éxito`);
        
        // Recargar eventos
        window.location.reload();
      } else {
        alert(`Error en programación automática: ${result.message}`);
      }

    } catch (error) {
      console.error('Error in batch auto-schedule:', error);
      alert('Error al ejecutar programación automática');
    } finally {
      setIsAutoScheduling(false);
      setShowAutoSchedulePrompt(false);
    }
  };

  /**
   * Obtener estadísticas del calendario
   */
  const getCalendarStats = () => {
    const now = new Date();
    
    const upcomingEvents = events.filter(event => 
      event.startTime > now && !['canceled', 'completed'].includes(event.status)
    ).length;

    const automatedEvents = events.filter(event => event.automated).length;

    const completedThisWeek = events.filter(event => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      return event.status === 'completed' && 
             event.completedAt && 
             event.completedAt >= weekStart;
    }).length;

    const totalEvents = events.length;

    return {
      upcomingEvents,
      automatedEvents,
      completedThisWeek,
      totalEvents,
      automationRate: totalEvents > 0 ? Math.round((automatedEvents / totalEvents) * 100) : 0
    };
  };

  const stats = getCalendarStats();

  if (!user?.tenantId || !user?.organizationId || !user?.id) {
    return (
      <div className="text-center py-8">
        <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Información de usuario no disponible</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <CalendarIcon className="w-8 h-8" />
              <span>Calendario Inteligente</span>
            </h1>
            <p className="mt-2 text-blue-100">
              Reuniones programadas automáticamente basadas en análisis de IA
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setShowAutoSchedulePrompt(true)}
              disabled={isAutoScheduling}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isAutoScheduling ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span>Programando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>🤖 Auto Programar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Próximos Eventos</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Eventos IA</p>
                <p className="text-2xl font-bold">{stats.automatedEvents}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Completados</p>
                <p className="text-2xl font-bold">{stats.completedThisWeek}</p>
                <p className="text-xs text-blue-200">Esta semana</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Automatización</p>
                <p className="text-2xl font-bold">{stats.automationRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Vista principal del calendario */}
      <CalendarView
        tenantId={user.tenantId}
        organizationId={user.organizationId}
        userId={user.id}
        className="min-h-96"
      />

      {/* Modal de detalles de evento */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        onUpdate={async (eventId, updates) => {
          await updateEvent(eventId, updates);
        }}
        onDelete={async (eventId) => {
          await deleteEvent(eventId);
        }}
        onComplete={async (eventId, outcome, nextAction) => {
          await completeEvent(eventId, outcome, nextAction);
        }}
        leadData={selectedEvent ? {
          name: 'Lead Name', // TODO: Get from event.lead
          company: 'Company',
          email: 'email@example.com',
          phone: '+1234567890',
          status: 'qualified'
        } : undefined}
      />

      {/* Prompt de programación automática */}
      {showAutoSchedulePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">🤖 Programación Automática</h3>
            <p className="text-gray-600 mb-6">
              El sistema analizará los leads calificados basándose en el análisis de sentiment 
              y programará automáticamente reuniones para aquellos que cumplan los criterios.
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Criterios de programación:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sentiment score &gt; 0.4</li>
                <li>• Engagement score &gt; 60%</li>
                <li>• Momentos críticos detectados</li>
                <li>• Sin eventos recientes programados</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBatchAutoSchedule}
                disabled={isAutoScheduling}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isAutoScheduling ? 'Procesando...' : 'Iniciar Programación'}
              </button>
              <button
                onClick={() => setShowAutoSchedulePrompt(false)}
                disabled={isAutoScheduling}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}