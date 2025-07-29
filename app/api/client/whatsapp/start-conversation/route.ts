import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IClient } from '@/modules/clients/types/clients';
import firebaseApp from '@/lib/firebase/client';
import { startWhatsAppConversation } from '@/lib/services/mcpWhatsApp';

const db = getFirestore(firebaseApp);

/**
 * API ENDPOINT - Start WhatsApp Conversation
 * 
 * Inicia una nueva conversación de WhatsApp usando MCP service
 * 
 * @param clientId - ID del cliente
 * @param tenantId - ID del tenant
 * @param organizationId - ID de la organización
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, tenantId, organizationId, action } = body;

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
    const client = { id: clientId, ...clientData } as IClient;

    console.log(`🚀 Starting WhatsApp conversation for client: ${client.name} (${clientId})`);
    console.log(`🎯 Selected action: ${action || 'No action specified'}`);

    try {
      // Iniciar conversación usando MCP service
      const mcpResponse = await startWhatsAppConversation(client, action);
      
      console.log(`✅ WhatsApp conversation started successfully: ${mcpResponse.conversation_id}`);

      return NextResponse.json({
        success: true,
        data: mcpResponse,
        message: 'WhatsApp conversation started successfully',
        conversationId: mcpResponse.conversation_id,
        clientId: mcpResponse.client_id,
        source: 'MCP WhatsApp Service'
      });

    } catch (mcpError) {
      console.error('❌ Error starting WhatsApp conversation via MCP:', mcpError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: mcpError instanceof Error ? mcpError.message : 'Error al iniciar conversación',
          details: 'Error en servicio MCP WhatsApp'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Error in start-conversation endpoint:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al iniciar conversación de WhatsApp'
      },
      { status: 500 }
    );
  }
}