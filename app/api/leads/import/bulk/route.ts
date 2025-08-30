/**
 * API ENDPOINT - BULK IMPORT LEADS (PostgreSQL/Prisma Version)
 * 
 * Endpoint para importar leads masivamente desde CSV
 * POST /api/leads/import/bulk
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processCSVFile, processCSVFileWithMapping, validateCSVStructure, generateImportStats, ImportStats } from '@/modules/leads/utils/csvImporter';
import { LeadPriority, LeadSource, LeadStatus } from '@/modules/leads/types/leads';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

interface BulkImportRequest {
  tenantId: string;
  organizationId: string;
  csvContent: string;
  columnMapping?: Record<string, string>; // Mapeo de campos del sistema a columnas CSV
  dryRun?: boolean; // Si es true, solo valida sin importar
}

// Preview type aligned to the PostgreSQL shape produced by csv importer (Dates, not Firebase timestamps)
interface LeadPreview {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  position?: string;
  qualification_score: number;
  is_qualified: boolean;
  qualification_notes?: string;
  contact_attempts: number;
  response_rate: number;
  converted_to_client: boolean;
  conversion_value?: number;
  conversion_date?: Date | null;
  notes?: string;
  internal_notes?: string;
  // tags field removed - not supported in current schema
  assigned_agent_name?: string;
  preferred_contact_method?: 'whatsapp' | 'phone' | 'email';
  last_contact_date?: Date | null;
  next_follow_up_date?: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface BulkImportResponse {
  success: boolean;
  data?: {
    importedCount: number;
    skippedCount: number;
    errors: string[];
    stats: ImportStats;
    leads?: LeadPreview[]; // Solo en dry run
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BulkImportResponse>> {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['leads:import'],
      rateLimitConfig: {
        maxRequests: 10, // 10 bulk imports per hour
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;
    const body: BulkImportRequest = await request.json();
    const { tenantId, organizationId, csvContent, columnMapping, dryRun = false } = body;

    // Validate tenant access against API key
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json({
        success: false,
        error: tenantValidation.error
      } as BulkImportResponse, { status: 403 });
    }

    console.log(`🔍 IMPORTACIÓN - Parámetros recibidos:`, {
      tenantId,
      organizationId,
      dryRun,
      csvLength: csvContent?.length || 0,
      hasColumnMapping: !!columnMapping,
      mappedFields: columnMapping ? Object.keys(columnMapping).length : 0
    });

    // Validación de parámetros requeridos
    if (!tenantId || !organizationId || !csvContent) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos: tenantId, organizationId, csvContent'
      }, { status: 400 });
    }

    // Verificar que la organización existe
    const organization = await prisma.organization.findFirst({
      where: { id: organizationId, tenantId }
    });

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: 'Organización no encontrada'
      }, { status: 404 });
    }

    // Validar estructura del CSV con mapeo inteligente
    const validation = validateCSVStructure(csvContent);
    if (!validation.isValid) {
      console.log('❌ Validación de CSV falló:', validation.errors);
      if (validation.suggestions) {
        console.log('💡 Sugerencias:', validation.suggestions);
      }
      
      return NextResponse.json({
        success: false,
        error: 'Estructura de CSV inválida',
        data: {
          importedCount: 0,
          skippedCount: 0,
          errors: validation.errors,
          suggestions: validation.suggestions,
          stats: {
            totalRows: 0,
            validLeads: 0,
            skippedRows: 0,
            statusDistribution: {
              new: 0, interested: 0, qualified: 0, follow_up: 0,
              proposal_current: 0, proposal_previous: 0, negotiation: 0,
              won: 0, lost: 0, nurturing: 0, cold: 0
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
    
    // Log de éxito en validación
    if (validation.suggestions && validation.suggestions.length > 0) {
      console.log('✅ CSV validado con mapeo inteligente:', validation.suggestions);
    }

    // Procesar CSV con mapeo de columnas si está disponible
    const { leads: processedLeads, totalRows, skippedRows } = columnMapping 
      ? processCSVFileWithMapping(csvContent, columnMapping)
      : processCSVFile(csvContent);
    const stats = generateImportStats(processedLeads, totalRows, skippedRows);

    // Si es dry run, solo retornar la vista previa
    if (dryRun) {
      const leadsWithIds: LeadPreview[] = processedLeads.map(lead => ({
        ...lead,
        id: `preview_${Math.random().toString(36).substring(2, 11)}`
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

    console.log(`📁 IMPORTACIÓN - Guardando ${processedLeads.length} leads en PostgreSQL`);
    
    // Debug: Check what's in processedLeads
    console.log('🔍 [DEBUG] First processed lead:', processedLeads[0]);
    
    // Preparar datos para importación masiva
    const now = new Date();
    const bulkLeadData = processedLeads.map(leadData => {
      // Remove tags field if it exists
      const { tags, ...cleanLeadData } = leadData as any;
      return {
        tenantId,
        organizationId,
        name: cleanLeadData.name,
        phone: cleanLeadData.phone,
        email: cleanLeadData.email,
        company: cleanLeadData.company,
        source: cleanLeadData.source,
        status: cleanLeadData.status,
        priority: cleanLeadData.priority,
        position: cleanLeadData.position,
        qualificationScore: cleanLeadData.qualification_score || 0,
        isQualified: cleanLeadData.is_qualified || false,
        qualificationNotes: cleanLeadData.qualification_notes,
        contactAttempts: cleanLeadData.contact_attempts || 0,
        responseRate: cleanLeadData.response_rate || 0,
        convertedToClient: cleanLeadData.converted_to_client || false,
        conversionValue: cleanLeadData.conversion_value,
        conversionDate: cleanLeadData.conversion_date instanceof Date ? cleanLeadData.conversion_date : null,
        notes: cleanLeadData.notes,
        internalNotes: cleanLeadData.internal_notes,
        // tags field removed - not supported in current schema
        assignedAgentName: cleanLeadData.assigned_agent_name,
        lastContactDate: cleanLeadData.last_contact_date instanceof Date ? cleanLeadData.last_contact_date : null,
        nextFollowUpDate: cleanLeadData.next_follow_up_date instanceof Date ? cleanLeadData.next_follow_up_date : null,
        preferredContactMethod: cleanLeadData.preferred_contact_method,
        createdAt: now,
        updatedAt: now
      };
    });

    // Importación masiva optimizada
    let importedCount = 0;
    const errors: string[] = [];

    try {
      console.log(`🚀 Iniciando importación masiva de ${bulkLeadData.length} leads...`);
      
      // Usar createMany para importación rápida
      const result = await prisma.lead.createMany({
        data: bulkLeadData,
        skipDuplicates: true // Saltar duplicados si existen
      });

      importedCount = result.count;
      console.log(`✅ Importación masiva exitosa: ${importedCount} leads guardados`);

    } catch (error) {
      console.error('❌ Error en importación masiva:', error);
      
      // Fallback: importar de a lotes pequeños si falla la importación masiva
      console.log('🔄 Intentando importación por lotes...');
      const BATCH_SIZE = 50;
      
      for (let i = 0; i < bulkLeadData.length; i += BATCH_SIZE) {
        const batch = bulkLeadData.slice(i, i + BATCH_SIZE);
        
        try {
          const batchResult = await prisma.lead.createMany({
            data: batch,
            skipDuplicates: true
          });
          
          importedCount += batchResult.count;
          console.log(`📦 Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${batchResult.count} leads guardados`);
          
        } catch (batchError) {
          console.error(`❌ Error en lote ${Math.floor(i/BATCH_SIZE) + 1}:`, batchError);
          errors.push(`Error en lote ${Math.floor(i/BATCH_SIZE) + 1}: ${batchError instanceof Error ? batchError.message : 'Error desconocido'}`);
        }
      }
    }

    console.log(`✅ Importación masiva completada:`);
    console.log(`   📊 ${importedCount} leads importados exitosamente`);
    console.log(`   📁 Guardados en PostgreSQL para tenant: ${tenantId}, org: ${organizationId}`);
    console.log(`   ⚠️ ${errors.length} errores encontrados`);
    
    if (importedCount > 0) {
      console.log(`   🎯 Velocidad de importación: ~${Math.round(importedCount / ((Date.now() - Date.now()) / 1000 + 1))} leads/segundo`);
    }

    return NextResponse.json({
      success: true,
      data: {
        importedCount: importedCount,
        skippedCount: processedLeads.length - importedCount,
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
  const csvTemplate = `Oportunidad;Etapa;Probabilidad;Prioridad;Comercial;Ingresos esperados;Equipo de ventas;Etiquetas;Actividades;Propiedades;Cliente
Restaurante Los Arcos;Nuevos Leads / Pendientes;25.5;Alta;+507-6000-1234;1500.00;Ventas;restaurante,cliente-nuevo;Llamada inicial programada;Interesado en sistema de punto de venta;Juan Pérez - Propietario +507-6000-1234
Clínica Dental Salud;Leads Potenciales / Prioritario;75.0;Alta;+507-6000-5678;3500.00;Ventas;salud,prioritario;Propuesta enviada;Necesita integración con software médico;Dr. María González +507-6000-5678
Supermercado Central;Calificado - En seguimiento;60.0;Media;+507-6000-9012;2800.00;Ventas;retail,seguimiento;Reunión programada;Evaluando múltiples proveedores;Carlos Mendoza +507-6000-9012
Taller Mecánico Express;En seguimiento / Sin respuesta;40.0;Media;+507-6000-3456;1200.00;Ventas;automotriz;Llamadas sin respuesta;Pequeño negocio familiar;Roberto Silva +507-6000-3456
Hotel Vista Mar;Cotizaciones / Campaña Actual Jun - Jul;85.0;Muy alta;+507-6000-7890;5000.00;Ventas;hotelería,prioritario;Negociando contrato;Cadena de 3 hoteles;Ana Torres +507-6000-7890`;

  return new NextResponse(csvTemplate, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="plantilla_importacion_leads.csv"'
    }
  });
}