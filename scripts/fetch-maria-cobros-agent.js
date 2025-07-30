/**
 * Script para obtener información del agente MAR-IA COBROS de ElevenLabs
 * Este script hace fetch a los APIs internos para obtener el prompt y configuración
 */

const BASE_URL = 'http://localhost:3000'; // Ajusta según tu setup

async function fetchMariaCobrousAgent() {
  try {
    console.log('🔍 [SCRIPT] Buscando agente MAR-IA COBROS...\n');

    // 1. Obtener lista de agentes para encontrar MAR-IA COBROS
    console.log('📋 [STEP 1] Obteniendo lista de agentes...');
    const listResponse = await fetch(`${BASE_URL}/api/tenant/agents/elevenlabs/list?tenantId=test-tenant&lightweight=false`);
    
    if (!listResponse.ok) {
      throw new Error(`Error al obtener lista de agentes: ${listResponse.status}`);
    }

    const listData = await listResponse.json();
    console.log(`✅ [STEP 1] Encontrados ${listData.total} agentes\n`);

    // 2. Buscar el agente que contenga "MAR-IA" o "COBROS" en el nombre
    let mariaAgent = null;
    console.log('🔎 [STEP 2] Buscando agente MAR-IA COBROS...');
    
    for (const agent of listData.agents) {
      console.log(`   - Agente: "${agent.name}" (ID: ${agent.id})`);
      
      if (agent.name && (
        agent.name.toLowerCase().includes('mar-ia') || 
        agent.name.toLowerCase().includes('maria') || 
        agent.name.toLowerCase().includes('cobros')
      )) {
        mariaAgent = agent;
        console.log(`   ✅ ENCONTRADO: "${agent.name}"`);
        break;
      }
    }

    if (!mariaAgent) {
      console.log('❌ [ERROR] No se encontró agente MAR-IA COBROS');
      console.log('📋 [DEBUG] Agentes disponibles:');
      listData.agents.forEach(agent => {
        console.log(`   - "${agent.name}" (ID: ${agent.id})`);
      });
      return;
    }

    console.log(`\n🎯 [STEP 3] Obteniendo información detallada del agente...`);
    console.log(`   Agent ID Local: ${mariaAgent.id}`);
    console.log(`   ElevenLabs Agent ID: ${mariaAgent.elevenLabsConfig?.agentId}`);

    // 3. Obtener información detallada del agente desde ElevenLabs
    const agentInfoResponse = await fetch(`${BASE_URL}/api/tenant/elevenlabs/agent-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenantId: 'test-tenant', // Ajusta según tu tenant
        agentId: mariaAgent.elevenLabsConfig?.agentId
      })
    });

    if (!agentInfoResponse.ok) {
      const errorText = await agentInfoResponse.text();
      console.log(`❌ [ERROR] Error al obtener info del agente: ${agentInfoResponse.status}`);
      console.log(`📄 [ERROR] Respuesta: ${errorText}`);
      return;
    }

    const agentInfo = await agentInfoResponse.json();
    
    if (!agentInfo.success) {
      console.log('❌ [ERROR] Error en respuesta:', agentInfo.error);
      return;
    }

    // 4. Mostrar información del agente
    console.log('\n🎉 [SUCCESS] ¡Información del agente MAR-IA COBROS obtenida!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 INFORMACIÓN BÁSICA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`🆔 Agent ID: ${agentInfo.agent.agent_id}`);
    console.log(`📛 Nombre: ${agentInfo.agent.name}`);
    console.log(`🎵 Voice ID: ${agentInfo.agent.voice_id}`);
    console.log(`🤖 Modelo: ${agentInfo.agent.model}`);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💬 SYSTEM PROMPT ACTUAL');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(agentInfo.agent.system_prompt);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('👋 FIRST MESSAGE ACTUAL');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(agentInfo.agent.first_message);

    if (agentInfo.agent.conversation_config) {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('⚙️ CONFIGURACIÓN DE CONVERSACIÓN');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🌡️ Temperatura: ${agentInfo.agent.conversation_config.temperature}`);
      console.log(`🎯 Max Tokens: ${agentInfo.agent.conversation_config.max_tokens}`);
      
      if (agentInfo.agent.conversation_config.voice) {
        console.log('\n🎵 Configuración de voz:');
        console.log(`   - Stability: ${agentInfo.agent.conversation_config.voice.stability}`);
        console.log(`   - Similarity Boost: ${agentInfo.agent.conversation_config.voice.similarity_boost}`);
        console.log(`   - Style: ${agentInfo.agent.conversation_config.voice.style}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📋 ANÁLISIS DEL PROMPT ACTUAL');
    console.log('═══════════════════════════════════════════════════════════');
    
    const prompt = agentInfo.agent.system_prompt;
    
    // Verificar si incluye call_type
    if (prompt.includes('{{call_type}}')) {
      console.log('✅ El prompt YA incluye la variable {{call_type}}');
    } else {
      console.log('❌ El prompt NO incluye la variable {{call_type}}');
      console.log('📝 NECESITA ACTUALIZACIÓN para usar la nueva variable call_type');
    }

    // Verificar otras variables dinámicas
    const dynamicVars = prompt.match(/\{\{[^}]+\}\}/g) || [];
    if (dynamicVars.length > 0) {
      console.log(`🔧 Variables dinámicas encontradas (${dynamicVars.length}):`);
      dynamicVars.forEach(variable => {
        console.log(`   - ${variable}`);
      });
    } else {
      console.log('⚠️ No se encontraron variables dinámicas en el prompt');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🚀 SIGUIENTE PASO: ACTUALIZAR PROMPT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Para incluir la variable call_type, el prompt debería mencionar:');
    console.log('');
    console.log('El tipo de llamada es: {{call_type}}');
    console.log('');
    console.log('Actúa según el tipo de llamada:');
    console.log('- overdue_payment_call: Enfócate en pagos atrasados');
    console.log('- follow_up_call: Haz seguimiento de acuerdos previos');
    console.log('- request_info_call: Solicita información faltante');
    console.log('- general_inquiry_call: Consulta general');

  } catch (error) {
    console.error('💥 [ERROR] Error ejecutando script:', error);
  }
}

// Ejecutar el script
fetchMariaCobrousAgent();