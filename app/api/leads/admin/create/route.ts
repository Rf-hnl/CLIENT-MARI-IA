import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ILead, ILeadDocument, LeadStatus, LeadSource, LeadPriority } from '@/modules/leads/types/leads';

/**
 * CREATE LEAD API
 * 
 * Crea un nuevo lead en Firebase
 * Ruta: /tenants/{tenantId}/organizations/{organizationId}/leads
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, leadData } = body;

    if (!tenantId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'tenantId y organizationId son requeridos',
      }, { status: 400 });
    }

    if (!leadData) {
      return NextResponse.json({
        success: false,
        error: 'leadData es requerido',
      }, { status: 400 });
    }

    // Validar campos requeridos
    const requiredFields = ['name', 'phone', 'status', 'source'];
    for (const field of requiredFields) {
      if (!leadData[field]) {
        return NextResponse.json({
          success: false,
          error: `Campo requerido faltante: ${field}`,
        }, { status: 400 });
      }
    }

    // Construir la ruta
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadsCollectionRef = adminDb.collection(leadsPath);

    // Generar timestamp
    const now = adminDb.FieldValue.serverTimestamp();

    // Calcular score de calificación inicial
    let qualificationScore = 10; // Score base
    
    // Bonus por información completa
    if (leadData.email) qualificationScore += 10;
    if (leadData.company) qualificationScore += 15;
    if (leadData.position) qualificationScore += 10;
    if (leadData.interest_level) qualificationScore += (leadData.interest_level * 10);
    
    // Bonus por prioridad
    if (leadData.priority === 'urgent') qualificationScore += 20;
    else if (leadData.priority === 'high') qualificationScore += 15;
    else if (leadData.priority === 'medium') qualificationScore += 10;
    else qualificationScore += 5;

    // Bonus por fuente
    if (['referral', 'website'].includes(leadData.source)) qualificationScore += 10;
    else if (['social_media', 'advertisement'].includes(leadData.source)) qualificationScore += 5;

    qualificationScore = Math.min(100, qualificationScore);

    // Determinar si está calificado
    const isQualified = qualificationScore >= 60 || 
                       ['qualified', 'proposal', 'negotiation', 'won'].includes(leadData.status);

    // Crear datos completos del lead
    const completeLead: Omit<ILead, 'id'> = {
      // Campos del formulario
      ...leadData,
      
      // Asegurar que priority esté definido
      priority: leadData.priority || 'medium',
      
      // Campos calculados/automáticos
      qualification_score: qualificationScore,
      is_qualified: isQualified,
      contact_attempts: 0,
      response_rate: 0,
      converted_to_client: false,
      
      // Timestamps
      created_at: now,
      updated_at: now,
      
      // Campos opcionales con valores por defecto
      national_id: leadData.national_id || null,
      address: leadData.address || null,
      city: leadData.city || null,
      province: leadData.province || null,
      postal_code: leadData.postal_code || null,
      country: leadData.country || 'Panamá',
      budget_range: leadData.budget_range || null,
      decision_timeline: leadData.decision_timeline || null,
      assigned_agent_id: leadData.assigned_agent_id || null,
      assigned_agent_name: leadData.assigned_agent_name || null,
      client_id: null,
      conversion_date: null,
      conversion_value: null,
      last_contact_date: null,
      next_follow_up_date: null,
      qualification_notes: leadData.qualification_notes || null,
      internal_notes: leadData.internal_notes || null,
      tags: leadData.tags || []
    };

    // Crear documento con estructura compatible
    const leadDocument: Omit<ILeadDocument, 'id'> = {
      _data: completeLead,
      leadInteractions: {
        callLogs: [],
        emailRecords: [],
        whatsappRecords: [],
        meetingRecords: []
      }
    };

    // Crear el documento
    let docRef;
    if (leadData.customId && process.env.NEXT_PUBLIC_DEVELOPMENT === 'true') {
      // Solo en desarrollo, permitir ID personalizado
      docRef = leadsCollectionRef.doc(leadData.customId);
      await docRef.set(leadDocument);
    } else {
      // Generar ID automáticamente
      docRef = await leadsCollectionRef.add(leadDocument);
    }

    const leadId = docRef.id;

    // Preparar respuesta con el lead creado
    const createdLead: ILead = {
      id: leadId,
      ...completeLead
    };

    console.log(`✅ Lead creado: ${createdLead.name} (${leadId}) en ${leadsPath}`);

    return NextResponse.json({
      success: true,
      data: createdLead,
      leadId,
      path: leadsPath,
      message: `Lead "${createdLead.name}" creado exitosamente`,
    });

  } catch (error) {
    console.error("Error creando lead:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}