const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugVoiceAgent() {
  try {
    console.log('🔍 Debugging voice agent visibility...\n');
    
    // Obtener el agente de voz específico
    const voiceAgent = await prisma.agentReference.findFirst({
      where: {
        elevenLabsAgentId: 'agent_01jy4g926hepd8x62rfcp8fjab'
      },
      include: {
        tenant: { select: { name: true } },
        organization: { select: { name: true } }
      }
    });
    
    if (!voiceAgent) {
      console.log('❌ No se encontró el agente de voz');
      return;
    }
    
    console.log('📋 DETALLES DEL AGENTE DE VOZ:');
    console.log(`  ID: ${voiceAgent.id}`);
    console.log(`  ElevenLabs Agent ID: ${voiceAgent.elevenLabsAgentId}`);
    console.log(`  Tenant: ${voiceAgent.tenant.name} (${voiceAgent.tenantId})`);
    console.log(`  Organization: ${voiceAgent.organization.name} (${voiceAgent.organizationId})`);
    console.log(`  Provider: ${voiceAgent.provider}`);
    console.log(`  Is Active: ${voiceAgent.isActive} ⚠️ ESTE ES EL PROBLEMA SI ES FALSE`);
    console.log(`  Total Calls: ${voiceAgent.totalCalls}`);
    console.log(`  Successful Calls: ${voiceAgent.successfulCalls}`);
    console.log(`  Failed Calls: ${voiceAgent.failedCalls}`);
    console.log(`  Total Cost: $${voiceAgent.totalCost}`);
    console.log(`  Created: ${voiceAgent.createdAt.toISOString()}`);
    console.log(`  Last Used: ${voiceAgent.lastUsedAt ? voiceAgent.lastUsedAt.toISOString() : 'Never'}`);
    console.log(`  Local Tags: ${JSON.stringify(voiceAgent.localTags)}`);
    console.log(`  Usage Rules: ${JSON.stringify(voiceAgent.usageRules, null, 2)}`);
    
    // Simular la consulta que hace la API
    console.log('\n🔍 SIMULANDO CONSULTA DE LA API...');
    
    const apiQuery = await prisma.agentReference.findMany({
      where: {
        tenantId: voiceAgent.tenantId,
        isActive: true, // Esta es la línea que filtra
        organizationId: voiceAgent.organizationId
      }
    });
    
    console.log(`📊 Agentes encontrados con isActive: true: ${apiQuery.length}`);
    
    if (apiQuery.length === 0) {
      console.log('❌ EL PROBLEMA: El agente tiene isActive: false');
      console.log('🔧 SOLUCIÓN: Cambiar isActive a true');
      
      // Ofrecer arreglo
      console.log('\n¿Quieres que active el agente? (y/n)');
      
      // Para script automático, activarlo directamente
      console.log('🔧 Activando agente automáticamente...');
      
      await prisma.agentReference.update({
        where: { id: voiceAgent.id },
        data: { isActive: true }
      });
      
      console.log('✅ Agente activado exitosamente');
      
      // Verificar de nuevo
      const updated = await prisma.agentReference.findUnique({
        where: { id: voiceAgent.id }
      });
      
      console.log(`✅ Estado actual isActive: ${updated?.isActive}`);
    } else {
      console.log('✅ El agente está activo y debería aparecer en la interfaz');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
debugVoiceAgent()
  .then(() => {
    console.log('\n🎉 Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });