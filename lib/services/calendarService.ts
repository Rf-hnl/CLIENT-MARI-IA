/**
 * CALENDAR SERVICE
 * 
 * Servicio principal para gestión de calendario integrado
 * Incluye programación automática basada en sentiment analysis
 */

import { prisma } from '@/lib/prisma';
import { 
  CalendarEvent, 
  CreateCalendarEventData, 
  AutoSchedulingConfig, 
  AutoSchedulingResult,
  FollowUpType,
  CalendarEventStatus,
  CalendarEventPriority,
  DEFAULT_AUTO_SCHEDULING_CONFIG,
  DEFAULT_FOLLOW_UP_CONFIGS
} from '@/types/calendar';
import QualifiedLeadDetector from './qualifiedLeadDetector';

export class CalendarService {
  private autoSchedulingConfig: AutoSchedulingConfig;
  private qualifiedDetector: QualifiedLeadDetector;

  constructor(config?: Partial<AutoSchedulingConfig>) {
    this.autoSchedulingConfig = { ...DEFAULT_AUTO_SCHEDULING_CONFIG, ...config };
    this.qualifiedDetector = new QualifiedLeadDetector();
  }

  /**
   * Crear nuevo evento de calendario
   */
  async createEvent(
    data: CreateCalendarEventData,
    tenantId: string,
    organizationId: string
  ): Promise<CalendarEvent> {
    try {
      console.log('📅 [CALENDAR SERVICE] Creating new event:', {
        leadId: data.leadId,
        title: data.title,
        startTime: data.startTime,
        automated: data.automated || false
      });

      const event = await prisma.leadCalendarEvent.create({
        data: {
          leadId: data.leadId,
          userId: data.userId,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          allDay: data.allDay || false,
          location: data.location,
          eventType: data.eventType || 'meeting',
          reminderMinutes: data.reminderMinutes || 30,
          priority: data.priority || 'medium',
          automated: data.automated || false,
          sentimentTrigger: data.sentimentTrigger,
          followUpType: data.followUpType,
          meetingPlatform: data.meetingPlatform || 'internal',
          meetingLink: data.meetingLink,
          attendeeEmails: data.attendeeEmails || [],
          metadata: data.metadata || {}
        }
      });

      console.log(`✅ [CALENDAR SERVICE] Event created with ID: ${event.id}`);
      return this.mapPrismaEventToCalendarEvent(event);

    } catch (error) {
      console.error('❌ [CALENDAR SERVICE] Error creating event:', error);
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Programar automáticamente reunión para lead calificado
   */
  async scheduleAutomatically(
    leadId: string,
    userId: string,
    tenantId: string,
    organizationId: string,
    config?: Partial<AutoSchedulingConfig>
  ): Promise<AutoSchedulingResult> {
    const currentConfig = { ...this.autoSchedulingConfig, ...config };

    try {
      console.log('🤖 [AUTO SCHEDULING] Starting automatic scheduling for lead:', leadId);

      // 1. Generar recomendación de programación
      const recommendation = await this.qualifiedDetector.generateSchedulingRecommendation(leadId);
      
      if (!recommendation) {
        return {
          success: false,
          error: 'No scheduling recommendation generated',
          reason: 'Lead does not meet criteria for automatic scheduling'
        };
      }

      console.log('📊 [AUTO SCHEDULING] Scheduling recommendation:', recommendation);

      // 2. Verificar si debe programarse automáticamente
      if (recommendation.recommendedAction === 'no_action') {
        return {
          success: false,
          error: 'No action recommended',
          reason: recommendation.reasoning
        };
      }

      // 3. Determinar ventana de tiempo adecuada
      const suggestedTimes = await this.findAvailableSlots(
        userId,
        currentConfig.meetingDurations[recommendation.suggestedFollowUpType] || 30,
        currentConfig.businessHours,
        3 // Siguiente 3 días hábiles
      );

      if (suggestedTimes.length === 0) {
        return {
          success: false,
          error: 'No available time slots',
          reason: 'No suitable time slots found within business hours'
        };
      }

      // 4. Seleccionar el mejor horario (primer slot disponible)
      const selectedTime = suggestedTimes[0];
      const followUpConfig = DEFAULT_FOLLOW_UP_CONFIGS[recommendation.suggestedFollowUpType];
      
      const endTime = new Date(selectedTime.getTime() + (followUpConfig.duration * 60000));

      // 5. Crear evento automáticamente
      const eventData: CreateCalendarEventData = {
        leadId,
        userId,
        title: `${followUpConfig.title} - Programado Automáticamente`,
        description: `${followUpConfig.description}\n\n🤖 Programado automáticamente basado en análisis de sentiment.\n\nRazón: ${recommendation.reasoning}\n\nSentiment Score: ${recommendation.sentimentScore.toFixed(2)}`,
        startTime: selectedTime,
        endTime,
        eventType: followUpConfig.type,
        reminderMinutes: followUpConfig.reminderMinutes,
        priority: this.mapUrgencyToPriority(recommendation.urgency),
        automated: true,
        sentimentTrigger: recommendation.sentimentScore,
        followUpType: recommendation.suggestedFollowUpType,
        meetingPlatform: followUpConfig.meetingPlatform
      };

      const event = await this.createEvent(eventData, tenantId, organizationId);

      // 6. Actualizar lead con información de la programación
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          nextFollowUpDate: selectedTime,
          lastProgressionDate: new Date()
        }
      });

      console.log('✅ [AUTO SCHEDULING] Event scheduled automatically:', {
        eventId: event.id,
        time: selectedTime.toISOString(),
        type: recommendation.suggestedFollowUpType,
        priority: event.priority
      });

      return {
        success: true,
        eventId: event.id,
        event,
        reason: `Automatically scheduled ${followUpConfig.title.toLowerCase()} based on sentiment analysis`
      };

    } catch (error) {
      console.error('❌ [AUTO SCHEDULING] Error in automatic scheduling:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        reason: 'Technical error during automatic scheduling'
      };
    }
  }

  /**
   * Encontrar slots disponibles en el calendario
   */
  private async findAvailableSlots(
    userId: string,
    durationMinutes: number,
    businessHours: AutoSchedulingConfig['businessHours'],
    daysAhead: number = 5
  ): Promise<Date[]> {
    const availableSlots: Date[] = [];
    const now = new Date();
    
    // Buscar slots en los próximos días hábiles
    for (let day = 1; day <= daysAhead; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      
      // Verificar si es día hábil
      if (!businessHours.workingDays.includes(date.getDay())) {
        continue;
      }

      // Obtener eventos existentes para este día
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingEvents = await prisma.leadCalendarEvent.findMany({
        where: {
          userId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            notIn: ['canceled', 'completed']
          }
        },
        orderBy: { startTime: 'asc' }
      });

      // Encontrar slots libres
      const daySlots = this.findFreeSlotsInDay(
        date,
        businessHours,
        existingEvents,
        durationMinutes
      );

      availableSlots.push(...daySlots);
    }

    return availableSlots.slice(0, 10); // Máximo 10 opciones
  }

  /**
   * Encontrar slots libres en un día específico
   */
  private findFreeSlotsInDay(
    date: Date,
    businessHours: AutoSchedulingConfig['businessHours'],
    existingEvents: any[],
    durationMinutes: number
  ): Date[] {
    const freeSlots: Date[] = [];
    
    // Crear horarios de inicio y fin del día laboral
    const [startHour, startMinute] = businessHours.start.split(':').map(Number);
    const [endHour, endMinute] = businessHours.end.split(':').map(Number);
    
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    // Si es hoy, no programar en el pasado
    if (date.toDateString() === new Date().toDateString()) {
      const now = new Date();
      if (dayStart < now) {
        dayStart.setTime(now.getTime());
        // Redondear al próximo slot de 15 minutos
        const minutes = dayStart.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        dayStart.setMinutes(roundedMinutes, 0, 0);
      }
    }

    // Generar slots cada 15 minutos
    const current = new Date(dayStart);
    const slotInterval = 15 * 60000; // 15 minutos en ms
    const eventDuration = durationMinutes * 60000;

    while (current.getTime() + eventDuration <= dayEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + eventDuration);
      
      // Verificar si este slot colisiona con eventos existentes
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        
        return (
          (current >= eventStart && current < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (current <= eventStart && slotEnd >= eventEnd)
        );
      });

      if (!hasConflict) {
        freeSlots.push(new Date(current));
      }

      current.setTime(current.getTime() + slotInterval);
    }

    return freeSlots;
  }

  /**
   * Mapear urgencia a prioridad de calendario
   */
  private mapUrgencyToPriority(urgency: string): CalendarEventPriority {
    const mapping: Record<string, CalendarEventPriority> = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'urgent': 'urgent'
    };
    return mapping[urgency] || 'medium';
  }

  /**
   * Obtener eventos por rango de fechas
   */
  async getEventsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<CalendarEvent[]> {
    try {
      const events = await prisma.leadCalendarEvent.findMany({
        where: {
          userId,
          startTime: {
            gte: startDate,
            lte: endDate
          },
          lead: {
            tenantId
          }
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              company: true,
              status: true
            }
          }
        },
        orderBy: { startTime: 'asc' }
      });

      return events.map(event => this.mapPrismaEventToCalendarEvent(event));
    } catch (error) {
      console.error('❌ [CALENDAR SERVICE] Error fetching events by date range:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos próximos para un usuario
   */
  async getUpcomingEvents(
    userId: string,
    tenantId: string,
    limit: number = 10
  ): Promise<CalendarEvent[]> {
    try {
      const events = await prisma.leadCalendarEvent.findMany({
        where: {
          userId,
          startTime: {
            gte: new Date()
          },
          status: {
            notIn: ['canceled', 'completed']
          },
          lead: {
            tenantId
          }
        },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              company: true,
              status: true
            }
          }
        },
        orderBy: { startTime: 'asc' },
        take: limit
      });

      return events.map(event => this.mapPrismaEventToCalendarEvent(event));
    } catch (error) {
      console.error('❌ [CALENDAR SERVICE] Error fetching upcoming events:', error);
      throw error;
    }
  }

  /**
   * Actualizar evento
   */
  async updateEvent(
    eventId: string,
    data: Partial<CalendarEvent>,
    userId: string
  ): Promise<CalendarEvent> {
    try {
      const event = await prisma.leadCalendarEvent.update({
        where: { 
          id: eventId,
          userId // Verificar pertenencia
        },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.startTime && { startTime: data.startTime }),
          ...(data.endTime && { endTime: data.endTime }),
          ...(data.allDay !== undefined && { allDay: data.allDay }),
          ...(data.status && { status: data.status }),
          ...(data.priority && { priority: data.priority }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.eventType && { eventType: data.eventType }),
          ...(data.reminderMinutes !== undefined && { reminderMinutes: data.reminderMinutes }),
          ...(data.followUpType && { followUpType: data.followUpType }),
          ...(data.meetingPlatform && { meetingPlatform: data.meetingPlatform }),
          ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
          ...(data.attendeeEmails && { attendeeEmails: data.attendeeEmails }),
          ...(data.outcomeNotes && { outcomeNotes: data.outcomeNotes }),
          ...(data.nextAction && { nextAction: data.nextAction }),
          updatedAt: new Date()
        }
      });

      return this.mapPrismaEventToCalendarEvent(event);
    } catch (error) {
      console.error('❌ [CALENDAR SERVICE] Error updating event:', error);
      throw error;
    }
  }

  /**
   * Completar evento con resultado
   */
  async completeEvent(
    eventId: string,
    outcomeNotes: string,
    nextAction?: string,
    userId?: string
  ): Promise<void> {
    try {
      await prisma.leadCalendarEvent.update({
        where: { 
          id: eventId,
          ...(userId && { userId })
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
          outcomeNotes,
          nextAction,
          updatedAt: new Date()
        }
      });

      console.log(`✅ [CALENDAR SERVICE] Event ${eventId} completed successfully`);
    } catch (error) {
      console.error('❌ [CALENDAR SERVICE] Error completing event:', error);
      throw error;
    }
  }

  /**
   * Procesamiento batch de leads calificados para programación automática
   */
  async processBatchAutoScheduling(
    tenantId: string,
    organizationId: string,
    userId: string
  ): Promise<{
    processed: number;
    scheduled: number;
    errors: number;
    results: AutoSchedulingResult[];
  }> {
    try {
      console.log('🔄 [BATCH SCHEDULING] Starting batch processing for qualified leads');

      const qualifiedLeads = await this.qualifiedDetector.detectQualifiedLeads(
        tenantId,
        organizationId
      );

      console.log(`🎯 [BATCH SCHEDULING] Found ${qualifiedLeads.length} qualified leads`);

      const results: AutoSchedulingResult[] = [];
      let scheduled = 0;
      let errors = 0;

      // Procesar cada lead calificado
      for (const lead of qualifiedLeads) {
        try {
          const result = await this.scheduleAutomatically(
            lead.leadId,
            userId,
            tenantId,
            organizationId
          );

          results.push(result);

          if (result.success) {
            scheduled++;
          } else {
            console.warn(`⚠️ [BATCH SCHEDULING] Could not schedule ${lead.leadId}: ${result.reason}`);
          }

          // Pausa para evitar saturar la base de datos
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`❌ [BATCH SCHEDULING] Error processing lead ${lead.leadId}:`, error);
          errors++;
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            reason: 'Processing error'
          });
        }
      }

      console.log(`✅ [BATCH SCHEDULING] Batch complete: ${scheduled} scheduled, ${errors} errors`);

      return {
        processed: qualifiedLeads.length,
        scheduled,
        errors,
        results
      };

    } catch (error) {
      console.error('❌ [BATCH SCHEDULING] Error in batch processing:', error);
      throw error;
    }
  }

  /**
   * Mapear evento de Prisma a CalendarEvent
   */
  private mapPrismaEventToCalendarEvent(prismaEvent: any): CalendarEvent {
    return {
      id: prismaEvent.id,
      leadId: prismaEvent.leadId,
      userId: prismaEvent.userId,
      title: prismaEvent.title,
      description: prismaEvent.description,
      startTime: new Date(prismaEvent.startTime),
      endTime: new Date(prismaEvent.endTime),
      allDay: prismaEvent.allDay,
      location: prismaEvent.location,
      eventType: prismaEvent.eventType,
      reminderMinutes: prismaEvent.reminderMinutes,
      status: prismaEvent.status as CalendarEventStatus,
      priority: prismaEvent.priority as CalendarEventPriority,
      automated: prismaEvent.automated,
      sentimentTrigger: prismaEvent.sentimentTrigger ? Number(prismaEvent.sentimentTrigger) : undefined,
      followUpType: prismaEvent.followUpType as FollowUpType,
      meetingLink: prismaEvent.meetingLink,
      meetingPlatform: prismaEvent.meetingPlatform,
      attendeeEmails: prismaEvent.attendeeEmails || [],
      autoReminderSent: prismaEvent.autoReminderSent,
      rescheduledCount: prismaEvent.rescheduledCount,
      canceledAt: prismaEvent.canceledAt ? new Date(prismaEvent.canceledAt) : undefined,
      completedAt: prismaEvent.completedAt ? new Date(prismaEvent.completedAt) : undefined,
      outcomeNotes: prismaEvent.outcomeNotes,
      nextAction: prismaEvent.nextAction,
      metadata: prismaEvent.metadata,
      createdAt: new Date(prismaEvent.createdAt),
      updatedAt: new Date(prismaEvent.updatedAt)
    };
  }

  /**
   * Actualizar configuración de programación automática
   */
  updateAutoSchedulingConfig(config: Partial<AutoSchedulingConfig>): void {
    this.autoSchedulingConfig = { ...this.autoSchedulingConfig, ...config };
    console.log('⚙️ [CALENDAR SERVICE] Auto-scheduling config updated');
  }

  /**
   * Obtener configuración actual
   */
  getAutoSchedulingConfig(): AutoSchedulingConfig {
    return { ...this.autoSchedulingConfig };
  }
}

export default CalendarService;