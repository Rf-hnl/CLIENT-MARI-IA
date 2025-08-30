const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAnalysisAgentForJWT() {
  try {
    console.log('🧠 Creating analysis agent for JWT tenant...');
    
    const jwtTenantId = '62454186-ee40-47b3-8811-3d06cd64e049';
    const jwtOrganizationId = '3fbec5ca-b0cd-4abe-925a-d567141e3963';
    
    // Check if there are existing analysis agents in this tenant
    const existingAnalysisAgents = await prisma.unifiedAgent.findMany({
      where: { 
        tenantId: jwtTenantId,
        category: 'analysis'
      }
    });
    
    console.log('Existing analysis agents:', existingAnalysisAgents.length);
    
    if (existingAnalysisAgents.length === 0) {
      console.log('📝 Creating analysis agent...');
      
      // Create the analysis agent using the unified system
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create unified agent
        const unifiedAgent = await tx.unifiedAgent.create({
          data: {
            tenantId: jwtTenantId,
            organizationId: jwtOrganizationId,
            category: 'analysis',
            name: 'Sales Antares HIOPOS',
            description: 'Agente de análisis para scoring de leads',
            isActive: true,
            categoryData: {
              provider: 'gemini',
              model: 'gemini-1.5-flash',
              purpose: 'lead_scoring',
              instructions: ''
            },
            capabilities: {
              analysis: true,
              multiProvider: true,
              customPrompts: true,
              realTimeProcessing: true
            },
            tags: ['antres', 'lead-scoring', 'gemini'],
            version: '1.0'
          }
        });

        // 2. Create analysis agent specific data
        const analysisAgent = await tx.analysisAgent.create({
          data: {
            id: unifiedAgent.id,
            provider: 'gemini',
            model: 'gemini-1.5-flash',
            purpose: 'lead_scoring',
            systemPrompt: 'Eres un experto en análisis de leads. Califica este lead del 0 al 100.',
            instructions: '',
            providerConfig: JSON.stringify({
              temperature: 0.7,
              maxTokens: 1000
            }),
            maxTokens: 1000,
            temperature: 0.7
          }
        });

        return { unifiedAgent, analysisAgent };
      });
      
      console.log('✅ Analysis agent created:', result.unifiedAgent.id);
    } else {
      console.log('✅ Analysis agents already exist in JWT tenant');
    }
    
    console.log('🎉 Analysis agent setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating analysis agent:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAnalysisAgentForJWT();