/**
 * CALENDLY SERVICE
 * 
 * Servicio para integración completa con Calendly API
 * Maneja sincronización, scheduling automático y gestión de webhooks
 */

import { 
  CalendlyEvent,
  CalendlyInvitee,
  CalendlyEventType,
  CalendlyConfig,
  CalendlyIntegrationSettings,
  CalendlySchedulingRequest,
  CalendlySchedulingResponse
} from '@/types/calendly';
import { CalendarEvent, CalendarEventStatus } from '@/types/calendar';

export class CalendlyService {
  private accessToken: string;
  private baseUrl = 'https://api.calendly.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseUrl}/users/me`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Calendly API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  /**
   * Obtener tipos de eventos disponibles
   */
  async getEventTypes(userUri: string): Promise<CalendlyEventType[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/event_types?user=${encodeURIComponent(userUri)}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching event types: ${response.statusText}`);
      }

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Error getting event types:', error);
      throw error;
    }
  }

  /**
   * Obtener eventos programados
   */
  async getScheduledEvents(
    userUri: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<CalendlyEvent[]> {
    try {
      const params = new URLSearchParams({
        user: userUri,
        status: 'active'
      });

      if (startTime) {
        params.set('min_start_time', startTime.toISOString());
      }
      if (endTime) {
        params.set('max_start_time', endTime.toISOString());
      }

      const response = await fetch(
        `${this.baseUrl}/scheduled_events?${params.toString()}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching events: ${response.statusText}`);
      }

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Error getting scheduled events:', error);
      throw error;
    }
  }

  /**
   * Obtener invitees para un evento
   */
  async getEventInvitees(eventUri: string): Promise<CalendlyInvitee[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/scheduled_events/${encodeURIComponent(eventUri)}/invitees`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching invitees: ${response.statusText}`);
      }

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Error getting event invitees:', error);
      throw error;
    }
  }

  /**
   * Sincronizar eventos de Calendly con el sistema local
   */
  async syncCalendlyEvents(
    tenantId: string,
    organizationId: string,
    userUri: string,
    lastSyncDate?: Date
  ): Promise<{ synced: number; errors: string[] }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      // Obtener eventos desde la última sincronización
      const startTime = lastSyncDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás
      const calendlyEvents = await this.getScheduledEvents(userUri, startTime);

      for (const calendlyEvent of calendlyEvents) {
        try {
          // Verificar si el evento ya existe en nuestro sistema
          const existingEvent = await this.findExistingEvent(calendlyEvent.uri);
          
          if (existingEvent) {
            // Actualizar evento existente
            await this.updateExistingEvent(existingEvent, calendlyEvent);
          } else {
            // Crear nuevo evento
            await this.createEventFromCalendly(
              calendlyEvent,
              tenantId,
              organizationId
            );
          }
          
          synced++;
        } catch (error) {
          console.error(`Error syncing event ${calendlyEvent.uri}:`, error);
          errors.push(`Event ${calendlyEvent.name}: ${error}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error('Error in sync process:', error);
      throw error;
    }
  }

  /**
   * Programar reunión automática usando scoring de leads
   */
  async autoScheduleMeetingForLead(
    leadId: string,
    leadScore: number,
    sentiment: number,
    settings: CalendlyIntegrationSettings
  ): Promise<CalendlySchedulingResponse> {
    try {
      // Verificar si el lead cumple los criterios
      if (leadScore < settings.leadScoreThreshold || 
          sentiment < settings.sentimentThreshold) {
        return {
          success: false,
          error: 'Lead does not meet auto-scheduling criteria'
        };
      }

      // Obtener datos del lead
      const leadData = await this.getLeadData(leadId);
      if (!leadData) {
        return {
          success: false,
          error: 'Lead not found'
        };
      }

      // Determinar tipo de evento basado en score y contexto
      const eventType = this.determineEventTypeForLead(leadScore, leadData);
      
      // Crear request de scheduling
      const schedulingRequest: CalendlySchedulingRequest = {
        leadId,
        eventType,
        timezone: settings.timezone,
        inviteeEmail: leadData.email,
        inviteeName: leadData.name,
        customMessage: this.generateCustomMessage(leadData, eventType),
        followUpType: eventType,
        priority: this.mapScoreToPriority(leadScore),
        automated: true,
        metadata: {
          leadScore,
          sentiment,
          source: 'auto_scheduling',
        }
      };

      // Usar el endpoint de scheduling
      const response = await fetch('/api/calendar/calendly/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedulingRequest)
      });

      return await response.json();

    } catch (error) {
      console.error('Error in auto-scheduling:', error);
      return {
        success: false,
        error: 'Auto-scheduling failed'
      };
    }
  }

  /**
   * Crear webhook de Calendly
   */
  async createWebhook(
    organizationUri: string,
    callbackUrl: string,
    events: string[]
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/webhook_subscriptions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          url: callbackUrl,
          events,
          organization: organizationUri,
          scope: 'organization'
        })
      });

      if (!response.ok) {
        throw new Error(`Error creating webhook: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  /**
   * Obtener webhooks activos
   */
  async getWebhooks(organizationUri: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/webhook_subscriptions?organization=${encodeURIComponent(organizationUri)}`,
        {
          headers: this.getHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Error fetching webhooks: ${response.statusText}`);
      }

      const data = await response.json();
      return data.collection || [];
    } catch (error) {
      console.error('Error getting webhooks:', error);
      throw error;
    }
  }

  // Métodos privados

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  private async findExistingEvent(calendlyUri: string) {
    try {
      const response = await fetch(
        `/api/calendar/events?calendlyUri=${encodeURIComponent(calendlyUri)}`
      );
      const data = await response.json();
      return data.success ? data.event : null;
    } catch (error) {
      console.error('Error finding existing event:', error);
      return null;
    }
  }

  private async updateExistingEvent(
    existingEvent: any,
    calendlyEvent: CalendlyEvent
  ) {
    try {
      // Mapear estado de Calendly a nuestro sistema
      const status = this.mapCalendlyStatusToLocal(calendlyEvent.status);
      
      const updateResponse = await fetch(
        `/api/calendar/events/${existingEvent.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: calendlyEvent.name,
            startTime: calendlyEvent.start_time,
            endTime: calendlyEvent.end_time,
            status,
            meetingLink: calendlyEvent.location?.join_url,
            meetingLocation: calendlyEvent.location?.location,
            metadata: {
              ...existingEvent.metadata,
              lastSyncAt: new Date().toISOString(),
              calendlyUpdatedAt: calendlyEvent.updated_at
            }
          })
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update existing event');
      }

      console.log(`Updated event: ${existingEvent.id}`);
    } catch (error) {
      console.error('Error updating existing event:', error);
      throw error;
    }
  }

  private async createEventFromCalendly(
    calendlyEvent: CalendlyEvent,
    tenantId: string,
    organizationId: string
  ) {
    try {
      // Obtener invitees del evento
      const invitees = await this.getEventInvitees(calendlyEvent.uri);
      const primaryInvitee = invitees[0];

      if (!primaryInvitee) {
        throw new Error('No invitees found for event');
      }

      // Buscar lead asociado
      const leadData = await this.findLeadByEmail(primaryInvitee.email);
      
      const calendarEvent: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
        tenantId,
        organizationId,
        userId: leadData?.assignedTo || tenantId,
        leadId: leadData?.id || null,
        title: calendlyEvent.name,
        description: `Evento sincronizado desde Calendly\nInvitee: ${primaryInvitee.name} (${primaryInvitee.email})`,
        startTime: new Date(calendlyEvent.start_time),
        endTime: new Date(calendlyEvent.end_time),
        status: this.mapCalendlyStatusToLocal(calendlyEvent.status),
        priority: leadData ? this.mapScoreToPriority(leadData.score || 0) : 'medium',
        followUpType: this.mapCalendlyEventToFollowUpType(calendlyEvent.event_type),
        automated: false,
        meetingPlatform: this.mapCalendlyLocationToPlatform(calendlyEvent.location),
        meetingLink: calendlyEvent.location?.join_url,
        meetingLocation: calendlyEvent.location?.location,
        attendees: invitees.map(invitee => ({
          email: invitee.email,
          name: invitee.name,
          status: this.mapCalendlyInviteeStatusToLocal(invitee.status),
          response: 'accepted'
        })),
        metadata: {
          calendlyEventUri: calendlyEvent.uri,
          syncedAt: new Date().toISOString(),
          source: 'calendly_sync'
        }
      };

      const createResponse = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calendarEvent)
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create calendar event');
      }

      console.log(`Created event from Calendly: ${calendlyEvent.uri}`);
    } catch (error) {
      console.error('Error creating event from Calendly:', error);
      throw error;
    }
  }

  private async getLeadData(leadId: string) {
    try {
      const response = await fetch(`/api/leads/get?leadId=${leadId}`);
      const data = await response.json();
      return data.success ? data.lead : null;
    } catch (error) {
      console.error('Error getting lead data:', error);
      return null;
    }
  }

  private async findLeadByEmail(email: string) {
    try {
      const response = await fetch(`/api/leads/get?email=${email}`);
      const data = await response.json();
      return data.success ? data.lead : null;
    } catch (error) {
      console.error('Error finding lead by email:', error);
      return null;
    }
  }

  private determineEventTypeForLead(score: number, leadData: any): keyof CalendlyIntegrationSettings['eventTypeMapping'] {
    if (score >= 90) return 'closing';
    if (score >= 80) return 'proposal';
    if (score >= 70) return 'demo';
    if (score >= 60) return 'discovery';
    return 'follow_up';
  }

  private generateCustomMessage(leadData: any, eventType: string): string {
    const messages = {
      demo: `Hola ${leadData.name}, me da mucho gusto poder agendar esta demo personalizada contigo. Hablaremos sobre cómo podemos ayudarte con ${leadData.interests || 'tus objetivos'}.`,
      proposal: `${leadData.name}, es el momento perfecto para presentarte nuestra propuesta personalizada. Tengo excelentes noticias que compartir contigo.`,
      closing: `Perfecto ${leadData.name}, vamos a cerrar todos los detalles y dar el siguiente paso juntos. ¡Estoy emocionado de trabajar contigo!`,
      discovery: `Hola ${leadData.name}, vamos a conocernos mejor y entender exactamente cómo podemos ayudarte a alcanzar tus objetivos.`,
      follow_up: `${leadData.name}, quería darle seguimiento a nuestra conversación anterior y ver cómo podemos continuar avanzando.`
    };

    return messages[eventType as keyof typeof messages] || messages.follow_up;
  }

  private mapScoreToPriority(score: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (score >= 90) return 'urgent';
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private mapCalendlyStatusToLocal(calendlyStatus: string): CalendarEventStatus {
    switch (calendlyStatus) {
      case 'active': return 'scheduled';
      case 'canceled': return 'canceled';
      default: return 'scheduled';
    }
  }

  private mapCalendlyInviteeStatusToLocal(inviteeStatus: string): string {
    switch (inviteeStatus) {
      case 'active': return 'confirmed';
      case 'canceled': return 'declined';
      default: return 'pending';
    }
  }

  private mapCalendlyEventToFollowUpType(eventType: string): string {
    const typeMap: { [key: string]: string } = {
      'demo': 'demo',
      'discovery': 'discovery',
      'proposal': 'proposal',
      'closing': 'closing',
      'follow_up': 'follow_up',
      'technical': 'technical_call',
      'onboarding': 'onboarding'
    };

    const lowerEventType = eventType.toLowerCase();
    for (const [key, value] of Object.entries(typeMap)) {
      if (lowerEventType.includes(key)) {
        return value;
      }
    }

    return 'follow_up';
  }

  private mapCalendlyLocationToPlatform(location?: any): string {
    if (!location) return 'other';
    
    const type = location.type?.toLowerCase() || '';
    const locationStr = location.location?.toLowerCase() || '';

    if (type.includes('zoom') || locationStr.includes('zoom')) return 'zoom';
    if (type.includes('teams') || locationStr.includes('teams')) return 'teams';
    if (type.includes('meet') || locationStr.includes('meet')) return 'meet';
    if (type.includes('phone') || locationStr.includes('phone')) return 'phone';
    if (type.includes('physical') || locationStr.includes('office')) return 'in_person';

    return 'other';
  }
}

// Factory function para crear instancia del servicio
export function createCalendlyService(accessToken: string): CalendlyService {
  return new CalendlyService(accessToken);
}

// Utilidades para configuración
export class CalendlyConfigManager {
  static async getConfig(tenantId: string, organizationId: string): Promise<CalendlyIntegrationSettings | null> {
    try {
      const response = await fetch(`/api/tenant/calendly-config?tenantId=${tenantId}&organizationId=${organizationId}`);
      const data = await response.json();
      return data.success ? data.config : null;
    } catch (error) {
      console.error('Error getting Calendly config:', error);
      return null;
    }
  }

  static async updateConfig(
    tenantId: string,
    organizationId: string,
    config: Partial<CalendlyIntegrationSettings>
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/tenant/calendly-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          organizationId,
          config
        })
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating Calendly config:', error);
      return false;
    }
  }

  static async testConnection(accessToken: string): Promise<boolean> {
    try {
      const service = new CalendlyService(accessToken);
      await service.getCurrentUser();
      return true;
    } catch (error) {
      console.error('Calendly connection test failed:', error);
      return false;
    }
  }
}