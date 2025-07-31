/**
 * API ENDPOINT - BULK IMPORT LEADS
 * 
 * Endpoint para importar leads masivamente desde CSV
 * POST /api/leads/import/bulk
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { processCSVFile, validateCSVStructure, generateImportStats, ImportStats } from '@/modules/leads/utils/csvImporter';
import { ILead } from '@/modules/leads/types/leads';

interface BulkImportRequest {
  tenantId: string;
  organizationId: string;
  csvContent: string;
  dryRun?: boolean; // Si es true, solo valida sin importar
}

interface BulkImportResponse {
  success: boolean;
  data?: {
    importedCount: number;
    skippedCount: number;
    errors: string[];
    stats: ImportStats;
    leads?: ILead[]; // Solo en dry run
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BulkImportResponse>> {
  try {
    const body: BulkImportRequest = await request.json();
    const { tenantId, organizationId, csvContent, dryRun = false } = body;

    // Validación de parámetros requeridos
    if (!tenantId || !organizationId || !csvContent) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos: tenantId, organizationId, csvContent'
      }, { status: 400 });
    }

    // Validar estructura del CSV
    const validation = validateCSVStructure(csvContent);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Estructura de CSV inválida',
        data: {
          importedCount: 0,
          skippedCount: 0,
          errors: validation.errors,
          stats: {
            totalRows: 0,
            validLeads: 0,
            skippedRows: 0,
            statusDistribution: {
              new: 0, contacted: 0, interested: 0, qualified: 0, proposal: 0,
              negotiation: 0, won: 0, lost: 0, nurturing: 0, follow_up: 0, cold: 0
            },
            priorityDistribution: { low: 0, medium: 0, high: 0, urgent: 0 },
            sourceDistribution: {
              website: 0, social_media: 0, referral: 0, cold_call: 0,
              advertisement: 0, email: 0, event: 0, whatsapp: 0, other: 0
            }
          }
        }
      }, { status: 400 });
    }

    // Procesar CSV
    const processedLeads = processCSVFile(csvContent);
    const stats = generateImportStats(processedLeads);

    // Si es dry run, solo retornar la vista previa
    if (dryRun) {
      const leadsWithIds: ILead[] = processedLeads.map(lead => ({
        ...lead,
        id: `preview_${Math.random().toString(36).substr(2, 9)}`
      }));

      return NextResponse.json({
        success: true,
        data: {
          importedCount: 0,
          skippedCount: 0,
          errors: [],
          stats,
          leads: leadsWithIds.slice(0, 10) // Solo primeros 10 para preview
        }
      });
    }

    // Preparar referencia a la colección
    const leadsCollectionRef = adminDb
      .collection('tenants')
      .doc(tenantId)
      .collection('organizations')
      .doc(organizationId)
      .collection('leads');

    // Importar leads en batches (Firestore tiene límite de 500 operaciones por batch)
    const batch = adminDb.batch();
    const importedLeads: ILead[] = [];
    const errors: string[] = [];
    let batchCount = 0;
    const MAX_BATCH_SIZE = 450; // Dejar margen de seguridad

    for (const leadData of processedLeads) {
      try {
        // Generar ID único para el lead
        const leadRef = leadsCollectionRef.doc();
        const leadWithId: ILead = {
          ...leadData,
          id: leadRef.id
        };

        // Convertir timestamps para Firestore
        const firestoreData = {
          ...leadWithId,
          created_at: new Date(leadWithId.created_at._seconds * 1000),
          updated_at: new Date(leadWithId.updated_at._seconds * 1000),
          last_contact_date: leadWithId.last_contact_date 
            ? new Date(leadWithId.last_contact_date._seconds * 1000) 
            : null,
          next_follow_up_date: leadWithId.next_follow_up_date 
            ? new Date(leadWithId.next_follow_up_date._seconds * 1000) 
            : null,
          conversion_date: leadWithId.conversion_date 
            ? new Date(leadWithId.conversion_date._seconds * 1000) 
            : null
        };

        // Debug: mostrar datos que se van a guardar
        console.log(`💾 Guardando lead: ${firestoreData.name} - Status: ${firestoreData.status} - ID: ${firestoreData.id}`);
        
        batch.set(leadRef, firestoreData);
        importedLeads.push(leadWithId);
        batchCount++;

        // Ejecutar batch si alcanzamos el límite
        if (batchCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          // Crear nuevo batch
          const newBatch = adminDb.batch();
          Object.assign(batch, newBatch);
          batchCount = 0;
        }

      } catch (error) {
        console.error('Error procesando lead:', leadData.name, error);
        errors.push(`Error importando lead "${leadData.name}": ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    // Ejecutar batch final si tiene operaciones pendientes
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ Importación masiva completada: ${importedLeads.length} leads importados`);

    return NextResponse.json({
      success: true,
      data: {
        importedCount: importedLeads.length,
        skippedCount: processedLeads.length - importedLeads.length,
        errors,
        stats
      }
    });

  } catch (error) {
    console.error('❌ Error en importación masiva:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Método GET para obtener el template de CSV
export async function GET(): Promise<NextResponse> {
  const csvTemplate = `Etapa;Probabilidad;Activo;Moneda;MMR esperado;Equipo de ventas;Ganado/Perdido;Índice de Colores;Oportunidad;Ingresos esperados;Cliente;Etiquetas;Propiedades;Prioridad;Actividades;Decoración de Actividad de Excepción;Icono;Estado de la actividad;Resumen de la siguiente actividad;Icono de tipo de actvidad;Tipo de la siguiente actividad;Comercial;Propiedad 1
Nuevos Leads / Pendientes;25.5;VERDADERO;PAB;0.00;Ventas;Pendiente;0;Empresa Ejemplo S.A.;1500.00;Cliente Ejemplo;tag1,tag2;Propiedad ejemplo;Alta;Llamada de seguimiento;;;Planificado;Llamada de seguimiento;fa-check;Actividades pendientes;ventas@empresa.com;
Leads Potenciales / Prioritario;75.2;VERDADERO;PAB;0.00;Ventas;Pendiente;0;Juan Pérez;2500.00;;;;;Media;Envío de propuesta;;;Hoy;Envío de propuesta;fa-envelope;Correo electrónico;agente@empresa.com;`;

  return new NextResponse(csvTemplate, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="template_importacion_leads.csv"'
    }
  });
}