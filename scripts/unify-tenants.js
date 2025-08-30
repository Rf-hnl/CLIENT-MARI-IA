const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function unifyTenants() {
  try {
    console.log('🔄 Unifying all agents into JWT tenant...');
    
    const jwtTenantId = '62454186-ee40-47b3-8811-3d06cd64e049';
    const jwtOrganizationId = '3fbec5ca-b0cd-4abe-925a-d567141e3963';
    const oldTenantId = 'b17ca9ad-0666-4643-b5b0-60424db5747f';
    const oldOrganizationId = '40e018a4-9716-41d0-806c-f7137152e00c';
    
    // 1. Find all agents in the old tenant
    const oldTenantAgents = await prisma.unifiedAgent.findMany({
      where: { tenantId: oldTenantId },
      include: {
        analysisAgent: true,
        voiceAgent: true,
        writingAgent: true
      }
    });
    
    console.log(`📋 Found ${oldTenantAgents.length} agents in old tenant to migrate`);
    
    // 2. Move each agent to the JWT tenant
    for (const agent of oldTenantAgents) {
      console.log(`🔄 Moving agent: ${agent.name} (${agent.category})`);
      
      await prisma.unifiedAgent.update({
        where: { id: agent.id },
        data: {
          tenantId: jwtTenantId,
          organizationId: jwtOrganizationId
        }
      });
      
      console.log(`✅ Moved: ${agent.name}`);
    }
    
    // 3. Find all agent references in the old tenant (voice agents)
    const oldTenantReferences = await prisma.agentReference.findMany({
      where: { tenantId: oldTenantId }
    });
    
    console.log(`📋 Found ${oldTenantReferences.length} agent references in old tenant to migrate`);
    
    // 4. Move agent references to JWT tenant
    for (const ref of oldTenantReferences) {
      await prisma.agentReference.update({
        where: { id: ref.id },
        data: {
          tenantId: jwtTenantId,
          organizationId: jwtOrganizationId
        }
      });
      
      console.log(`✅ Moved agent reference: ${ref.elevenLabsAgentId}`);
    }
    
    // 5. Find all ElevenLabs configs in old tenant
    const oldConfigs = await prisma.elevenLabsConfig.findMany({
      where: { tenantId: oldTenantId }
    });
    
    console.log(`📋 Found ${oldConfigs.length} ElevenLabs configs in old tenant to migrate`);
    
    // 6. Move ElevenLabs configs to JWT tenant
    for (const config of oldConfigs) {
      await prisma.elevenLabsConfig.update({
        where: { id: config.id },
        data: {
          tenantId: jwtTenantId
        }
      });
      
      console.log(`✅ Moved config: ${config.name}`);
    }
    
    // 7. Check if old tenant is now empty
    const remainingAgents = await prisma.unifiedAgent.count({
      where: { tenantId: oldTenantId }
    });
    
    const remainingReferences = await prisma.agentReference.count({
      where: { tenantId: oldTenantId }
    });
    
    const remainingConfigs = await prisma.elevenLabsConfig.count({
      where: { tenantId: oldTenantId }
    });
    
    console.log(`📊 Remaining in old tenant: ${remainingAgents} agents, ${remainingReferences} references, ${remainingConfigs} configs`);
    
    // 8. If old tenant is empty, delete it and its organization
    if (remainingAgents === 0 && remainingReferences === 0 && remainingConfigs === 0) {
      console.log('🗑️ Old tenant is empty, cleaning up...');
      
      // Delete old organization
      await prisma.organization.delete({
        where: { id: oldOrganizationId }
      });
      console.log('✅ Deleted old organization');
      
      // Delete old tenant
      await prisma.tenant.delete({
        where: { id: oldTenantId }
      });
      console.log('✅ Deleted old tenant');
    }
    
    // 9. Verify final state
    const finalAgents = await prisma.unifiedAgent.findMany({
      where: { tenantId: jwtTenantId }
    });
    
    const finalReferences = await prisma.agentReference.findMany({
      where: { tenantId: jwtTenantId }
    });
    
    console.log(`🎉 Final state in JWT tenant:`);
    console.log(`  - ${finalAgents.length} unified agents`);
    console.log(`  - ${finalReferences.length} agent references`);
    console.log(`  - Voice agents: ${finalAgents.filter(a => a.category === 'voice').length + finalReferences.length}`);
    console.log(`  - Analysis agents: ${finalAgents.filter(a => a.category === 'analysis').length}`);
    
    console.log('✅ Tenant unification complete!');
    
  } catch (error) {
    console.error('❌ Error unifying tenants:', error);
  } finally {
    await prisma.$disconnect();
  }
}

unifyTenants();