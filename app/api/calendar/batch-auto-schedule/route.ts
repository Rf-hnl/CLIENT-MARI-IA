/**
 * BATCH AUTO SCHEDULE API ENDPOINT
 * 
 * Endpoint para procesamiento batch de leads calificados para programación automática
 * POST /api/calendar/batch-auto-schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import CalendarService from '@/lib/services/calendarService';

/**
 * POST /api/calendar/batch-auto-schedule
 * Procesar múltiples leads calificados para programación automática
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      tenantId,
      organizationId,
      userId
    } = body;

    // Validaciones
    if (!tenantId || !organizationId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, organizationId, userId' },
        { status: 400 }
      );
    }

    console.log('🔄 [BATCH AUTO SCHEDULE API] Starting batch auto-scheduling process');

    // Usar el servicio de calendario para procesamiento batch
    const calendarService = new CalendarService();
    const batchResult = await calendarService.processBatchAutoScheduling(
      tenantId,
      organizationId,
      userId
    );

    console.log(`✅ [BATCH AUTO SCHEDULE API] Batch processing complete:`, {
      processed: batchResult.processed,
      scheduled: batchResult.scheduled,
      errors: batchResult.errors
    });

    return NextResponse.json({
      success: true,
      message: 'Batch auto-scheduling completed',
      summary: {
        totalProcessed: batchResult.processed,
        successfullyScheduled: batchResult.scheduled,
        errors: batchResult.errors,
        successRate: batchResult.processed > 0 
          ? Math.round((batchResult.scheduled / batchResult.processed) * 100) 
          : 0
      },
      results: batchResult.results.map(result => ({
        success: result.success,
        eventId: result.eventId,
        reason: result.reason,
        error: result.error
      }))
    });

  } catch (error) {
    console.error('❌ [BATCH AUTO SCHEDULE API] Error in batch processing:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process batch auto-scheduling',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}