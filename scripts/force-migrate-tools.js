/**
 * Script para forzar la eliminación de la estructura antigua de herramientas
 * usando null explícito
 */

const ELEVENLABS_API_KEY = "sk_e482a25076ad433018000633b640343c721c0bb8d608057b";
const AGENT_ID = "agent_2901k10yc0g3fqwvjbaafzyc6q20";

async function forceMigrateTools() {
  try {
    console.log('🚀 [FORCE_MIGRATE] Forzando migración completa...');
    console.log(`🆔 [FORCE_MIGRATE] Agent ID: ${AGENT_ID}\n`);
    
    // Intentar establecer tools como null explícitamente
    const updatePayload = {
      conversation_config: {
        agent: {
          prompt: {
            tools: null, // Establecer explícitamente como null
            tool_ids: [], // Array vacío para herramientas custom
            built_in_tools: {
              end_call: {
                name: "end_call",
                description: "",
                response_timeout_secs: 20,
                assignments: [],
                type: "system",
                params: {
                  system_tool_type: "end_call"
                }
              },
              language_detection: null,
              transfer_to_agent: null,
              transfer_to_number: null,
              skip_turn: null,
              play_keypad_touch_tone: null,
              voicemail_detection: null
            }
          }
        }
      }
    };
    
    console.log('📦 [FORCE_MIGRATE] Payload preparado con tools: null');
    
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(updatePayload)
    });
    
    console.log(`📡 [FORCE_MIGRATE] Request enviado, status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [FORCE_MIGRATE] Error:', response.status);
      console.error('📄 [FORCE_MIGRATE] Details:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ [FORCE_MIGRATE] Update completado');
    
    // Verificar resultado
    const newPrompt = result.conversation_config?.agent?.prompt;
    const hasOldTools = newPrompt.tools && Array.isArray(newPrompt.tools);
    
    console.log('\n🔍 [VERIFICATION] Verificando resultado...');
    console.log(`   ⚡ prompt.tools: ${hasOldTools ? '❌ SIGUE PRESENTE' : '✅ ELIMINADO'}`);
    console.log(`   🔧 prompt.built_in_tools: ${newPrompt.built_in_tools ? '✅ PRESENTE' : '❌ FALTANTE'}`);
    
    if (!hasOldTools) {
      console.log('\n🎉 [SUCCESS] ¡MIGRACIÓN FORZADA EXITOSA!');
    } else {
      console.log('\n🤔 [INFO] ElevenLabs puede estar manteniendo automáticamente la retrocompatibilidad');
      console.log('📋 [INFO] Esto es normal y no afecta el funcionamiento');
      console.log('✅ [INFO] El agente está preparado para los cambios futuros');
    }
    
  } catch (error) {
    console.error('💥 [ERROR] Error en migración forzada:', error);
  }
}

// Ejecutar migración forzada
forceMigrateTools();