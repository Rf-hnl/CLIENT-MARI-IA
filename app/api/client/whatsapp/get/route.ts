import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IWhatsAppRecord, IClientDocument } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

/**
 * API ENDPOINT - WhatsApp History
 * 
 * Obtiene el historial de mensajes de WhatsApp desde customerInteractions del cliente
 * 
 * @param clientId - ID del cliente
 * @param tenantId - ID del tenant
 * @param organizationId - ID de la organización
 * 
 * NOTA: Los datos reales vienen de servicios MCP externos, aquí solo se obtienen los IDs almacenados
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
    const whatsappRecords = clientData.customerInteractions?.whatsAppRecords || [];

    console.log(`📱 WhatsApp History requested for client: ${clientId}`);
    console.log(`📊 Found ${whatsappRecords.length} WhatsApp records (IDs only)`);

    // TODO: Aquí se llamarían los servicios MCP externos para obtener los datos completos
    // usando los IDs almacenados en whatsappRecords

    return NextResponse.json({
      success: true,
      data: whatsappRecords,
      path: clientPath,
      message: 'WhatsApp history retrieved successfully',
      count: whatsappRecords.length,
      note: 'Los datos reales se obtienen vía MCP - aquí solo se muestran los IDs almacenados'
    });

  } catch (error) {
    console.error('❌ Error fetching WhatsApp history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al obtener historial de WhatsApp'
      },
      { status: 500 }
    );
  }
}