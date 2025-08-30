const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAgentLocation() {
  try {
    console.log('🔍 Verificando ubicación actual del agente...\n');
    
    // Buscar el agente de voz específico
    const voiceAgent = await prisma.agentReference.findFirst({
      where: {
        elevenLabsAgentId: 'agent_01jy4g926hepd8x62rfcp8fjab'
      },
      include: {
        tenant: { select: { name: true, identifier: true } },
        organization: { select: { name: true } }
      }
    });
    
    if (!voiceAgent) {
      console.log('❌ Agente de voz NO encontrado');
      return;
    }
    
    console.log('✅ AGENTE DE VOZ ENCONTRADO:');
    console.log(`   ID: ${voiceAgent.id}`);
    console.log(`   ElevenLabs ID: ${voiceAgent.elevenLabsAgentId}`);
    console.log(`   Tenant: ${voiceAgent.tenant.name} (${voiceAgent.tenantId})`);
    console.log(`   Organization: ${voiceAgent.organization.name} (${voiceAgent.organizationId})`);
    console.log(`   Active: ${voiceAgent.isActive}`);
    console.log(`   Total Calls: ${voiceAgent.totalCalls}`);
    
    // Verificar con qué tenant estás logueado según los logs
    const currentSessionTenant = 'b17ca9ad-0666-4643-b5b0-60424db5747f';
    const currentSessionOrg = '43bbe7ca-b1bc-4b61-a144-878f4f51d1ad';
    
    console.log('\n🔍 VERIFICANDO COINCIDENCIA:');
    console.log(`   Tu sesión busca en tenant: ${currentSessionTenant}`);
    console.log(`   Tu agente está en tenant: ${voiceAgent.tenantId}`);
    
    if (voiceAgent.tenantId === currentSessionTenant) {
      console.log('✅ ¡COINCIDENCIA! El agente debería aparecer');
    } else {
      console.log('❌ NO COINCIDE - El agente no aparecerá');
      console.log('\n🔧 SOLUCIÓN: Mover el agente al tenant de tu sesión');
      
      // Mover el agente al tenant correcto
      await prisma.agentReference.update({
        where: { id: voiceAgent.id },
        data: {
          tenantId: currentSessionTenant,
          organizationId: currentSessionOrg
        }
      });
      
      console.log('✅ Agente movido al tenant de tu sesión');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
verifyAgentLocation()
  .then(() => {
    console.log('\n🎉 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });