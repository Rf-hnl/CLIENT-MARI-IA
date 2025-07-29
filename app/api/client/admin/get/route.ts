import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { IClient, IClientDocument } from '@/modules/clients/types/clients';
// ele obejto es recibir por pamtreo el ide del tenet y ele id d ela organiacion y bucar een la ruta 
// /tenants/{teenantId/organizations/organizationId/clients trar todos los docuemntos de clientes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, organizationId } = body;

    if (!tenantId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'tenantId y organizationId son requeridos',
      }, { status: 400 });
    }

    // Construir la ruta: /tenants/{tenantId}/organizations/{organizationId}/clients
    const clientsPath = `tenants/${tenantId}/organizations/${organizationId}/clients`;
    const clientsCollectionRef = adminDb.collection(clientsPath);

    // Obtener todos los documentos de clientes
    const snapshot = await clientsCollectionRef.get();
    const clients: Record<string, IClient> = {};

    for (const doc of snapshot.docs) {
      const rawData = doc.data();
      
      // Check if document has new structure (IClientDocument) or old structure (direct IClient)
      if (rawData._data && rawData.customerInteractions !== undefined) {
        // New structure: IClientDocument with _data and customerInteractions
        const clientDocument = rawData as IClientDocument;
        clients[doc.id] = {
          id: doc.id,
          ...clientDocument._data,
          // Attach customerInteractions for compatibility if needed
          customerInteractions: clientDocument.customerInteractions
        } as IClient & { customerInteractions?: any };
      } else {
        // Old structure: Direct IClient data (backward compatibility)
        const clientData = rawData as Omit<IClient, 'id'>;
        clients[doc.id] = {
          id: doc.id,
          ...clientData
        };
      }
    }

    return NextResponse.json({
      success: true,
      path: clientsPath,
      data: clients,
      totalClients: snapshot.docs.length,
      tenantId,
      organizationId,
      message: `Se encontraron ${snapshot.docs.length} clientes en ${clientsPath}`,
    });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
