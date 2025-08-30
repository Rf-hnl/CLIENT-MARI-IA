/**
 * Script para listar tenants disponibles y sus agentes
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin (asume que las credenciales están configuradas)
if (!admin.apps.length) {
  try {
    // Intentar usar credenciales del ambiente o archivo
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.log('❌ Error inicializando Firebase Admin. Asegúrate de tener configuradas las credenciales.');
    console.log('   Puedes usar: export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"');
    process.exit(1);
  }
}

const db = admin.firestore();

async function listTenantsAndAgents() {
  try {
    console.log('🔍 [SCRIPT] Listando tenants y agentes...\n');

    // 1. Obtener todos los tenants
    const tenantsSnapshot = await db.collection('tenants').get();
    
    if (tenantsSnapshot.empty) {
      console.log('❌ No se encontraron tenants en la base de datos');
      return;
    }

    console.log(`📋 [TENANTS] Encontrados ${tenantsSnapshot.size} tenants:\n`);

    for (const tenantDoc of tenantsSnapshot.docs) {
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      
      console.log(`🏢 TENANT: ${tenantId}`);
      console.log(`   Nombre: ${tenantData.name || 'Sin nombre'}`);
      
      // 2. Buscar agentes ElevenLabs para este tenant
      try {
        const agentsSnapshot = await db
          .collection(`tenants/${tenantId}/elevenlabs-agents`)
          .get();
        
        if (agentsSnapshot.empty) {
          console.log(`   📭 Sin agentes ElevenLabs`);
        } else {
          console.log(`   🤖 Agentes ElevenLabs (${agentsSnapshot.size}):`);
          
          agentsSnapshot.docs.forEach(agentDoc => {
            const agentData = agentDoc.data();
            console.log(`      - "${agentData.name}" (ID: ${agentDoc.id})`);
            if (agentData.elevenLabsConfig?.agentId) {
              console.log(`        ElevenLabs ID: ${agentData.elevenLabsConfig.agentId}`);
            }
          });
        }
      } catch (error) {
        console.log(`   ❌ Error obteniendo agentes: ${error.message}`);
      }
      
      console.log(''); // Línea en blanco
    }

  } catch (error) {
    console.error('💥 [ERROR] Error ejecutando script:', error);
  }
}

// Ejecutar el script
listTenantsAndAgents();