import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ITenantElevenLabsConfig } from '@/types/elevenlabs';
import { IBatchCallDetail, IBatchCallRecipient } from '@/types/cobros';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string; conversation_id: string }> }
) {
  try {
    const { batch_id, conversation_id } = await params;
    const tenantId = request.headers.get('X-Tenant-ID'); // Get tenantId from header

    if (!batch_id || !conversation_id || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'batch_id, conversation_id y tenantId son requeridos' },
        { status: 400 }
      );
    }

    // 1. Cargar configuración de ElevenLabs para obtener la API Key
    const configPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configSnap = await adminDb.doc(configPath).get();
    if (!configSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Configuración ElevenLabs no encontrada para este tenant' },
        { status: 404 }
      );
    }
    const elevenLabsConfig = configSnap.data() as ITenantElevenLabsConfig;
    const elevenLabsApiKey = elevenLabsConfig.apiKey;

    if (!elevenLabsApiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key de ElevenLabs no configurada' },
        { status: 500 }
      );
    }

    // 2. Llamar a la API de ElevenLabs para obtener los detalles del batch call
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/batch-calling/${batch_id}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.json();
      console.error(`Error fetching batch call from ElevenLabs: ${elevenLabsResponse.status} - ${JSON.stringify(errorData)}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener detalles del batch call de ElevenLabs',
          details: errorData,
        },
        { status: elevenLabsResponse.status }
      );
    }

    const batchCallDetail: IBatchCallDetail = await elevenLabsResponse.json();

    // 3. Buscar el recipient específico por conversation_id
    const individualCallDetail = batchCallDetail.recipients.find(
      (recipient: IBatchCallRecipient) => recipient.conversation_id === conversation_id
    );

    if (!individualCallDetail) {
      return NextResponse.json(
        { success: false, error: 'Detalles de llamada individual no encontrados en el batch' },
        { status: 404 }
      );
    }

    // Return both the full batch call detail and the specific individual recipient detail
    return NextResponse.json({ 
      success: true, 
      data: {
        batchCall: batchCallDetail, // The full batch call object
        individualRecipient: individualCallDetail // The specific recipient object
      }
    });
  } catch (error) {
    console.error('Error en la API de detalles de llamada individual:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
