/**
 * AUTO SCHEDULE API ENDPOINT
 * 
 * Endpoint para programación automática de reuniones basada en sentiment analysis
 * Con integración Calendly para auto-scheduling inteligente
 * POST /api/calendar/auto-schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import CalendarService from '@/lib/services/calendarService';
import { createCalendlyService, CalendlyConfigManager } from '@/services/calendlyService';
import { CalendlySchedulingRequest } from '@/types/calendly';

/**
 * POST /api/calendar/auto-schedule
 * Programar automáticamente reunión para un lead calificado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      leadId,
      userId,
      tenantId,
      organizationId,
      config, // Configuración opcional de programación
      campaignContext // NUEVO: Contexto de campaña cuando se programa desde análisis
    } = body;

    // Validaciones
    if (!leadId || !userId || !tenantId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, userId, tenantId, organizationId' },
        { status: 400 }
      );
    }

    console.log('🤖 [AUTO SCHEDULE API] Starting automatic scheduling for lead:', leadId.slice(0, 8) + '...');

    // Obtener configuración de Calendly
    const calendlyConfig = await CalendlyConfigManager.getConfig(tenantId, organizationId);
    
    let result;
    
    if (calendlyConfig && calendlyConfig.enabled && calendlyConfig.autoScheduling) {
      console.log('📅 [AUTO SCHEDULE API] Using Calendly for auto-scheduling');
      
      // Usar Calendly para programación automática
      result = await scheduleWithCalendly(leadId, userId, tenantId, organizationId, calendlyConfig, config);
    } else {
      console.log('📅 [AUTO SCHEDULE API] Using internal calendar service');
      
      // Usar el servicio de calendario interno
      const calendarService = new CalendarService(config);
      result = await calendarService.scheduleAutomatically(
        leadId,
        userId,
        tenantId,
        organizationId,
        config
      );
    }

    if (result.success) {
      console.log(`✅ [AUTO SCHEDULE API] Event scheduled automatically: ${result.eventId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Event scheduled automatically',
        eventId: result.eventId,
        event: result.event,
        reason: result.reason
      });
    } else {
      console.log(`⚠️ [AUTO SCHEDULE API] Could not schedule automatically: ${result.reason}`);
      
      return NextResponse.json({
        success: false,
        message: 'Could not schedule automatically',
        error: result.error,
        reason: result.reason,
        suggestedTimes: result.suggestedTimes || []
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [AUTO SCHEDULE API] Error in automatic scheduling:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process automatic scheduling',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

/**
 * Programar reunión usando Calendly
 */
async function scheduleWithCalendly(
  leadId: string,
  userId: string,
  tenantId: string,
  organizationId: string,
  calendlyConfig: any,
  config: any
) {
  try {
    // Obtener datos del lead
    const leadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/leads/get?leadId=${leadId}`);
    const leadData = await leadResponse.json();
    
    if (!leadData.success) {
      return {
        success: false,
        reason: 'Lead not found',
        error: 'Could not retrieve lead information'
      };
    }

    const lead = leadData.lead;
    
    // Verificar criterios de auto-scheduling
    const leadScore = lead.score || 0;
    const sentiment = lead.sentiment || 0;
    
    if (leadScore < calendlyConfig.leadScoreThreshold || 
        sentiment < calendlyConfig.sentimentThreshold) {
      return {
        success: false,
        reason: 'Lead does not meet auto-scheduling criteria',
        error: `Score: ${leadScore} (req: ${calendlyConfig.leadScoreThreshold}), Sentiment: ${sentiment} (req: ${calendlyConfig.sentimentThreshold})`
      };
    }

    // Crear servicio de Calendly
    const calendlyService = createCalendlyService(process.env.CALENDLY_ACCESS_TOKEN!);
    
    // Programar reunión automáticamente
    const schedulingResult = await calendlyService.autoScheduleMeetingForLead(
      leadId,
      leadScore,
      sentiment,
      calendlyConfig
    );

    if (schedulingResult.success) {
      return {
        success: true,
        eventId: `calendly-${Date.now()}`, // ID temporal hasta que se confirme
        event: {
          title: `Auto-scheduled meeting - ${lead.name}`,
          type: 'calendly_auto_scheduled',
          schedulingUrl: schedulingResult.schedulingUrl,
          leadId,
          leadName: lead.name,
          leadEmail: lead.email,
          leadScore,
          sentiment
        },
        reason: 'Scheduled automatically via Calendly',
        schedulingUrl: schedulingResult.schedulingUrl
      };
    } else {
      return {
        success: false,
        reason: 'Calendly scheduling failed',
        error: schedulingResult.error
      };
    }

  } catch (error) {
    console.error('Error scheduling with Calendly:', error);
    return {
      success: false,
      reason: 'Calendly integration error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}