/**
 * CALL PERSONALIZATION API ENDPOINT
 * 
 * Endpoint principal para personalización de llamadas
 * POST /api/calls/personalize
 */

import { NextRequest, NextResponse } from 'next/server';
import { CallPersonalizer } from '@/lib/services/callPersonalizer';
import { PersonalizationRequest, LeadContext } from '@/types/personalization';

/**
 * POST /api/calls/personalize
 * Generar script personalizado para un lead específico
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      leadId,
      tenantId,
      organizationId,
      callObjective,
      preferredStrategy,
      maxScriptLength,
      includeObjectionHandling = true,
      includeValueProps = true,
      includeSocialProof = false,
      customInstructions
    } = body;

    // Validaciones básicas
    if (!leadId || !tenantId || !organizationId || !callObjective) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, tenantId, organizationId, callObjective' },
        { status: 400 }
      );
    }

    console.log('🎯 [PERSONALIZATION API] Starting personalization:', {
      leadId: leadId.slice(0, 8) + '...',
      objective: callObjective,
      strategy: preferredStrategy || 'auto-select'
    });

    // Crear contexto del lead (simplificado - en implementación completa obtendría de BD)
    const leadContext: LeadContext = {
      leadId,
      name: 'Lead Name', // TODO: Obtener de BD
      company: 'Company Name', // TODO: Obtener de BD
      position: 'Position', // TODO: Obtener de BD
      industry: 'Industry', // TODO: Obtener de BD
      totalCalls: 0,
      conversationHistory: [],
      currentStatus: 'new',
      commonObjections: [],
      painPointsIdentified: [],
      valuePropInterests: [],
      competitorsMentioned: []
    };

    // Crear request de personalización
    const personalizationRequest: PersonalizationRequest = {
      leadContext,
      callObjective,
      preferredStrategy,
      maxScriptLength,
      includeObjectionHandling,
      includeValueProps,
      includeSocialProof,
      customInstructions
    };

    // Inicializar servicio y generar script
    const personalizer = new CallPersonalizer();
    const result = await personalizer.personalizeCall(personalizationRequest);

    if (result.success) {
      console.log(`✅ [PERSONALIZATION API] Script generated successfully:`, {
        scriptId: result.script?.id,
        confidence: result.confidence,
        processingTime: result.processingTime
      });

      return NextResponse.json({
        success: true,
        script: result.script,
        metadata: {
          processingTime: result.processingTime,
          tokensUsed: result.tokensUsed,
          confidence: result.confidence,
          model: 'gpt-4o-mini'
        },
        recommendations: result.recommendations || [],
        warnings: result.warnings || []
      });
    } else {
      console.error('❌ [PERSONALIZATION API] Personalization failed:', result.error);
      
      return NextResponse.json({
        success: false,
        error: result.error,
        processingTime: result.processingTime
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ [PERSONALIZATION API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}