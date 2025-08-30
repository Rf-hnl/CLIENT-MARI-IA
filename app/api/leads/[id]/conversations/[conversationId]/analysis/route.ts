import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { conversationAnalyzer, convertElevenLabsTranscript } from '@/lib/ai/conversationAnalyzer';
import { CreateConversationAnalysisData } from '@/types/conversationAnalysis';

/**
 * Normalizar valores numéricos para cumplir con las restricciones de la base de datos
 */
function normalizeNumericField(value: number | undefined | null, max: number = 1): number | undefined {
  if (value === undefined || value === null) return undefined;
  
  // Si el valor es mayor que max, asumimos que está en escala 0-100 y lo convertimos a 0-max
  if (value > max) {
    return Math.min(value / 100, max);
  }
  
  // Asegurar que está dentro del rango permitido
  return Math.max(0, Math.min(value, max));
}

/**
 * Normalizar score de calidad (0-100)
 */
function normalizeQualityScore(value: number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Normalizar tiempo de procesamiento (en milisegundos, pero limitado)
 */
function normalizeProcessingTime(value: number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined;
  return Math.max(0, Math.min(600000, Math.round(value))); // Max 10 minutos
}


/**
 * GET - Obtener análisis existente de una conversación
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('🔍 [CONVERSATION ANALYSIS] Getting analysis for:', { leadId, conversationId });

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
        email: payload.email as string
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Obtener tenant usando el userId como en otros endpoints
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Verificar que el lead pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: tenant.id
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 4. Buscar análisis existente
    const existingAnalysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        callLog: {
          tenantId: tenant.id
        }
      }
    });

    if (!existingAnalysis) {
      return NextResponse.json({
        success: false,
        message: 'No analysis found for this conversation'
      }, { status: 404 });
    }

    console.log('✅ [CONVERSATION ANALYSIS] Found existing analysis:', existingAnalysis.id);

    return NextResponse.json({
      success: true,
      analysis: existingAnalysis
    });

  } catch (error) {
    console.error('💥 [CONVERSATION ANALYSIS] Error getting analysis:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST - Crear/actualizar análisis de una conversación
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('🤖 [CONVERSATION ANALYSIS] Starting analysis for:', { leadId, conversationId });

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
        email: payload.email as string
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Obtener tenant usando el userId como en otros endpoints
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Verificar que el lead pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId: tenant.id
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 4. Obtener datos de la conversación
    const body = await request.json();
    const { forceRefresh = false, transcript, callLogId } = body;
    
    // 🔍 DEBUG: Verificar parámetros de entrada
    console.log('🔍 [CONVERSATION ANALYSIS] Request parameters:');
    console.log(`   🔄 forceRefresh: ${forceRefresh}`);
    console.log(`   📝 transcript provided: ${!!transcript}`);
    console.log(`   📞 callLogId: ${callLogId || 'undefined'}`);

    // Use tenant.id as organizationId
    const organizationId = tenant.id;

    // Validar que organizationId existe
    if (!organizationId) {
      console.error('❌ [CONVERSATION ANALYSIS] Critical error: Tenant ID is missing after tenant object was confirmed.');
      return NextResponse.json({
        error: 'Internal server error',
        details: 'Could not determine organization ID from tenant.'
      }, { status: 500 });
    }

    // 5. Verificar si ya existe análisis
    const existingAnalysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        callLog: {
          tenantId: tenant.id
        }
      }
    });

    if (existingAnalysis && !forceRefresh) {
      console.log('✅ [CONVERSATION ANALYSIS] Using existing analysis:', existingAnalysis.id);
      return NextResponse.json({
        success: true,
        analysis: existingAnalysis,
        isExisting: true
      });
    }

    // 6. Si no hay transcript en el body, obtenerlo de ElevenLabs
    let conversationTranscript = transcript;
    if (!conversationTranscript) {
      console.log('📞 [CONVERSATION ANALYSIS] Fetching transcript from ElevenLabs...');

      const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
      const elevenLabsApiUrl = process.env.ELEVENLABS_API_URL;

      if (!elevenLabsApiKey || !elevenLabsApiUrl) {
        return NextResponse.json({ error: 'ElevenLabs not configured' }, { status: 400 });
      }

      // Obtener transcript de ElevenLabs API
      try {
        const transcriptResponse = await fetch(
          `${elevenLabsApiUrl}/v1/convai/conversations/${conversationId}`,
          {
            headers: {
              'xi-api-key': elevenLabsApiKey,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!transcriptResponse.ok) {
          throw new Error(`ElevenLabs API error: ${transcriptResponse.status}`);
        }

        const transcriptData = await transcriptResponse.json();
        
        // 🔍 DEBUG: Verificar qué datos llegan de ElevenLabs
        console.log('🔍 [CONVERSATION ANALYSIS] Raw transcript data from ElevenLabs:');
        console.log(`   📊 Has transcript property: ${!!transcriptData.transcript}`);
        console.log(`   📊 Transcript type: ${typeof transcriptData.transcript}`);
        console.log(`   📊 Transcript length: ${Array.isArray(transcriptData.transcript) ? transcriptData.transcript.length : 'N/A'}`);
        if (Array.isArray(transcriptData.transcript) && transcriptData.transcript.length > 0) {
          console.log(`   📊 First message sample:`, JSON.stringify(transcriptData.transcript[0], null, 2));
          console.log(`   📊 Last message sample:`, JSON.stringify(transcriptData.transcript[transcriptData.transcript.length - 1], null, 2));
        } else {
          console.log('   ⚠️ Transcript is empty or not an array');
        }

        // Convertir transcript de ElevenLabs a formato estándar
        conversationTranscript = convertElevenLabsTranscript(
          transcriptData.transcript || []
        );
        
        // 🔍 DEBUG: Verificar datos después de conversión
        console.log('🔍 [CONVERSATION ANALYSIS] Converted transcript:');
        console.log(`   📊 Messages: ${conversationTranscript.messages.length}`);
        console.log(`   📊 Duration: ${conversationTranscript.duration} seconds`);
        console.log(`   📊 Total words: ${conversationTranscript.totalWords}`);
        console.log(`   📊 Participants: ${conversationTranscript.participantCount}`);

      } catch (error) {
        console.error('❌ [CONVERSATION ANALYSIS] Error fetching transcript:', error);
        return NextResponse.json({
          error: 'Failed to fetch conversation transcript',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 });
      }
    }

    // 7. Crear datos para el análisis
    const analysisData: CreateConversationAnalysisData = {
      leadId,
      conversationId,
      callLogId,
      transcript: conversationTranscript
    };

    // 8. Ejecutar análisis con IA
    console.log('🧠 [CONVERSATION ANALYSIS] Running AI analysis...');
    const analysisResult = await conversationAnalyzer.analyzeConversation(
      analysisData,
      tenant.id,
      organizationId
    );

    if (!analysisResult.success || !analysisResult.analysis) {
      // Determinar el status code basado en el tipo de error
      let statusCode = 500;
      let errorTitle = 'Analysis failed';

      const errorMessage = analysisResult.error || '';

      if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
        statusCode = 429;
        errorTitle = 'Rate limit exceeded';
      } else if (errorMessage.includes('insufficient_quota') || errorMessage.includes('billing') || errorMessage.includes('402')) {
        statusCode = 402;
        errorTitle = 'Insufficient credits';
      } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
        statusCode = 401;
        errorTitle = 'Invalid API key';
      }

      return NextResponse.json({
        error: errorTitle,
        details: analysisResult.error
      }, { status: statusCode });
    }

    // 9. Validar y normalizar datos antes de guardar
    console.log('🔍 [CONVERSATION ANALYSIS] Validating data before DB save:');
    console.log(`   📊 Sentiment Score: ${analysisResult.analysis.sentimentScore} → ${normalizeNumericField(analysisResult.analysis.sentimentScore, 1)}`);
    console.log(`   🎯 Confidence: ${analysisResult.analysis.confidenceScore} → ${normalizeNumericField(analysisResult.analysis.confidenceScore, 1)}`);
    console.log(`   📈 Conversion: ${analysisResult.analysis.conversionLikelihood} → ${normalizeNumericField(analysisResult.analysis.conversionLikelihood, 1)}`);
    console.log(`   🏆 Quality: ${analysisResult.analysis.callQualityScore} → ${normalizeQualityScore(analysisResult.analysis.callQualityScore)}`);
    console.log(`   ⏱️ Processing Time: ${analysisResult.analysis.processingTime} → ${normalizeProcessingTime(analysisResult.analysis.processingTime)}`);

    // 10. Guardar o actualizar análisis en la base de datos
    let savedAnalysis;
    if (existingAnalysis) {
      // Actualizar análisis existente
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          sentiment: {
            overall: { 
              sentiment: analysisResult.analysis.overallSentiment,
              score: normalizeNumericField(analysisResult.analysis.sentimentScore, 1),
              confidence: normalizeNumericField(analysisResult.analysis.sentimentConfidence, 1)
            }
          } as Prisma.InputJsonValue ?? undefined,
          qualityScore: normalizeQualityScore(analysisResult.analysis.callQualityScore),
          engagementLevel: analysisResult.analysis.leadInterestLevel ? String(analysisResult.analysis.leadInterestLevel) : undefined,
          keyTopics: analysisResult.analysis.keyTopics ?? [],
          actionItems: analysisResult.analysis.actionItems ?? [],
          followUpSuggestions: analysisResult.analysis.followUpSuggestions ?? [],
          interestIndicators: (analysisResult.analysis.interestIndicators as Prisma.InputJsonValue) ?? undefined,
          objections: analysisResult.analysis.objections ?? [],
          buyingSignals: analysisResult.analysis.buyingSignals ?? [],
          competitorMentions: analysisResult.analysis.competitorMentions ?? [],
          priceDiscussion: (analysisResult.analysis.priceDiscussion as Prisma.InputJsonValue) ?? undefined,
          decisionMakers: analysisResult.analysis.decisionMakers ?? [],
          timeframeIndicators: (analysisResult.analysis.timeframeIndicators as Prisma.InputJsonValue) ?? undefined,
          speakingTimeDistribution: {
            agent: normalizeNumericField(analysisResult.analysis.talkTimeRatio?.agent, 1) || 0,
            client: normalizeNumericField(analysisResult.analysis.talkTimeRatio?.client, 1) || 0
          } as Prisma.InputJsonValue ?? undefined,
          conversationFlow: (analysisResult.analysis.conversationFlow as Prisma.InputJsonValue) ?? undefined,
          interruptionAnalysis: {
            count: analysisResult.analysis.interruptionCount || 0,
            analysis: `Total interruptions: ${analysisResult.analysis.interruptionCount || 0}`
          } as Prisma.InputJsonValue ?? undefined,
          questionCount: analysisResult.analysis.questionsAsked ?? undefined,
          conversionProbability: normalizeNumericField(analysisResult.analysis.conversionLikelihood, 1),
          recommendedNextAction: analysisResult.analysis.recommendedAction ?? undefined,
          bestFollowUpTime: analysisResult.analysis.followUpTimeline ?? undefined,
          suggestedApproach: analysisResult.analysis.suggestedApproach ?? undefined,
          processingModel: analysisResult.analysis.analysisModel ?? undefined,
          confidence: normalizeNumericField(analysisResult.analysis.confidenceScore, 1),
          processingTime: normalizeProcessingTime(analysisResult.analysis.processingTime),
          rawAnalysis: (analysisResult.analysis.fullAnalysis as Prisma.InputJsonValue) ?? undefined,
          updatedAt: new Date()
        }
      });
    } else {
      // Crear nuevo análisis
      const createData: Prisma.ConversationAnalysisUncheckedCreateInput = {
        conversationId,
        leadId,
        callLogId: callLogId || undefined,
        sentiment: {
          overall: { 
            sentiment: analysisResult.analysis.overallSentiment,
            score: normalizeNumericField(analysisResult.analysis.sentimentScore, 1),
            confidence: normalizeNumericField(analysisResult.analysis.sentimentConfidence, 1)
          }
        } as Prisma.InputJsonValue ?? undefined,
        qualityScore: normalizeQualityScore(analysisResult.analysis.callQualityScore),
        engagementLevel: analysisResult.analysis.leadInterestLevel ? String(analysisResult.analysis.leadInterestLevel) : undefined,
        keyTopics: analysisResult.analysis.keyTopics ?? [],
        actionItems: analysisResult.analysis.actionItems ?? [],
        followUpSuggestions: analysisResult.analysis.followUpSuggestions ?? [],
        interestIndicators: (analysisResult.analysis.interestIndicators as Prisma.InputJsonValue) ?? undefined,
        objections: analysisResult.analysis.objections ?? [],
        buyingSignals: analysisResult.analysis.buyingSignals ?? [],
        competitorMentions: analysisResult.analysis.competitorMentions ?? [],
        priceDiscussion: (analysisResult.analysis.priceDiscussion as Prisma.InputJsonValue) ?? undefined,
        decisionMakers: analysisResult.analysis.decisionMakers ?? [],
        timeframeIndicators: (analysisResult.analysis.timeframeIndicators as Prisma.InputJsonValue) ?? undefined,
        speakingTimeDistribution: {
          agent: normalizeNumericField(analysisResult.analysis.talkTimeRatio?.agent, 1) || 0,
          client: normalizeNumericField(analysisResult.analysis.talkTimeRatio?.client, 1) || 0
        } as Prisma.InputJsonValue ?? undefined,
        conversationFlow: (analysisResult.analysis.conversationFlow as Prisma.InputJsonValue) ?? undefined,
        interruptionAnalysis: {
          count: analysisResult.analysis.interruptionCount || 0,
          analysis: `Total interruptions: ${analysisResult.analysis.interruptionCount || 0}`
        } as Prisma.InputJsonValue ?? undefined,
        questionCount: analysisResult.analysis.questionsAsked ?? undefined,
        conversionProbability: normalizeNumericField(analysisResult.analysis.conversionLikelihood, 1),
        recommendedNextAction: analysisResult.analysis.recommendedAction ?? undefined,
        bestFollowUpTime: analysisResult.analysis.followUpTimeline ?? undefined,
        suggestedApproach: analysisResult.analysis.suggestedApproach ?? undefined,
        processingModel: analysisResult.analysis.analysisModel ?? undefined,
        confidence: normalizeNumericField(analysisResult.analysis.confidenceScore, 1),
        processingTime: normalizeProcessingTime(analysisResult.analysis.processingTime),
        rawAnalysis: (analysisResult.analysis.fullAnalysis as Prisma.InputJsonValue) ?? undefined
      };

      savedAnalysis = await prisma.conversationAnalysis.create({
        data: createData
      });
    }

    console.log('✅ [CONVERSATION ANALYSIS] Analysis saved successfully:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      isExisting: false,
      processingTime: analysisResult.processingTime,
      tokensUsed: analysisResult.tokensUsed,
      cost: analysisResult.cost
    });

  } catch (error) {
    console.error('💥 [CONVERSATION ANALYSIS] Error creating analysis:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE - Eliminar análisis de conversación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

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
        id: payload.userId as string
      };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Obtener tenant
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Eliminar análisis
    const deletedAnalysis = await prisma.conversationAnalysis.deleteMany({
      where: {
        conversationId: conversationId,
        callLog: {
          tenantId: tenant.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deletedAnalysis.count
    });

  } catch (error) {
    console.error('💥 [CONVERSATION ANALYSIS] Error deleting analysis:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}