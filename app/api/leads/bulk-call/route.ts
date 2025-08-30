/**
 * BULK CALLING API ENDPOINT
 * 
 * Endpoint para iniciar llamadas masivas a múltiples leads
 * POST /api/leads/bulk-call
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// Función para determinar el tipo de llamada recomendado según el estado del lead
function getRecommendedCallType(leadStatus: string): string {
  const statusToCallType: Record<string, string> = {
    'new': 'prospecting',
    'contacted': 'qualification',
    'interested': 'follow_up',
    'qualified': 'follow_up',
    'proposal_sent': 'closing',
    'negotiating': 'closing',
    'follow_up': 'follow_up',
    'not_interested': 'recovery',
    'converted': 'follow_up',
    'cold': 'recovery'
  };
  
  return statusToCallType[leadStatus] || 'prospecting';
}

interface BulkCallRequest {
  leadIds: string[];
  callType?: string;
  callMode?: 'automatic' | 'manual';
  tenantId: string;
  organizationId: string;
  notes?: string;
}

interface BulkCallResult {
  success: boolean;
  totalProcessed: number;
  successfulCalls: number;
  failedCalls: number;
  results: {
    leadId: string;
    leadName: string;
    success: boolean;
    callLogId?: string;
    error?: string;
  }[];
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Autenticación y autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [BULK CALL API] No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { id: payload.userId as string, email: payload.email as string };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    // 2. Obtener perfil de usuario y tenant
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    
    const {
      leadIds,
      callType = 'prospecting',
      callMode = 'manual',
      tenantId,
      organizationId,
      notes
    }: BulkCallRequest = body;

    // Validaciones
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds es requerido y debe ser un array con al menos un ID' },
        { status: 400 }
      );
    }

    if (leadIds.length > 50) {
      return NextResponse.json(
        { error: 'Máximo 50 leads permitidos por solicitud masiva' },
        { status: 400 }
      );
    }

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { error: 'tenantId y organizationId son requeridos' },
        { status: 400 }
      );
    }

    console.log('🔄 [BULK CALL API] Iniciando llamadas masivas:', {
      totalLeads: leadIds.length,
      callType,
      tenantId: tenantId.slice(0, 8) + '...',
      organizationId: organizationId.slice(0, 8) + '...'
    });

    // Obtener leads válidos con información de campaña (usar tenant del usuario autenticado)
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        tenantId: tenant.id
      },
      include: {
        campaign: {
          include: {
            products: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron leads válidos' },
        { status: 404 }
      );
    }

    // VALIDACIÓN: Verificar que todos los leads tengan campaña asignada
    const leadsWithoutCampaign = leads.filter(lead => !lead.campaign);
    if (leadsWithoutCampaign.length > 0) {
      return NextResponse.json(
        { 
          error: 'Algunos leads no tienen campaña asignada',
          details: `${leadsWithoutCampaign.length} leads sin campaña: ${leadsWithoutCampaign.map(l => l.name).join(', ')}`,
          leadsWithoutCampaign: leadsWithoutCampaign.map(l => ({ id: l.id, name: l.name }))
        },
        { status: 400 }
      );
    }

    console.log(`📊 [BULK CALL API] Encontrados ${leads.length} leads válidos para procesar`);

    // Procesar leads en paralelo (máximo 5 llamadas simultáneas)
    const results: BulkCallResult['results'] = [];
    const batchSize = 5;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      console.log(`🔄 [BULK CALL API] Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(leads.length/batchSize)}`);

      // Procesar lote en paralelo
      const batchPromises = batch.map(async (lead) => {
        try {
          // Verificar que el lead tiene teléfono
          if (!lead.phone) {
            console.log(`⚠️ [BULK CALL API] Lead ${lead.name} sin teléfono - omitido`);
            return {
              leadId: lead.id,
              leadName: lead.name,
              success: false,
              error: 'Lead sin número de teléfono'
            };
          }

          // Determinar tipo de llamada según el modo
          let finalCallType = callType;
          if (callMode === 'automatic') {
            finalCallType = getRecommendedCallType(lead.status);
          }

          console.log(`📞 [BULK CALL API] Lead ${lead.name} - Modo: ${callMode}, Tipo: ${finalCallType}, Estado: ${lead.status}`);

          // Llamar al endpoint individual de llamadas
          const baseUrl = request.url.split('/api/')[0];
          const callResponse = await fetch(`${baseUrl}/api/leads/${lead.id}/call`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify({
              callType: finalCallType,
              notes: notes ? `${notes} (Llamada masiva - ${callMode})` : `Llamada masiva - ${callMode}`
            })
          });

          if (callResponse.ok) {
            const callResult = await callResponse.json();
            console.log(`✅ [BULK CALL API] Llamada exitosa para ${lead.name}`);
            
            return {
              leadId: lead.id,
              leadName: lead.name,
              success: true,
              callLogId: callResult.callLog?.id
            };
          } else {
            const errorText = await callResponse.text();
            console.error(`❌ [BULK CALL API] Error en llamada para ${lead.name}:`, errorText);
            
            return {
              leadId: lead.id,
              leadName: lead.name,
              success: false,
              error: `Error en llamada: ${errorText}`
            };
          }

        } catch (error) {
          console.error(`❌ [BULK CALL API] Error procesando lead ${lead.name}:`, error);
          return {
            leadId: lead.id,
            leadName: lead.name,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          };
        }
      });

      // Esperar que termine el lote
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pequeña pausa entre lotes para no saturar ElevenLabs
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Calcular estadísticas finales
    const totalProcessingTime = Date.now() - startTime;
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    const bulkResult: BulkCallResult = {
      success: true,
      totalProcessed: results.length,
      successfulCalls: successful.length,
      failedCalls: failed.length,
      results
    };

    console.log('✅ [BULK CALL API] Llamadas masivas completadas:', {
      total: bulkResult.totalProcessed,
      successful: bulkResult.successfulCalls,
      failed: bulkResult.failedCalls,
      successRate: Math.round((bulkResult.successfulCalls / bulkResult.totalProcessed) * 100) + '%',
      totalTime: totalProcessingTime + 'ms'
    });

    return NextResponse.json(bulkResult);

  } catch (error) {
    console.error('❌ [BULK CALL API] Error inesperado:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
        totalProcessed: 0,
        successfulCalls: 0,
        failedCalls: 0,
        results: []
      },
      { status: 500 }
    );
  }
}