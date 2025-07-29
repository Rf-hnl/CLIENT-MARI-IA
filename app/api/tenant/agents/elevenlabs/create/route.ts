import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  ILocalAgentReference,
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
    if (!agentData.elevenLabsAgentId) {
      return NextResponse.json(
        { success: false, error: 'elevenLabsAgentId es requerido' },
        { status: 400 }
      );
    }

    if (!agentData.usage) {
      return NextResponse.json(
        { success: false, error: 'usage rules son requeridas' },
        { status: 400 }
      );
    }

    console.log(`[CREATE AGENT] Creating agent reference for tenant: ${tenantId}`);
    console.log(`[CREATE AGENT] ElevenLabs Agent ID: ${agentData.elevenLabsAgentId}`);

    // Generar ID único para la referencia local
    const localAgentId = `agent-${agentData.elevenLabsAgentId.slice(-8)}-${Date.now()}`;

    const now = new Date();

    // Crear SOLO la referencia local (OPTIMIZADA)
    const agentReference: ILocalAgentReference = {
      id: localAgentId,
      tenantId,
      
      // SOLO referencia a ElevenLabs
      elevenLabsConfig: {
        agentId: agentData.elevenLabsAgentId
      },
      
      // Reglas de negocio LOCALES
      usage: agentData.usage,
      
      // Metadata LOCAL
      metadata: {
        isActive: true,
        createdAt: now as any,
        updatedAt: now as any,
        createdBy: uid,
        version: '1.0.0',
        tags: agentData.tags || []
      },
      
      // Stats LOCALES
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

    // Verificar que no existe ya una referencia para este agente de ElevenLabs
    const agentsPath = `tenants/${tenantId}/elevenlabs-agents`;
    const existingQuery = await adminDb.collection(agentsPath)
      .where('elevenLabsConfig.agentId', '==', agentData.elevenLabsAgentId)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json({
        success: false,
        error: `Ya existe una referencia para el agente ElevenLabs "${agentData.elevenLabsAgentId}"`
      } as IAgentOperationResult, { status: 409 });
    }

    // Guardar SOLO la referencia en Firebase
    const agentDocPath = `${agentsPath}/${localAgentId}`;
    await adminDb.doc(agentDocPath).set(agentReference);

    console.log(`[CREATE AGENT] Agent reference created successfully: ${localAgentId} for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: 'Referencia de agente creada exitosamente',
      agent: agentReference
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