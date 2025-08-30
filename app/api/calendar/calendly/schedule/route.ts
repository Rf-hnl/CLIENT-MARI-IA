/**
 * CALENDLY SCHEDULING API
 * 
 * Endpoint para programar reuniones automáticamente usando Calendly
 * POST /api/calendar/calendly/schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { CalendlySchedulingRequest, CalendlySchedulingResponse } from '@/types/calendly';

const CALENDLY_ACCESS_TOKEN = process.env.CALENDLY_ACCESS_TOKEN;
const CALENDLY_API_BASE = 'https://api.calendly.com';

export async function POST(request: NextRequest) {
  try {
    const schedulingRequest: CalendlySchedulingRequest = await request.json();

    // Validar request
    if (!schedulingRequest.leadId || !schedulingRequest.inviteeEmail) {
      return NextResponse.json(
        { success: false, error: 'Lead ID and invitee email are required' },
        { status: 400 }
      );
    }

    // Obtener configuración de Calendly para el tenant
    const config = await getCalendlyConfig(schedulingRequest.leadId);
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Calendly not configured for this organization' },
        { status: 400 }
      );
    }

    // Obtener URL de scheduling según el tipo de evento
    const schedulingUrl = getSchedulingUrlForEventType(
      config,
      schedulingRequest.eventType,
      schedulingRequest.metadata
    );

    if (!schedulingUrl) {
      return NextResponse.json(
        { success: false, error: 'Event type not configured' },
        { status: 400 }
      );
    }

    // Si es auto-scheduling, crear invitación directamente
    if (schedulingRequest.automated) {
      const result = await createScheduledInvitation(schedulingRequest, config);
      return NextResponse.json(result);
    }

    // Si no es automático, devolver URL de scheduling para que el lead self-schedule
    const customizedUrl = addTrackingToSchedulingUrl(schedulingUrl, schedulingRequest);

    const response: CalendlySchedulingResponse = {
      success: true,
      schedulingUrl: customizedUrl
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in Calendly scheduling:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Obtener configuración de Calendly para el tenant
 */
async function getCalendlyConfig(leadId: string) {
  try {
    // Obtener información del lead para saber el tenant
    const leadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/get?leadId=${leadId}`);
    const leadData = await leadResponse.json();
    
    if (!leadData.success) return null;
    
    const { tenantId, organizationId } = leadData.lead;

    // Obtener configuración de Calendly del tenant
    const configResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/tenant/calendly-config?tenantId=${tenantId}&organizationId=${organizationId}`
    );
    
    const configData = await configResponse.json();
    return configData.success ? configData.config : null;

  } catch (error) {
    console.error('Error getting Calendly config:', error);
    return null;
  }
}

/**
 * Obtener URL de scheduling según el tipo de evento
 */
function getSchedulingUrlForEventType(config: any, eventType: string, metadata?: any): string | null {
  const eventTypeMapping = config.eventTypeMapping || {};
  
  // Mapear tipos de seguimiento a tipos de evento de Calendly
  const typeMap: { [key: string]: string } = {
    demo: eventTypeMapping.demo || 'demo',
    proposal: eventTypeMapping.proposal || 'proposal',
    closing: eventTypeMapping.closing || 'closing',
    follow_up: eventTypeMapping.follow_up || 'follow-up',
    technical_call: eventTypeMapping.technical_call || 'technical',
    discovery: eventTypeMapping.discovery || 'discovery'
  };

  const calendlyEventType = typeMap[eventType];
  if (!calendlyEventType) return null;

  // Obtener URL base del event type
  const eventTypeConfig = config.eventTypes?.[calendlyEventType];
  return eventTypeConfig?.schedulingUrl || null;
}

/**
 * Añadir tracking y parámetros personalizados a la URL de scheduling
 */
function addTrackingToSchedulingUrl(baseUrl: string, request: CalendlySchedulingRequest): string {
  const url = new URL(baseUrl);
  
  // Parámetros de tracking
  if (request.metadata) {
    if (request.metadata.source) {
      url.searchParams.set('utm_source', request.metadata.source);
    }
    if (request.metadata.campaignId) {
      url.searchParams.set('utm_campaign', request.metadata.campaignId);
    }
  }

  // Información del lead
  url.searchParams.set('lead_id', request.leadId);
  url.searchParams.set('event_type', request.eventType);
  url.searchParams.set('automated', request.automated.toString());
  
  // Pre-fill información del invitee si está disponible
  if (request.inviteeName) {
    url.searchParams.set('name', request.inviteeName);
  }
  if (request.inviteeEmail) {
    url.searchParams.set('email', request.inviteeEmail);
  }

  return url.toString();
}

/**
 * Crear invitación programada automáticamente
 * NOTA: Esto requiere Calendly Enterprise API para crear eventos directamente
 */
