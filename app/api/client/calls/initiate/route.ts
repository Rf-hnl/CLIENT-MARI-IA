
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';                // Para FieldValue
import { adminDb } from '@/lib/firebase/admin';    // Tu instancia de Firestore
import {
  IClientDocument,
  IClient,
  ICallLog
} from '@/modules/clients/types/clients';
import { ITenantElevenLabsConfig } from '@/types/elevenlabs';
import { ITenantElevenLabsAgent } from '@/types/agents';

interface InitiateCallRequestBody {
  clientId: string;
  tenantId: string;
  organizationId: string;
  agentId: string;    // ID del agente local
  callType: string;   // e.g. "overdue_payment"
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear body y validar
    const {
      clientId,
      tenantId,
      organizationId,
      agentId,
      callType
    } = (await request.json()) as InitiateCallRequestBody;

    if (!clientId || !tenantId || !organizationId || !agentId || !callType) {
      return NextResponse.json(
        {
          success: false,
          error: 'clientId, tenantId, organizationId, agentId y callType son requeridos'
        },
        { status: 400 }
      );
    }

    // 2. Obtener datos del cliente
    const clientPath = `tenants/${tenantId}/organizations/${organizationId}/clients/${clientId}`;
    const clientRef = adminDb.doc(clientPath);
    const clientSnap = await clientRef.get();

    if (!clientSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const clientDoc = clientSnap.data() as IClientDocument;
    if (!clientDoc._data) {
      return NextResponse.json(
        { success: false, error: 'Datos de cliente incompletos' },
        { status: 500 }
      );
    }
    const clientData = clientDoc._data as IClient;

    // 3. Cargar configuración de ElevenLabs
    const configPath = `tenants/${tenantId}/elevenlabs-config/settings`;
    const configSnap = await adminDb.doc(configPath).get();
    if (!configSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Configuración ElevenLabs no encontrada' },
        { status: 404 }
      );
    }
    const elevenLabsConfig = configSnap.data() as ITenantElevenLabsConfig;

    // 4. Obtener el agente local
    const agentPath = `tenants/${tenantId}/elevenlabs-agents/${agentId}`;
    const agentSnap = await adminDb.doc(agentPath).get();
    if (!agentSnap.exists) {
      return NextResponse.json(
        { success: false, error: `Agente no encontrado en ${agentPath}` },
        { status: 404 }
      );
    }
    const localAgent = agentSnap.data() as ITenantElevenLabsAgent;
    const elevenLabsAgentId = localAgent.elevenLabsConfig.agentId;
    if (!elevenLabsAgentId) {
      return NextResponse.json(
        { success: false, error: 'Falta el agent_id de ElevenLabs en el agente' },
        { status: 400 }
      );
    }

    // Helper para formatear número panameño
    function formatPanamaPhone(raw: string) {
      let digits = raw.replace(/\D/g, '');
      if (!digits.startsWith('507')) {
        if (digits.startsWith('0')) digits = digits.slice(1);
        digits = '507' + digits;
      }
      return `+${digits}`;
    }

    // 5. Preparar payload según la nueva documentación de ElevenLabs
    // CAMBIOS desde la versión anterior:
    // - conversation_initiation_client_data ahora va DENTRO de cada recipient
    // - dynamicVariables cambió a dynamic_variables (snake_case)
    // - Se eliminó max_duration (no existe en la nueva API)
    // - La respuesta ahora devuelve 'id' en lugar de 'call_id'
    const elevenLabsPayload = {
      call_name: `${callType} - ${clientData.name} - ${new Date().toISOString()}`,
      agent_id: elevenLabsAgentId,
      agent_phone_number_id: elevenLabsConfig.phoneId,
      scheduled_time_unix: 1,  // Lanza la llamada ya 
      // scheduled_time_unix: Math.floor(Date.now() / 1000),  // Lanza la llamada ya
      recipients: [
        {
          phone_number: formatPanamaPhone(clientData.phone),
          conversation_initiation_client_data: {
            dynamic_variables: {
              call_type: callType,  // Tipo de acción de llamada seleccionada
              phone: clientData.phone,
              name: clientData.name,
              company: clientData.employer || '',
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
              payment_date: clientData.payment_date
                ? new Date(clientData.payment_date._seconds * 1000).toISOString()
                : '',
              installment_amount: clientData.installment_amount,
              pending_installments: clientData.pending_installments,
              due_date: clientData.due_date
                ? new Date(clientData.due_date._seconds * 1000).toISOString()
                : '',
              loan_start_date: clientData.loan_start_date
                ? new Date(clientData.loan_start_date._seconds * 1000).toISOString()
                : '',
              days_overdue: clientData.days_overdue,
              last_payment_date: clientData.last_payment_date
                ? new Date(clientData.last_payment_date._seconds * 1000).toISOString()
                : '',
              last_payment_amount: clientData.last_payment_amount,
              credit_score: clientData.credit_score,
              risk_category: clientData.risk_category,
              credit_limit: clientData.credit_limit,
              available_credit: clientData.available_credit,
              employment_status: clientData.employment_status || '',
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
              tags: clientData.tags || []
            }
          }
        }
      ]
    };

