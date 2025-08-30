const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugTenantMismatch() {
  try {
    console.log('🔍 Investigando discrepancia de tenants...\n');
    
    // Buscar todos los tenants
    const allTenants = await prisma.tenant.findMany({
      include: {
        organizations: {
          include: {
            users: {
              select: {
                id: true,
                email: true,
                displayName: true
              }
            }
          }
        },
        agents: true
      }
    });
    
    console.log('📋 TENANTS EN EL SISTEMA:');
    allTenants.forEach(tenant => {
      console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.id})`);
      console.log(`   Identifier: ${tenant.identifier}`);
      console.log(`   Plan: ${tenant.plan}`);
      console.log(`   Created: ${tenant.createdAt.toISOString()}`);
      
      tenant.organizations.forEach(org => {
        console.log(`   📁 Organization: ${org.name} (${org.id})`);
        org.users.forEach(user => {
          console.log(`     👤 User: ${user.displayName || user.email} (${user.id})`);
        });
      });
      
      console.log(`   🤖 Unified Agents: ${tenant.agents.length}`);
    });
    
    // Buscar agent references
    const agentRefs = await prisma.agentReference.findMany({
      include: {
        tenant: { select: { name: true, identifier: true } },
        organization: { select: { name: true } }
      }
    });
    
    console.log('\n📞 AGENT REFERENCES (Voice Agents):');
    agentRefs.forEach(ref => {
      console.log(`\n🤖 Agent Reference: ${ref.id}`);
      console.log(`   ElevenLabs ID: ${ref.elevenLabsAgentId}`);
      console.log(`   Tenant: ${ref.tenant.name} (${ref.tenantId})`);
      console.log(`   Organization: ${ref.organization.name} (${ref.organizationId})`);
      console.log(`   Active: ${ref.isActive}`);
      console.log(`   Total Calls: ${ref.totalCalls}`);
    });
    
    // Tenant IDs from logs
    const loggedTenantId = 'b17ca9ad-0666-4643-b5b0-60424db5747f';
    const voiceAgentTenantId = '62454186-ee40-47b3-8811-3d06cd64e049';
    
    console.log('\n🔍 ANÁLISIS DE DISCREPANCIA:');
    console.log(`Tenant en logs de la interfaz: ${loggedTenantId}`);
    console.log(`Tenant del agente de voz: ${voiceAgentTenantId}`);
    
    const loggedTenant = allTenants.find(t => t.id === loggedTenantId);
    const voiceTenant = allTenants.find(t => t.id === voiceAgentTenantId);
    
    if (loggedTenant) {
      console.log(`✅ Tenant de la interfaz encontrado: ${loggedTenant.name}`);
    } else {
      console.log('❌ Tenant de la interfaz NO encontrado');
    }
    
    if (voiceTenant) {
      console.log(`✅ Tenant del agente de voz encontrado: ${voiceTenant.name}`);
    } else {
      console.log('❌ Tenant del agente de voz NO encontrado');
    }
    
    if (loggedTenantId !== voiceAgentTenantId) {
      console.log('\n⚠️ PROBLEMA IDENTIFICADO: Estás logueado en un tenant diferente al que tiene el agente de voz');
      console.log('\n🔧 POSIBLES SOLUCIONES:');
      console.log('1. Cambiar de tenant en la interfaz');
      console.log('2. Mover el agente de voz al tenant actual');
      console.log('3. Verificar por qué hay múltiples tenants');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
debugTenantMismatch()
  .then(() => {
    console.log('\n🎉 Debug completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });