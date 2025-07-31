import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { ILead, ILeadDocument } from '@/modules/leads/types/leads';

/**
 * GET LEADS API
 * 
 * Obtiene todos los leads de un tenant/organización
 * Ruta: /tenants/{tenantId}/organizations/{organizationId}/leads
 */

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

    // Construir la ruta: /tenants/{tenantId}/organizations/{organizationId}/leads
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadsCollectionRef = adminDb.collection(leadsPath);

    // Obtener todos los documentos de leads
    const snapshot = await leadsCollectionRef.get();
    const leads: Record<string, ILead> = {};

    console.log(`🔍 Leyendo ${snapshot.docs.length} documentos de leads desde: ${leadsPath}`);

    for (const doc of snapshot.docs) {
      const rawData = doc.data();
      
      console.log(`📄 Documento ${doc.id}:`, {
        hasDataField: !!rawData._data,
        hasInteractions: !!rawData.leadInteractions,
        directFields: Object.keys(rawData).slice(0, 5),
        status: rawData.status || rawData._data?.status
      });
      
      // Check if document has new structure (ILeadDocument) or old structure (direct ILead)
      if (rawData._data && rawData.leadInteractions !== undefined) {
        // New structure: ILeadDocument with _data and leadInteractions
        console.log(`📋 Procesando estructura nueva para ${doc.id}`);
        const leadDocument = rawData as ILeadDocument;
        leads[doc.id] = {
          id: doc.id,
          ...leadDocument._data,
          // Attach leadInteractions for compatibility if needed
          leadInteractions: leadDocument.leadInteractions
        } as ILead & { leadInteractions?: any };
      } else {
        // Old structure: Direct ILead data (backward compatibility)
        console.log(`📋 Procesando estructura directa para ${doc.id}`);
        const leadData = rawData as Omit<ILead, 'id'>;
        leads[doc.id] = {
          id: doc.id,
          ...leadData
        };
      }
      
      console.log(`✅ Lead procesado: ${leads[doc.id].name} - Status: ${leads[doc.id].status}`);
    }

    // Calcular estadísticas básicas
    const totalLeads = snapshot.docs.length;
    const leadsArray = Object.values(leads);
    
    const stats = {
      total: totalLeads,
      byStatus: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      converted: leadsArray.filter(lead => lead.converted_to_client).length,
      totalValue: leadsArray.reduce((sum, lead) => sum + (lead.conversion_value || 0), 0)
    };

    // Contar por status, source y priority
    leadsArray.forEach(lead => {
      stats.byStatus[lead.status] = (stats.byStatus[lead.status] || 0) + 1;
      stats.bySource[lead.source] = (stats.bySource[lead.source] || 0) + 1;
      stats.byPriority[lead.priority] = (stats.byPriority[lead.priority] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      path: leadsPath,
      data: leads,
      stats,
      totalLeads,
      tenantId,
      organizationId,
      message: `Se encontraron ${totalLeads} leads en ${leadsPath}`,
    });
  } catch (error) {
    console.error("Error obteniendo leads:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}