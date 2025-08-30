/**
 * COMPLETE EVENT API ENDPOINT
 * 
 * Endpoint específico para completar eventos de calendario
 * POST /api/calendar/events/[id]/complete
 */

import { NextRequest, NextResponse } from 'next/server';
import CalendarService from '@/lib/services/calendarService';

/**
 * POST /api/calendar/events/[id]/complete
 * Completar evento con resultado y próxima acción
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    
    const {
      userId,
      outcomeNotes,
      nextAction
    } = body;

    // Validaciones
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 }
      );
    }

    if (!outcomeNotes || !outcomeNotes.trim()) {
      return NextResponse.json(
        { error: 'outcomeNotes is required' },
        { status: 400 }
      );
    }

    console.log(`✅ [CALENDAR API] Completing event ${eventId} with outcome`);

    // Usar el servicio para completar el evento
    const calendarService = new CalendarService();
    await calendarService.completeEvent(
      eventId,
      outcomeNotes.trim(),
      nextAction?.trim(),
      userId
    );

    console.log(`✅ [CALENDAR API] Event ${eventId} completed successfully`);

    return NextResponse.json({ 
      message: 'Event completed successfully',
      eventId
    });

  } catch (error) {
    console.error(`❌ [CALENDAR API] Error completing event ${params.id}:`, error);
    
    // Manejar errores específicos
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to complete calendar event' },
      { status: 500 }
    );
  }
}