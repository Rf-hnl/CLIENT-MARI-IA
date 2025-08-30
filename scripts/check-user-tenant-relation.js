const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserTenantRelation() {
  try {
    console.log('🔍 VERIFICANDO RELACIÓN USUARIO-TENANT\n');

    // 1. Ver todos los usuarios y sus tenants
    console.log('📋 STEP 1: Usuarios y tenants');
    console.log('=============================');
    
    const users = await prisma.user.findMany({
      include: {
        ownedTenants: {
          select: { id: true, name: true, identifier: true }
        },
        organization: {
          select: { id: true, name: true, tenantId: true }
        }
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. User: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Tenants owned: ${user.ownedTenants.length}`);
      user.ownedTenants.forEach(tenant => {
        console.log(`     - ${tenant.name} (${tenant.identifier}) [${tenant.id}]`);
      });
      console.log(`   Organization: ${user.organization?.name || 'None'}`);
      if (user.organization) {
        console.log(`   Org Tenant ID: ${user.organization.tenantId}`);
      }
    });

    // 2. Ver específicamente el agente y su tenant
    console.log('\n\n📋 STEP 2: Agente específico');
    console.log('==============================');
    
    const agentRef = await prisma.agentReference.findFirst({
      where: {
        elevenLabsAgentId: 'agent_01jy4g926hepd8x62rfcp8fjab'
      },
      include: {
        tenant: {
          select: { id: true, name: true, identifier: true, ownerId: true }
        },
        organization: {
          select: { id: true, name: true }
        }
      }
    });

    if (agentRef) {
      console.log('✅ Agente encontrado:');
      console.log(`   Agent ID: ${agentRef.elevenLabsAgentId}`);
      console.log(`   Tenant: ${agentRef.tenant.name} (${agentRef.tenant.identifier})`);
      console.log(`   Tenant ID: ${agentRef.tenantId}`);
      console.log(`   Tenant Owner ID: ${agentRef.tenant.ownerId}`);
      console.log(`   Organization: ${agentRef.organization.name}`);
      console.log(`   Is Active: ${agentRef.isActive}`);
      console.log(`   Provider: ${agentRef.provider}`);

      // 3. Ver qué usuario es el owner de este tenant
      const tenantOwner = await prisma.user.findUnique({
        where: { id: agentRef.tenant.ownerId },
        select: { id: true, email: true }
      });

      console.log(`   Tenant Owner: ${tenantOwner?.email || 'None'}`);
    } else {
      console.log('❌ Agente NO encontrado');
    }

    // 4. Simular el flujo del API /api/agents/available
    console.log('\n\n📋 STEP 3: Simulando API call');
    console.log('===============================');

    // Simular para cada usuario
    for (const user of users) {
      console.log(`\nSimulando para user: ${user.email} (ID: ${user.id})`);
      
      // Encontrar tenant donde este usuario es owner
      const userTenant = await prisma.tenant.findFirst({
        where: { ownerId: user.id }
      });

      if (userTenant) {
        console.log(`  ✅ User is owner of tenant: ${userTenant.name} (${userTenant.id})`);
        
        // Buscar agentes para este tenant
        const userAgents = await prisma.agentReference.findMany({
          where: {
            tenantId: userTenant.id,
            provider: 'elevenlabs',
            isActive: true
          }
        });

        console.log(`  📊 Agents found for this user: ${userAgents.length}`);
        userAgents.forEach(agent => {
          console.log(`    - ${agent.elevenLabsAgentId} (Active: ${agent.isActive})`);
        });

        // Buscar config de ElevenLabs
        const config = await prisma.elevenLabsConfig.findFirst({
          where: {
            tenantId: userTenant.id,
            isActive: true
          }
        });

        console.log(`  🔧 ElevenLabs config: ${config ? 'Present' : 'Missing'}`);
        if (config) {
          console.log(`    Config name: ${config.name}`);
        }

      } else {
        console.log(`  ❌ User is NOT owner of any tenant`);
        
        // Check if user belongs to organization in any tenant
        if (user.organization) {
          console.log(`  📋 But user belongs to organization: ${user.organization.name}`);
          console.log(`  📋 Organization tenant: ${user.organization.tenantId}`);
          
          // Buscar agentes para el tenant de la organización
          const orgAgents = await prisma.agentReference.findMany({
            where: {
              tenantId: user.organization.tenantId,
              provider: 'elevenlabs',
              isActive: true
            }
          });
          
          console.log(`  📊 Agents in org tenant: ${orgAgents.length}`);
        }
      }
    }

    console.log('\n✅ Check completed');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserTenantRelation();