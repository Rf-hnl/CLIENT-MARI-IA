import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

interface BulkDeleteResult {
  clientId: string;
  clientName: string;
  success: boolean;
  error?: string;
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, organizationId, tenantId, clientIds } = body;

    // Validar parámetros requeridos
    if (!uid || !organizationId || !tenantId || !clientIds || !Array.isArray(clientIds)) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: uid, organizationId, tenantId, clientIds (array)' },
        { status: 400 }
      );
    }

    if (clientIds.length === 0) {
      return NextResponse.json(
        { error: 'La lista de clientIds no puede estar vacía' },
        { status: 400 }
      );
    }

    console.log(`[BULK DELETE] Deleting ${clientIds.length} clients for user ${uid}`);
    console.log(`[BULK DELETE] Using path structure: tenants/${tenantId}/organizations/${organizationId}/clients`);
    console.log(`[BULK DELETE] Client IDs to delete:`, clientIds);

    const results: BulkDeleteResult[] = [];
    // Usar la misma estructura que la API GET
    const basePath = `tenants/${tenantId}/organizations/${organizationId}/clients`;

    // Procesar cada cliente individualmente
    for (const clientId of clientIds) {
      try {
        const clientDocPath = `${basePath}/${clientId}`;
        console.log(`[BULK DELETE] Checking client path: ${clientDocPath}`);
        
        // Verificar que el cliente existe
        const clientDoc = await db.doc(clientDocPath).get();
        if (!clientDoc.exists) {
          console.log(`[BULK DELETE] Client not found at path: ${clientDocPath}`);
          results.push({
            clientId,
            clientName: 'Desconocido',
            success: false,
            error: `Cliente no encontrado en ${clientDocPath}`
          });
          continue;
        }

        const clientData = clientDoc.data();
        const clientName = clientData?.name || 'Desconocido';

        // Crear batch para eliminación atómica por cliente
        const batch = db.batch();

        // 1. Eliminar documento principal del cliente
        batch.delete(db.doc(clientDocPath));

        // 2. Eliminar subcolecciones relacionadas
        const subcollections = [
          'callLogs',
          'emailRecords', 
          'whatsappRecords',
          'paymentHistory',
          'interactionHistory'
        ];

        for (const subcollection of subcollections) {
          try {
            const subcollectionRef = db.collection(`${clientDocPath}/${subcollection}`);
            const subcollectionDocs = await subcollectionRef.get();
            
            if (!subcollectionDocs.empty) {
              subcollectionDocs.forEach(doc => {
                batch.delete(doc.ref);
              });
            }
          } catch (subcollectionError) {
            console.warn(`[BULK DELETE] Warning deleting ${subcollection} for ${clientId}:`, subcollectionError);
          }
        }

        // 3. customerInteractions está dentro del documento del cliente, no necesita eliminación separada
        // Se eliminará automáticamente con el documento principal
        console.log(`[BULK DELETE] customerInteractions will be deleted with main document`);

        // 4. Ejecutar eliminación atómica para este cliente
        await batch.commit();

        results.push({
          clientId,
          clientName,
          success: true
        });

        console.log(`[BULK DELETE] Successfully deleted client ${clientId} (${clientName})`);

      } catch (clientError) {
        console.error(`[BULK DELETE] Error deleting client ${clientId}:`, clientError);
        results.push({
          clientId,
          clientName: 'Desconocido',
          success: false,
          error: clientError instanceof Error ? clientError.message : 'Error desconocido'
        });
      }
    }

    // Estadísticas finales
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`[BULK DELETE] Completed: ${successCount} successful, ${failureCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Eliminación masiva completada: ${successCount} exitosas, ${failureCount} fallidas`,
      totalProcessed: results.length,
      successCount,
      failureCount,
      results
    });

  } catch (error) {
    console.error('[BULK DELETE] Critical error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error crítico del servidor durante eliminación masiva',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}