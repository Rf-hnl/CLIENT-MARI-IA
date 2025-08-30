import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { SentimentTemporalAnalyzer } from '@/lib/ai/sentimentTemporalAnalyzer';

/**
 * POST - Análisis temporal de sentiment por segmentos
 * 
 * Realiza análisis de sentiment multinivel dividiendo la conversación
 * en segmentos temporales para detectar cambios y momentos críticos
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('🕐 [TEMPORAL SENTIMENT] Starting temporal sentiment analysis:', { leadId, conversationId });

    // 1. Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { 
        id: payload.userId as string, 
        email: payload.email as string,
        tenantId: payload.tenantId as string,
        organizationId: payload.organizationId as string
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Verificar tenant y organización
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 3. Verificar que el lead pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: user.tenantId
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 4. Obtener datos de la petición
    const body = await request.json();
    const { 
      transcript, 
      config = {},
      includeLeadContext = true 
    } = body;

    console.log('🔍 [TEMPORAL SENTIMENT] Request parameters:', {
      hasTranscript: !!transcript,
      configKeys: Object.keys(config),
      includeLeadContext
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // 5. Convertir transcript a formato estándar
    let normalizedTranscript;
    try {
      normalizedTranscript = SentimentTemporalAnalyzer.convertTranscript(transcript);
      console.log('✅ [TEMPORAL SENTIMENT] Transcript converted:', {
        duration: normalizedTranscript.duration,
        messageCount: normalizedTranscript.messages.length,
        participantCount: normalizedTranscript.participantCount
      });
    } catch (error) {
      console.error('❌ [TEMPORAL SENTIMENT] Error converting transcript:', error);
      return NextResponse.json({ 
        error: 'Invalid transcript format',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 400 });
    }

    // 6. Preparar contexto del lead (opcional)
    let leadContext;
    if (includeLeadContext) {
      leadContext = {
        name: lead.name,
        company: lead.company,
        currentStatus: lead.status,
        previousAnalyses: 0 // TODO: Contar análisis previos
      };

      // Contar análisis previos del lead
      try {
        const previousCount = await prisma.conversationAnalysis.count({
          where: { leadId: lead.id }
        });
        leadContext.previousAnalyses = previousCount;
      } catch (error) {
        console.warn('⚠️ Could not count previous analyses:', error);
      }
    }

    console.log('🎯 [TEMPORAL SENTIMENT] Lead context:', leadContext);

    // 7. Configurar analizador temporal
    const analyzerConfig = {
      segmentDurationSeconds: config.segmentDuration || 30,
      overlapSeconds: config.overlap || 5,
      minSegmentLength: config.minSegmentLength || 10,
      model: config.model || 'gpt-4o-mini',
      temperature: config.temperature || 0.3,
      ...config
    };

    console.log('⚙️ [TEMPORAL SENTIMENT] Analyzer configuration:', analyzerConfig);

    // 8. Realizar análisis temporal
    const analyzer = new SentimentTemporalAnalyzer(analyzerConfig);
    const startTime = Date.now();

    const sentimentTimeline = await analyzer.analyzeSentimentTimeline(
      normalizedTranscript,
      leadContext
    );

    const processingTime = Date.now() - startTime;

    console.log('✅ [TEMPORAL SENTIMENT] Analysis completed:', {
      processingTimeMs: processingTime,
      segmentsAnalyzed: sentimentTimeline.sentimentProgression.length,
      changesDetected: sentimentTimeline.sentimentChanges.length,
      criticalMoments: sentimentTimeline.criticalMoments.length,
      overallSentiment: sentimentTimeline.overallSentiment
    });

    // 9. Buscar o crear análisis en la base de datos
    let existingAnalysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        leadId: leadId
      }
    });

    // 10. Preparar datos para guardar
    const sentimentTimelineData = {
      temporalAnalysis: {
        segmentCount: sentimentTimeline.sentimentProgression.length,
        averageSentiment: sentimentTimeline.overallSentiment.score,
        sentimentStability: sentimentTimeline.sentimentChanges.length < 2 ? 'stable' : 
                           sentimentTimeline.sentimentChanges.length < 4 ? 'moderate' : 'volatile',
        criticalMomentsCount: sentimentTimeline.criticalMoments.length,
        dominantEmotions: sentimentTimeline.sentimentProgression
          .map(p => p.dominantEmotion)
          .reduce((acc, emotion) => {
            acc[emotion] = (acc[emotion] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      },
      timeline: sentimentTimeline,
      config: analyzerConfig,
      processingTime,
      analyzedAt: new Date().toISOString()
    };

    // 11. Actualizar o crear registro en la base de datos
    let savedAnalysis;
    if (existingAnalysis) {
      // Actualizar análisis existente
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          // Actualizar campos principales con datos del timeline
          sentiment: JSON.stringify({
            overall: sentimentTimeline.overallSentiment.label,
            score: sentimentTimeline.overallSentiment.score,
            confidence: sentimentTimeline.overallSentiment.confidence
          }),
          qualityScore: Math.round(sentimentTimeline.overallSentiment.confidence * 100),
          engagementLevel: sentimentTimeline.criticalMoments.length > 3 ? 'high' :
                          sentimentTimeline.criticalMoments.length > 1 ? 'medium' : 'low',
          
          // Actualizar análisis completo con datos temporales
          rawAnalysis: {
            ...((existingAnalysis.rawAnalysis as any) || {}),
            temporalSentiment: sentimentTimelineData
          },
          updatedAt: new Date()
        }
      });
      console.log('✅ [TEMPORAL SENTIMENT] Updated existing analysis:', savedAnalysis.id);
    } else {
      // Crear nuevo análisis con datos temporales
      savedAnalysis = await prisma.conversationAnalysis.create({
        data: {
          leadId,
          conversationId,
          analysisType: 'temporal_sentiment',

          // Datos principales derivados del análisis temporal
          sentiment: JSON.stringify({
            overall: sentimentTimeline.overallSentiment.label,
            score: sentimentTimeline.overallSentiment.score,
            confidence: sentimentTimeline.overallSentiment.confidence
          }),
          qualityScore: Math.round(sentimentTimeline.overallSentiment.confidence * 100),
          engagementLevel: sentimentTimeline.criticalMoments.length > 3 ? 'high' :
                          sentimentTimeline.criticalMoments.length > 1 ? 'medium' : 'low',
          keyTopics: sentimentTimeline.criticalMoments.map(m => m.description),
          
          // Datos técnicos
          processingModel: analyzerConfig.model || 'gpt-4o-mini',
          confidence: sentimentTimeline.overallSentiment.confidence,
          processingTime,

          // Análisis completo en JSON
          rawAnalysis: {
            temporalSentiment: sentimentTimelineData
          },
          
          analyzedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ [TEMPORAL SENTIMENT] Created new analysis:', savedAnalysis.id);
    }

    // 12. Actualizar campos de sentiment en el lead para filtros avanzados
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          lastSentimentScore: sentimentTimeline.overallSentiment.score,
          lastEngagementScore: Math.round(sentimentTimeline.overallSentiment.confidence * 100),
          aiAnalysisUpdatedAt: new Date()
        }
      });
      console.log('✅ [TEMPORAL SENTIMENT] Updated lead sentiment fields');
    } catch (error) {
      console.warn('⚠️ [TEMPORAL SENTIMENT] Could not update lead fields:', error);
    }

    // 13. Respuesta exitosa
    return NextResponse.json({
      success: true,
      analysisType: 'temporal_sentiment',
      data: {
        timeline: sentimentTimeline,
        summary: {
          overallSentiment: sentimentTimeline.overallSentiment,
          segmentsAnalyzed: sentimentTimeline.sentimentProgression.length,
          significantChanges: sentimentTimeline.sentimentChanges.length,
          criticalMoments: sentimentTimeline.criticalMoments.length,
          processingTimeMs: processingTime
        }
      },
      config: analyzerConfig,
      savedToDatabase: true,
      analysisId: savedAnalysis.id
    });

  } catch (error) {
    console.error('❌ [TEMPORAL SENTIMENT] Error in temporal sentiment analysis:', error);
    
    // Determinar código de estado basado en el error
    let statusCode = 500;
    let errorTitle = 'Internal server error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('insufficient_quota') || errorMessage.includes('exceeded your current quota')) {
      statusCode = 402;
      errorTitle = 'Insufficient OpenAI credits';
    } else if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
      statusCode = 429;
      errorTitle = 'Rate limit exceeded';
    } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      statusCode = 401;
      errorTitle = 'Invalid API key';
    }
    
    return NextResponse.json({ 
      error: errorTitle,
      details: errorMessage,
      analysisType: 'temporal_sentiment'
    }, { status: statusCode });
  }
}

/**
 * GET - Obtener análisis temporal existente
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;

    // Autenticación básica (reutilizar lógica del POST)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { 
        tenantId: payload.tenantId as string,
        organizationId: payload.organizationId as string
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Buscar análisis temporal existente
    const analysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        leadId: leadId
      },
      select: {
        id: true,
        rawAnalysis: true,
        sentiment: true,
        qualityScore: true,
        engagementLevel: true,
        analyzedAt: true,
        processingTime: true
      }
    });

    if (!analysis) {
      return NextResponse.json({ 
        error: 'Temporal sentiment analysis not found',
        message: 'No temporal analysis exists for this conversation. Run POST first.'
      }, { status: 404 });
    }

    // Extraer datos temporales del análisis
    const rawAnalysis = analysis.rawAnalysis as any;
    const temporalData = rawAnalysis?.temporalSentiment;

    if (!temporalData) {
      return NextResponse.json({ 
        error: 'No temporal data found',
        message: 'Analysis exists but lacks temporal sentiment data'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      analysisType: 'temporal_sentiment',
      data: temporalData,
      metadata: {
        analysisId: analysis.id,
        analyzedAt: analysis.analyzedAt,
        processingTime: analysis.processingTime
      }
    });

  } catch (error) {
    console.error('❌ [TEMPORAL SENTIMENT GET] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve temporal analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}