    // 6. Llamada a la API de ElevenLabs
    const response = await fetch(
      'https://api.elevenlabs.io/v1/convai/batch-calling/submit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsConfig.apiKey
        },
        body: JSON.stringify(elevenLabsPayload)
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json(
        {
          success: false,
          error: 'Error al iniciar llamada en ElevenLabs',
          details: err
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    const callId = result.id; // Cambió de call_id a id según la nueva documentación
    if (!callId) {
      return NextResponse.json(
        {
          success: false,
          error: 'ElevenLabs no devolvió el ID de la llamada'
        },
        { status: 500 }
      );
    }

    // 7. Guardar el registro en Firestore
    const callLog: ICallLog = {
      id: callId,
      clientId,
      timestamp: admin.firestore.FieldValue.serverTimestamp() as any,
      callType,
      durationMinutes: 0,
      agentId: localAgent.id,
      outcome: 'initiated',
      audioUrl: '',
      transcription: '',
      elevenLabsJobId: callId,
      transcriptionStatus: 'pending'
    };

    console.log('📝 [CALL_LOG] Guardando callLog:', JSON.stringify(callLog, null, 2));

    // Actualizar el array de callLogs
    const clientLatestSnap = await clientRef.get();
    const clientDocumentData = clientLatestSnap.data();
    
    console.log('📄 [CLIENT_DOC] Estructura del documento cliente:');
    console.log('- Existe documento:', clientLatestSnap.exists);
    console.log('- Tiene _data:', !!clientDocumentData?._data);
    console.log('- Tiene customerInteractions:', !!clientDocumentData?.customerInteractions);
    console.log('- CallLogs existentes:', clientDocumentData?.customerInteractions?.callLogs?.length || 0);

    const existing = clientDocumentData?.customerInteractions?.callLogs as ICallLog[] || [];
    const updatedCallLogs = [...existing, callLog];

    console.log('🔄 [UPDATE] Actualizando con', updatedCallLogs.length, 'callLogs total');

    // Si no existe customerInteractions, necesitamos inicializarlo
    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (!clientDocumentData?.customerInteractions) {
      console.log('🆕 [INIT] Inicializando customerInteractions por primera vez');
      updateData.customerInteractions = {
        callLogs: updatedCallLogs,
        emailRecords: [],
        clientAIProfiles: null
      };
    } else {
      updateData['customerInteractions.callLogs'] = updatedCallLogs;
    }

    await clientRef.update(updateData);

    // Verificar que se guardó correctamente
    const verificationSnap = await clientRef.get();
    const verificationData = verificationSnap.data();
    const savedCallLogs = verificationData?.customerInteractions?.callLogs || [];
    const foundLog = savedCallLogs.find((log: ICallLog) => log.id === callId);

    if (foundLog) {
      console.log('✅ [SAVE_SUCCESS] CallLog guardado y verificado exitosamente con ID:', callId);
      console.log('📊 [VERIFICATION] Total callLogs en documento:', savedCallLogs.length);
    } else {
      console.error('❌ [SAVE_ERROR] CallLog NO se encontró después del guardado!');
      console.error('📄 [DEBUG] Datos guardados:', JSON.stringify(savedCallLogs, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: 'Llamada iniciada correctamente',
      callId
    });
  } catch (error) {
    console.error('Error al iniciar llamada:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      },
      { status: 500 }
    );
  }
}
