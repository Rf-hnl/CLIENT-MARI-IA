import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin'; // Import adminDb
import { IClientDocument, IClient, ICallLog } from '@/modules/clients/types/clients';
import { ITenantElevenLabsConfig } from '@/types/elevenlabs';
import { ITenantElevenLabsAgent } from '@/types/agents';
import admin from 'firebase-admin'; // Import admin for FieldValue

interface InitiateCallRequestBody {
  clientId: string;
  tenantId: string;
  organizationId: string;
  agentId: string; // ID del agente local (ITenantElevenLabsAgent.id)
  callType: string; // Tipo de llamada (ej. "overdue_payment", "follow_up")
}

export async function POST(request: NextRequest) {
  try {
    const body: InitiateCallRequestBody = await request.json();
    const { clientId, tenantId, organizationId, agentId, callType } = body;

    // 1. Validar parámetros requeridos
    if (!clientId || !tenantId || !organizationId || !agentId || !callType) {
      return NextResponse.json(
        { success: false, error: 'clientId, tenantId, organizationId, agentId y callType son requeridos' },
        { status: 400 }
      );
    }

    // 2. Obtener datos del cliente
    const clientPath = `tenants/${tenantId}/organizations/${organizationId}/clients/${clientId}`;
    const clientDocRef = adminDb.doc(clientPath); // Use adminDb
    const clientDoc = await clientDocRef.get();

    if (!clientDoc.exists) { // Corrected: .exists is a property, not a function
      return NextResponse.json({ success: false, error: 'Cliente no encontrado' }, { status: 404 });
    }

    const rawClientData = clientDoc.data();
    if (!rawClientData) {
      return NextResponse.json({ success: false, error: 'Datos de cliente vacíos en el documento' }, { status: 500 });
    }
    const clientDocumentData: IClientDocument = (rawClientData as any) as IClientDocument; // Cast to any first
    
    if (!clientDocumentData._data) {
      return NextResponse.json({ success: false, error: 'Datos de cliente incompletos en el documento' }, { status: 500 });
    }
    const clientData: IClient = clientDocumentData._data;

    // 3. Obtener configuración de ElevenLabs del tenant
    const elevenLabsConfigPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const elevenLabsConfigDoc = await adminDb.doc(elevenLabsConfigPath).get();

    if (!elevenLabsConfigDoc.exists) { // Corrected: .exists is a property, not a function
      return NextResponse.json({ success: false, error: 'Configuración de ElevenLabs no encontrada para el tenant' }, { status: 404 });
    }
    const elevenLabsConfig: ITenantElevenLabsConfig = (elevenLabsConfigDoc.data() as any) as ITenantElevenLabsConfig; // Cast to any first

    // 4. Obtener detalles del agente ElevenLabs (desde la referencia local)
    const agentDocRef = adminDb.doc(`tenants/${tenantId}/agents/${agentId}`); // Use adminDb
    const agentDoc = await agentDocRef.get();

    if (!agentDoc.exists) { // Corrected: .exists is a property, not a function
      return NextResponse.json({ success: false, error: 'Agente no encontrado' }, { status: 404 });
    }
    const localAgent: ITenantElevenLabsAgent = (agentDoc.data() as any) as ITenantElevenLabsAgent; // Cast to any first

    // Extraer el agent_id de ElevenLabs del agente local
    const elevenLabsAgentId = localAgent.elevenLabsData?.agent_id || localAgent.elevenLabsConfig.agentId;
    if (!elevenLabsAgentId) {
      return NextResponse.json({ success: false, error: 'ID de agente de ElevenLabs no configurado para el agente seleccionado' }, { status: 400 });
    }

    // 5. Preparar payload para ElevenLabs Batch Calling API
    const elevenLabsPayload = {
      call_name: `${callType} - ${clientData.name} - ${new Date().toISOString()}`,
      agent_id: elevenLabsAgentId,
      agent_phone_number_id: elevenLabsConfig.phoneId,
      scheduled_time_unix: Math.floor(Date.now() / 1000), // Iniciar inmediatamente
      max_duration: 300, // 5 minutos, configurable
      recipients: [
        {
          phone_number: clientData.phone,
          name: clientData.name,
          company: clientData.employer || '', // Mapear campos del cliente
          email: clientData.email || '',
          national_id: clientData.national_id,
          address: clientData.address || '',
          city: clientData.city || '',
          province: clientData.province || '',
          postal_code: clientData.postal_code || '',
          country: clientData.country || '',
          debt: clientData.debt,
          status: clientData.status,
          loan_letter: clientData.loan_letter,
          payment_date: clientData.payment_date ? new Date(clientData.payment_date._seconds * 1000).toISOString() : '',
          installment_amount: clientData.installment_amount,
          pending_installments: clientData.pending_installments,
          due_date: clientData.due_date ? new Date(clientData.due_date._seconds * 1000).toISOString() : '',
          loan_start_date: clientData.loan_start_date ? new Date(clientData.loan_start_date._seconds * 1000).toISOString() : '',
          days_overdue: clientData.days_overdue,
          last_payment_date: clientData.last_payment_date ? new Date(clientData.last_payment_date._seconds * 1000).toISOString() : '',
          last_payment_amount: clientData.last_payment_amount,
          credit_score: clientData.credit_score,
          risk_category: clientData.risk_category,
          credit_limit: clientData.credit_limit,
          available_credit: clientData.available_credit,
          employment_status: clientData.employment_status || '',
          employer: clientData.employer || '',
          position: clientData.position || '',
          monthly_income: clientData.monthly_income || 0,
          employment_verified: clientData.employment_verified || false,
          preferred_contact_method: clientData.preferred_contact_method || '',
          best_contact_time: clientData.best_contact_time || '',
          response_score: clientData.response_score || 0,
          recovery_probability: clientData.recovery_probability,
          collection_strategy: clientData.collection_strategy || '',
          notes: clientData.notes || '',
          internal_notes: clientData.internal_notes || '',
          tags: clientData.tags || [],
        },
      ],
    };

    // 6. Realizar la llamada a la API de ElevenLabs
    const elevenLabsApiUrl = elevenLabsConfig.apiUrl || 'https://api.elevenlabs.io/v1/convai/batch-calling/submit';
    const elevenLabsApiKey = elevenLabsConfig.apiKey;

    const elevenLabsResponse = await fetch(elevenLabsApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify(elevenLabsPayload),
    });

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.json();
      console.error('Error de ElevenLabs:', errorData);
      return NextResponse.json(
        { success: false, error: 'Error al iniciar llamada con ElevenLabs', details: errorData },
        { status: elevenLabsResponse.status }
      );
    }

    const elevenLabsResult = await elevenLabsResponse.json();
    const elevenLabsCallId = elevenLabsResult.call_id; // Asumiendo que ElevenLabs devuelve 'call_id'

    // 7. Guardar el registro de la llamada en Firebase
    const callLog: ICallLog = {
      id: elevenLabsCallId, // Usamos el ID de ElevenLabs como ID del log
      clientId: clientId,
      timestamp: admin.firestore.FieldValue.serverTimestamp() as any, // Use admin.firestore.FieldValue.serverTimestamp()
      callType: callType,
      durationMinutes: 0, // Se actualizará con el webhook
      agentId: localAgent.id, // ID del agente local
      outcome: 'initiated',
      audioUrl: '', // Se actualizará con el webhook
      transcription: '', // Se actualizará con el webhook
      elevenLabsJobId: elevenLabsCallId, // Guardamos el ID de ElevenLabs
      transcriptionStatus: 'pending',
    };

    // Para actualizar el array callLogs en el documento principal del cliente:
    const currentClientDoc = await clientDocRef.get(); // Re-fetch to ensure latest state
    const currentClientData = currentClientDoc.data(); // No cast here, let it be DocumentData
    
    // Ensure currentClientData is not null/undefined before accessing properties
    const currentClientDocumentData: IClientDocument = (currentClientData as any) as IClientDocument;

    const updatedCallLogs = [...(currentClientDocumentData.customerInteractions?.callLogs || []), callLog];

    await clientDocRef.update({ // Use clientDocRef (adminDb doc ref)
      'customerInteractions.callLogs': updatedCallLogs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Use admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📞 Llamada iniciada para cliente ${clientId} con ElevenLabs Call ID: ${elevenLabsCallId}`);

    return NextResponse.json({
      success: true,
      message: 'Llamada iniciada exitosamente',
      elevenLabsCallId: elevenLabsCallId,
      callLogId: elevenLabsCallId, // Usamos el ID de ElevenLabs como ID del log de Firebase también
    });

  } catch (error) {
    console.error('❌ Error al iniciar llamada:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        details: 'Error al iniciar llamada telefónica',
      },
      { status: 500 }
    );
  }
}
