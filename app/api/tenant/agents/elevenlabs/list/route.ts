import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { 
  ITenantElevenLabsAgent, 
  IAgentsListResult, 
  IAgentsFilter 
} from '@/types/agents';

// GET - Listar agentes ElevenLabs del tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Filtros opcionales
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags')?.split(',');
    const scenarios = searchParams.get('scenarios')?.split(',');
    const riskCategories = searchParams.get('riskCategories')?.split(',');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'tenantId es requerido' },
        { status: 400 }
      );
    }

    console.log(`[LIST AGENTS] Fetching agents for tenant: ${tenantId}`);

    const agentsPath = `tenants/${tenantId}/agents/elevenlabs`;
    const agentsCollectionRef = adminDb.collection(agentsPath);
    
    let query: any = agentsCollectionRef;

    // Aplicar filtros
    if (isActive !== null) {
      query = query.where('metadata.isActive', '==', isActive === 'true');
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.orderBy('metadata.createdAt', 'desc');

    const snapshot = await query.get();
    let agents: ITenantElevenLabsAgent[] = [];

    snapshot.forEach(doc => {
      const agentData = doc.data() as ITenantElevenLabsAgent;
      agents.push({
        id: doc.id,
        ...agentData
      });
    });

    // Aplicar filtros que no se pueden hacer en Firestore
    if (search) {
      const searchLower = search.toLowerCase();
      agents = agents.filter(agent => 
        agent.name.toLowerCase().includes(searchLower) ||
        agent.description.toLowerCase().includes(searchLower)
      );
    }

    if (tags && tags.length > 0) {
      agents = agents.filter(agent =>
        tags.some(tag => agent.metadata.tags.includes(tag))
      );
    }

    if (scenarios && scenarios.length > 0) {
      agents = agents.filter(agent =>
        scenarios.some(scenario => agent.usage.targetScenarios.includes(scenario))
      );
    }

    if (riskCategories && riskCategories.length > 0) {
      agents = agents.filter(agent =>
        riskCategories.some(risk => agent.usage.riskCategories.includes(risk))
      );
    }

    // Paginación
    const total = agents.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAgents = agents.slice(startIndex, endIndex);

    console.log(`[LIST AGENTS] Found ${total} agents for tenant: ${tenantId}, returning ${paginatedAgents.length}`);

    const result: IAgentsListResult = {
      success: true,
      agents: paginatedAgents,
      total,
      page,
      limit
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('[LIST AGENTS] Error:', error);
    
    const result: IAgentsListResult = {
      success: false,
      agents: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(result, { status: 500 });
  }
}