import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * BULK DELETE LEADS API
 * 
 * Elimina múltiples leads de Firebase en una operación batch
 */

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, tenantId, organizationId, leadIds } = body;

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

    // Límite de seguridad para operaciones batch
    if (leadIds.length > 500) {
      return NextResponse.json({
        success: false,
        error: 'No se pueden eliminar más de 500 leads en una operación',
      }, { status: 400 });
    }

    // Construir la ruta
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadsCollection = adminDb.collection(leadsPath);

    console.log(`🗑️ Iniciando eliminación masiva de ${leadIds.length} leads`);
    console.log(`   Usuario: ${uid}`);
    console.log(`   Ruta: ${leadsPath}`);

    // Procesar en batches de 500 (límite de Firestore)
    const batchSize = 500;
    const results: Array<{leadId: string, success: boolean, error?: string, leadName?: string}> = [];
    
    for (let i = 0; i < leadIds.length; i += batchSize) {
      const batchLeadIds = leadIds.slice(i, i + batchSize);
      const batch = adminDb.batch();
      
      // Primero obtener los documentos para logging
      const docsToDelete: Array<{ref: any, name: string}> = [];
      
      for (const leadId of batchLeadIds) {
        try {
          const leadDocRef = leadsCollection.doc(leadId);
          const leadDoc = await leadDocRef.get();
          
          if (leadDoc.exists) {
            const leadData = leadDoc.data();
            const leadName = leadData?._data?.name || 'Lead sin nombre';
            docsToDelete.push({ ref: leadDocRef, name: leadName });
            batch.delete(leadDocRef);
            
            results.push({
              leadId,
              success: true,
              leadName
            });
          } else {
            results.push({
              leadId,
              success: false,
              error: 'Lead no encontrado'
            });
          }
        } catch (error) {
          results.push({
            leadId,
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }
      
      // Ejecutar el batch si hay documentos para eliminar
      if (docsToDelete.length > 0) {
        await batch.commit();
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${docsToDelete.length} leads eliminados`);
        docsToDelete.forEach(doc => {
          console.log(`      • ${doc.name}`);
        });
      }
    }

    // Calcular estadísticas
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`📊 Eliminación masiva completada:`);
    console.log(`   ✅ Exitosos: ${successful.length}`);
    console.log(`   ❌ Fallidos: ${failed.length}`);
    console.log(`   📍 Total procesados: ${results.length}`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
        successfulLeads: successful.map(r => ({ id: r.leadId, name: r.leadName })),
        failedLeads: failed.map(r => ({ id: r.leadId, error: r.error }))
      },
      path: leadsPath,
      message: `Eliminación masiva completada: ${successful.length} exitosos, ${failed.length} fallidos`,
    });

  } catch (error) {
    console.error("Error en eliminación masiva:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}