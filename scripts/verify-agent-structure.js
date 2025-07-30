/**
 * Script para verificar la estructura actual del agente MAR-IA COBROS
 * y determinar si necesita migración a la nueva estructura de herramientas
 */

const ELEVENLABS_API_KEY = "sk_e482a25076ad433018000633b640343c721c0bb8d608057b";
const AGENT_ID = "agent_2901k10yc0g3fqwvjbaafzyc6q20";

async function verifyAgentStructure() {
  try {
    console.log('🔍 [VERIFY] Verificando estructura del agente MAR-IA COBROS...');
    console.log(`🆔 [VERIFY] Agent ID: ${AGENT_ID}\n`);
    
    // Obtener información actual del agente
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [VERIFY] Error al obtener agente:', response.status, response.statusText);
      console.error('📄 [VERIFY] Error details:', errorText);
      return;
    }
    
    const agentData = await response.json();
    
    console.log('✅ [VERIFY] Agente obtenido exitosamente');
    console.log('📋 [VERIFY] Analizando estructura de herramientas...\n');
    
    const prompt = agentData.conversation_config?.agent?.prompt;
    
    if (!prompt) {
      console.log('❌ [VERIFY] No se encontró configuración de prompt');
      return;
    }
    
    // Verificar estructura actual
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔍 ANÁLISIS DE ESTRUCTURA DE HERRAMIENTAS');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Verificar campos existentes
    const hasOldTools = prompt.tools && Array.isArray(prompt.tools);
    const hasNewToolIds = prompt.tool_ids && Array.isArray(prompt.tool_ids);
    const hasBuiltInTools = prompt.built_in_tools && typeof prompt.built_in_tools === 'object';
    
    console.log(`📊 [STRUCTURE] Campos encontrados:`);
    console.log(`   ⚡ prompt.tools (ANTIGUA): ${hasOldTools ? '✅ PRESENTE' : '❌ NO PRESENTE'}`);
    console.log(`   🆕 prompt.tool_ids (NUEVA): ${hasNewToolIds ? '✅ PRESENTE' : '❌ NO PRESENTE'}`);
    console.log(`   🔧 prompt.built_in_tools (NUEVA): ${hasBuiltInTools ? '✅ PRESENTE' : '❌ NO PRESENTE'}\n`);
    
    if (hasOldTools) {
      console.log('🚨 [WARNING] ESTRUCTURA ANTIGUA DETECTADA');
      console.log(`📋 [OLD_TOOLS] Herramientas en prompt.tools (${prompt.tools.length}):`);
      prompt.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name} (tipo: ${tool.type})`);
        if (tool.type === 'system') {
          console.log(`      └─ System tool: ${tool.params?.system_tool_type || 'unknown'}`);
        }
      });
      console.log('');
    }
    
    if (hasNewToolIds) {
      console.log(`✅ [NEW_STRUCTURE] Herramientas en prompt.tool_ids (${prompt.tool_ids.length}):`);
      prompt.tool_ids.forEach((toolId, index) => {
        console.log(`   ${index + 1}. ${toolId}`);
      });
      console.log('');
    }
    
    if (hasBuiltInTools) {
      console.log('🔧 [BUILT_IN_TOOLS] Herramientas built-in encontradas:');
      Object.keys(prompt.built_in_tools).forEach(toolName => {
        const tool = prompt.built_in_tools[toolName];
        if (tool && tool.type) {
          console.log(`   ✅ ${toolName} (tipo: ${tool.type})`);
          if (tool.params?.system_tool_type) {
            console.log(`      └─ System tool: ${tool.params.system_tool_type}`);
          }
        } else {
          console.log(`   ❌ ${toolName} (null/disabled)`);
        }
      });
      console.log('');
    }
    
    // Determinar estado de migración
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ESTADO DE MIGRACIÓN');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (hasOldTools && !hasNewToolIds && !hasBuiltInTools) {
      console.log('🚨 [MIGRATION_NEEDED] MIGRACIÓN REQUERIDA');
      console.log('   El agente usa SOLAMENTE la estructura antigua');
      console.log('   📅 Deadline: 23 Julio 2025');
      console.log('   🎯 Acción: Migrar a tool_ids + built_in_tools');
      
      return { needsMigration: true, structure: 'old_only' };
      
    } else if (hasOldTools && (hasNewToolIds || hasBuiltInTools)) {
      console.log('⚠️ [MIXED_STRUCTURE] ESTRUCTURA MIXTA DETECTADA');
      console.log('   El agente tiene AMBAS estructuras (antigua y nueva)');
      console.log('   📅 Deadline: 15 Julio 2025 (GET endpoints cambiarán)');
      console.log('   🎯 Acción: Limpiar estructura antigua');
      
      return { needsMigration: true, structure: 'mixed' };
      
    } else if (!hasOldTools && (hasNewToolIds || hasBuiltInTools)) {
      console.log('✅ [MIGRATED] ESTRUCTURA NUEVA');
      console.log('   El agente usa SOLAMENTE la estructura nueva');
      console.log('   🎉 Estado: Listo para el futuro');
      console.log('   ✅ Acción: Ninguna requerida');
      
      return { needsMigration: false, structure: 'new_only' };
      
    } else {
      console.log('❓ [UNKNOWN] ESTRUCTURA DESCONOCIDA');
      console.log('   No se detectaron herramientas en ninguna estructura');
      console.log('   ⚠️ Esto puede indicar un problema');
      
      return { needsMigration: true, structure: 'unknown' };
    }
    
  } catch (error) {
    console.error('💥 [ERROR] Error verificando estructura:', error);
  }
}

// Ejecutar verificación
verifyAgentStructure().then(result => {
  if (result) {
    console.log('\n🎯 [CONCLUSION]');
    console.log(`Estructura: ${result.structure}`);
    console.log(`Migración necesaria: ${result.needsMigration ? 'SÍ' : 'NO'}`);
    
    if (result.needsMigration) {
      console.log('\n📋 [NEXT_STEPS]');
      console.log('1. Crear script de migración');
      console.log('2. Actualizar estructura a tool_ids + built_in_tools');
      console.log('3. Probar funcionamiento');
      console.log('4. Eliminar estructura antigua');
    }
  }
});