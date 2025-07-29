import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  ITenantElevenLabsAgent, 
  ICreateAgentData, 
  IAgentOperationResult 
} from '@/types/agents';

// POST - Crear nuevo agente ElevenLabs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, uid, ...agentData }: { 
      tenantId: string; 
      uid: string; 
    } & ICreateAgentData = body;

    if (!tenantId || !uid) {
      return NextResponse.json(
        { success: false, error: 'tenantId y uid son requeridos' },
        { status: 400 }
      );
    }

    // Validar datos requeridos
    if (!agentData.name || !agentData.description) {
      return NextResponse.json(
        { success: false, error: 'name y description son requeridos' },
        { status: 400 }
      );
    }

    if (!agentData.elevenLabsConfig?.agentId) {
      return NextResponse.json(
        { success: false, error: 'elevenLabsConfig.agentId es requerido' },
        { status: 400 }
      );
    }

    console.log(`[CREATE AGENT] Creating agent for tenant: ${tenantId}`);

    // Generar ID único para el agente
    const agentId = agentData.name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();

    const now = new Date();

    // Crear el agente
    const agent: ITenantElevenLabsAgent = {
      id: agentId,
      tenantId,
      name: agentData.name,
      description: agentData.description,
      elevenLabsConfig: agentData.elevenLabsConfig,
      usage: agentData.usage,
      metadata: {
        isActive: true,
        createdAt: now as any,
        updatedAt: now as any,
        createdBy: uid,
        version: '1.0.0',
        tags: agentData.tags || []
      },
      stats: {
        totalCalls: 0,
        successfulCalls: 0,
        averageDuration: 0,
        averageSuccessRate: 0,
        lastUsed: null,
        costPerCall: 0,
        totalCost: 0
      }
    };

    // Verificar que no existe un agente con el mismo nombre
    const agentsPath = `tenants/${tenantId}/agents/elevenlabs`;
    const existingQuery = await adminDb.collection(agentsPath)
      .where('name', '==', agentData.name)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json({
        success: false,
        error: `Ya existe un agente con el nombre "${agentData.name}"`
      } as IAgentOperationResult, { status: 409 });
    }

    // Guardar en Firebase
    const agentDocPath = `${agentsPath}/${agentId}`;
    await adminDb.doc(agentDocPath).set(agent);

    console.log(`[CREATE AGENT] Agent created successfully: ${agentId} for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: 'Agente creado exitosamente',
      agent
    } as IAgentOperationResult);

  } catch (error) {
    console.error('[CREATE AGENT] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as IAgentOperationResult, { status: 500 });
  }
}