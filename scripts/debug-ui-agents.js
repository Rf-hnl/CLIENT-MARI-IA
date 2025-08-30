const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUIAgents() {
  try {
    console.log('🔍 Debuggeando por qué la UI no muestra agentes...\n');
    
    // 1. Verificar todos los tenants y sus agentes
    console.log('1️⃣ VERIFICANDO TODOS LOS TENANTS Y SUS AGENTES:');
    const allTenants = await prisma.tenant.findMany({
      include: {
        agents: true, // unified_agents
        agentReferences: true // agent_references
      }
    });
    
    allTenants.forEach(tenant => {
      console.log(`\n   🏢 Tenant: ${tenant.name} (${tenant.id})`);
      console.log(`      Identifier: ${tenant.identifier}`);
      console.log(`      Unified Agents: ${tenant.agents.length}`);
      console.log(`      Agent References: ${tenant.agentReferences.length}`);
      
      if (tenant.agentReferences.length > 0) {
        tenant.agentReferences.forEach(ref => {
          console.log(`         📞 ${ref.elevenLabsAgentId} - Active: ${ref.isActive}`);
        });
      }
    });
    
    // 2. Simular las llamadas que hace la UI
    console.log('\n2️⃣ SIMULANDO LLAMADAS DE LA UI:');
    
    // Identificar todos los posibles tenant/org combinations
    const combinations = [
      // El tenant donde está el agente
      { tenantId: 'b17ca9ad-0666-4643-b5b0-60424db5747f', organizationId: '40e018a4-9716-41d0-806c-f7137152e00c', note: 'Tenant donde está el agente' },
      // El tenant/org de los logs de la UI
      { tenantId: 'b17ca9ad-0666-4643-b5b0-60424db5747f', organizationId: '43bbe7ca-b1bc-4b61-a144-878f4f51d1ad', note: 'Tenant/org de los logs UI' },
      // El tenant original ANTRES
      { tenantId: '62454186-ee40-47b3-8811-3d06cd64e049', organizationId: '3fbec5ca-b0cd-4abe-925a-d567141e3963', note: 'Tenant original ANTRES' }
    ];
    
    for (const combo of combinations) {
      console.log(`\n   🧪 Probando: ${combo.note}`);
      console.log(`      Tenant: ${combo.tenantId}`);
      console.log(`      Org: ${combo.organizationId}`);
      
      try {
        // Simular la consulta de la API unificada
        const agentReferences = await prisma.agentReference.findMany({
          where: {
            tenantId: combo.tenantId,
            isActive: true
            // organizationId filter is commented out in the API
          },
          include: {
            organization: true,
            tenant: true
          }
        });
        
        console.log(`      Resultado: ${agentReferences.length} agentes encontrados`);
        
        if (agentReferences.length > 0) {
          agentReferences.forEach(ref => {
            console.log(`         ✅ ${ref.elevenLabsAgentId} (${ref.totalCalls} calls)`);
          });
        }
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
    
    // 3. Verificar el formato de respuesta de la API
    console.log('\n3️⃣ VERIFICANDO FORMATO DE RESPUESTA API:');
    
    // Usar el tenant correcto donde está el agente
    const correctTenant = 'b17ca9ad-0666-4643-b5b0-60424db5747f';
    
    const agentReferences = await prisma.agentReference.findMany({
      where: {
        tenantId: correctTenant,
        isActive: true
      },
      include: {
        organization: true,
        tenant: true
      }
    });
    
    console.log(`   📊 Agentes encontrados: ${agentReferences.length}`);
    
    if (agentReferences.length > 0) {
      // Convertir al formato UnifiedAgent (como hace la API)
      const agents = agentReferences.map(ref => ({
        id: ref.id,
        category: 'voice',
        name: 'Voice Agent',
        description: 'Voice agent from ElevenLabs',
        isActive: ref.isActive,
        totalUsage: ref.totalCalls,
        successRate: ref.totalCalls > 0 ? (ref.successfulCalls / ref.totalCalls) * 100 : 0,
        totalCost: Number(ref.totalCost),
        averageResponseTime: ref.averageCallDuration,
        lastUsed: ref.lastUsedAt,
        tags: ref.localTags,
        version: '1.0.0',
        createdAt: ref.createdAt,
        updatedAt: ref.updatedAt,
        createdBy: ref.createdBy || '',
        updatedBy: ref.createdBy || '',
        categoryData: {
          elevenLabsAgentId: ref.elevenLabsAgentId,
          provider: ref.provider,
          usageRules: ref.usageRules
        },
        capabilities: {
          languages: ['es', 'en'],
          maxCallDuration: 30,
          supportedScenarios: ['first_contact', 'follow_up']
        }
      }));
      
      console.log('\n   📋 Formato de respuesta que debería recibir la UI:');
      console.log(JSON.stringify({
        success: true,
        agents: agents,
        total: agents.length,
        byCategory: {
          voice: agents.filter(a => a.category === 'voice').length,
          analysis: 0,
          writing: 0
        }
      }, null, 2));
    }
    
    // 4. Verificar usuarios y sus organizaciones
    console.log('\n4️⃣ VERIFICANDO USUARIOS Y ORGANIZACIONES:');
    const users = await prisma.user.findMany({
      include: {
        organization: {
          include: {
            tenant: true
          }
        }
      }
    });
    
    users.forEach(user => {
      console.log(`\n   👤 Usuario: ${user.email}`);
      console.log(`      ID: ${user.id}`);
      console.log(`      Organization: ${user.organization.name} (${user.organizationId})`);
      console.log(`      Tenant: ${user.organization.tenant.name} (${user.organization.tenantId})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
debugUIAgents()
  .then(() => {
    console.log('\n🎉 Debug UI completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });