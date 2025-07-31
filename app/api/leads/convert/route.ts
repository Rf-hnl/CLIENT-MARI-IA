import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * CONVERT LEAD TO CLIENT API
 * 
 * Convierte un lead a cliente y opcionalmente crea el registro de cliente
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId, 
      organizationId, 
      leadId, 
      conversionValue, 
      clientData, 
      createClientRecord = false,
      notes 
    } = body;

    if (!tenantId || !organizationId || !leadId) {
      return NextResponse.json({
        success: false,
        error: 'tenantId, organizationId y leadId son requeridos',
      }, { status: 400 });
    }

    // Construir rutas
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const clientsPath = `tenants/${tenantId}/organizations/${organizationId}/clients`;
    
    const leadDocRef = adminDb.collection(leadsPath).doc(leadId);

    // Verificar que el lead existe
    const leadDoc = await leadDocRef.get();
    if (!leadDoc.exists) {
      return NextResponse.json({
        success: false,
        error: `Lead con ID ${leadId} no encontrado`,
      }, { status: 404 });
    }

    const leadData = leadDoc.data();
    const lead = leadData?._data;

    // Verificar que el lead no esté ya convertido
    if (lead?.converted_to_client) {
      return NextResponse.json({
        success: false,
        error: 'Este lead ya ha sido convertido a cliente',
        data: { 
          leadId, 
          clientId: lead.client_id,
          conversionDate: lead.conversion_date 
        }
      }, { status: 400 });
    }

    const now = adminDb.FieldValue.serverTimestamp();
    let clientId = null;

    // Crear registro de cliente si se solicita
    if (createClientRecord) {
      try {
        const clientsCollection = adminDb.collection(clientsPath);
        
        // Mapear datos del lead a estructura de cliente
        const newClientData = {
          // Campos requeridos para cliente
          name: lead?.name || '',
          national_id: lead?.national_id || '',
          phone: lead?.phone || '',
          debt: conversionValue || 0,
          status: 'current',
          loan_letter: `CONV-${Date.now()}`, // Generar número de préstamo
          
          // Campos de contacto
          email: lead?.email || null,
          address: lead?.address || null,
          city: lead?.city || null,
          province: lead?.province || null,
          postal_code: lead?.postal_code || null,
          country: lead?.country || 'Panamá',
          preferred_contact_method: lead?.preferred_contact_method || null,
          best_contact_time: lead?.best_contact_time || null,
          
          // Campos de empleo
          employment_status: null,
          employer: lead?.company || null,
          position: lead?.position || null,
          monthly_income: null,
          employment_verified: false,
          
          // Campos financieros (se calcularán automáticamente)
          payment_date: now,
          installment_amount: 0,
          pending_installments: 0,
          due_date: now,
          loan_start_date: now,
          days_overdue: 0,
          last_payment_date: null,
          last_payment_amount: 0,
          
          // Campos de análisis
          credit_score: Math.max(600, lead?.qualification_score ? lead.qualification_score * 8 : 600),
          risk_category: lead?.qualification_score >= 80 ? 'prime' : 
                       lead?.qualification_score >= 60 ? 'near-prime' : 'subprime',
          credit_limit: conversionValue ? conversionValue * 2 : 10000,
          available_credit: conversionValue || 5000,
          recovery_probability: lead?.qualification_score || 70,
          
          // Notas
          notes: notes || `Cliente convertido desde lead: ${lead?.name}`,
          internal_notes: `Conversión automática desde lead ${leadId}. Score original: ${lead?.qualification_score}`,
          
          // Tags
          tags: [...(lead?.tags || []), 'convertido-desde-lead'],
          
          // Campos de sistema
          created_at: now,
          updated_at: now,
          
          // Datos adicionales del cliente (usar valores por defecto)
          ...clientData
        };

        // Crear documento de cliente
        const clientDocument = {
          _data: newClientData,
          customerInteractions: {
            callLogs: [],
            emailRecords: [],
            clientAIProfiles: null
          }
        };

        const clientDocRef = await clientsCollection.add(clientDocument);
        clientId = clientDocRef.id;

        console.log(`👤 Cliente creado: ${newClientData.name} (${clientId})`);
        
      } catch (clientError) {
        console.error('Error creando cliente:', clientError);
        // Continuar con la conversión del lead aunque falle la creación del cliente
        console.log('Continuando con conversión de lead...');
      }
    }

    // Actualizar el lead como convertido
    const leadUpdates: any = {
      status: 'won',
      converted_to_client: true,
      conversion_date: now,
      conversion_value: conversionValue || null,
      client_id: clientId,
      is_qualified: true,
      next_follow_up_date: null, // Ya no necesita seguimiento como lead
      updated_at: now
    };

    if (notes) {
      leadUpdates.notes = notes;
    }

    // Actualizar en Firebase
    const updateData: any = {};
    Object.keys(leadUpdates).forEach(key => {
      updateData[`_data.${key}`] = leadUpdates[key];
    });

    await leadDocRef.update(updateData);

    // Obtener datos actualizados del lead
    const updatedLeadDoc = await leadDocRef.get();
    const updatedLeadData = updatedLeadDoc.data();
    const updatedLead = {
      id: leadId,
      ...updatedLeadData?._data
    };

    console.log(`🎉 Lead convertido exitosamente:`);
    console.log(`   Lead: ${lead?.name} (${leadId})`);
    console.log(`   Cliente: ${clientId || 'No creado'}`);
    console.log(`   Valor: $${conversionValue || 0}`);

    return NextResponse.json({
      success: true,
      data: {
        lead: updatedLead,
        clientId,
        conversionValue: conversionValue || null,
        conversionDate: new Date().toISOString()
      },
      paths: {
        leadPath: `${leadsPath}/${leadId}`,
        clientPath: clientId ? `${clientsPath}/${clientId}` : null
      },
      message: `Lead "${lead?.name}" convertido exitosamente${clientId ? ' y cliente creado' : ''}`,
    });

  } catch (error) {
    console.error("Error convirtiendo lead:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}