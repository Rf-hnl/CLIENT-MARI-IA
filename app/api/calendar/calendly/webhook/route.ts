/**
 * CALENDLY WEBHOOK ENDPOINT
 * 
 * Maneja webhooks de Calendly para sincronizar eventos automáticamente
 * POST /api/calendar/calendly/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { CalendlyWebhookPayload, CalendlyEvent, CalendlyInvitee } from '@/types/calendly';
import { CalendarEvent, CalendarEventStatus } from '@/types/calendar';

const CALENDLY_WEBHOOK_SECRET = process.env.CALENDLY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('calendly-webhook-signature');

    // Verificar signature del webhook
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload: CalendlyWebhookPayload = JSON.parse(body);

    switch (payload.event) {
      case 'invitee.created':
        await handleInviteeCreated(payload);
        break;
      
      case 'invitee.canceled':
        await handleInviteeCanceled(payload);
        break;
      
      case 'invitee_no_show.created':
        await handleInviteeNoShow(payload);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${payload.event}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Calendly webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Verificar signature del webhook de Calendly
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature || !CALENDLY_WEBHOOK_SECRET) {
    return false;
  }

  const expectedSignature = createHmac('sha256', CALENDLY_WEBHOOK_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * Manejar creación de invitee (reunión programada)
 */
async function handleInviteeCreated(payload: CalendlyWebhookPayload) {
  const { event: calendlyEvent, invitee } = payload.payload;
  
  if (!calendlyEvent || !invitee) return;

  try {
    // Buscar lead asociado por email
    const leadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/get?email=${invitee.email}`);
    const leadData = await leadResponse.json();
    
    if (!leadData.success || !leadData.lead) {
      console.log(`No lead found for email: ${invitee.email}`);
      return;
    }

    const lead = leadData.lead;

    // Determinar tipo de seguimiento basado en event type
    const followUpType = mapCalendlyEventTypeToFollowUp(calendlyEvent.event_type);
    
    // Crear evento en nuestro sistema
    const calendarEvent: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: lead.tenantId,
      organizationId: lead.organizationId,
      userId: lead.assignedTo || lead.tenantId,
      leadId: lead.id,
      title: `${calendlyEvent.name} - ${invitee.name}`,
      description: `Reunión programada automáticamente vía Calendly.\nEmail: ${invitee.email}\nTipo: ${followUpType}`,
      startTime: new Date(calendlyEvent.start_time),
      endTime: new Date(calendlyEvent.end_time),
      status: 'scheduled' as CalendarEventStatus,
      priority: mapLeadScoreToPriority(lead.score || 0),
      followUpType,
      automated: true,
      meetingPlatform: mapCalendlyLocationToPlatform(calendlyEvent.location),
      meetingLink: calendlyEvent.location?.join_url,
      meetingLocation: calendlyEvent.location?.location,
      attendees: [
        {
          email: invitee.email,
          name: invitee.name,
          status: 'pending',
          response: 'accepted'
        }
      ],
      metadata: {
        calendlyEventUri: calendlyEvent.uri,
        calendlyInviteeUri: invitee.uri,
        source: 'calendly_webhook',
        tracking: invitee.tracking
      }
    };

    // Crear evento en BD
    const createResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarEvent)
    });

    if (createResponse.ok) {
      console.log(`Calendar event created for Calendly event: ${calendlyEvent.uri}`);
      
      // Actualizar lead con nueva actividad
      await updateLeadWithCalendlyEvent(lead.id, calendlyEvent, invitee);
    }

  } catch (error) {
    console.error('Error handling invitee created:', error);
  }
}

/**
 * Manejar cancelación de invitee
 */
async function handleInviteeCanceled(payload: CalendlyWebhookPayload) {
  const { event: calendlyEvent, invitee } = payload.payload;
  
  if (!calendlyEvent || !invitee) return;

  try {
    // Buscar evento en nuestro sistema por URI de Calendly
    const eventResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events?calendlyUri=${calendlyEvent.uri}`
    );
    
    const eventData = await eventResponse.json();
    
    if (eventData.success && eventData.event) {
      // Actualizar estado del evento
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events/${eventData.event.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'canceled',
            metadata: {
              ...eventData.event.metadata,
              canceledAt: new Date().toISOString(),
              canceledBy: 'calendly_webhook'
            }
          })
        }
      );

      if (updateResponse.ok) {
        console.log(`Calendar event canceled for Calendly event: ${calendlyEvent.uri}`);
      }
    }

  } catch (error) {
    console.error('Error handling invitee canceled:', error);
  }
}

