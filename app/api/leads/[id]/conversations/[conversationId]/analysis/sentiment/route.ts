import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';
import { ConversationAnalyzer } from '@/lib/ai/conversationAnalyzer';
import { convertElevenLabsTranscript } from '@/lib/ai/conversationAnalyzer';

/**
 * POST - Análisis específico de sentiment de una conversación
 */
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string; conversationId: string }> }
) {
  try {
    const { id: leadId, conversationId } = await params;
    console.log('😊 [SENTIMENT ANALYSIS] Starting sentiment analysis for:', { leadId, conversationId });

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

    // 2. Usar tenantId y organizationId directamente del JWT (como otros endpoints)
    console.log('🔍 [DEBUG] User context from JWT:');
    console.log(`   tenantId: ${user.tenantId}`);
    console.log(`   organizationId: ${user.organizationId}`);
    
    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('✅ [DEBUG] Tenant and Organization validated:', {
      tenant: tenant.name,
      organization: organization.name
    });

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

    // 4. Obtener datos del cuerpo de la petición
    const body = await request.json();
    const { transcript, agentId, analysisStyle, temperature } = body;

    console.log('🔍 [SENTIMENT DEBUG] Request body:', {
      hasTranscript: !!transcript,
      transcriptType: typeof transcript,
      transcriptKeys: transcript ? Object.keys(transcript) : 'N/A',
      hasMessages: transcript?.messages ? transcript.messages.length : 'No messages',
      hasRawTranscript: transcript?.transcript?.raw ? transcript.transcript.raw.length : 'No raw transcript'
    });

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // Detectar estructura del transcript y normalizar
    let normalizedTranscript;
    if (transcript.messages && Array.isArray(transcript.messages)) {
      // Estructura estándar: { messages: [...] }
      normalizedTranscript = transcript;
    } else if (transcript.transcript?.raw && Array.isArray(transcript.transcript.raw)) {
      // Estructura ElevenLabs: { transcript: { raw: [...] } }
      normalizedTranscript = {
        messages: transcript.transcript.raw,
        duration: transcript.conversationDetails?.duration || 0,
        totalWords: 0
      };
      console.log('🔧 [SENTIMENT DEBUG] Converted ElevenLabs transcript structure');
    } else {
      console.error('❌ [SENTIMENT DEBUG] Invalid transcript structure:', transcript);
      return NextResponse.json({ error: 'Transcript must contain messages array or transcript.raw' }, { status: 400 });
    }

    // 5. Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();

    // 6. Crear prompt específico para análisis de sentiment con estilo personalizado
    const sentimentPrompt = buildSentimentPrompt(normalizedTranscript, analysisStyle);

    // 7. Ejecutar análisis de sentiment con parámetros personalizados
    console.log('🤖 [SENTIMENT ANALYSIS] Using styled prompt:', {
      agent: agentId || 'auto',
      style: analysisStyle || 'default',
      temperature: temperature || 0.3
    });
    
    // Use the private method correctly via reflection with custom temperature
    const aiResponse = await (analyzer as any).callDirectOpenAI(sentimentPrompt, 'sentiment', temperature);

    // 8. Procesar respuesta específica de sentiment
    console.log('🔍 [SENTIMENT ANALYSIS] Raw AI response:', aiResponse);
    const sentimentData = parseSentimentResponse(aiResponse);
    console.log('📊 [SENTIMENT ANALYSIS] Parsed sentiment data:', {
      overall: sentimentData.overall,
      score: sentimentData.score,
      confidence: sentimentData.confidence,
      scoreAsPercentage: `${Math.round((sentimentData.score || 0) * 100)}%`,
      confidenceAsPercentage: `${Math.round((sentimentData.confidence || 0) * 100)}%`
    });

    // 9. Buscar análisis existente o crear uno nuevo
    let existingAnalysis = await prisma.conversationAnalysis.findFirst({
      where: {
        conversationId: conversationId,
        tenantId: tenant.id
      }
    });

    // 10. Actualizar o crear análisis en la base de datos
    console.log('💾 [SENTIMENT DATABASE] Preparing to save sentiment data:', {
      overall: sentimentData.overall,
      score: sentimentData.score,
      confidence: sentimentData.confidence,
      existingAnalysis: !!existingAnalysis
    });
    
    let savedAnalysis;
    if (existingAnalysis) {
      // Actualizar análisis existente con datos de sentiment
      savedAnalysis = await prisma.conversationAnalysis.update({
        where: { id: existingAnalysis.id },
        data: {
          overallSentiment: sentimentData.overall,
          sentimentScore: sentimentData.score,
          sentimentConfidence: sentimentData.confidence,
          // Guardar el análisis completo de sentiment en rawInsights para preservarlo
          rawInsights: {
            ...((existingAnalysis.rawInsights as any) || {}),
            sentiment: sentimentData
          },
          updatedAt: new Date()
        }
      });
      console.log('✅ [SENTIMENT DATABASE] Updated existing analysis:', savedAnalysis.id);
    } else {
      // Crear nuevo análisis con datos de sentiment y valores por defecto
      savedAnalysis = await prisma.conversationAnalysis.create({
        data: {
          tenantId: user.tenantId, // Usar directamente del JWT
          organizationId: user.organizationId, // Usar directamente del JWT
          leadId,
          conversationId,
          
          // Sentiment Analysis
          overallSentiment: sentimentData.overall,
          sentimentScore: sentimentData.score,
          sentimentConfidence: sentimentData.confidence,
          
          // Quality Analysis (pendientes - requieren análisis específico)
          callQualityScore: 0.0,
          agentPerformanceScore: 0.0,
          conversationFlow: 'unknown',
          
          // Insights (pendientes - requieren análisis específico)
          keyTopics: [],
          mainPainPoints: [],
          buyingSignals: [],
          objections: [],
          competitorMentions: [],
          
          // Engagement (pendientes - requieren análisis específico)
          leadInterestLevel: 0,
          engagementScore: 0.0,
          responseQuality: 'unknown',
          
          // Predictions (pendientes - requieren análisis específico)
          conversionLikelihood: 0.0,
          recommendedAction: 'analyze_first',
          urgencyLevel: 'unknown',
          followUpTimeline: null,
          
          // Metrics (pendientes - requieren análisis específico)
          questionAsked: 0,
          questionsAnswered: 0,
          interruptionCount: 0,
          talkTimeRatio: 0.0,
          
          // Metadata
          analysisModel: aiResponse.model || 'gpt-4o-mini',
          analysisVersion: '1.0',
          confidenceScore: 50.0,
          processingTime: Date.now() - Date.now(),
          
          // JSON Data
          fullAnalysis: {},
          rawInsights: {
            sentiment: sentimentData
          }
        }
      });
      console.log('✅ [SENTIMENT DATABASE] Created new analysis:', savedAnalysis.id);
    }

    // Verificar que los valores se guardaron correctamente
    console.log('🔍 [SENTIMENT DATABASE] Saved analysis values:', {
      id: savedAnalysis.id,
      overallSentiment: savedAnalysis.overallSentiment,
      sentimentScore: savedAnalysis.sentimentScore,
      sentimentConfidence: savedAnalysis.sentimentConfidence,
      displayScore: `${Math.round((savedAnalysis.sentimentScore || 0) * 100)}%`,
      displayConfidence: `${Math.round((savedAnalysis.sentimentConfidence || 0) * 100)}%`
    });

    console.log('✅ [SENTIMENT ANALYSIS] Sentiment analysis completed and saved:', savedAnalysis.id);

    return NextResponse.json({
      success: true,
      analysisType: 'sentiment',
      data: sentimentData,
      processingTime: Date.now(),
      usedAgent: aiResponse.agentName || 'Default',
      model: aiResponse.model || 'Unknown',
      savedToDatabase: true
    });

  } catch (error) {
    console.error('❌ [SENTIMENT ANALYSIS] Error in sentiment analysis:', error);
    
    // Determinar el status code y mensaje basado en el tipo de error
    let statusCode = 500;
    let errorTitle = 'Internal server error';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('insufficient_quota') || errorMessage.includes('exceeded your current quota')) {
      statusCode = 402;
      errorTitle = 'Insufficient credits';
    } else if (errorMessage.includes('Too Many Requests') || errorMessage.includes('429')) {
      statusCode = 429;
      errorTitle = 'Rate limit exceeded';
    } else if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      statusCode = 401;
      errorTitle = 'Invalid API key';
    }
    
    return NextResponse.json({ 
      error: errorTitle,
      details: errorMessage
    }, { status: statusCode });
  }
}

