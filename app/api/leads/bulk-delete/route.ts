/**
 * API ENDPOINT - BULK DELETE LEADS
 * 
 * Endpoint para eliminar múltiples leads de forma masiva
 * POST /api/leads/bulk-delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface BulkDeleteRequest {
  leadIds: string[];
}

interface BulkDeleteResponse {
  success: boolean;
  data?: {
    deletedCount: number;
    errors: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BulkDeleteResponse>> {
  try {
    const body: BulkDeleteRequest = await request.json();
    const { leadIds } = body;

    console.log(`🗑️ ELIMINACIÓN MASIVA - Parámetros recibidos:`, {
      leadIds: leadIds?.length || 0,
      sampleIds: leadIds?.slice(0, 3)
    });

    // Validación de parámetros requeridos
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere un array de IDs de leads para eliminar'
      }, { status: 400 });
    }

    // Validar que no se excedan los límites razonables
    if (leadIds.length > 1000) {
      return NextResponse.json({
        success: false,
        error: 'No se pueden eliminar más de 1000 leads a la vez'
      }, { status: 400 });
    }

    let deletedCount = 0;
    const errors: string[] = [];

    try {
      console.log(`🚀 Iniciando eliminación masiva de ${leadIds.length} leads...`);
      
      // Verificar que los leads existen antes de eliminar
      const existingLeads = await prisma.lead.findMany({
        where: { 
          id: { 
            in: leadIds 
          } 
        },
        select: { id: true, name: true }
      });

      const existingIds = existingLeads.map(lead => lead.id);
      const nonExistentIds = leadIds.filter(id => !existingIds.includes(id));

      if (nonExistentIds.length > 0) {
        errors.push(`${nonExistentIds.length} leads no encontrados (pueden haber sido eliminados previamente)`);
        console.warn('⚠️ Leads no encontrados:', nonExistentIds.slice(0, 5));
      }

      if (existingIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            deletedCount: 0,
            errors: ['Ningún lead encontrado para eliminar']
          }
        });
      }

      // Eliminar leads en lotes para mejor rendimiento
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < existingIds.length; i += BATCH_SIZE) {
        const batch = existingIds.slice(i, i + BATCH_SIZE);
        
        try {
          const result = await prisma.lead.deleteMany({
            where: { 
              id: { 
                in: batch 
              } 
            }
          });
          
          deletedCount += result.count;
          console.log(`📦 Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${result.count} leads eliminados`);
          
        } catch (batchError) {
          console.error(`❌ Error en lote ${Math.floor(i/BATCH_SIZE) + 1}:`, batchError);
          errors.push(`Error eliminando lote ${Math.floor(i/BATCH_SIZE) + 1}: ${batchError instanceof Error ? batchError.message : 'Error desconocido'}`);
        }
      }

    } catch (error) {
      console.error('❌ Error en eliminación masiva:', error);
      errors.push(error instanceof Error ? error.message : 'Error interno del servidor');
    }

    console.log(`✅ Eliminación masiva completada:`);
    console.log(`   🗑️ ${deletedCount} leads eliminados exitosamente`);
    console.log(`   ⚠️ ${errors.length} errores encontrados`);
    
    if (deletedCount > 0) {
      console.log(`   🎯 Velocidad de eliminación: ~${Math.round(deletedCount / ((Date.now() - Date.now()) / 1000 + 1))} leads/segundo`);
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deletedCount,
        errors
      }
    });

  } catch (error) {
    console.error('❌ Error en eliminación masiva:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}

// Método para obtener información sobre límites de eliminación
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    maxLeadsPerBatch: 1000,
    batchSize: 100,
    supportedMethods: ['POST'],
    description: 'Endpoint para eliminación masiva de leads'
  });
}