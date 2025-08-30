/**
 * CALENDAR EVENTS API ROUTE
 * 
 * Endpoints para gestionar eventos de calendario:
 * - GET: Listar eventos por rango de fechas con filtros
 * - POST: Crear nuevo evento
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import CalendarService from '@/lib/services/calendarService';
import { CalendarEventFilters } from '@/types/calendar';

/**
 * GET /api/calendar/events
 * Obtener eventos de calendario con filtros
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parámetros requeridos
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!tenantId || !organizationId || !userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: tenantId, organizationId, userId, startDate, endDate' },
        { status: 400 }
      );
    }

    // Filtros opcionales
    const filters: CalendarEventFilters = {};
    
    const status = searchParams.get('status');
    if (status) {
      filters.status = status.split(',') as any[];
    }

    const priority = searchParams.get('priority');
    if (priority) {
      filters.priority = priority.split(',') as any[];
    }

    const followUpType = searchParams.get('followUpType');
    if (followUpType) {
      filters.followUpType = followUpType.split(',') as any[];
    }

    const automated = searchParams.get('automated');
    if (automated === 'true') {
      filters.automated = true;
    }

    const meetingPlatform = searchParams.get('meetingPlatform');
    if (meetingPlatform) {
      filters.meetingPlatform = meetingPlatform.split(',') as any[];
    }

    console.log('🔍 [CALENDAR API] Fetching events with filters:', {
      tenantId: tenantId.slice(0, 8) + '...',
      userId: userId.slice(0, 8) + '...',
      dateRange: { startDate, endDate },
      filters
    });

    // Construir query de Prisma
    const whereClause: any = {
      userId,
      startTime: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      },
      lead: {
        tenantId,
        organizationId
      }
    };

    // Aplicar filtros
    if (filters.status && filters.status.length > 0) {
      whereClause.status = { in: filters.status };
    }

    if (filters.priority && filters.priority.length > 0) {
      whereClause.priority = { in: filters.priority };
    }

    if (filters.followUpType && filters.followUpType.length > 0) {
      whereClause.followUpType = { in: filters.followUpType };
    }

    if (filters.automated !== undefined) {
      whereClause.automated = filters.automated;
    }

    if (filters.meetingPlatform && filters.meetingPlatform.length > 0) {
      whereClause.meetingPlatform = { in: filters.meetingPlatform };
    }

    // Obtener eventos
    const events = await prisma.leadCalendarEvent.findMany({
      where: whereClause,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
            status: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    console.log(`✅ [CALENDAR API] Found ${events.length} events`);

    return NextResponse.json(events);

  } catch (error) {
    console.error('❌ [CALENDAR API] Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/events
 * Crear nuevo evento de calendario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      tenantId,
      organizationId,
      leadId,
      userId,
      title,
      description,
      startTime,
      endTime,
      allDay = false,
      location,
      eventType = 'meeting',
      reminderMinutes = 30,
      priority = 'medium',
      automated = false,
      sentimentTrigger,
      followUpType,
      meetingPlatform = 'internal',
      attendeeEmails = [],
      metadata = {}
    } = body;

    // Validaciones básicas
    if (!tenantId || !organizationId || !leadId || !userId || !title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📅 [CALENDAR API] Creating new event:', {
      leadId: leadId.slice(0, 8) + '...',
      title,
      startTime,
      automated
    });

    // Crear evento usando el servicio
    const calendarService = new CalendarService();
    const event = await calendarService.createEvent({
      leadId,
      userId,
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      allDay,
      location,
      eventType,
      reminderMinutes,
      priority,
      automated,
      sentimentTrigger,
      followUpType,
      meetingPlatform,
      attendeeEmails,
      metadata
    }, tenantId, organizationId);

    console.log(`✅ [CALENDAR API] Event created with ID: ${event.id}`);

    return NextResponse.json(event);

  } catch (error) {
    console.error('❌ [CALENDAR API] Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}