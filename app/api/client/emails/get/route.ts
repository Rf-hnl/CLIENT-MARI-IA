import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IEmailRecord, IClientDocument } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';

const db = getFirestore(firebaseApp);

/**
 * API ENDPOINT - Email History
 * 
 * Obtiene el historial de correos electrónicos desde customerInteractions del cliente
 * 
 * @param clientId - ID del cliente
 * @param tenantId - ID del tenant
 * @param organizationId - ID de la organización
 * 
 * NOTA: Los datos reales vienen de servicios MCP externos (Gmail API, SendGrid, etc.)
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
    const emailRecords = clientData.customerInteractions?.emailRecords || [];

    console.log(`📧 Email History requested for client: ${clientId}`);
    console.log(`📊 Found ${emailRecords.length} email records (IDs only)`);

    // TODO: Aquí se llamarían los servicios MCP externos para obtener:
    // - Contenido completo de emails
    // - Estado de entrega
    // - Hilos de conversación
    // - Adjuntos
    // usando los IDs almacenados en emailRecords

    return NextResponse.json({
      success: true,
      data: emailRecords,
      path: clientPath,
      message: 'Email history retrieved successfully',
      count: emailRecords.length,
      note: 'Los datos reales (contenido, adjuntos) se obtienen vía MCP - aquí solo se muestran los IDs almacenados',
      features: {
        threading: 'Email thread tracking via MCP pending',
        attachments: 'Attachment handling via MCP pending',
        templates: 'Email templates via MCP pending',
        deliveryStatus: 'Delivery status tracking via MCP pending'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching email history:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al obtener historial de correos electrónicos'
      },
      { status: 500 }
    );
  }
}