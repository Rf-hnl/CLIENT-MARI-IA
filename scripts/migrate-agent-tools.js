/**
 * Script para migrar el agente MAR-IA COBROS a la nueva estructura de herramientas
 * Elimina la estructura antigua (prompt.tools) y conserva solo la nueva (built_in_tools)
 */

const ELEVENLABS_API_KEY = "sk_e482a25076ad433018000633b640343c721c0bb8d608057b";
const AGENT_ID = "agent_2901k10yc0g3fqwvjbaafzyc6q20";

async function migrateAgentTools() {
  try {
    console.log('🚀 [MIGRATE] Iniciando migración de herramientas...');
    console.log(`🆔 [MIGRATE] Agent ID: ${AGENT_ID}\n`);
    
    // 1. Obtener configuración actual
    console.log('📋 [STEP 1] Obteniendo configuración actual...');
    const getResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('❌ [MIGRATE] Error al obtener agente:', getResponse.status);
      console.error('📄 [MIGRATE] Error details:', errorText);
      return;
    }
    
    const currentAgent = await getResponse.json();
    const currentPrompt = currentAgent.conversation_config?.agent?.prompt;
    
    if (!currentPrompt) {
      console.error('❌ [MIGRATE] No se encontró configuración de prompt');
      return;
    }
    
    console.log('✅ [STEP 1] Configuración obtenida');
    console.log(`📊 [CURRENT] Estado actual:`);
    console.log(`   - prompt.tools: ${currentPrompt.tools ? currentPrompt.tools.length : 0} herramientas`);
    console.log(`   - prompt.tool_ids: ${currentPrompt.tool_ids ? currentPrompt.tool_ids.length : 0} IDs`);
    console.log(`   - prompt.built_in_tools: ${currentPrompt.built_in_tools ? Object.keys(currentPrompt.built_in_tools).length : 0} herramientas`);
    
    // 2. Preparar nueva configuración (solo mantener la estructura nueva)
    console.log('\n📋 [STEP 2] Preparando nueva configuración...');
    
    const newPromptConfig = {
      ...currentPrompt,
      // Eliminar campo obsoleto
      tools: undefined,
      // Mantener tool_ids vacío (no tenemos herramientas custom)
      tool_ids: [],
      // Mantener built_in_tools tal como está (ya tiene la estructura correcta)
      built_in_tools: currentPrompt.built_in_tools
    };
    
    // Verificar que built_in_tools tenga end_call
    if (!newPromptConfig.built_in_tools?.end_call) {
      console.log('🔧 [STEP 2] Agregando end_call a built_in_tools...');
      newPromptConfig.built_in_tools = {
        ...newPromptConfig.built_in_tools,
        end_call: {
          name: "end_call",
          description: "",
          response_timeout_secs: 20,
          assignments: [],
          type: "system",
          params: {
            system_tool_type: "end_call"
          }
        }
      };
    }
    
    console.log('✅ [STEP 2] Nueva configuración preparada');
    console.log(`📊 [NEW] Nueva estructura:`);
    console.log(`   - prompt.tools: ELIMINADO`);
    console.log(`   - prompt.tool_ids: ${newPromptConfig.tool_ids.length} IDs`);
    console.log(`   - prompt.built_in_tools: ${Object.keys(newPromptConfig.built_in_tools).length} herramientas`);
    
    // 3. Actualizar agente
    console.log('\n📋 [STEP 3] Actualizando agente...');
    
    const updatePayload = {
      conversation_config: {
        agent: {
          prompt: newPromptConfig
        }
      }
    };
    
    const updateResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(updatePayload)
    });
    
    console.log(`📡 [STEP 3] Request enviado, status: ${updateResponse.status}`);
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ [MIGRATE] Error al actualizar agente:', updateResponse.status);
      console.error('📄 [MIGRATE] Error details:', errorText);
      return;
    }
    
    const updatedAgent = await updateResponse.json();
    console.log('✅ [STEP 3] Agente actualizado exitosamente');
    
    // 4. Verificar migración
    console.log('\n📋 [STEP 4] Verificando migración...');
    
    const newPrompt = updatedAgent.conversation_config?.agent?.prompt;
    const hasOldTools = newPrompt.tools && Array.isArray(newPrompt.tools);
    const hasBuiltInTools = newPrompt.built_in_tools && typeof newPrompt.built_in_tools === 'object';
    const hasEndCall = newPrompt.built_in_tools?.end_call;
    
    console.log(`🔍 [VERIFICATION] Resultado de migración:`);
    console.log(`   ⚡ prompt.tools (antigua): ${hasOldTools ? '❌ AÚN PRESENTE' : '✅ ELIMINADO'}`);
    console.log(`   🔧 prompt.built_in_tools: ${hasBuiltInTools ? '✅ PRESENTE' : '❌ FALTANTE'}`);
    console.log(`   📞 end_call tool: ${hasEndCall ? '✅ CONFIGURADO' : '❌ FALTANTE'}`);
    
    if (!hasOldTools && hasBuiltInTools && hasEndCall) {
      console.log('\n🎉 [SUCCESS] ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Estructura antigua eliminada');
      console.log('✅ Estructura nueva funcionando');
      console.log('✅ Herramienta end_call configurada');
      console.log('✅ Agente listo para el futuro (post-Julio 2025)');
      console.log('═══════════════════════════════════════════════════════════');
      
      console.log('\n🔍 [NEXT] Prueba recomendada:');
      console.log('1. Realizar una llamada de prueba');
      console.log('2. Verificar que end_call funciona correctamente');
      console.log('3. Confirmar que todas las funcionalidades están operativas');
      
    } else {
      console.log('\n⚠️ [WARNING] Migración incompleta');
      console.log('Revisar configuración manualmente');
    }
    
  } catch (error) {
    console.error('💥 [ERROR] Error durante migración:', error);
  }
}

// Ejecutar migración
migrateAgentTools();