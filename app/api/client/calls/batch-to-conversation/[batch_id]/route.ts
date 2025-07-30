import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ITenantElevenLabsConfig } from '@/types/elevenlabs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ batch_id: string }> }
) {
  try {
    const { batch_id } = await params;
    const body = await request.json();
    const { tenantId, clientPhone } = body;

    if (!batch_id || !tenantId || !clientPhone) {
      return NextResponse.json(
        { success: false, error: 'batch_id, tenantId y clientPhone son requeridos' },
        { status: 400 }
      );
    }

    console.log(`🎯 [BATCH_TO_CONV] Procesando batch: ${batch_id} para cliente: ${clientPhone}`);

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

    // 2. Obtener información del batch para encontrar conversation_id
    console.log(`📡 [BATCH_TO_CONV] Llamando a ElevenLabs batch API...`);
    const batchResponse = await fetch(`https://api.elevenlabs.io/v1/convai/batch-calling/${batch_id}`, {
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
    });

    if (!batchResponse.ok) {
      const errorData = await batchResponse.json();
      console.error(`❌ [BATCH_TO_CONV] Error batch API: ${batchResponse.status} - ${JSON.stringify(errorData)}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener información del batch de ElevenLabs',
          details: errorData,
        },
        { status: batchResponse.status }
      );
    }

    const batchData = await batchResponse.json();
    console.log(`📦 [BATCH_TO_CONV] Batch data obtenido, recipients: ${batchData.recipients?.length || 0}`);

    // 3. Buscar el recipient que corresponde a este cliente por teléfono
    const recipient = batchData.recipients?.find((r: any) => 
      r.phone_number === clientPhone
    );

    if (!recipient) {
      console.warn(`⚠️ [BATCH_TO_CONV] No se encontró recipient para teléfono: ${clientPhone}`);
      console.log(`📱 [BATCH_TO_CONV] Recipients disponibles:`, batchData.recipients?.map((r: any) => r.phone_number));
      return NextResponse.json(
        { 
          success: false, 
          error: 'No se encontró recipient para este teléfono en el batch',
          availablePhones: batchData.recipients?.map((r: any) => r.phone_number) || []
        },
        { status: 404 }
      );
    }

    if (!recipient.conversation_id) {
      console.warn(`⚠️ [BATCH_TO_CONV] Recipient encontrado pero sin conversation_id`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'El recipient no tiene conversation_id asignado aún',
          recipient_status: recipient.status
        },
        { status: 404 }
      );
    }

    console.log(`✅ [BATCH_TO_CONV] Conversation ID encontrado: ${recipient.conversation_id}`);

    // 4. Obtener detalles de la conversación usando el conversation_id
    const conversationResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${recipient.conversation_id}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': elevenLabsApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!conversationResponse.ok) {
      const errorData = await conversationResponse.json();
      console.error(`❌ [BATCH_TO_CONV] Error conversation API: ${conversationResponse.status} - ${JSON.stringify(errorData)}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener detalles de la conversación de ElevenLabs',
          details: errorData,
        },
        { status: conversationResponse.status }
      );
    }

    const conversationDetail = await conversationResponse.json();
    console.log(`🎊 [BATCH_TO_CONV] Conversación obtenida exitosamente: ${recipient.conversation_id}`);

    return NextResponse.json({ 
      success: true, 
      data: {
        conversation_id: recipient.conversation_id,
        batch_id: batch_id,
        recipient_status: recipient.status,
        conversation_detail: conversationDetail
      }
    });

  } catch (error) {
    console.error('❌ [BATCH_TO_CONV] Error en la API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}