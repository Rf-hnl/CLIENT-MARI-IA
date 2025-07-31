import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ILead, ILeadDocument, LeadStatus } from '@/modules/leads/types/leads';

/**
 * UPDATE LEAD API
 * 
 * Actualiza un lead existente en Firebase
 * Ruta: /tenants/{tenantId}/organizations/{organizationId}/leads/{leadId}
 */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId, leadId, updates } = body;

    if (!tenantId || !organizationId || !leadId) {
      return NextResponse.json({
        success: false,
        error: 'tenantId, organizationId y leadId son requeridos',
      }, { status: 400 });
    }

    if (!updates) {
      return NextResponse.json({
        success: false,
        error: 'updates es requerido',
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

    // Obtener datos actuales
    const currentData = leadDoc.data() as ILeadDocument;
    const currentLead = currentData._data;

    // Preparar actualizaciones
    const now = adminDb.FieldValue.serverTimestamp();
    const updatedFields: any = {
      ...updates,
      updated_at: now
    };

    // Lógica especial para cambios de status
    if (updates.status && updates.status !== currentLead.status) {
      const newStatus = updates.status as LeadStatus;
      
      // Actualizar campos relacionados según el nuevo status
      switch (newStatus) {
        case 'contacted':
          if (!currentLead.last_contact_date) {
            updatedFields.last_contact_date = now;
          }
          updatedFields.contact_attempts = (currentLead.contact_attempts || 0) + 1;
          break;
          
        case 'qualified':
          updatedFields.is_qualified = true;
          if (updatedFields.qualification_score < 60) {
            updatedFields.qualification_score = Math.max(60, updatedFields.qualification_score || 60);
          }
          break;
          
        case 'won':
          updatedFields.converted_to_client = true;
          updatedFields.conversion_date = now;
          updatedFields.is_qualified = true;
          break;
          
        case 'lost':
          updatedFields.converted_to_client = false;
          break;
          
        case 'follow_up':
          if (!updatedFields.next_follow_up_date) {
            // Programar seguimiento en 3 días por defecto
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 3);
            updatedFields.next_follow_up_date = adminDb.Timestamp.fromDate(followUpDate);
          }
          break;
      }
    }

    // Recalcular qualification_score si es necesario
    if (updates.interest_level || updates.priority || updates.email || updates.company) {
      let newScore = currentLead.qualification_score || 10;
      
      // Ajustar por cambios específicos
      if (updates.interest_level && updates.interest_level !== currentLead.interest_level) {
        const oldBonus = (currentLead.interest_level || 0) * 10;
        const newBonus = updates.interest_level * 10;
        newScore = newScore - oldBonus + newBonus;
      }
      
      if (updates.priority && updates.priority !== currentLead.priority) {
        // Remover bonus anterior
        if (currentLead.priority === 'urgent') newScore -= 20;
        else if (currentLead.priority === 'high') newScore -= 15;
        else if (currentLead.priority === 'medium') newScore -= 10;
        else newScore -= 5;
        
        // Agregar nuevo bonus
        if (updates.priority === 'urgent') newScore += 20;
        else if (updates.priority === 'high') newScore += 15;
        else if (updates.priority === 'medium') newScore += 10;
        else newScore += 5;
      }
      
      // Bonus por completar información
      if (updates.email && !currentLead.email) newScore += 10;
      if (updates.company && !currentLead.company) newScore += 15;
      
      updatedFields.qualification_score = Math.min(100, Math.max(0, newScore));
      updatedFields.is_qualified = updatedFields.qualification_score >= 60 || 
                                  ['qualified', 'proposal', 'negotiation', 'won'].includes(updatedFields.status || currentLead.status);
    }

    // Actualizar en Firebase usando la estructura correcta
    const updateData: any = {};
    Object.keys(updatedFields).forEach(key => {
      updateData[`_data.${key}`] = updatedFields[key];
    });

    await leadDocRef.update(updateData);

    // Obtener datos actualizados para respuesta
    const updatedDoc = await leadDocRef.get();
    const updatedData = updatedDoc.data() as ILeadDocument;
    const updatedLead: ILead = {
      id: leadId,
      ...updatedData._data
    };

    console.log(`✅ Lead actualizado: ${updatedLead.name} (${leadId})`);
    console.log(`   Campos actualizados: ${Object.keys(updatedFields).join(', ')}`);

    return NextResponse.json({
      success: true,
      data: updatedLead,
      leadId,
      updatedFields: Object.keys(updatedFields),
      path: leadsPath,
      message: `Lead "${updatedLead.name}" actualizado exitosamente`,
    });

  } catch (error) {
    console.error("Error actualizando lead:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}