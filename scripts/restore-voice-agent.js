const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreVoiceAgent() {
  try {
    console.log('🎤 Restoring voice agent for JWT tenant...');
    
    const jwtTenantId = '62454186-ee40-47b3-8811-3d06cd64e049';
    const jwtOrganizationId = '3fbec5ca-b0cd-4abe-925a-d567141e3963';
    
    // Check if there are existing voice agents in this tenant
    const existingAgents = await prisma.agentReference.findMany({
      where: { tenantId: jwtTenantId }
    });
    
    console.log('Existing voice agents:', existingAgents.length);
    
    if (existingAgents.length === 0) {
      console.log('📝 Creating sample voice agent...');
      
      // Create a sample voice agent reference (this would normally come from ElevenLabs)
      const voiceAgent = await prisma.agentReference.create({
        data: {
          tenantId: jwtTenantId,
          organizationId: jwtOrganizationId,
          elevenLabsAgentId: 'antres-voice-agent-001',
          provider: 'elevenlabs',
          usageRules: {
            targetScenarios: ['first_contact', 'follow_up'],
            maxCallDuration: 30,
            allowedHours: { start: '09:00', end: '18:00' }
          },
          localTags: ['antres', 'sales', 'spanish'],
          isActive: true,
          totalCalls: 7,
          successfulCalls: 5,
          failedCalls: 2,
          totalCost: 12.50,
          averageCallDuration: 180,
          lastUsedAt: new Date()
        }
      });
      
      console.log('✅ Voice agent created:', voiceAgent.id);
    } else {
      console.log('✅ Voice agents already exist in tenant');
    }
    
    console.log('🎉 Voice agent restoration complete!');
    
  } catch (error) {
    console.error('❌ Error restoring voice agent:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreVoiceAgent();