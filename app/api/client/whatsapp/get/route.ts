import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { IWhatsAppRecord, IClientDocument, IClient } from '@/modules/clients/types/clients';
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
    const client = { id: clientId, ...clientData } as IClient;

    console.log(`📱 WhatsApp History requested for client: ${clientId} (${days} days)`);

    try {
      // Obtener conversaciones desde MCP service
      const mcpResponse = await getWhatsAppConversations(clientId, days);
      
      // Transformar datos MCP a formato IWhatsAppRecord
      const whatsappRecords: IWhatsAppRecord[] = mcpResponse.conversations.map(mcpMessage => 
        transformMCPToWhatsAppRecord(mcpMessage, clientId)
      );

      console.log(`📊 Retrieved ${whatsappRecords.length} WhatsApp messages from MCP`);

      return NextResponse.json({
        success: true,
        data: whatsappRecords,
        path: clientPath,
        message: 'WhatsApp history retrieved successfully from MCP',
        count: whatsappRecords.length,
        totalMessages: mcpResponse.total_messages,
        periodDays: mcpResponse.period_days,
        source: 'MCP WhatsApp Service'
      });

    } catch (mcpError) {
      // Si MCP falla, mostrar mensaje apropiado ya que no hay datos de WhatsApp en Firebase
      console.warn('⚠️ MCP service unavailable:', mcpError);
      
      return NextResponse.json({
        success: true,
        data: [], // No hay datos de WhatsApp almacenados en Firebase
        path: clientPath,
        message: 'MCP service unavailable - no WhatsApp data stored in Firebase',
        count: 0,
        source: 'Firebase Fallback',
        warning: 'MCP service unavailable and no local WhatsApp data found'
      });
    }

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