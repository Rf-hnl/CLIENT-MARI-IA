import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const provider = searchParams.get('provider');
    const purpose = searchParams.get('purpose');
    const isActive = searchParams.get('isActive');
    const isValidated = searchParams.get('isValidated');

    console.log('🔍 [API] Fetching analysis agents for tenant:', tenantId);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID requerido' },
        { status: 400 }
      );
    }

    // Construir filtros
    const whereClause: any = {
      tenantId: tenantId,
      category: 'analysis',
      ...(organizationId && { organizationId }),
      ...(isActive !== null && { isActive: isActive === 'true' }),
    };

    // Filtros específicos para analysis agents
    const analysisWhere: any = {};
    if (provider) analysisWhere.provider = provider;
    if (purpose) analysisWhere.purpose = purpose;

    // Obtener agentes con sus datos específicos de análisis
    const agents = await prisma.unifiedAgent.findMany({
      where: whereClause,
      include: {
        analysisAgent: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filtrar por campos específicos de analysis agent si se proporcionan
    let filteredAgents = agents;
    if (Object.keys(analysisWhere).length > 0) {
      filteredAgents = agents.filter(agent => {
        if (!agent.analysisAgent) return false;
        
        return Object.entries(analysisWhere).every(([key, value]) => {
          return agent.analysisAgent![key as keyof typeof agent.analysisAgent] === value;
        });
      });
    }

    // Transformar a formato esperado por el frontend
    const transformedAgents = filteredAgents.map(agent => {
      const analysisData = agent.analysisAgent;
      
      return {
        id: agent.id,
        tenantId: agent.tenantId,
        organizationId: agent.organizationId,
        category: agent.category,
        name: agent.name,
        description: agent.description,
        isActive: agent.isActive,
        
        // Datos específicos de analysis agent
        provider: analysisData?.provider || 'openai',
        model: analysisData?.model || 'gpt-4',
        purpose: analysisData?.purpose || 'lead_scoring',
        systemPrompt: analysisData?.systemPrompt || '',
        instructions: analysisData?.instructions,
        
        // Configuración del proveedor
        providerConfig: {
          provider: analysisData?.provider || 'openai',
          config: {
            model: analysisData?.model || 'gpt-4',
            maxTokens: analysisData?.maxTokens || 4000,
            temperature: Number(analysisData?.temperature) || 0.7,
            ...(JSON.parse(analysisData?.providerConfig as string || '{}'))
          }
        },
        
        // Configuración de uso (desde categoryData o defaults)
        usage: {
          isActive: agent.isActive,
          isDefault: false, // TODO: Implementar lógica de default
          maxRequestsPerDay: 1000,
          maxCostPerMonth: 100,
          allowedHours: { start: '00:00', end: '23:59' },
          allowedDays: [1, 2, 3, 4, 5, 6, 7]
        },
        
        // Estadísticas
        stats: {
          totalRequests: agent.totalUsage,
          successfulRequests: Math.floor(agent.totalUsage * (Number(agent.successRate) / 100)),
          failedRequests: agent.totalUsage - Math.floor(agent.totalUsage * (Number(agent.successRate) / 100)),
          averageResponseTime: agent.averageResponseTime,
          totalCost: Number(agent.totalCost),
          lastUsed: agent.lastUsed,
          successRate: Number(agent.successRate)
        },
        
        // Validación
        validation: {
          isValidated: true, // TODO: Implementar lógica de validación
          lastValidated: new Date(),
          validationIssues: []
        },
        
        // Metadatos
        metadata: {
          version: agent.version,
          tags: agent.tags,
          capabilities: agent.capabilities,
          ...(typeof agent.categoryData === 'object' ? agent.categoryData : {})
        },
        
        // Timestamps
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        createdBy: agent.createdBy,
        updatedBy: agent.updatedBy
      };
    });

    console.log(`✅ [API] Retrieved ${transformedAgents.length} analysis agents`);

    return NextResponse.json({
      success: true,
      agents: transformedAgents,
      total: transformedAgents.length,
      filters: {
        tenantId,
        organizationId,
        provider,
        purpose,
        isActive,
        isValidated
      }
    });

  } catch (error) {
    console.error('❌ [API] Error fetching analysis agents:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        agents: []
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}