async function createScheduledInvitation(
  request: CalendlySchedulingRequest,
  config: any
): Promise<CalendlySchedulingResponse> {
  try {
    // Para auto-scheduling completo necesitamos encontrar una slot disponible
    const availableSlot = await findAvailableTimeSlot(request, config);
    
    if (!availableSlot) {
      return {
        success: false,
        error: 'No available time slots found'
      };
    }

    // En una implementación real, aquí usaríamos la API de Calendly Enterprise
    // para crear el evento directamente. Por ahora, devolvemos la URL personalizada.
    const schedulingUrl = getSchedulingUrlForEventType(config, request.eventType, request.metadata);
    const customizedUrl = addTrackingToSchedulingUrl(schedulingUrl!, request);

    // Crear record preliminar en nuestro sistema
    await createPreliminaryCalendarEvent(request, availableSlot);

    return {
      success: true,
      schedulingUrl: customizedUrl,
      eventDetails: {
        startTime: availableSlot.start,
        endTime: availableSlot.end,
        location: 'TBD - Will be updated after Calendly confirmation'
      }
    };

  } catch (error) {
    console.error('Error creating scheduled invitation:', error);
    return {
      success: false,
      error: 'Failed to create scheduled invitation'
    };
  }
}

/**
 * Encontrar slot de tiempo disponible
 */
async function findAvailableTimeSlot(
  request: CalendlySchedulingRequest,
  config: any
): Promise<{ start: string; end: string } | null> {
  try {
    // Obtener horarios disponibles desde Calendly
    const eventTypeUri = config.eventTypes[request.eventType]?.uri;
    if (!eventTypeUri) return null;

    const response = await fetch(
      `${CALENDLY_API_BASE}/availability_windows?event_type=${encodeURIComponent(eventTypeUri)}`,
      {
        headers: {
          'Authorization': `Bearer ${CALENDLY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('Error fetching availability from Calendly:', await response.text());
      return null;
    }

    const availabilityData = await response.json();
    
    // Buscar el primer slot disponible
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 horas desde ahora
    
    for (const window of availabilityData.collection || []) {
      const startTime = new Date(window.start_time);
      const endTime = new Date(window.end_time);
      
      if (startTime >= minStartTime) {
        return {
          start: startTime.toISOString(),
          end: endTime.toISOString()
        };
      }
    }

    return null;

  } catch (error) {
    console.error('Error finding available time slot:', error);
    return null;
  }
}

/**
 * Crear evento preliminar en el calendario
 */
async function createPreliminaryCalendarEvent(
  request: CalendlySchedulingRequest,
  timeSlot: { start: string; end: string }
) {
  try {
    const calendarEvent = {
      tenantId: '', // Se obtendrá del lead
      organizationId: '', // Se obtendrá del lead
      userId: '', // Se obtendrá del lead
      leadId: request.leadId,
      title: `${request.eventType} - ${request.inviteeName} (Pendiente confirmación)`,
      description: `Evento programado automáticamente vía Calendly.\nTipo: ${request.eventType}\nPrioridad: ${request.priority}`,
      startTime: new Date(timeSlot.start),
      endTime: new Date(timeSlot.end),
      status: 'pending',
      priority: request.priority,
      followUpType: request.followUpType,
      automated: true,
      meetingPlatform: 'calendly',
      attendees: [
        {
          email: request.inviteeEmail,
          name: request.inviteeName,
          status: 'pending',
          response: 'pending'
        }
      ],
      metadata: {
        source: 'calendly_auto_schedule',
        automated: true,
        preliminaryEvent: true,
        ...request.metadata
      }
    };

    // Obtener información del lead para completar campos faltantes
    const leadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/get?leadId=${request.leadId}`);
    const leadData = await leadResponse.json();
    
    if (leadData.success) {
      calendarEvent.tenantId = leadData.lead.tenantId;
      calendarEvent.organizationId = leadData.lead.organizationId;
      calendarEvent.userId = leadData.lead.assignedTo || leadData.lead.tenantId;
    }

    // Crear evento preliminar
    const createResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarEvent)
    });

    if (createResponse.ok) {
      console.log(`Preliminary calendar event created for lead: ${request.leadId}`);
    }

  } catch (error) {
    console.error('Error creating preliminary calendar event:', error);
  }
}

/**
 * Endpoint GET para obtener configuración disponible
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and Organization ID required' },
        { status: 400 }
      );
    }

    // Obtener configuración de Calendly
    const configResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/tenant/calendly-config?tenantId=${tenantId}&organizationId=${organizationId}`
    );
    
    const configData = await configResponse.json();

    if (!configData.success) {
      return NextResponse.json({
        success: false,
        error: 'Calendly not configured'
      });
    }

    return NextResponse.json({
      success: true,
      config: configData.config,
      eventTypes: Object.keys(configData.config.eventTypeMapping || {}),
      enabled: configData.config.enabled || false
    });

  } catch (error) {
    console.error('Error getting Calendly config:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}