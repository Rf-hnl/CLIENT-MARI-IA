import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IClientDocument } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

/**
 * API ENDPOINT - AI Analysis
 * 
 * Obtiene el análisis de IA desde customerInteractions del cliente
 * 
 * @param clientId - ID del cliente
 * @param tenantId - ID del tenant
 * @param organizationId - ID de la organización
 * 
 * NOTA: Los datos de análisis pueden venir de servicios MCP externos (OpenAI, Claude, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, tenantId, organizationId } = body;

    // Validar parámetros requeridos
    if (!clientId || !tenantId || !organizationId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'clientId, tenantId y organizationId son requeridos' 
        },
        { status: 400 }
      );
    }

    // Obtener documento del cliente desde Firebase
    const clientPath = `tenants/${tenantId}/organizations/${organizationId}/clients/${clientId}`;
    const clientDocRef = doc(db, clientPath);
    const clientDoc = await getDoc(clientDocRef);

    if (!clientDoc.exists()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cliente no encontrado' 
        },
        { status: 404 }
      );
    }

    const clientData = clientDoc.data() as IClientDocument;
    const aiProfile = clientData.customerInteractions?.clientAIProfiles || null;

    console.log(`🤖 AI Analysis requested for client: ${clientId}`);
    console.log(`📊 AI Profile found: ${aiProfile ? 'Yes' : 'No'}`);

    // TODO: Si no hay análisis o está desactualizado, se puede:
    // 1. Llamar servicios MCP para generar nuevo análisis
    // 2. Analizar patrones de comunicación
    // 3. Calcular scores de riesgo actualizados

    return NextResponse.json({
      success: true,
      data: aiProfile,
      path: clientPath,
      message: 'AI analysis retrieved successfully',
      hasAnalysis: !!aiProfile,
      note: 'Los análisis pueden generarse/actualizarse vía MCP usando datos de comunicaciones',
      features: {
        riskAssessment: 'Based on communication patterns and payment history',
        behaviorAnalysis: 'Pattern recognition from interactions',
        predictiveModeling: 'Churn prediction via ML models',
        recommendations: 'Action recommendations based on profile',
        sentimentAnalysis: 'Communication sentiment via MCP'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching AI analysis:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al obtener análisis de IA'
      },
      { status: 500 }
    );
  }
}