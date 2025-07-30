import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IClientDocument } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

/**
 * API ENDPOINT - Call History
 * 
 * Obtiene el historial de llamadas desde customerInteractions del cliente
 * 
 * @param clientId - ID del cliente
 * @param tenantId - ID del tenant
 * @param organizationId - ID de la organización
 * 
 * NOTA: Los datos reales vienen de servicios MCP externos (ElevenLabs, etc.)
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
    const callLogs = clientData.customerInteractions?.callLogs || [];

    console.log(`📞 [CALL_HISTORY] Call History requested for client: ${clientId}`);
    console.log(`📄 [CLIENT_DOC] Estructura del documento:`);
    console.log(`- Tiene _data:`, !!clientData._data);
    console.log(`- Tiene customerInteractions:`, !!clientData.customerInteractions);
    console.log(`📊 [CALL_LOGS] Found ${callLogs.length} call records`);
    
    if (callLogs.length > 0) {
      console.log(`🔍 [FIRST_CALL] Primer callLog:`, JSON.stringify(callLogs[0], null, 2));
    }

    // TODO: Aquí se llamarían los servicios MCP externos para obtener:
    // - Transcripciones de ElevenLabs
    // - URLs de audio
    // - Análisis de sentimiento
    // usando los IDs almacenados en callLogs

    return NextResponse.json({
      success: true,
      data: callLogs,
      path: clientPath,
      message: 'Call history retrieved successfully',
      count: callLogs.length,
      note: 'Los datos reales (transcripciones, audio) se obtienen vía MCP - aquí solo se muestran los IDs almacenados',
      features: {
        transcription: 'ElevenLabs MCP integration pending',
        audioPlayback: 'Audio URLs via MCP pending',
        callAnalysis: 'AI analysis via MCP pending'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching call history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al obtener historial de llamadas'
      },
      { status: 500 }
    );
  }
}