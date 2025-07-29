import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IWhatsAppRecord } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';
import { getWhatsAppConversations, transformMCPToWhatsAppRecord } from '@/lib/services/mcpWhatsApp';

const db = getFirestore(firebaseApp);

/**
 * API ENDPOINT - WhatsApp History with MCP Integration
 * 
 * Obtiene el historial de mensajes de WhatsApp desde MCP service
 * 
 * @param clientId - ID del cliente
 * @param tenantId - ID del tenant
 * @param organizationId - ID de la organización
 * @param days - Número de días a filtrar (opcional, default: 7)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, tenantId, organizationId, days = 7 } = body;

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

    const clientData = clientDoc.data();
    
    // Los datos del cliente están directamente en el documento, no en _data
    // const client = { id: clientId, ...clientData } as IClient; // Unused variable

    console.log(`📱 WhatsApp History requested for client: ${clientId} (${days} days)`);

    try {
      // Obtener conversaciones desde MCP service
      const mcpResponse = await getWhatsAppConversations(clientId, days);
      
      
      // Validar que la respuesta tenga messages
      if (!mcpResponse || !mcpResponse.messages || !Array.isArray(mcpResponse.messages)) {
        console.warn('⚠️ MCP Response missing messages array:', mcpResponse);
        return NextResponse.json({
          success: true,
          data: [],
          path: clientPath,
          message: 'No messages found in MCP response',
          count: 0,
          totalMessages: 0,
          periodDays: days,
          source: 'MCP WhatsApp Service'
        });
      }
      
      // Transformar datos MCP a formato IWhatsAppRecord
      const whatsappRecords: IWhatsAppRecord[] = mcpResponse.messages.map(mcpMessage => 
        transformMCPToWhatsAppRecord(mcpMessage, clientId)
      );

      console.log(`📊 Retrieved ${whatsappRecords.length} WhatsApp messages from MCP`);

      return NextResponse.json({
        success: true,
        data: whatsappRecords,
        path: clientPath,
        message: 'WhatsApp history retrieved successfully from MCP',
        count: whatsappRecords.length,
        totalMessages: mcpResponse.message_count,
        periodDays: mcpResponse.days,
        source: 'MCP WhatsApp Service'
      });

    } catch (mcpError) {
      // Si MCP falla, loguear el error y retornar un mensaje de error apropiado
      console.error('❌ Error fetching WhatsApp conversations from MCP:', mcpError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to retrieve WhatsApp history from MCP: ${mcpError instanceof Error ? mcpError.message : 'Unknown error'}`,
          details: 'Error al obtener historial de WhatsApp del servicio MCP'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error fetching WhatsApp history in endpoint:', error);
    
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