/**
 * Crear prompt específico para análisis de sentiment con estilo personalizado
 */
function buildSentimentPrompt(transcript: any, analysisStyle?: string): string {
  const messages = transcript.messages
    .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.message || msg.content || ''}`)
    .join('\n');

  // Instrucciones específicas según el estilo de análisis
  const styleInstructions = getStyleInstructions(analysisStyle);

  return `
ANALIZA EL SENTIMENT DE ESTA CONVERSACIÓN DE VENTAS - ENFOQUE EXCLUSIVO EN SENTIMENT:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ESPECÍFICAS PARA SENTIMENT ===
Analiza ÚNICAMENTE el sentiment de esta conversación. Enfócate en:

1. SENTIMENT GENERAL de toda la conversación
2. SENTIMENT ESPECÍFICO de cada mensaje del CLIENTE/LEAD (no del agente)
3. PROGRESIÓN del sentiment durante la conversación
4. EMOCIONES detectadas en el cliente
5. MOMENTOS CLAVE donde el sentiment cambió

IMPORTANTE: Analiza el sentiment de cada mensaje del CLIENTE/LEAD individualmente.

Responde ÚNICAMENTE con este JSON:

{
  "overall": "positive|negative|neutral|mixed",
  "score": número entre -1.0 y 1.0,
  "confidence": número entre 0.0 y 1.0,
  "reasoning": "explicación detallada del sentiment detectado",
  "emotions": ["happy", "frustrated", "interested", "confused", "excited", "worried", ...],
  "sentimentProgression": "descripción de cómo cambió el sentiment durante la conversación",
  "keyMoments": [
    {
      "moment": "descripción del momento",
      "sentiment": "positive|negative|neutral",
      "impact": "high|medium|low",
      "reasoning": "por qué este momento fue importante"
    }
  ],
  "messageAnalysis": [
    {
      "messageIndex": número del mensaje del cliente,
      "content": "texto del mensaje del cliente",
      "sentiment": "positive|negative|neutral",
      "sentimentScore": número entre -1.0 y 1.0,
      "emotions": ["emotion1", "emotion2", ...],
      "confidence": número entre 0.0 y 1.0,
      "keyPhrases": ["frase importante 1", "frase importante 2", ...],
      "reasoning": "por qué se clasificó así"
    }
  ],
  "summary": {
    "dominantEmotion": "la emoción más presente",
    "emotionalJourney": "resumen del viaje emocional del cliente",
    "sentimentStability": "stable|volatile|improving|declining",
    "clientMood": "descripción del estado de ánimo general del cliente"
  }
}

