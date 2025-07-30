
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

// Función helper para guardar callLogs
async function saveCallLog(clientRef: admin.firestore.DocumentReference, callLog: ICallLog) {
  console.log('📝 [SAVE_CALL_LOG] Guardando callLog:', JSON.stringify(callLog, null, 2));

  // Obtener documento actual
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
  const foundLog = savedCallLogs.find((log: ICallLog) => log.id === callLog.id);

  if (foundLog) {
    console.log('✅ [SAVE_SUCCESS] CallLog guardado y verificado exitosamente con ID:', callLog.id);
    console.log('📊 [VERIFICATION] Total callLogs en documento:', savedCallLogs.length);
  } else {
    console.error('❌ [SAVE_ERROR] CallLog NO se encontró después del guardado!');
    console.error('📄 [DEBUG] Datos guardados:', JSON.stringify(savedCallLogs, null, 2));
  }
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

    // 5. Preparar payload según la documentación de ElevenLabs para batch calling
    // ENDPOINT CORRECTO: /v1/convai/batch-calling/submit (usado para llamadas individuales y batch)
    // - agent_phone_number_id es correcto para batch calling
    // - conversation_initiation_client_data con dynamic_variables
    // - recipients array con un solo recipient para llamada individual
    const elevenLabsPayload = {
      call_name: `${callType} - ${clientData.name} - ${new Date().toISOString()}`,
      agent_id: elevenLabsAgentId,
      agent_phone_number_id: elevenLabsConfig.phoneId,
      scheduled_time_unix: 5,
      recipients: [
        {
          phone_number: formatPanamaPhone(clientData.phone),
          conversation_initiation_client_data: {
            dynamic_variables: {
              call_type: callType,  // Tipo de acción de llamada seleccionada
              phone: clientData.phone,
              name: clientData.name,
              company: process.env.COMPANY_NAME || 'HYPERNOVA LABS',
              company_employer: clientData.employer || '',
              email: clientData.email || '',
              national_id: clientData.national_id,
              address: clientData.address || '',
              city: clientData.city || '',
              province: clientData.province || '',
              postal_code: clientData.postal_code || '',
              country: clientData.country || '',
              debt: clientData.debt.toString(),
              status: clientData.status,
              loan_letter: clientData.loan_letter,
              payment_date: clientData.payment_date
                ? new Date(clientData.payment_date._seconds * 1000).toISOString()
                : '',
              installment_amount: clientData.installment_amount.toString(),
              pending_installments: clientData.pending_installments.toString(),
              due_date: clientData.due_date
                ? new Date(clientData.due_date._seconds * 1000).toISOString()
                : '',
              loan_start_date: clientData.loan_start_date
                ? new Date(clientData.loan_start_date._seconds * 1000).toISOString()
                : '',
              days_overdue: clientData.days_overdue.toString(),
              last_payment_date: clientData.last_payment_date
                ? new Date(clientData.last_payment_date._seconds * 1000).toISOString()
                : '',
              last_payment_amount: clientData.last_payment_amount.toString(),
              credit_score: clientData.credit_score.toString(),
              risk_category: clientData.risk_category,
              credit_limit: clientData.credit_limit.toString(),
              available_credit: clientData.available_credit.toString(),
              employment_status: clientData.employment_status || '',
              position: clientData.position || '',
              monthly_income: clientData.monthly_income ? clientData.monthly_income.toString() : '0',
              employment_verified: clientData.employment_verified ? 'true' : 'false',
              preferred_contact_method: clientData.preferred_contact_method || '',
              best_contact_time: clientData.best_contact_time || '',
              response_score: clientData.response_score ? clientData.response_score.toString() : '0',
              recovery_probability: clientData.recovery_probability.toString(),
              collection_strategy: clientData.collection_strategy || '',
              notes: clientData.notes || '',
              internal_notes: clientData.internal_notes || '',
              tags: clientData.tags ? clientData.tags.join(', ') : ''
            }
          }
        }
      ]
    };

    // =====================================================================
    // 🚀 ELEVENLABS API REQUEST - DEBUGGING INFORMATION
    // =====================================================================
    console.log('');
    console.log('='.repeat(80));
    console.log('🚀 INICIANDO LLAMADA A ELEVENLABS API');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('📍 ENDPOINT:');
    console.log('   URL: https://api.elevenlabs.io/v1/convai/batch-calling/submit');
    console.log('   Method: POST');
    console.log('');
    
    console.log('🔑 CONFIGURACIÓN:');
    console.log('   Agent ID:', elevenLabsAgentId);
    console.log('   Phone ID:', elevenLabsConfig.phoneId);
    console.log('   API Key:', elevenLabsConfig.apiKey ? `${elevenLabsConfig.apiKey.substring(0, 8)}...` : 'NO CONFIGURADA');
    console.log('');
    
    console.log('📞 DATOS DEL CLIENTE:');
    console.log('   Nombre:', clientData.name);
    console.log('   Teléfono original:', clientData.phone);
    console.log('   Teléfono formateado:', formatPanamaPhone(clientData.phone));
    console.log('   ID Nacional:', clientData.national_id);
    console.log('   Deuda:', clientData.debt);
    console.log('   Tipo de llamada:', callType);
    console.log('');
    
    console.log('📦 PAYLOAD COMPLETO ENVIADO A ELEVENLABS:');
    console.log('-'.repeat(50));
    console.log(JSON.stringify(elevenLabsPayload, null, 2));
    console.log('-'.repeat(50));
    console.log('');

    // 6. Llamada a la API de ElevenLabs (ENDPOINT BATCH CALLING)
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

    // =====================================================================
    // 📥 ELEVENLABS API RESPONSE - DEBUGGING INFORMATION
    // =====================================================================
    console.log('='.repeat(80));
    console.log('📥 RESPUESTA DE ELEVENLABS API');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('📊 STATUS:');
    console.log('   Status Code:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('   OK:', response.ok);
    console.log('');
    
    console.log('📋 HEADERS:');
    const headers = Object.fromEntries(response.headers.entries());
    Object.entries(headers).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('');

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'No se pudo parsear respuesta de error' }));
      
      console.log('❌ ERROR DE ELEVENLABS:');
      console.log('-'.repeat(50));
      console.log('Status Code:', response.status);
      console.log('Error Body:');
      console.log(JSON.stringify(err, null, 2));
      console.log('-'.repeat(50));
      console.log('');
      
      // Guardar llamada fallida en callLogs
      const failedCallLog: ICallLog = {
        id: `failed_${Date.now()}_${clientId}`,
        clientId,
        timestamp: new Date(),
        callType,
        durationMinutes: 0,
        agentId: localAgent.id,
        outcome: 'failed',
        audioUrl: '',
        transcription: '',
        elevenLabsJobId: '',
        transcriptionStatus: 'failed',
        notes: `Error ElevenLabs (${response.status}): ${JSON.stringify(err)}`
      };

      console.log('💾 [FAILED_CALL] Guardando llamada fallida:', JSON.stringify(failedCallLog, null, 2));
      
      // Guardar la llamada fallida
      await saveCallLog(clientRef, failedCallLog);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Error al iniciar llamada en ElevenLabs',
          details: err,
          statusCode: response.status,
          statusText: response.statusText
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('✅ RESPUESTA EXITOSA DE ELEVENLABS:');
    console.log('-'.repeat(50));
    console.log('Response Body Completo:');
    console.log(JSON.stringify(result, null, 2));
    console.log('-'.repeat(50));
    console.log('');
    
    const callId = result.id; // Para batch calling, ElevenLabs devuelve id del batch job
    console.log('🔍 EXTRACCIÓN DE CALL ID:');
    console.log('   Campo buscado: id (batch job id)');
    console.log('   Valor extraído:', callId);
    console.log('   Tipo:', typeof callId);
    console.log('');
    
    if (!callId) {
      // Guardar llamada fallida por falta de ID
      const failedCallLog: ICallLog = {
        id: `no_id_${Date.now()}_${clientId}`,
        clientId,
        timestamp: new Date(),
        callType,
        durationMinutes: 0,
        agentId: localAgent.id,
        outcome: 'failed',
        audioUrl: '',
        transcription: '',
        elevenLabsJobId: '',
        transcriptionStatus: 'failed',
        notes: 'ElevenLabs no devolvió el ID de la llamada'
      };

      console.log('❌ [NO_ID_CALL] Guardando llamada sin ID:', JSON.stringify(failedCallLog, null, 2));
      
      // Guardar la llamada fallida
      await saveCallLog(clientRef, failedCallLog);
      
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
      timestamp: new Date(),
      callType,
      durationMinutes: 0,
      agentId: localAgent.id,
      outcome: 'initiated',
      audioUrl: '',
      transcription: '',
      elevenLabsJobId: callId,
      transcriptionStatus: 'pending'
    };

    // Guardar usando la función helper
    await saveCallLog(clientRef, callLog);

    return NextResponse.json({
      success: true,
      message: 'Llamada iniciada correctamente',
      callId
    });
  } catch (error) {
    console.error('Error al iniciar llamada:', error);
    
    // Intentar guardar el error si tenemos suficiente información
    try {
      const body = await request.clone().json();
      const { clientId, tenantId, organizationId, agentId, callType } = body;
      
      if (clientId && tenantId && organizationId && agentId && callType) {
        const clientPath = `tenants/${tenantId}/organizations/${organizationId}/clients/${clientId}`;
        const clientRef = adminDb.doc(clientPath);
        
        // Obtener el agente para el log
        const agentPath = `tenants/${tenantId}/elevenlabs-agents/${agentId}`;
        const agentSnap = await adminDb.doc(agentPath).get();
        const localAgent = agentSnap.data() as ITenantElevenLabsAgent;
        
        const errorCallLog: ICallLog = {
          id: `error_${Date.now()}_${clientId}`,
          clientId,
          timestamp: new Date(),
          callType,
          durationMinutes: 0,
          agentId: localAgent?.id || agentId,
          outcome: 'failed',
          audioUrl: '',
          transcription: '',
          elevenLabsJobId: '',
          transcriptionStatus: 'failed',
          notes: `Error interno: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };

        console.log('💥 [ERROR_CALL] Guardando llamada con error interno:', JSON.stringify(errorCallLog, null, 2));
        await saveCallLog(clientRef, errorCallLog);
      }
    } catch (saveError) {
      console.error('❌ [SAVE_ERROR] No se pudo guardar el error de llamada:', saveError);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      },
      { status: 500 }
    );
  }
}
