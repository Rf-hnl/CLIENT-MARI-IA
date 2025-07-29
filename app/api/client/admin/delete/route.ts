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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, organizationId, tenantId, clientId } = body;

    // Validar parámetros requeridos
    if (!uid || !organizationId || !tenantId || !clientId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos: uid, organizationId, tenantId, clientId' },
        { status: 400 }
      );
    }

    console.log(`[DELETE CLIENT] Deleting client ${clientId} for user ${uid}`);

    // Usar la misma estructura que la API GET
    const clientDocPath = `tenants/${tenantId}/organizations/${organizationId}/clients/${clientId}`;
    
    // Verificar que el cliente existe antes de eliminar
    const clientDoc = await db.doc(clientDocPath).get();
    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const clientData = clientDoc.data();
    console.log(`[DELETE CLIENT] Found client: ${clientData?.name || 'Unknown'}`);

    // Iniciar batch para eliminación atómica
    const batch = db.batch();

    // 1. Eliminar documento principal del cliente
    batch.delete(db.doc(clientDocPath));

    // 2. Eliminar subcolecciones relacionadas si existen
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
          console.log(`[DELETE CLIENT] Deleting ${subcollectionDocs.size} documents from ${subcollection}`);
          subcollectionDocs.forEach(doc => {
            batch.delete(doc.ref);
          });
        }
      } catch (subcollectionError) {
        console.warn(`[DELETE CLIENT] Warning deleting ${subcollection}:`, subcollectionError);
        // Continuar con otras subcolecciones aunque una falle
      }
    }

    // 3. customerInteractions está dentro del documento del cliente, no necesita eliminación separada
    // Se eliminará automáticamente con el documento principal
    console.log(`[DELETE CLIENT] customerInteractions will be deleted with main document`);

    // 4. Ejecutar eliminación atómica
    await batch.commit();

    console.log(`[DELETE CLIENT] Successfully deleted client ${clientId} and all related data`);

    return NextResponse.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      deletedClientId: clientId,
      deletedClientName: clientData?.name || 'Unknown'
    });

  } catch (error) {
    console.error('[DELETE CLIENT] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor al eliminar cliente',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}