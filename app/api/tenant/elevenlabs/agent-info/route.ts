import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

interface ElevenLabsAgentInfo {
  agent_id: string;
  name: string;
  voice_id: string;
  model: string;
  system_prompt: string;
  first_message: string;
  conversation_config: {
    agent_id: string;
    voice: {
      voice_id: string;
      stability: number;
      similarity_boost: number;
      style: number;
    };
    model: string;
    temperature: number;
    max_tokens: number;
    system_prompt: string;
    first_message: string;
  };
}

interface AgentInfoResult {
  success: boolean;
  agent?: ElevenLabsAgentInfo;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [AGENT-INFO] Iniciando POST request...');
    
    const body = await request.json();
    console.log('📦 [AGENT-INFO] Body recibido:', body);
    
    const { tenantId, agentId, testConfig } = body;

    if (!tenantId || !agentId) {
      console.log('❌ [AGENT-INFO] Faltan parámetros requeridos:', { tenantId, agentId });
      return NextResponse.json({ 
        success: false, 
        error: 'tenantId y agentId son requeridos' 
      }, { status: 400 });
    }

    console.log('🔍 [AGENT-INFO] Obteniendo información del agente:', agentId, 'para tenant:', tenantId);

    // Si se proporciona testConfig, usarlo; sino, obtener de la configuración guardada
    let apiKey = testConfig?.apiKey;
    let apiUrl = testConfig?.apiUrl || 'https://api.elevenlabs.io';

    if (!testConfig) {
      // Obtener configuración guardada del tenant directamente de Firebase
      console.log('🔥 [AGENT-INFO] Obteniendo configuración de Firebase para tenant:', tenantId);
      try {
        const configDocPath = `tenants/${tenantId}/elevenlabs-config/settings`;
        const configDoc = await adminDb.doc(configDocPath).get();
        console.log('📄 [AGENT-INFO] Config doc exists:', configDoc.exists);
        
        if (configDoc.exists) {
          const configData = configDoc.data();
          console.log('📋 [AGENT-INFO] Config data keys:', Object.keys(configData || {}));
          apiKey = configData?.apiKey;
          apiUrl = configData?.apiUrl || 'https://api.elevenlabs.io';
          console.log('🔑 [AGENT-INFO] API Key encontrada:', apiKey ? `SÍ (${apiKey.substring(0, 10)}...)` : 'NO');
          console.log('🌐 [AGENT-INFO] API URL:', apiUrl);
        } else {
          console.log('⚠️ [AGENT-INFO] No se encontró documento de configuración en path:', configDocPath);
        }
      } catch (firebaseError) {
        console.error('🔥 [AGENT-INFO] Error obteniendo config de Firebase:', firebaseError);
      }
    } else {
      console.log('⚡ [AGENT-INFO] Usando testConfig proporcionado');
    }

    if (!apiKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se encontró API Key. Configura ElevenLabs primero.' 
      }, { status: 400 });
    }

    console.log('📡 [AGENT-INFO] Haciendo request a ElevenLabs API...');
    console.log('🔗 [AGENT-INFO] URL:', `${apiUrl}/v1/convai/agents/${agentId}`);

    // Hacer request a ElevenLabs para obtener información del agente
    const response = await fetch(`${apiUrl}/v1/convai/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('📨 [AGENT-INFO] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [AGENT-INFO] Error response:', errorText);
      
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
        error: `Error al obtener agente: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    const agentData: ElevenLabsAgentInfo = await response.json();
    
    console.log('✅ [AGENT-INFO] Agente obtenido exitosamente!');
    console.log('📋 [AGENT-INFO] === INFORMACIÓN CRUDA DEL AGENTE ===');
    console.log('🔍 [AGENT-INFO] Datos completos (JSON):', JSON.stringify(agentData, null, 2));
    console.log('📝 [AGENT-INFO] === DETALLES ESPECÍFICOS ===');
    console.log('🆔 [AGENT-INFO] Agent ID:', agentData.agent_id);
    console.log('📛 [AGENT-INFO] Nombre:', agentData.name);
    console.log('🎵 [AGENT-INFO] Voice ID:', agentData.voice_id);
    console.log('🤖 [AGENT-INFO] Modelo:', agentData.model);
    console.log('💬 [AGENT-INFO] System Prompt:', agentData.system_prompt);
    console.log('👋 [AGENT-INFO] First Message:', agentData.first_message);
    
    if (agentData.conversation_config) {
      console.log('⚙️ [AGENT-INFO] === CONFIGURACIÓN DE CONVERSACIÓN ===');
      console.log('🔧 [AGENT-INFO] Config completa:', JSON.stringify(agentData.conversation_config, null, 2));
      console.log('🎵 [AGENT-INFO] Voice config:', JSON.stringify(agentData.conversation_config.voice, null, 2));
      console.log('🌡️ [AGENT-INFO] Temperatura:', agentData.conversation_config.temperature);
      console.log('🎯 [AGENT-INFO] Max tokens:', agentData.conversation_config.max_tokens);
    }
    
    console.log('📊 [AGENT-INFO] === ESTRUCTURA DE KEYS ===');
    console.log('🔑 [AGENT-INFO] Keys principales:', Object.keys(agentData));
    if (agentData.conversation_config) {
      console.log('🔑 [AGENT-INFO] Keys de conversation_config:', Object.keys(agentData.conversation_config));
      if (agentData.conversation_config.voice) {
        console.log('🔑 [AGENT-INFO] Keys de voice:', Object.keys(agentData.conversation_config.voice));
      }
    }
    console.log('📋 [AGENT-INFO] === FIN DE INFORMACIÓN CRUDA ===');

    const result: AgentInfoResult = {
      success: true,
      agent: agentData
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('💥 [AGENT-INFO] Error interno:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}