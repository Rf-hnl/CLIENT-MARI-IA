import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { LeadStatus, LeadPriority } from '@/modules/leads/types/leads';

/**
 * BULK UPDATE LEADS API
 * 
 * Actualiza múltiples leads de Firebase en una operación batch
 * Útil para cambios masivos de status, asignación de agentes, etc.
 */

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, tenantId, organizationId, leadIds, updates } = body;

    if (!uid || !tenantId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'uid, tenantId y organizationId son requeridos',
      }, { status: 400 });
    }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'leadIds debe ser un array no vacío',
      }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'updates es requerido y no puede estar vacío',
      }, { status: 400 });
    }

    // Límite de seguridad
    if (leadIds.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'No se pueden actualizar más de 500 leads en una operación',
      }, { status: 400 });
    }

    // Construir la ruta
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadsCollection = adminDb.collection(leadsPath);

    console.log(`📝 Iniciando actualización masiva de ${leadIds.length} leads`);
    console.log(`   Usuario: ${uid}`);
    console.log(`   Ruta: ${leadsPath}`);
    console.log(`   Actualizaciones: ${Object.keys(updates).join(', ')}`);

    const now = adminDb.FieldValue.serverTimestamp();
    
    // Preparar actualizaciones base
    const baseUpdates: any = {
      ...updates,
      updated_at: now
    };

    // Lógica especial para cambios de status
    if (updates.status) {
      const newStatus = updates.status as LeadStatus;
      
      switch (newStatus) {
        case 'contacted':
          baseUpdates.last_contact_date = now;
          break;
          
        case 'qualified':
          baseUpdates.is_qualified = true;
          break;
          
        case 'won':
          baseUpdates.converted_to_client = true;
          baseUpdates.conversion_date = now;
          baseUpdates.is_qualified = true;
          break;
          
        case 'lost':
          baseUpdates.converted_to_client = false;
          break;
          
        case 'follow_up':
          if (!baseUpdates.next_follow_up_date) {
            const followUpDate = new Date();
            followUpDate.setDate(followUpDate.getDate() + 3);
            baseUpdates.next_follow_up_date = adminDb.Timestamp.fromDate(followUpDate);
          }
          break;
      }
    }

    // Procesar en batches de 500 (límite de Firestore)
    const batchSize = 500;
    const results: Array<{leadId: string, success: boolean, error?: string, leadName?: string}> = [];
    
    for (let i = 0; i < leadIds.length; i += batchSize) {
      const batchLeadIds = leadIds.slice(i, i + batchSize);
      const batch = adminDb.batch();
      
      for (const leadId of batchLeadIds) {
        try {
          const leadDocRef = leadsCollection.doc(leadId);
          
          // Verificar que el lead existe
          const leadDoc = await leadDocRef.get();
          if (!leadDoc.exists) {
            results.push({
              leadId,
              success: false,
              error: 'Lead no encontrado'
            });
            continue;
          }

          const leadData = leadDoc.data();
          const leadName = leadData?._data?.name || 'Lead sin nombre';

          // Preparar actualizaciones específicas para este lead
          const leadUpdates: any = {};
          Object.keys(baseUpdates).forEach(key => {
            leadUpdates[`_data.${key}`] = baseUpdates[key];
          });

          // Actualizar contact_attempts si cambiamos a contacted
          if (updates.status === 'contacted') {
            const currentAttempts = leadData?._data?.contact_attempts || 0;
            leadUpdates[`_data.contact_attempts`] = currentAttempts + 1;
          }

          batch.update(leadDocRef, leadUpdates);
          
          results.push({
            leadId,
            success: true,
            leadName
          });
          
        } catch (error) {
          results.push({
            leadId,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
      
      // Ejecutar el batch
      if (results.filter(r => r.success).length > 0) {
        await batch.commit();
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batchLeadIds.length} leads procesados`);
      }
    }

    // Calcular estadísticas
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`📊 Actualización masiva completada:`);
    console.log(`   ✅ Exitosos: ${successful.length}`);
    console.log(`   ❌ Fallidos: ${failed.length}`);
    console.log(`   📍 Total procesados: ${results.length}`);

    return NextResponse.json({
      success: true,
      results,
      updates: Object.keys(baseUpdates),
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successfulLeads: successful.map(r => ({ id: r.leadId, name: r.leadName })),
        failedLeads: failed.map(r => ({ id: r.leadId, error: r.error }))
      },
      path: leadsPath,
      message: `Actualización masiva completada: ${successful.length} exitosos, ${failed.length} fallidos`,
    });

  } catch (error) {
    console.error("Error en actualización masiva:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}