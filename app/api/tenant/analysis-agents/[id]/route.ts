import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Actualizar agente de análisis
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log('🔧 [API] Updating analysis agent:', id);

    const {
      tenantId,
      name,
      description,
      provider,
      model,
      purpose,
      systemPrompt,
      instructions,
      providerConfig,
      usage,
      tags,
      updatedBy
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID requerido' },
        { status: 400 }
      );
    }

    // Verificar que el agente existe y pertenece al tenant
    const existingAgent = await prisma.unifiedAgent.findFirst({
      where: {
        id,
        tenantId,
        category: 'analysis'
      },
      include: {
        analysisAgent: true
      }
    });

    if (!existingAgent) {
      return NextResponse.json(
        { success: false, error: 'Agente no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar usando transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el agente unificado
      const updatedUnifiedAgent = await tx.unifiedAgent.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(usage?.isActive !== undefined && { isActive: usage.isActive }),
          ...(tags && { tags }),
          categoryData: {
            ...existingAgent.categoryData,
            ...(provider && { provider }),
            ...(model && { model }),
            ...(purpose && { purpose }),
            ...(instructions !== undefined && { instructions }),
            ...(usage && { usage }),
            ...(providerConfig && providerConfig)
          },
          updatedBy: updatedBy || existingAgent.updatedBy,
          updatedAt: new Date()
        }
      });

      // 2. Actualizar el registro específico de analysis agent
      const updateData: any = {};
      if (provider) updateData.provider = provider;
      if (model) updateData.model = model;
      if (purpose) updateData.purpose = purpose;
      if (systemPrompt) updateData.systemPrompt = systemPrompt;
      if (instructions !== undefined) updateData.instructions = instructions;
      if (providerConfig) updateData.providerConfig = JSON.stringify(providerConfig);
      if (providerConfig?.maxTokens) updateData.maxTokens = providerConfig.maxTokens;
      if (providerConfig?.temperature !== undefined) updateData.temperature = providerConfig.temperature;

      let updatedAnalysisAgent = existingAgent.analysisAgent;
      if (Object.keys(updateData).length > 0) {
        updatedAnalysisAgent = await tx.analysisAgent.update({
          where: { id },
          data: updateData
        });
      }

      return { updatedUnifiedAgent, updatedAnalysisAgent };
    });

    // Transformar a formato esperado por el frontend
    const responseAgent = {
      id: result.updatedUnifiedAgent.id,
      tenantId: result.updatedUnifiedAgent.tenantId,
      organizationId: result.updatedUnifiedAgent.organizationId,
      category: result.updatedUnifiedAgent.category,
      name: result.updatedUnifiedAgent.name,
      description: result.updatedUnifiedAgent.description,
      isActive: result.updatedUnifiedAgent.isActive,
      
      // Datos específicos de analysis agent
      provider: result.updatedAnalysisAgent?.provider || 'openai',
      model: result.updatedAnalysisAgent?.model || 'gpt-4',
      purpose: result.updatedAnalysisAgent?.purpose || 'lead_scoring',
      systemPrompt: result.updatedAnalysisAgent?.systemPrompt || '',
      instructions: result.updatedAnalysisAgent?.instructions,
      
      // Configuración del proveedor
      providerConfig: {
        provider: result.updatedAnalysisAgent?.provider || 'openai',
        config: {
          model: result.updatedAnalysisAgent?.model || 'gpt-4',
          maxTokens: result.updatedAnalysisAgent?.maxTokens || 4000,
          temperature: Number(result.updatedAnalysisAgent?.temperature) || 0.7,
          ...JSON.parse(result.updatedAnalysisAgent?.providerConfig || '{}')
        }
      },
      
      // Configuración de uso
      usage: {
        isActive: result.updatedUnifiedAgent.isActive,
        isDefault: false, // TODO: Implementar lógica de default
        maxRequestsPerDay: 1000,
        maxCostPerMonth: 100,
        allowedHours: { start: '00:00', end: '23:59' },
        allowedDays: [1, 2, 3, 4, 5, 6, 7]
      },
      
      // Estadísticas actuales
      stats: {
        totalRequests: result.updatedUnifiedAgent.totalUsage,
        successfulRequests: Math.floor(result.updatedUnifiedAgent.totalUsage * (Number(result.updatedUnifiedAgent.successRate) / 100)),
        failedRequests: result.updatedUnifiedAgent.totalUsage - Math.floor(result.updatedUnifiedAgent.totalUsage * (Number(result.updatedUnifiedAgent.successRate) / 100)),
        averageResponseTime: result.updatedUnifiedAgent.averageResponseTime,
        totalCost: Number(result.updatedUnifiedAgent.totalCost),
        lastUsed: result.updatedUnifiedAgent.lastUsed,
        successRate: Number(result.updatedUnifiedAgent.successRate)
      },
      
      // Validación
      validation: {
        isValidated: true, // TODO: Implementar lógica de validación
        lastValidated: new Date(),
        validationIssues: []
      },
      
      // Metadatos
      metadata: {
        version: result.updatedUnifiedAgent.version,
        tags: result.updatedUnifiedAgent.tags,
        capabilities: result.updatedUnifiedAgent.capabilities,
        ...result.updatedUnifiedAgent.categoryData
      },
      
      // Timestamps
      createdAt: result.updatedUnifiedAgent.createdAt,
      updatedAt: result.updatedUnifiedAgent.updatedAt,
      createdBy: result.updatedUnifiedAgent.createdBy,
      updatedBy: result.updatedUnifiedAgent.updatedBy
    };

    console.log(`✅ [API] Analysis agent updated successfully: ${id}`);

    return NextResponse.json({
      success: true,
      agent: responseAgent,
      message: 'Agente de análisis actualizado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error updating analysis agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Eliminar agente de análisis
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    console.log('🗑️ [API] Deleting analysis agent:', id);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID requerido' },
        { status: 400 }
      );
    }

    // Verificar que el agente existe y pertenece al tenant
    const existingAgent = await prisma.unifiedAgent.findFirst({
      where: {
        id,
        tenantId,
        category: 'analysis'
      },
      include: {
        analysisAgent: true
      }
    });

    if (!existingAgent) {
      return NextResponse.json(
        { success: false, error: 'Agente no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar usando transacción (el análisis agent se eliminará automáticamente por la foreign key con onDelete: Cascade)
    await prisma.$transaction(async (tx) => {
      // Primero eliminar logs de uso si existen
      await tx.agentUsageLog.deleteMany({
        where: { agentId: id }
      });

      // Luego eliminar el agente unificado (esto eliminará automáticamente el analysis agent)
      await tx.unifiedAgent.delete({
        where: { id }
      });
    });

    console.log(`✅ [API] Analysis agent deleted successfully: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Agente de análisis eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [API] Error deleting analysis agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener agente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    console.log('🔍 [API] Getting analysis agent:', id);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID requerido' },
        { status: 400 }
      );
    }

    // Obtener el agente con sus datos específicos
    const agent = await prisma.unifiedAgent.findFirst({
      where: {
        id,
        tenantId,
        category: 'analysis'
      },
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
      }
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: 'Agente no encontrado' },
        { status: 404 }
      );
    }

    // Transformar a formato esperado por el frontend
    const responseAgent = {
      id: agent.id,
      tenantId: agent.tenantId,
      organizationId: agent.organizationId,
      category: agent.category,
      name: agent.name,
      description: agent.description,
      isActive: agent.isActive,
      
      // Datos específicos de analysis agent
      provider: agent.analysisAgent?.provider || 'openai',
      model: agent.analysisAgent?.model || 'gpt-4',
      purpose: agent.analysisAgent?.purpose || 'lead_scoring',
      systemPrompt: agent.analysisAgent?.systemPrompt || '',
      instructions: agent.analysisAgent?.instructions,
      
      // Configuración del proveedor
      providerConfig: {
        provider: agent.analysisAgent?.provider || 'openai',
        config: {
          model: agent.analysisAgent?.model || 'gpt-4',
          maxTokens: agent.analysisAgent?.maxTokens || 4000,
          temperature: Number(agent.analysisAgent?.temperature) || 0.7,
          ...JSON.parse(agent.analysisAgent?.providerConfig || '{}')
        }
      },
      
      // Configuración de uso
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
        ...agent.categoryData
      },
      
      // Timestamps
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
      createdBy: agent.createdBy,
      updatedBy: agent.updatedBy
    };

    console.log(`✅ [API] Analysis agent retrieved successfully: ${id}`);

    return NextResponse.json({
      success: true,
      agent: responseAgent
    });

  } catch (error) {
    console.error('❌ [API] Error getting analysis agent:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}