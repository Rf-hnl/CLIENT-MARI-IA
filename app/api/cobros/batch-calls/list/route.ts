import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ITenantElevenLabsConfig } from '@/types/elevenlabs';

// Interfaces para la respuesta de ElevenLabs
interface ElevenLabsBatchCall {
  id: string;
  phone_number_id: string;
  name: string;
  agent_id: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  last_updated_at_unix: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  agent_name: string;
  phone_provider: string;
}

interface ElevenLabsBatchCallsResponse {
  batch_calls: ElevenLabsBatchCall[];
  next_doc?: string;
  has_more: boolean;
}

interface BatchCallsListParams {
  tenantId: string;
  limit?: number;
  last_doc?: string;
  filters?: {
    status?: string[];
    agent_id?: string;
    call_type?: string[];
    search?: string;
  };
}

// Interface para calls procesados
interface IBatchCall {
  id: string;
  phone_number_id: string;
  name: string;
  agent_id: string;
  agent_name: string;
  phone_provider: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  last_updated_at_unix: number;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  scheduled_time: string;
  last_updated_at: string;
  status_display: string;
  progress: number;
  call_type: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 [BATCH_CALLS] Iniciando listado de llamadas batch...');
    
    const body = await request.json();
    const { tenantId, limit = 50, last_doc, filters } = body as BatchCallsListParams;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId es requerido' },
        { status: 400 }
      );
    }

    console.log(`🏢 [BATCH_CALLS] Tenant: ${tenantId}, Limit: ${limit}`);

    // 1. Obtener configuración de ElevenLabs
    const configPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configSnap = await adminDb.doc(configPath).get();
    
    if (!configSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Configuración ElevenLabs no encontrada' },
        { status: 404 }
      );
    }

    const elevenLabsConfig = configSnap.data() as ITenantElevenLabsConfig;

    if (!elevenLabsConfig.apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key de ElevenLabs no configurada' },
        { status: 400 }
      );
    }

    // 2. Construir URL con parámetros
    const url = new URL('https://api.elevenlabs.io/v1/convai/batch-calling/workspace');
    url.searchParams.set('limit', limit.toString());
    if (last_doc) {
      url.searchParams.set('last_doc', last_doc);
    }

    console.log(`📡 [BATCH_CALLS] Llamando a ElevenLabs: ${url.toString()}`);

    // 3. Llamar a la API de ElevenLabs
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsConfig.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`❌ [BATCH_CALLS] Error ElevenLabs: ${response.status} - ${err}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener llamadas de ElevenLabs',
          details: err
        },
        { status: response.status }
      );
    }

    const batchCallsData = await response.json() as ElevenLabsBatchCallsResponse;
    
    console.log(`✅ [BATCH_CALLS] Obtenidas ${batchCallsData.batch_calls.length} llamadas batch`);

    // 4. Procesar, enriquecer y filtrar datos
    let processedCalls = batchCallsData.batch_calls.map(call => ({
      ...call,
      created_at: new Date(call.created_at_unix * 1000).toISOString(),
      scheduled_time: new Date(call.scheduled_time_unix * 1000).toISOString(),
      last_updated_at: new Date(call.last_updated_at_unix * 1000).toISOString(),
      // Calcular estado más legible
      status_display: getStatusDisplay(call.status),
      // Calcular progreso
      progress: call.total_calls_scheduled > 0 
        ? Math.round((call.total_calls_dispatched / call.total_calls_scheduled) * 100) 
        : 0,
      // Categorizar por tipo de llamada (extraer del nombre)
      call_type: extractCallType(call.name)
    }));

    // 5. Aplicar filtros del lado del servidor
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        processedCalls = processedCalls.filter(call => filters.status!.includes(call.status));
      }
      
      if (filters.agent_id) {
        processedCalls = processedCalls.filter(call => call.agent_id === filters.agent_id);
      }
      
      if (filters.call_type && filters.call_type.length > 0) {
        processedCalls = processedCalls.filter(call => filters.call_type!.includes(call.call_type));
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        processedCalls = processedCalls.filter(call => 
          call.name.toLowerCase().includes(searchLower) ||
          call.agent_name.toLowerCase().includes(searchLower) ||
          call.call_type.toLowerCase().includes(searchLower)
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        batch_calls: processedCalls,
        pagination: {
          next_doc: batchCallsData.next_doc,
          has_more: batchCallsData.has_more,
          limit,
          current_count: processedCalls.length
        }
      },
      summary: {
        total_calls: processedCalls.length,
        by_status: getStatusSummary(processedCalls),
        by_agent: getAgentSummary(processedCalls)
      }
    });

  } catch (error) {
    console.error('💥 [BATCH_CALLS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      },
      { status: 500 }
    );
  }
}

// Funciones auxiliares
function getStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pendiente',
    'in_progress': 'En Progreso',
    'completed': 'Completada',
    'failed': 'Fallida',
    'cancelled': 'Cancelada'
  };
  return statusMap[status] || status;
}

function extractCallType(callName: string): string {
  const lowerName = callName.toLowerCase();
  
  if (lowerName.includes('overdue_payment')) return 'Pago Atrasado';
  if (lowerName.includes('follow_up')) return 'Seguimiento';
  if (lowerName.includes('request_info')) return 'Solicitud Info';
  if (lowerName.includes('general_inquiry')) return 'Consulta General';
  
  return 'Otros';
}

function getStatusSummary(calls: IBatchCall[]): Record<string, number> {
  return calls.reduce((acc, call) => {
    acc[call.status] = (acc[call.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function getAgentSummary(calls: IBatchCall[]): Record<string, number> {
  return calls.reduce((acc, call) => {
    acc[call.agent_name] = (acc[call.agent_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}