/**
 * CONTEXT ANALYSIS API ENDPOINT
 * 
 * Endpoint para análisis profundo de contexto del lead
 * POST /api/calls/analyze-context
 */

import { NextRequest, NextResponse } from 'next/server';
import { CallPersonalizer } from '@/lib/services/callPersonalizer';
import { LeadContext } from '@/types/personalization';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/calls/analyze-context
 * Analizar contexto completo de un lead para personalización
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, tenantId, organizationId } = body;

    // Validaciones
    if (!leadId || !tenantId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields: leadId, tenantId, organizationId' },
        { status: 400 }
      );
    }

    console.log('🔍 [CONTEXT ANALYSIS API] Analyzing lead context:', leadId.slice(0, 8) + '...');

    // Obtener datos del lead desde la base de datos
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
        organizationId
      },
      include: {
        conversationAnalysis: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        callLogs: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            conversationAnalysis: true
          }
        }
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Construir contexto completo del lead
    const leadContext: LeadContext = {
      leadId: lead.id,
      name: lead.name,
      company: lead.company || undefined,
      position: lead.position || undefined,
      industry: lead.source || undefined, // Aproximación temporal
      
      // Historial de interacciones
      totalCalls: lead.callLogs.length,
      lastCallDate: lead.lastContactDate || undefined,
      lastCallResult: lead.lastCallResult || undefined,
      responsePattern: lead.daysSinceLastCall ? 
        (lead.daysSinceLastCall < 2 ? 'quick' : 
         lead.daysSinceLastCall < 7 ? 'delayed' : 'inconsistent') : undefined,
      
      // Análisis previos
      lastSentimentScore: lead.lastSentimentScore ? Number(lead.lastSentimentScore) : undefined,
      lastEngagementScore: lead.lastEngagementScore || undefined,
      averageCallDuration: lead.callLogs.length > 0 ? 
        lead.callLogs.reduce((acc, call) => acc + (call.durationMinutes || 0), 0) / lead.callLogs.length 
        : undefined,
      
      // Preferencias identificadas
      preferredContactMethod: lead.preferredContactMethod || undefined,
      bestCallTimeWindow: lead.preferredCallTimeWindow || undefined,
      
      // Contexto de negocio
      currentStatus: lead.status,
      qualificationScore: lead.qualificationScore || undefined,
      interestLevel: lead.interestLevel || undefined,
      budgetIndicated: lead.budgetRange ? true : false,
      decisionMakerLevel: lead.position?.toLowerCase().includes('ceo') || lead.position?.toLowerCase().includes('director') ? 
        'decision_maker' : 'unknown',
      
      // Historial de conversaciones
      conversationHistory: lead.conversationAnalysis.map(analysis => ({
        conversationId: analysis.conversationId || analysis.id,
        date: analysis.createdAt,
        duration: 0, // TODO: Extraer de call logs
        outcome: analysis.recommendedNextAction || 'unknown',
        keyTopics: analysis.keyTopics || [],
        sentiment: 0, // TODO: Calcular de sentiment analysis
        engagement: 0, // TODO: Calcular engagement
        objections: analysis.objections || [],
        buyingSignals: analysis.buyingSignals || [],
        nextSteps: analysis.recommendedNextAction
      })),
      
      // Objeciones y concerns (extraídos de análisis)
      commonObjections: lead.conversationAnalysis
        .flatMap(a => a.objections || [])
        .filter((obj, index, arr) => arr.indexOf(obj) === index)
        .slice(0, 5),
      
      painPointsIdentified: lead.conversationAnalysis
        .flatMap(a => a.keyTopics || [])
        .filter(topic => topic.toLowerCase().includes('problem') || topic.toLowerCase().includes('challenge'))
        .slice(0, 3),
      
      valuePropInterests: lead.conversationAnalysis
        .flatMap(a => a.keyTopics || [])
        .filter(topic => topic.toLowerCase().includes('benefit') || topic.toLowerCase().includes('value'))
        .slice(0, 3),
      
      competitorsMentioned: lead.conversationAnalysis
        .flatMap(a => a.competitorMentions || [])
        .filter((comp, index, arr) => arr.indexOf(comp) === index)
        .slice(0, 3)
    };

    // Realizar análisis de contexto
    const personalizer = new CallPersonalizer();
    const contextAnalysis = await personalizer.analyzeLeadContext(leadContext);

    console.log('✅ [CONTEXT ANALYSIS API] Analysis completed:', {
      personality: contextAnalysis.personalityProfile,
      strategy: contextAnalysis.recommendedStrategy,
      confidence: contextAnalysis.profileConfidence
    });

    return NextResponse.json({
      success: true,
      leadContext,
      contextAnalysis,
      insights: {
        totalInteractions: leadContext.totalCalls,
        lastActivity: leadContext.lastCallDate,
        engagementTrend: leadContext.lastEngagementScore || 0 > 50 ? 'positive' : 'neutral',
        sentimentTrend: leadContext.lastSentimentScore || 0 > 0.5 ? 'positive' : 'neutral'
      }
    });

  } catch (error) {
    console.error('❌ [CONTEXT ANALYSIS API] Error analyzing context:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze lead context',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}