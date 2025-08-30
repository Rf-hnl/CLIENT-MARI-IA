/**
 * BULK PERSONALIZATION API ENDPOINT
 * 
 * Endpoint para personalización masiva de múltiples leads
 * POST /api/calls/bulk-personalize
 */

import { NextRequest, NextResponse } from 'next/server';
import { CallPersonalizer } from '@/lib/services/callPersonalizer';
import { PersonalizationRequest, LeadContext, CallObjective, PersonalizationStrategy } from '@/types/personalization';
import { prisma } from '@/lib/prisma';

interface BulkPersonalizationRequest {
  tenantId: string;
  organizationId: string;
  leadIds: string[];
  callObjective: CallObjective;
  preferredStrategy?: PersonalizationStrategy;
  maxConcurrency?: number;
  customInstructions?: string;
}

interface BulkPersonalizationResult {
  success: boolean;
  totalProcessed: number;
  successfulPersonalizations: number;
  failedPersonalizations: number;
  results: {
    leadId: string;
    success: boolean;
    scriptId?: string;
    confidence?: number;
    error?: string;
    processingTime: number;
  }[];
  totalProcessingTime: number;
  averageConfidence: number;
}

/**
 * POST /api/calls/bulk-personalize
 * Generar scripts personalizados para múltiples leads
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    const {
      tenantId,
      organizationId,
      leadIds,
      callObjective,
      preferredStrategy,
      maxConcurrency = 3,
      customInstructions
    }: BulkPersonalizationRequest = body;

    // Validaciones
    if (!tenantId || !organizationId || !leadIds || !Array.isArray(leadIds) || leadIds.length === 0 || !callObjective) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantId, organizationId, leadIds (array), callObjective' },
        { status: 400 }
      );
    }

    if (leadIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 leads allowed per bulk request' },
        { status: 400 }
      );
    }

    console.log('🔄 [BULK PERSONALIZATION API] Starting bulk personalization:', {
      totalLeads: leadIds.length,
      objective: callObjective,
      strategy: preferredStrategy || 'auto-select',
      concurrency: maxConcurrency
    });

    // Obtener datos de todos los leads
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        tenantId,
        organizationId
      },
      include: {
        conversationAnalysis: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        callLogs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        campaign: {
          include: {
            products: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads found matching the criteria' },
        { status: 404 }
      );
    }

    console.log(`📊 [BULK PERSONALIZATION API] Found ${leads.length} leads to process`);

    // Inicializar personalizador
    const personalizer = new CallPersonalizer({
      maxConcurrentAnalysis: maxConcurrency
    });

    // Procesar leads en batches para controlar concurrencia
    const results: BulkPersonalizationResult['results'] = [];
    const batchSize = maxConcurrency;
    
    for (let i = 0; i < leads.length; i += batchSize) {
      const batch = leads.slice(i, i + batchSize);
      
      console.log(`🔄 [BULK PERSONALIZATION API] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(leads.length/batchSize)}`);

      // Procesar batch en paralelo
      const batchPromises = batch.map(async (lead) => {
        const leadStartTime = Date.now();
        
        try {
          // Construir contexto del lead
          const leadContext: LeadContext = {
            leadId: lead.id,
            name: lead.name,
            company: lead.company || undefined,
            position: lead.position || undefined,
            industry: lead.source || undefined,
            
            totalCalls: lead.callLogs.length,
            lastCallDate: lead.lastContactDate || undefined,
            lastCallResult: lead.lastCallResult || undefined,
            
            lastSentimentScore: lead.lastSentimentScore ? Number(lead.lastSentimentScore) : undefined,
            lastEngagementScore: lead.lastEngagementScore || undefined,
            
            currentStatus: lead.status,
            qualificationScore: lead.qualificationScore || undefined,
            interestLevel: lead.interestLevel || undefined,
            budgetIndicated: lead.budgetRange ? true : false,
            
            conversationHistory: lead.conversationAnalysis.map(analysis => ({
              conversationId: analysis.conversationId || analysis.id,
              date: analysis.createdAt,
              duration: 0,
              outcome: analysis.recommendedNextAction || 'unknown',
              keyTopics: analysis.keyTopics || [],
              sentiment: 0,
              engagement: 0,
              objections: analysis.objections || [],
              buyingSignals: analysis.buyingSignals || []
            })),
            
            commonObjections: lead.conversationAnalysis
              .flatMap(a => a.objections || [])
              .slice(0, 3),
            painPointsIdentified: [],
            valuePropInterests: [],
            competitorsMentioned: [],
            
            // NUEVOS CAMPOS: Información de campaña y productos
            campaignName: lead.campaign?.name || undefined,
            campaignDescription: lead.campaign?.description || undefined,
            campaignProducts: lead.campaign?.products?.map(cp => ({
              name: cp.product.name,
              description: cp.product.description || undefined,
              price: cp.product.price ? Number(cp.product.price) : undefined,
              sku: cp.product.sku || undefined
            })) || []
          } as any; // Usamos 'as any' porque estamos extendiendo el tipo con campos de campaña

          // Crear request de personalización
          const personalizationRequest: PersonalizationRequest = {
            leadContext,
            callObjective,
            preferredStrategy,
            customInstructions
          };

          // Generar script personalizado
          const result = await personalizer.personalizeCall(personalizationRequest);
          
          const processingTime = Date.now() - leadStartTime;

          if (result.success) {
            console.log(`✅ [BULK PERSONALIZATION API] Success for lead ${lead.id.slice(0, 8)}...`);
            return {
              leadId: lead.id,
              success: true,
              scriptId: result.script?.id,
              confidence: result.confidence,
              processingTime
            };
          } else {
            console.warn(`⚠️ [BULK PERSONALIZATION API] Failed for lead ${lead.id.slice(0, 8)}...: ${result.error}`);
            return {
              leadId: lead.id,
              success: false,
              error: result.error,
              processingTime
            };
          }

        } catch (error) {
          console.error(`❌ [BULK PERSONALIZATION API] Error processing lead ${lead.id}:`, error);
          return {
            leadId: lead.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime: Date.now() - leadStartTime
          };
        }
      });

      // Esperar que termine el batch
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pequeña pausa entre batches para no saturar la API
      if (i + batchSize < leads.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Calcular estadísticas finales
    const totalProcessingTime = Date.now() - startTime;
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const averageConfidence = successful.length > 0 ? 
      successful.reduce((acc, r) => acc + (r.confidence || 0), 0) / successful.length : 0;

    const bulkResult: BulkPersonalizationResult = {
      success: true,
      totalProcessed: results.length,
      successfulPersonalizations: successful.length,
      failedPersonalizations: failed.length,
      results,
      totalProcessingTime,
      averageConfidence
    };

    console.log('✅ [BULK PERSONALIZATION API] Bulk personalization completed:', {
      total: bulkResult.totalProcessed,
      successful: bulkResult.successfulPersonalizations,
      failed: bulkResult.failedPersonalizations,
      successRate: Math.round((bulkResult.successfulPersonalizations / bulkResult.totalProcessed) * 100) + '%',
      totalTime: totalProcessingTime + 'ms'
    });

    return NextResponse.json(bulkResult);

  } catch (error) {
    console.error('❌ [BULK PERSONALIZATION API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        totalProcessingTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}