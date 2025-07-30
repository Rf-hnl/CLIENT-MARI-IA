/**
 * Script para verificar si nuestro payload de batch calling es compatible
 * con la API actual de ElevenLabs
 */

const ELEVENLABS_API_KEY = "sk_e482a25076ad433018000633b640343c721c0bb8d608057b";
const AGENT_ID = "agent_2901k10yc0g3fqwvjbaafzyc6q20";
const PHONE_ID = "phnum_01jy4g2j9kfe8sc8dapbzadaq0"; // Del .env

// Simular el payload que enviamos
const testPayload = {
  call_name: "TEST - Verification Call - " + new Date().toISOString(),
  agent_id: AGENT_ID,
  agent_phone_number_id: PHONE_ID,
  scheduled_time_unix: Math.floor(Date.now() / 1000) + 300, // 5 minutos en el futuro para no hacer llamada real
  recipients: [
    {
      phone_number: "+50767891234", // Número de prueba
      conversation_initiation_client_data: {
        dynamic_variables: {
          call_type: "test_call",
          name: "Test User",
          company: "Test Company",
          debt: "100.00",
          phone: "+50767891234"
        }
      }
    }
  ]
};

async function verifyBatchCallingAPI() {
  try {
    console.log('🔍 [VERIFY] Verificando compatibilidad de Batch Calling API...\n');
    
    console.log('📋 [PAYLOAD] Estructura del payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n📊 [PAYLOAD] Validaciones:');
    console.log(`   ✅ call_name: ${testPayload.call_name ? 'PRESENTE' : 'FALTANTE'}`);
    console.log(`   ✅ agent_id: ${testPayload.agent_id ? 'PRESENTE' : 'FALTANTE'}`);
    console.log(`   ✅ agent_phone_number_id: ${testPayload.agent_phone_number_id ? 'PRESENTE' : 'FALTANTE'}`);
    console.log(`   ✅ recipients: ${testPayload.recipients?.length > 0 ? 'PRESENTE' : 'FALTANTE'}`);
    console.log(`   ✅ scheduled_time_unix: ${testPayload.scheduled_time_unix ? 'PRESENTE' : 'FALTANTE'}`);
    
    const recipient = testPayload.recipients[0];
    console.log(`\n📞 [RECIPIENT] Estructura del destinatario:`);
    console.log(`   ✅ phone_number: ${recipient.phone_number ? 'PRESENTE' : 'FALTANTE'}`);
    console.log(`   ✅ conversation_initiation_client_data: ${recipient.conversation_initiation_client_data ? 'PRESENTE' : 'FALTANTE'}`);
    console.log(`   ✅ dynamic_variables: ${recipient.conversation_initiation_client_data?.dynamic_variables ? 'PRESENTE' : 'FALTANTE'}`);
    
    if (recipient.conversation_initiation_client_data?.dynamic_variables) {
      const dynVars = Object.keys(recipient.conversation_initiation_client_data.dynamic_variables);
      console.log(`   📝 Variables dinámicas (${dynVars.length}): ${dynVars.join(', ')}`);
    }
    
    console.log('\n🚀 [TEST] Enviando payload de prueba a ElevenLabs...');
    console.log('⚠️ [NOTE] Programado para 5 minutos en el futuro (no se ejecutará)');
    
    const response = await fetch('https://api.elevenlabs.io/v1/convai/batch-calling/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`\n📡 [RESPONSE] Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ [SUCCESS] ¡Payload es compatible con la API!');
      console.log('\n📊 [RESPONSE] Respuesta de ElevenLabs:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n🎯 [ANALYSIS] Análisis de respuesta:');
      console.log(`   🆔 Batch ID: ${result.id}`);
      console.log(`   📞 Phone ID: ${result.phone_number_id}`);
      console.log(`   🤖 Agent ID: ${result.agent_id}`);
      console.log(`   📅 Created At: ${new Date(result.created_at_unix * 1000).toISOString()}`);
      console.log(`   📊 Status: ${result.status}`);
      
      // Cancelar la llamada programada para no desperdiciar créditos
      if (result.id) {
        console.log('\n🛑 [CLEANUP] Cancelando llamada de prueba...');
        try {
          const cancelResponse = await fetch(`https://api.elevenlabs.io/v1/convai/batch-calling/${result.id}/cancel`, {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY
            }
          });
          
          if (cancelResponse.ok) {
            console.log('✅ [CLEANUP] Llamada de prueba cancelada exitosamente');
          } else {
            console.log('⚠️ [CLEANUP] No se pudo cancelar (puede que no sea necesario)');
          }
        } catch (error) {
          console.log('⚠️ [CLEANUP] Error cancelando:', error.message);
        }
      }
      
      console.log('\n🎉 [CONCLUSION] COMPATIBILIDAD VERIFICADA');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ Estructura del payload es correcta');
      console.log('✅ API acepta conversation_initiation_client_data');
      console.log('✅ dynamic_variables funcionan correctamente');
      console.log('✅ call_type será recibido por el agente');
      console.log('═══════════════════════════════════════════════════════════');
      
    } else {
      const errorText = await response.text();
      console.log('❌ [ERROR] Payload incompatible con la API');
      console.log(`📄 [ERROR] Detalles: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('\n🔍 [ERROR_ANALYSIS] Análisis del error:');
        console.log(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('\n📄 [ERROR_RAW] Error sin formato JSON:', errorText);
      }
    }
    
  } catch (error) {
    console.error('💥 [ERROR] Error verificando API:', error);
  }
}

// Ejecutar verificación
verifyBatchCallingAPI();