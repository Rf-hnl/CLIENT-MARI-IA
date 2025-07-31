import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * DELETE LEAD API
 * 
 * Elimina un lead específico de Firebase
 * Ruta: /tenants/{tenantId}/organizations/{organizationId}/leads/{leadId}
 */

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, tenantId, organizationId, leadId } = body;

    if (!uid || !tenantId || !organizationId || !leadId) {
      return NextResponse.json({
        success: false,
        error: 'uid, tenantId, organizationId y leadId son requeridos',
      }, { status: 400 });
    }

    // Construir la ruta
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadDocRef = adminDb.collection(leadsPath).doc(leadId);

    // Verificar que el lead existe antes de eliminar
    const leadDoc = await leadDocRef.get();
    if (!leadDoc.exists) {
      return NextResponse.json({
        success: false,
        error: `Lead con ID ${leadId} no encontrado`,
      }, { status: 404 });
    }

    // Obtener datos del lead para logging
    const leadData = leadDoc.data();
    const leadName = leadData?._data?.name || 'Lead sin nombre';
    const leadCompany = leadData?._data?.company || '';

    // Eliminar el documento
    await leadDocRef.delete();

    console.log(`🗑️ Lead eliminado: ${leadName}${leadCompany ? ` (${leadCompany})` : ''} (${leadId})`);
    console.log(`   Ruta: ${leadsPath}/${leadId}`);
    console.log(`   Eliminado por usuario: ${uid}`);

    return NextResponse.json({
      success: true,
      leadId,
      leadName,
      leadCompany,
      path: leadsPath,
      message: `Lead "${leadName}" eliminado exitosamente`,
    });

  } catch (error) {
    console.error("Error eliminando lead:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}