import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ITenantElevenLabsConfig } from '@/types/elevenlabs';

// Interface para el detalle de una llamada batch
interface BatchCallRecipient {
  id: string;
  phone_number: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  conversation_id?: string;
  call_id?: string;
  started_at_unix?: number;
  ended_at_unix?: number;
  duration_seconds?: number;
  created_at_unix?: number;
  updated_at_unix?: number;
  error_message?: string;
  retry_count?: number;
  audio_url?: string;
  transcript?: string;
  cost_usd?: number;
  quality_score?: number;
}

interface BatchCallDetail {
  id: string;
  phone_number_id: string;
  name: string;
  agent_id: string;
  created_at_unix: number;
  scheduled_time_unix: number;
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  last_updated_at_unix: number;
  status: string;
  agent_name: string;
  phone_provider: string;
  recipients: BatchCallRecipient[];
  // Información adicional disponible
  workspace_id?: string;
  total_cost_usd?: number;
  average_duration_seconds?: number;
  success_rate?: number;
  retry_settings?: {
    max_retries: number;
    retry_delay_seconds: number;
  };
  conversation_config?: {
    voice_id: string;
    voice_name: string;
    model_id: string;
    language: string;
    max_duration_seconds: number;
    webhook_url?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const { batchId } = params;
    console.log(`🔍 [BATCH_DETAIL] Obteniendo detalles para batch: ${batchId}`);
    
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId es requerido' },
        { status: 400 }
      );
    }

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'batchId es requerido' },
        { status: 400 }
      );
    }

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

    // 2. Llamar a la API de ElevenLabs para obtener detalles
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/batch-calling/${batchId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsConfig.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`❌ [BATCH_DETAIL] Error ElevenLabs: ${response.status} - ${err}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener detalles de la llamada',
          details: err
        },
        { status: response.status }
      );
    }

    const batchDetail = await response.json() as BatchCallDetail;
    
    console.log(`✅ [BATCH_DETAIL] Detalles obtenidos para ${batchDetail.name}`);

    // 3. Procesar y enriquecer datos
    const processedDetail = {
      ...batchDetail,
      created_at: new Date(batchDetail.created_at_unix * 1000).toISOString(),
      scheduled_time: new Date(batchDetail.scheduled_time_unix * 1000).toISOString(),
      last_updated_at: new Date(batchDetail.last_updated_at_unix * 1000).toISOString(),
      status_display: getStatusDisplay(batchDetail.status),
      call_type: extractCallType(batchDetail.name),
      progress: batchDetail.total_calls_scheduled > 0 
        ? Math.round((batchDetail.total_calls_dispatched / batchDetail.total_calls_scheduled) * 100) 
        : 0,
      recipients: batchDetail.recipients.map(recipient => ({
        ...recipient,
        status_display: getStatusDisplay(recipient.status),
        started_at: recipient.started_at_unix ? new Date(recipient.started_at_unix * 1000).toISOString() : null,
        ended_at: recipient.ended_at_unix ? new Date(recipient.ended_at_unix * 1000).toISOString() : null,
        created_at: recipient.created_at_unix ? new Date(recipient.created_at_unix * 1000).toISOString() : null,
        updated_at: recipient.updated_at_unix ? new Date(recipient.updated_at_unix * 1000).toISOString() : null,
        duration_minutes: recipient.duration_seconds ? Math.round(recipient.duration_seconds / 60) : 0,
        duration_formatted: recipient.duration_seconds ? formatDuration(recipient.duration_seconds) : '0s'
      }))
    };

    // 4. Estadísticas avanzadas de recipients
    const recipientStats = {
      total: batchDetail.recipients.length,
      by_status: batchDetail.recipients.reduce((acc, recipient) => {
        acc[recipient.status] = (acc[recipient.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      total_duration_minutes: batchDetail.recipients.reduce((acc, recipient) => {
        return acc + (recipient.duration_seconds ? Math.round(recipient.duration_seconds / 60) : 0);
      }, 0),
      total_duration_seconds: batchDetail.recipients.reduce((acc, recipient) => {
        return acc + (recipient.duration_seconds || 0);
      }, 0),
      average_duration_seconds: batchDetail.recipients.length > 0 
        ? Math.round(batchDetail.recipients.reduce((acc, recipient) => acc + (recipient.duration_seconds || 0), 0) / batchDetail.recipients.length)
        : 0,
      success_rate: batchDetail.recipients.length > 0
        ? Math.round((batchDetail.recipients.filter(r => r.status === 'completed').length / batchDetail.recipients.length) * 100)
        : 0,
      total_cost_usd: batchDetail.recipients.reduce((acc, recipient) => {
        return acc + (recipient.cost_usd || 0);
      }, 0),
      total_retries: batchDetail.recipients.reduce((acc, recipient) => {
        return acc + (recipient.retry_count || 0);
      }, 0),
      quality_stats: {
        average_quality: batchDetail.recipients.length > 0
          ? batchDetail.recipients.reduce((acc, recipient) => acc + (recipient.quality_score || 0), 0) / batchDetail.recipients.length
          : 0,
        with_transcript: batchDetail.recipients.filter(r => r.transcript).length,
        with_audio: batchDetail.recipients.filter(r => r.audio_url).length
      }
    };

    return NextResponse.json({
      success: true,
      data: processedDetail,
      stats: recipientStats
    });

  } catch (error) {
    console.error('💥 [BATCH_DETAIL] Error:', error);
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}