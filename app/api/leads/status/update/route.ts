import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { LeadStatus } from '@/modules/leads/types/leads';

/**
 * UPDATE LEAD STATUS API
 * 
 * API especializada para actualizar el status de un lead
 * Incluye lógica automática para cada tipo de status
 */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, leadId, status, notes, agentId } = body;

    if (!tenantId || !organizationId || !leadId || !status) {
      return NextResponse.json({
        success: false,
        error: 'tenantId, organizationId, leadId y status son requeridos',
      }, { status: 400 });
    }

    // Validar que el status es válido
    const validStatuses: LeadStatus[] = [
      'new', 'contacted', 'interested', 'qualified', 'proposal', 
      'negotiation', 'won', 'lost', 'nurturing', 'follow_up', 'cold'
    ];

    if (!validStatuses.includes(status as LeadStatus)) {
      return NextResponse.json({
        success: false,
        error: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`,
      }, { status: 400 });
    }

    // Construir la ruta
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadDocRef = adminDb.collection(leadsPath).doc(leadId);

    // Verificar que el lead existe
    const leadDoc = await leadDocRef.get();
    if (!leadDoc.exists) {
      return NextResponse.json({
        success: false,
        error: `Lead con ID ${leadId} no encontrado`,
      }, { status: 404 });
    }

    const currentData = leadDoc.data();
    const currentLead = currentData?._data;
    const previousStatus = currentLead?.status;

    if (previousStatus === status) {
      return NextResponse.json({
        success: true,
        message: `Lead ya tiene el status ${status}`,
        data: { id: leadId, ...currentLead }
      });
    }

    const now = adminDb.FieldValue.serverTimestamp();
    
    // Preparar actualizaciones según el nuevo status
    const updates: any = {
      status,
      updated_at: now
    };

    // Agregar notas si se proporcionan
    if (notes) {
      updates.notes = notes;
    }

    // Lógica específica por status
    switch (status as LeadStatus) {
      case 'contacted':
        updates.last_contact_date = now;
        updates.contact_attempts = (currentLead?.contact_attempts || 0) + 1;
        
        // Si es el primer contacto desde 'new'
        if (previousStatus === 'new') {
          console.log(`📞 Primer contacto con lead: ${currentLead?.name}`);
        }
        break;

      case 'interested':
        // Aumentar score si muestra interés
        updates.qualification_score = Math.min(100, (currentLead?.qualification_score || 0) + 10);
        updates.last_contact_date = now;
        break;

      case 'qualified':
        updates.is_qualified = true;
        updates.qualification_score = Math.max(60, currentLead?.qualification_score || 60);
        
        if (notes) {
          updates.qualification_notes = notes;
        }
        
        console.log(`✅ Lead calificado: ${currentLead?.name}`);
        break;

      case 'proposal':
        updates.is_qualified = true;
        updates.last_contact_date = now;
        
        // Programar seguimiento en 1 semana
        const proposalFollowUp = new Date();
        proposalFollowUp.setDate(proposalFollowUp.getDate() + 7);
        updates.next_follow_up_date = adminDb.Timestamp.fromDate(proposalFollowUp);
        
        console.log(`📋 Propuesta enviada a: ${currentLead?.name}`);
        break;

      case 'negotiation':
        updates.is_qualified = true;
        updates.last_contact_date = now;
        
        // Seguimiento más frecuente en negociación
        const negotiationFollowUp = new Date();
        negotiationFollowUp.setDate(negotiationFollowUp.getDate() + 3);
        updates.next_follow_up_date = adminDb.Timestamp.fromDate(negotiationFollowUp);
        
        console.log(`🤝 Lead en negociación: ${currentLead?.name}`);
        break;

      case 'won':
        updates.converted_to_client = true;
        updates.conversion_date = now;
        updates.is_qualified = true;
        updates.next_follow_up_date = null; // Ya no necesita seguimiento
        
        console.log(`🎉 Lead convertido: ${currentLead?.name} -> Cliente`);
        break;

      case 'lost':
        updates.converted_to_client = false;
        updates.next_follow_up_date = null;
        
        // Opcional: programar para revisión futura
        if (!notes?.includes('definitivo')) {
          const futureReview = new Date();
          futureReview.setMonth(futureReview.getMonth() + 6); // 6 meses después
          updates.next_follow_up_date = adminDb.Timestamp.fromDate(futureReview);
        }
        
        console.log(`❌ Lead perdido: ${currentLead?.name} - ${notes || 'Sin razón especificada'}`);
        break;

      case 'nurturing':
        // Seguimiento a largo plazo
        const nurturingFollowUp = new Date();
        nurturingFollowUp.setMonth(nurturingFollowUp.getMonth() + 1); // 1 mes
        updates.next_follow_up_date = adminDb.Timestamp.fromDate(nurturingFollowUp);
        
        console.log(`🌱 Lead en nutrición: ${currentLead?.name}`);
        break;

      case 'follow_up':
        // Seguimiento urgente
        const urgentFollowUp = new Date();
        urgentFollowUp.setDate(urgentFollowUp.getDate() + 2); // 2 días
        updates.next_follow_up_date = adminDb.Timestamp.fromDate(urgentFollowUp);
        
        console.log(`⏰ Lead requiere seguimiento: ${currentLead?.name}`);
        break;

      case 'cold':
        // Lead frío, seguimiento muy espaciado
        const coldFollowUp = new Date();
        coldFollowUp.setMonth(coldFollowUp.getMonth() + 3); // 3 meses
        updates.next_follow_up_date = adminDb.Timestamp.fromDate(coldFollowUp);
        
        console.log(`🧊 Lead marcado como frío: ${currentLead?.name}`);
        break;
    }

    // Actualizar en Firebase
    const updateData: any = {};
    Object.keys(updates).forEach(key => {
      updateData[`_data.${key}`] = updates[key];
    });

    await leadDocRef.update(updateData);

    // Obtener datos actualizados
    const updatedDoc = await leadDocRef.get();
    const updatedData = updatedDoc.data();
    const updatedLead = {
      id: leadId,
      ...updatedData?._data
    };

    // Log del cambio de status
    console.log(`🔄 Status actualizado: ${currentLead?.name}`);
    console.log(`   ${previousStatus} → ${status}`);
    if (notes) console.log(`   Notas: ${notes}`);
    if (agentId) console.log(`   Por agente: ${agentId}`);

    return NextResponse.json({
      success: true,
      data: updatedLead,
      statusChange: {
        from: previousStatus,
        to: status,
        timestamp: new Date().toISOString(),
        agentId: agentId || null,
        notes: notes || null
      },
      message: `Status actualizado de "${previousStatus}" a "${status}"`,
    });

  } catch (error) {
    console.error("Error actualizando status de lead:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}