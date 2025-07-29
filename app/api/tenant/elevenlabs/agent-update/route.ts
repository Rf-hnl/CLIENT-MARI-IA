import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

interface UpdateAgentData {
  name?: string;
  first_message?: string;
  system_prompt?: string;
  voice_id?: string;
  stability?: number;
  similarity_boost?: number;
  temperature?: number;
  max_tokens?: number;
}

interface UpdateAgentRequest {
  tenantId: string;
  agentId: string;
  updateData: UpdateAgentData;
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🚀 [AGENT-UPDATE] Iniciando PUT request...');
    
    const body = await request.json();
    console.log('📦 [AGENT-UPDATE] Body recibido:', body);
    
    const { tenantId, agentId, updateData }: UpdateAgentRequest = body;

    if (!tenantId || !agentId || !updateData) {
      console.log('❌ [AGENT-UPDATE] Faltan parámetros requeridos:', { tenantId, agentId, updateData });
      return NextResponse.json({ 
        success: false, 
        error: 'tenantId, agentId y updateData son requeridos' 
      }, { status: 400 });
    }

    console.log('🔍 [AGENT-UPDATE] Actualizando agente:', agentId, 'para tenant:', tenantId);

    // Obtener configuración guardada del tenant directamente de Firebase
    console.log('🔥 [AGENT-UPDATE] Obteniendo configuración de Firebase para tenant:', tenantId);
    let apiKey: string | undefined;
    let apiUrl = 'https://api.elevenlabs.io';

    try {
      const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
      const configDoc = await adminDb.doc(configDocPath).get();
      console.log('📄 [AGENT-UPDATE] Config doc exists:', configDoc.exists);
      
      if (configDoc.exists) {
        const configData = configDoc.data();
        apiKey = configData?.apiKey;
        apiUrl = configData?.apiUrl || 'https://api.elevenlabs.io';
        console.log('🔑 [AGENT-UPDATE] API Key encontrada:', apiKey ? 'SÍ' : 'NO');
        console.log('🌐 [AGENT-UPDATE] API URL:', apiUrl);
      } else {
        console.log('⚠️ [AGENT-UPDATE] No se encontró documento de configuración en path:', configDocPath);
      }
    } catch (firebaseError) {
      console.error('🔥 [AGENT-UPDATE] Error obteniendo config de Firebase:', firebaseError);
    }

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se encontró API Key. Configura ElevenLabs primero.' 
      }, { status: 400 });
    }

    // Construir el payload de actualización para ElevenLabs
    const updatePayload: any = {};

    // Si hay cambios en el nombre
    if (updateData.name) {
      updatePayload.name = updateData.name;
    }

    // Si hay cambios en la configuración de conversación
    const conversationConfigUpdates: any = {};

    // Cambios en TTS (voz)
    if (updateData.voice_id || updateData.stability !== undefined || updateData.similarity_boost !== undefined) {
      conversationConfigUpdates.tts = {};
      if (updateData.voice_id) conversationConfigUpdates.tts.voice_id = updateData.voice_id;
      if (updateData.stability !== undefined) conversationConfigUpdates.tts.stability = updateData.stability;
      if (updateData.similarity_boost !== undefined) conversationConfigUpdates.tts.similarity_boost = updateData.similarity_boost;
    }

    // Cambios en el agente (prompt, first_message)
    if (updateData.first_message || updateData.system_prompt || updateData.temperature !== undefined || updateData.max_tokens !== undefined) {
      conversationConfigUpdates.agent = {};
      if (updateData.first_message) conversationConfigUpdates.agent.first_message = updateData.first_message;
      
      if (updateData.system_prompt || updateData.temperature !== undefined || updateData.max_tokens !== undefined) {
        conversationConfigUpdates.agent.prompt = {};
        if (updateData.system_prompt) conversationConfigUpdates.agent.prompt.prompt = updateData.system_prompt;
        if (updateData.temperature !== undefined) conversationConfigUpdates.agent.prompt.temperature = updateData.temperature;
        if (updateData.max_tokens !== undefined) conversationConfigUpdates.agent.prompt.max_tokens = updateData.max_tokens;
      }
    }

    if (Object.keys(conversationConfigUpdates).length > 0) {
      updatePayload.conversation_config = conversationConfigUpdates;
    }

    console.log('📡 [AGENT-UPDATE] Haciendo request a ElevenLabs API...');
    console.log('🔗 [AGENT-UPDATE] URL:', `${apiUrl}/v1/convai/agents/${agentId}`);
    console.log('📋 [AGENT-UPDATE] Payload:', JSON.stringify(updatePayload, null, 2));

    // Hacer request a ElevenLabs para actualizar el agente
    const response = await fetch(`${apiUrl}/v1/convai/agents/${agentId}`, {
      method: 'PATCH', // ElevenLabs usa PATCH para updates
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });

    console.log('📨 [AGENT-UPDATE] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AGENT-UPDATE] Error response:', errorText);
      
      if (response.status === 401) {
        return NextResponse.json({ 
          success: false, 
          error: 'API Key inválida' 
        }, { status: 401 });
      }
      
      if (response.status === 404) {
        return NextResponse.json({ 
          success: false, 
          error: 'Agente no encontrado. Verifica el Agent ID.' 
        }, { status: 404 });
      }

      return NextResponse.json({ 
        success: false, 
        error: `Error al actualizar agente: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    const updatedAgentData = await response.json();
    console.log('✅ [AGENT-UPDATE] Agente actualizado exitosamente!');
    console.log('📋 [AGENT-UPDATE] Respuesta de ElevenLabs:', JSON.stringify(updatedAgentData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Agente actualizado exitosamente en ElevenLabs',
      agent: updatedAgentData
    }, { status: 200 });

  } catch (error) {
    console.error('💥 [AGENT-UPDATE] Error interno:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}