/**
 * Manejar no-show del invitee
 */
async function handleInviteeNoShow(payload: CalendlyWebhookPayload) {
  const { event: calendlyEvent, invitee } = payload.payload;
  
  if (!calendlyEvent || !invitee) return;

  try {
    // Buscar evento en nuestro sistema
    const eventResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events?calendlyUri=${calendlyEvent.uri}`
    );
    
    const eventData = await eventResponse.json();
    
    if (eventData.success && eventData.event) {
      // Actualizar estado a no-show
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events/${eventData.event.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'no_show',
            metadata: {
              ...eventData.event.metadata,
              noShowAt: new Date().toISOString(),
              markedBy: 'calendly_webhook'
            }
          })
        }
      );

      if (updateResponse.ok) {
        console.log(`Calendar event marked as no-show: ${calendlyEvent.uri}`);
        
        // Programar follow-up automático para no-show
        await scheduleNoShowFollowUp(eventData.event);
      }
    }

  } catch (error) {
    console.error('Error handling invitee no-show:', error);
  }
}

/**
 * Mapear tipo de evento de Calendly a tipo de seguimiento
 */
function mapCalendlyEventTypeToFollowUp(eventType: string): string {
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

  return 'follow_up'; // Default
}

/**
 * Mapear score de lead a prioridad
 */
function mapLeadScoreToPriority(score: number) {
  if (score >= 90) return 'urgent';
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Mapear ubicación de Calendly a plataforma de reunión
 */
function mapCalendlyLocationToPlatform(location?: any): string {
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

/**
 * Actualizar lead con evento de Calendly
 */
async function updateLeadWithCalendlyEvent(
  leadId: string, 
  calendlyEvent: CalendlyEvent, 
  invitee: CalendlyInvitee
) {
  try {
    const updateResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/admin/update`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          updates: {
            lastActivity: new Date().toISOString(),
            meetingScheduled: true,
            nextFollowUp: calendlyEvent.start_time,
            metadata: {
              calendlyScheduled: true,
              lastCalendlyEvent: calendlyEvent.uri,
              scheduledViaAutomation: true
            }
          }
        })
      }
    );

    if (updateResponse.ok) {
      console.log(`Lead updated with Calendly event: ${leadId}`);
    }

  } catch (error) {
    console.error('Error updating lead with Calendly event:', error);
  }
}

/**
 * Programar follow-up automático para no-show
 */
async function scheduleNoShowFollowUp(originalEvent: any) {
  try {
    // Programar nuevo follow-up para 24 horas después
    const followUpTime = new Date();
    followUpTime.setDate(followUpTime.getDate() + 1);

    const followUpEvent: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: originalEvent.tenantId,
      organizationId: originalEvent.organizationId,
      userId: originalEvent.userId,
      leadId: originalEvent.leadId,
      title: `Follow-up: No-show de ${originalEvent.title}`,
      description: `Follow-up automático por no asistencia a reunión programada.\nReunión original: ${originalEvent.title}\nFecha original: ${new Date(originalEvent.startTime).toLocaleString('es-ES')}`,
      startTime: followUpTime,
      endTime: new Date(followUpTime.getTime() + 30 * 60000), // 30 min
      status: 'scheduled' as CalendarEventStatus,
      priority: 'high',
      followUpType: 'follow_up',
      automated: true,
      meetingPlatform: 'phone',
      metadata: {
        source: 'no_show_followup',
        originalEventId: originalEvent.id,
        autoScheduled: true
      }
    };

    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUpEvent)
      }
    );

    if (createResponse.ok) {
      console.log(`No-show follow-up scheduled for lead: ${originalEvent.leadId}`);
    }

  } catch (error) {
    console.error('Error scheduling no-show follow-up:', error);
  }
}