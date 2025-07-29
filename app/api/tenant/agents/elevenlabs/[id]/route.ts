import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  ITenantElevenLabsAgent, 
  IUpdateAgentData, 
  IAgentOperationResult 
} from '@/types/agents';

// GET - Obtener agente específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const agentId = params.id;

    if (!tenantId || !agentId) {
      return NextResponse.json(
        { success: false, error: 'tenantId y agentId son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[GET AGENT] Fetching agent: ${agentId} for tenant: ${tenantId}`);

    const agentDocPath = `tenants/${tenantId}/agents/elevenlabs/${agentId}`;
    const agentDoc = await adminDb.doc(agentDocPath).get();

    if (!agentDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Agente no encontrado'
      } as IAgentOperationResult, { status: 404 });
    }

    const agent = {
      id: agentDoc.id,
      ...agentDoc.data()
    } as ITenantElevenLabsAgent;

    return NextResponse.json({
      success: true,
      message: 'Agente obtenido exitosamente',
      agent
    } as IAgentOperationResult);

  } catch (error) {
    console.error('[GET AGENT] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as IAgentOperationResult, { status: 500 });
  }
}

// PUT - Actualizar agente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { tenantId, uid, ...updateData }: { 
      tenantId: string; 
      uid: string; 
    } & IUpdateAgentData = body;
    
    const agentId = params.id;

    if (!tenantId || !uid || !agentId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, uid y agentId son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[UPDATE AGENT] Updating agent: ${agentId} for tenant: ${tenantId}`);

    const agentDocPath = `tenants/${tenantId}/agents/elevenlabs/${agentId}`;
    const agentDoc = await adminDb.doc(agentDocPath).get();

    if (!agentDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Agente no encontrado'
      } as IAgentOperationResult, { status: 404 });
    }

    const currentAgent = agentDoc.data() as ITenantElevenLabsAgent;
    const now = new Date();

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (updateData.name && updateData.name !== currentAgent.name) {
      const agentsPath = `tenants/${tenantId}/agents/elevenlabs`;
      const existingQuery = await adminDb.collection(agentsPath)
        .where('name', '==', updateData.name)
        .get();

      if (!existingQuery.empty) {
        return NextResponse.json({
          success: false,
          error: `Ya existe un agente con el nombre "${updateData.name}"`
        } as IAgentOperationResult, { status: 409 });
      }
    }

    // Merge de datos actuales con nuevos datos
    const updatedAgent: ITenantElevenLabsAgent = {
      ...currentAgent,
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.description && { description: updateData.description }),
      ...(updateData.elevenLabsConfig && { 
        elevenLabsConfig: {
          ...currentAgent.elevenLabsConfig,
          ...updateData.elevenLabsConfig
        }
      }),
      ...(updateData.usage && { 
        usage: {
          ...currentAgent.usage,
          ...updateData.usage
        }
      }),
      metadata: {
        ...currentAgent.metadata,
        updatedAt: now as any,
        ...(updateData.tags && { tags: updateData.tags })
      }
    };

    await adminDb.doc(agentDocPath).set(updatedAgent);

    console.log(`[UPDATE AGENT] Agent updated successfully: ${agentId} for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: 'Agente actualizado exitosamente',
      agent: updatedAgent
    } as IAgentOperationResult);

  } catch (error) {
    console.error('[UPDATE AGENT] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as IAgentOperationResult, { status: 500 });
  }
}

// DELETE - Eliminar agente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const uid = searchParams.get('uid');
    const agentId = params.id;

    if (!tenantId || !uid || !agentId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, uid y agentId son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[DELETE AGENT] Deleting agent: ${agentId} for tenant: ${tenantId}`);

    const agentDocPath = `tenants/${tenantId}/agents/elevenlabs/${agentId}`;
    const agentDoc = await adminDb.doc(agentDocPath).get();

    if (!agentDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'Agente no encontrado'
      } as IAgentOperationResult, { status: 404 });
    }

    const agent = agentDoc.data() as ITenantElevenLabsAgent;

    // Verificar si el agente tiene llamadas activas
    // Aquí se podría agregar lógica para verificar llamadas en progreso
    // const activeCallsQuery = await adminDb.collection('calls')
    //   .where('agentId', '==', agentId)
    //   .where('status', 'in', ['initiated', 'in_progress'])
    //   .get();
    
    // if (!activeCallsQuery.empty) {
    //   return NextResponse.json({
    //     success: false,
    //     error: 'No se puede eliminar un agente con llamadas activas'
    //   } as IAgentOperationResult, { status: 409 });
    // }

    await adminDb.doc(agentDocPath).delete();

    console.log(`[DELETE AGENT] Agent deleted successfully: ${agentId} for tenant: ${tenantId}`);

    return NextResponse.json({
      success: true,
      message: `Agente "${agent.name}" eliminado exitosamente`,
      agent
    } as IAgentOperationResult);

  } catch (error) {
    console.error('[DELETE AGENT] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error'
    } as IAgentOperationResult, { status: 500 });
  }
}