ESTILO DE ANÁLISIS: ${styleInstructions}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
}

/**
 * Obtener instrucciones específicas según el estilo de análisis
 */
function getStyleInstructions(analysisStyle?: string): string {
  switch (analysisStyle) {
    case 'creative':
      return `ENFOQUE CREATIVO: Busca matices emocionales únicos, metáforas en el lenguaje, patrones de comportamiento inusuales y perspectivas alternativas. Considera contextos más amplios y conexiones sutiles.`;
    
    case 'conservative':
      return `ENFOQUE CONSERVADOR: Mantén interpretaciones consistentes y objetivas. Enfócate en evidencia clara y directa. Evita especulaciones y mantén evaluaciones moderadas.`;
    
    case 'balanced':
    default:
      return `ENFOQUE BALANCEADO: Combina objetividad con insights perceptivos. Considera tanto evidencia directa como contexto sutil. Mantén evaluaciones precisas pero comprensivas.`;
  }
}

/**
 * Procesar respuesta de IA específica para sentiment
 */
function parseSentimentResponse(aiResponse: any): any {
  try {
    const jsonContent = aiResponse.content || aiResponse;
    
    // Limpiar respuesta y extraer JSON
    let cleanJson = jsonContent;
    if (typeof cleanJson === 'string') {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanJson = cleanJson.trim();
    }

    // 🔧 SOLUCIÓN: Intentar reparar JSON truncado
    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.log('⚠️ [SENTIMENT] JSON parsing failed, attempting repair...');
      
      // Intentar cerrar strings y objetos incompletos
      let repairedJson = cleanJson;
      
      // Si termina con una coma, quitarla
      if (repairedJson.endsWith(',')) {
        repairedJson = repairedJson.slice(0, -1);
      }
      
      // Contar llaves y corchetes para balance
      const openBraces = (repairedJson.match(/\{/g) || []).length;
      const closeBraces = (repairedJson.match(/\}/g) || []).length;
      const openBrackets = (repairedJson.match(/\[/g) || []).length;
      const closeBrackets = (repairedJson.match(/\]/g) || []).length;
      
      // Cerrar arrays incompletos
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repairedJson += ']';
      }
      
      // Cerrar objetos incompletos
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repairedJson += '}';
      }
      
      // Si hay strings sin cerrar, intentar cerrarlas
      const quoteCount = (repairedJson.match(/"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        repairedJson += '"';
      }
      
      console.log('🔧 [SENTIMENT] Attempting with repaired JSON...');
      parsed = JSON.parse(repairedJson);
      console.log('✅ [SENTIMENT] JSON repair successful!');
    }
    
    // Validar estructura específica de sentiment
    if (!parsed.overall || parsed.score === undefined || parsed.confidence === undefined) {
      throw new Error('Invalid sentiment analysis structure');
    }
    
    // 🚨 Validar rangos de valores
    console.log('🔍 [SENTIMENT VALIDATION] Pre-validation values:', {
      score: parsed.score,
      confidence: parsed.confidence,
      overall: parsed.overall
    });
    
    // Validar que score esté entre -1.0 y 1.0
    if (parsed.score < -1.0 || parsed.score > 1.0) {
      console.warn(`⚠️ [SENTIMENT VALIDATION] Score ${parsed.score} fuera de rango [-1.0, 1.0], ajustando...`);
      parsed.score = Math.max(-1.0, Math.min(1.0, parsed.score));
    }
    
    // Validar que confidence esté entre 0.0 y 1.0
    if (parsed.confidence < 0.0 || parsed.confidence > 1.0) {
      console.warn(`⚠️ [SENTIMENT VALIDATION] Confidence ${parsed.confidence} fuera de rango [0.0, 1.0], ajustando...`);
      parsed.confidence = Math.max(0.0, Math.min(1.0, parsed.confidence));
    }
    
    // Validar que overall sea uno de los valores permitidos
    const validOverall = ['positive', 'negative', 'neutral', 'mixed'];
    if (!validOverall.includes(parsed.overall)) {
      console.warn(`⚠️ [SENTIMENT VALIDATION] Overall '${parsed.overall}' no válido, usando 'neutral'`);
      parsed.overall = 'neutral';
    }
    
    console.log('✅ [SENTIMENT VALIDATION] Post-validation values:', {
      score: parsed.score,
      confidence: parsed.confidence,
      overall: parsed.overall
    });
    
    return {
      ...parsed,
      analysisType: 'sentiment',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ [SENTIMENT ANALYSIS] Error parsing AI response:', error);
    console.error('📄 [SENTIMENT ANALYSIS] Raw content that failed to parse:', typeof aiResponse === 'object' ? aiResponse.content : aiResponse);
    
    // Retornar estructura por defecto en caso de error
    const fallbackData = {
      overall: 'neutral',
      score: 0,
      confidence: 0.5,
      reasoning: `Error en el análisis - respuesta por defecto (${(error as Error).message})`,
      emotions: ['uncertain'],
      sentimentProgression: 'No disponible debido a error en análisis',
      keyMoments: [],
      messageAnalysis: [],
      summary: {
        dominantEmotion: 'uncertain',
        emotionalJourney: 'No disponible',
        sentimentStability: 'stable',
        clientMood: 'Indeterminado'
      },
      analysisType: 'sentiment',
      timestamp: new Date().toISOString(),
      error: 'Analysis parsing failed'
    };
    
    console.log('🔧 [SENTIMENT ANALYSIS] Using fallback data:', fallbackData);
    return fallbackData;
  }
}