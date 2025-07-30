import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ITenantElevenLabsConfig, IConversationDetail } from '@/types/elevenlabs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversation_id: string }> }
) {
  try {
    const { conversation_id } = await params;
    const tenantId = request.headers.get('X-Tenant-ID'); // Get tenantId from header

    if (!conversation_id || !tenantId) {
      return NextResponse.json(
        { success: false, error: 'conversation_id y tenantId son requeridos' },
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

    // 2. Llamar a la API de ElevenLabs para obtener los detalles de la conversación
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversations/${conversation_id}`,
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
      console.error(`Error fetching conversation from ElevenLabs: ${elevenLabsResponse.status} - ${JSON.stringify(errorData)}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener detalles de la conversación de ElevenLabs',
          details: errorData,
        },
        { status: elevenLabsResponse.status }
      );
    }

    const conversationDetail: IConversationDetail = await elevenLabsResponse.json();

    return NextResponse.json({ success: true, data: conversationDetail });
  } catch (error) {
    console.error('Error en la API de detalles de conversación:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
