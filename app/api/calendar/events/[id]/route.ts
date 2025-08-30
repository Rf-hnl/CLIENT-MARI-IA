/**
 * CALENDAR EVENT MANAGEMENT API
 * 
 * Endpoints para gestionar eventos específicos:
 * - GET: Obtener detalles de evento
 * - PUT: Actualizar evento
 * - DELETE: Eliminar evento
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import CalendarService from '@/lib/services/calendarService';

/**
 * GET /api/calendar/events/[id]
 * Obtener detalles de un evento específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log(`🔍 [CALENDAR API] Fetching event ${eventId}`);

    const event = await prisma.leadCalendarEvent.findFirst({
      where: {
        id: eventId,
        userId // Verificar que el usuario tenga acceso
      },
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
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log(`✅ [CALENDAR API] Event found: ${event.title}`);

    return NextResponse.json(event);

  } catch (error) {
    console.error(`❌ [CALENDAR API] Error fetching event ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/calendar/events/[id]
 * Actualizar evento de calendario
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 }
      );
    }

    console.log(`📝 [CALENDAR API] Updating event ${eventId}:`, Object.keys(updateData));

    // Usar el servicio para actualizar
    const calendarService = new CalendarService();
    const updatedEvent = await calendarService.updateEvent(eventId, updateData, userId);

    console.log(`✅ [CALENDAR API] Event updated: ${updatedEvent.title}`);

    return NextResponse.json(updatedEvent);

  } catch (error) {
    console.error(`❌ [CALENDAR API] Error updating event ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/calendar/events/[id]
 * Eliminar evento de calendario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    console.log(`🗑️ [CALENDAR API] Deleting event ${eventId}`);

    // Verificar que el evento existe y pertenece al usuario
    const event = await prisma.leadCalendarEvent.findFirst({
      where: {
        id: eventId,
        userId
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Eliminar evento
    await prisma.leadCalendarEvent.delete({
      where: { id: eventId }
    });

    console.log(`✅ [CALENDAR API] Event deleted: ${event.title}`);

    return NextResponse.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error(`❌ [CALENDAR API] Error deleting event ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}