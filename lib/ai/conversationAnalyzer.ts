/**
 * CONVERSATION ANALYZER WITH MULTI-AI PROVIDER
 * 
 * Sistema de análisis automático con fallback automático:
 * 1. OpenAI (Primary) 
 * 2. Google Gemini (Fallback)
 * 3. Claude (Secondary Fallback) - Future
 */

import { 
  ConversationAnalysis, 
  ConversationTranscript, 
  CreateConversationAnalysisData,
  AnalysisConfig,
  AIAnalysisResult,
  SentimentType,
  RecommendedAction,
  UrgencyLevel,
  FollowUpTimeline,
  ConversationFlow,
  ResponseQuality
} from '@/types/conversationAnalysis';


// Configuración por defecto
const DEFAULT_CONFIG: AnalysisConfig = {
  model: 'gpt-4o-mini',
  includeEmotionAnalysis: true,
  includeTopicExtraction: true,
  includeBuyingSignals: true,
  includeCompetitorAnalysis: true,
  language: 'es'
};

/**
 * SISTEMA PRINCIPAL DE ANÁLISIS
 */
export class ConversationAnalyzer {
  private config: AnalysisConfig;

  constructor(config: Partial<AnalysisConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calcular métricas reales del transcript
   */
  private calculateTranscriptMetrics(transcript: ConversationTranscript) {
    const { messages, duration } = transcript;
    
    // Calcular tiempo de habla por rol
    let agentMessages = 0;
    let leadMessages = 0;
    let agentWordCount = 0;
    let leadWordCount = 0;
    
    messages.forEach(msg => {
      const wordCount = msg.content ? msg.content.split(' ').length : 0;
      if (msg.role === 'agent') {
        agentMessages++;
        agentWordCount += wordCount;
      } else {
        leadMessages++;
        leadWordCount += wordCount;
      }
    });
    
    const totalWords = agentWordCount + leadWordCount;
    const agentTimeRatio = totalWords > 0 ? agentWordCount / totalWords : 0.5;
    const leadTimeRatio = totalWords > 0 ? leadWordCount / totalWords : 0.5;
    
    // Calcular preguntas (buscar signos de interrogación)
    const agentQuestions = messages.filter(msg => 
      msg.role === 'agent' && msg.content.includes('?')
    ).length;
    
    const leadQuestions = messages.filter(msg => 
      msg.role === 'lead' && msg.content.includes('?')  
    ).length;
    
    return {
      agentTimeRatio: Math.round(agentTimeRatio * 100),
      leadTimeRatio: Math.round(leadTimeRatio * 100),
      agentMessages,
      leadMessages,
      agentWordCount,
      leadWordCount,
      agentQuestions,
      leadQuestions,
      totalQuestions: agentQuestions + leadQuestions
    };
  }

  /**
   * Analizar una conversación completa
   */
  async analyzeConversation(
    data: CreateConversationAnalysisData,
    tenantId: string,
    organizationId: string
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      console.log('🤖 [ANALIZADOR] Iniciando análisis de conversación:', data.conversationId);

      // 1. Calcular métricas reales del transcript
      const transcriptMetrics = this.calculateTranscriptMetrics(data.transcript);
      
      console.log('📊 [ANALIZADOR] Métricas calculadas del transcript:', transcriptMetrics);

      // 2. Preparar datos para análisis
      const analysisPrompt = this.buildAnalysisPrompt(data.transcript);
      
      // 3. Llamar a la API de IA usando agente configurado con transcript para cálculo dinámico
      const aiResponse = await this.callAIAnalysis(analysisPrompt, tenantId, 'complete', data.transcript);
      
      // 4. Procesar respuesta y extraer datos estructurados
      const analysisData = this.parseAIResponse(aiResponse);
      
      // 5. Crear objeto de análisis completo
      const analysis: ConversationAnalysis = {
        id: '', // Se generará en la BD
        tenantId,
        organizationId,
        leadId: data.leadId,
        callLogId: data.callLogId,
        conversationId: data.conversationId,
        
        // Sentiment Analysis
        overallSentiment: analysisData.sentiment.overall,
        sentimentScore: analysisData.sentiment.score,
        sentimentConfidence: analysisData.sentiment.confidence,
        
        // Quality Analysis
        callQualityScore: analysisData.quality.overall,
        agentPerformanceScore: analysisData.quality.agentPerformance,
        conversationFlow: analysisData.quality.flow,
        
        // Key Insights
        keyTopics: analysisData.insights.keyTopics || [],
        mainPainPoints: analysisData.insights.painPoints || [],
        buyingSignals: analysisData.insights.buyingSignals || [],
        objections: analysisData.insights.objections || [],
        competitorMentions: analysisData.insights.competitors || [],
        actionItems: analysisData.insights.actionItems || [],
        followUpSuggestions: analysisData.insights.followUpSuggestions || [],
        decisionMakers: analysisData.insights.decisionMakers || [],
        timeframeIndicators: analysisData.insights.timeframe || [],
        priceDiscussion: analysisData.insights.priceDiscussion || null,
        
        // Engagement
        leadInterestLevel: analysisData.engagement.interestLevel,
        engagementScore: analysisData.engagement.score,
        responseQuality: analysisData.engagement.responseQuality,
        
        // Predictions
        conversionLikelihood: analysisData.predictions.conversionLikelihood,
        recommendedAction: analysisData.predictions.recommendedAction,
        urgencyLevel: analysisData.predictions.urgency,
        followUpTimeline: analysisData.predictions.followUpTimeline,
        suggestedApproach: analysisData.predictions.suggestedApproach || 'Seguimiento estándar basado en el interés mostrado',
        
        // Conversation Metrics (usar métricas calculadas reales)
        questionsAsked: transcriptMetrics.totalQuestions,
        questionsAnswered: transcriptMetrics.leadQuestions, // preguntas respondidas por el lead
        interruptionCount: analysisData.metrics.interruptions || 0,
        talkTimeRatio: {
          agent: transcriptMetrics.agentTimeRatio / 100, // convertir a decimal 0-1
          client: transcriptMetrics.leadTimeRatio / 100
        },
        
        // Metadata
        analysisModel: this.config.model,
        analysisVersion: '1.0',
        confidenceScore: analysisData.confidence,
        processingTime: Date.now() - startTime,
        
        // Raw Data
        fullAnalysis: analysisData.fullAnalysis,
        rawInsights: aiResponse,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ [ANALIZADOR] Análisis completado exitosamente');

      return {
        success: true,
        analysis,
        processingTime: Date.now() - startTime,
        tokensUsed: aiResponse.tokensUsed,
        cost: aiResponse.cost
      };

    } catch (error) {
      console.error('❌ [ANALIZADOR] Error en análisis:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido en análisis',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Construir prompt para análisis de IA
   */
  private buildAnalysisPrompt(transcript: ConversationTranscript): string {
    const messages = transcript.messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    // 📊 LOG DE LA CONVERSACIÓN QUE SE ENVIARÁ
    console.log('📋 [ANALIZADOR] CONVERSACIÓN COMPLETA A ANALIZAR:');
    console.log(`   📝 Total mensajes: ${transcript.messages.length}`);
    console.log(`   ⏱️ Duración: ${Math.floor(transcript.duration / 60)} minutos`);
    console.log(`   💬 Palabras totales: ${transcript.totalWords}`);
    console.log('   📄 MENSAJES:');
    transcript.messages.forEach((msg, index) => {
      console.log(`      ${index + 1}. ${msg.role.toUpperCase()}: "${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}"`);
    });
    console.log('   🔚 FIN DE CONVERSACIÓN');

    return `
ANALIZA ESTA CONVERSACIÓN DE VENTAS Y PROPORCIONA UN ANÁLISIS DETALLADO EN JSON:

=== CONVERSACIÓN ===
${messages}

=== DURACIÓN ===
${Math.floor(transcript.duration / 60)} minutos, ${transcript.totalWords} palabras

=== INSTRUCCIONES ===
Analiza esta conversación entre un agente de ventas y un prospecto (lead). 
Proporciona un análisis completo en formato JSON con la siguiente estructura EXACTA:

IMPORTANTE: 
1. Analiza el sentiment de cada mensaje del CLIENTE/LEAD (no del agente) individualmente.
2. Extrae TODA la información comercial relevante: nombres, empresas, productos, precios, fechas.
3. Identifica pain points específicos mencionados por el cliente.
4. Detecta todas las señales de compra y objeciones.
5. Proporciona action items específicos y sugerencias de seguimiento detalladas.

{
  "sentiment": {
    "overall": "positive|negative|neutral|mixed",
    "score": número entre -1.0 y 1.0,
    "confidence": número entre 0.0 y 1.0,
    "reasoning": "explicación del sentiment detectado"
  },
  "quality": {
    "overall": número entre 0 y 100,
    "agentPerformance": número entre 0 y 100,
    "flow": "excellent|good|fair|poor",
    "reasoning": "análisis de la calidad de la conversación"
  },
  "insights": {
    "keyTopics": ["tema1", "tema2", ...],
    "painPoints": ["dolor1", "dolor2", ...],
    "buyingSignals": ["señal1", "señal2", ...],
    "objections": ["objeción1", "objeción2", ...],
    "competitors": ["competidor1", "competidor2", ...],
    "actionItems": ["acción1", "acción2", ...],
    "followUpSuggestions": ["sugerencia1", "sugerencia2", ...],
    "decisionMakers": ["persona1", "persona2", ...],
    "timeframe": ["indicador1", "indicador2", ...],
    "priceDiscussion": "resumen de discusión de precios o null si no se habló de precios"
  },
  "engagement": {
    "interestLevel": número entre 1 y 10,
    "score": número entre 0 y 100,
    "responseQuality": "excellent|good|fair|poor",
    "reasoning": "análisis del nivel de engagement"
  },
  "predictions": {
    "conversionLikelihood": número entre 0 y 100,
    "recommendedAction": "immediate_follow_up|send_proposal|schedule_meeting|nurture_lead|qualify_further|close_deal|archive_lead",
    "urgency": "low|medium|high|critical",
    "followUpTimeline": "immediate|1_day|3_days|1_week|2_weeks|1_month",
    "suggestedApproach": "enfoque específico y detallado para el siguiente contacto",
    "reasoning": "justificación de las predicciones"
  },
  "metrics": {
    "questionsAsked": número de preguntas del agente,
    "questionsAnswered": número de preguntas respondidas por el lead,
    "interruptions": número de interrupciones,
    "talkTimeRatio": ratio de tiempo hablado agente/lead (0.0 a 1.0)
  },
  "confidence": número entre 0 y 100,
  "messageAnalysis": [
    {
      "messageIndex": número del mensaje (solo del cliente/lead),
      "content": "texto del mensaje del cliente",
      "sentiment": "positive|negative|neutral",
      "sentimentScore": número entre -1.0 y 1.0,
      "emotions": ["happy", "frustrated", "interested", "confused", ...],
      "keyPhrases": ["frase importante 1", "frase importante 2", ...],
      "intent": "question|objection|interest|agreement|concern",
      "urgencyLevel": "low|medium|high"
    }
  ],
  "fullAnalysis": {
    "summary": "resumen ejecutivo de la conversación",
    "sentimentProgression": "cómo cambió el sentiment del cliente durante la conversación",
    "clientMoments": "momentos clave donde el cliente mostró emociones fuertes",
    "strengths": ["fortaleza1", "fortaleza2", ...],
    "improvements": ["mejora1", "mejora2", ...],
    "nextSteps": ["paso1", "paso2", ...]
  }
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;
  }

  /**
   * Llamar a OpenAI directamente desde variables de entorno
   */
  private async callAIAnalysis(prompt: string, tenantId?: string, analysisType?: string, transcript?: ConversationTranscript): Promise<any> {
    console.log('🤖 [ANALIZADOR] Usando OpenAI directamente desde .env');

    try {
      return await this.callDirectOpenAI(prompt, analysisType, undefined, transcript);
    } catch (error) {
      console.error('❌ [ANALIZADOR] Error llamando a OpenAI:', error);
      throw error;
    }
  }

  /**
   * Buscar agentes de análisis disponibles
   */
  private async findAnalysisAgents(tenantId: string, analysisType?: string) {
    const { prisma } = await import('@/lib/prisma');
    
    try {
      // Buscar TODOS los agentes de análisis activos
      const agents = await prisma.unifiedAgent.findMany({
        where: {
          tenantId: tenantId,
          category: 'analysis',
          isActive: true
        },
        include: {
          analysisAgent: true
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      });

      const analysisAgents = agents
        .filter(agent => agent.analysisAgent)
        .map(agent => ({
          id: agent.id,
          name: agent.name,
          provider: agent.analysisAgent!.provider,
          model: agent.analysisAgent!.model,
          purpose: agent.analysisAgent!.purpose,
          systemPrompt: agent.analysisAgent!.systemPrompt,
          instructions: agent.analysisAgent!.instructions,
          providerConfig: agent.analysisAgent!.providerConfig,
          maxTokens: agent.analysisAgent!.maxTokens,
          temperature: agent.analysisAgent!.temperature
        }));

      console.log(`🔍 [ANALIZADOR] Encontrados ${analysisAgents.length} agentes de análisis para tenant ${tenantId}`);
      return analysisAgents;

    } catch (error) {
      console.error('❌ [ANALIZADOR] Error encontrando agentes de análisis:', error);
      return [];
    }
  }

  /**
   * Buscar agente de análisis apropiado (legacy - para compatibilidad)
   */
  private async findAnalysisAgent(tenantId: string, analysisType?: string) {
    const agents = await this.findAnalysisAgents(tenantId, analysisType);
    return agents.length > 0 ? agents[0] : null;
  }

  /**
   * Llamar agente OpenAI
   */
  private async callOpenAIAgent(agent: any, prompt: string) {
    const providerConfig = agent.providerConfig as any;
    const apiKey = providerConfig?.apiKey || process.env.OPENAI_API_KEY;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: agent.model,
        messages: [
          {
            role: 'system',
            content: agent.systemPrompt + (agent.instructions ? `\n\nInstrucciones adicionales: ${agent.instructions}` : '')
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: Number(agent.temperature),
        max_tokens: agent.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      cost: this.calculateCost(data.usage?.total_tokens || 0),
      model: agent.model,
      agentName: agent.name
    };
  }

  /**
   * Llamar agente Claude
   */
  private async callClaudeAgent(agent: any, prompt: string) {
    const providerConfig = agent.providerConfig as any;
    const apiKey = providerConfig?.apiKey || process.env.ANTHROPIC_API_KEY;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: agent.model,
        max_tokens: agent.maxTokens,
        temperature: Number(agent.temperature),
        system: agent.systemPrompt + (agent.instructions ? `\n\nInstrucciones adicionales: ${agent.instructions}` : ''),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      cost: this.calculateCost((data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)),
      model: agent.model,
      agentName: agent.name
    };
  }

  /**
   * Llamar agente Gemini
   */
  private async callGeminiAgent(agent: any, prompt: string) {
    const providerConfig = agent.providerConfig as any;
    const apiKey = providerConfig?.apiKey || process.env.GOOGLE_API_KEY;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${agent.model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${agent.systemPrompt}${agent.instructions ? `\n\nInstrucciones adicionales: ${agent.instructions}` : ''}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: Number(agent.temperature),
          maxOutputTokens: agent.maxTokens
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      cost: this.calculateCost(data.usageMetadata?.totalTokenCount || 0),
      model: agent.model,
      agentName: agent.name
    };
  }

  /**
   * Calcular tokens necesarios basado en la complejidad de la conversación
   */
  private calculateRequiredTokens(transcript: ConversationTranscript, analysisType?: string): number {
    const baseTokens = 1500; // Tokens mínimos para análisis básico
    const { messages, duration, totalWords } = transcript;
    
    // Factor de complejidad basado en cantidad de mensajes
    const messageComplexity = Math.min(messages.length * 50, 1000);
    
    // Factor de complejidad basado en duración (más tiempo = más contexto)
    const durationComplexity = Math.min(Math.floor(duration / 60) * 100, 800);
    
    // Factor de complejidad basado en palabras totales
    const wordComplexity = Math.min(Math.floor(totalWords / 100) * 25, 600);
    
    // Factor de complejidad por intercambios (más turnos = más complejo)
    const interactionComplexity = messages.length > 10 ? Math.min((messages.length - 10) * 30, 400) : 0;
    
    // Detectar conversaciones con potencial complejidad alta
    const averageWordsPerMessage = totalWords / Math.max(messages.length, 1);
    const verbosityBonus = averageWordsPerMessage > 50 ? 300 : averageWordsPerMessage > 25 ? 150 : 0;
    
    // Detectar conversaciones cortas pero densas (pocos mensajes pero muchas palabras)
    const densityBonus = (messages.length < 5 && totalWords > 200) ? 200 : 0;
    
    // Calcular tokens base por complejidad
    let calculatedTokens = baseTokens + messageComplexity + durationComplexity + wordComplexity + interactionComplexity + verbosityBonus + densityBonus;
    
    // Ajustar por tipo de análisis específico
    if (analysisType === 'complete' || analysisType === 'sentiment') {
      calculatedTokens = Math.floor(calculatedTokens * 1.5); // 50% más para análisis completo
    } else if (analysisType === 'insights') {
      calculatedTokens = Math.floor(calculatedTokens * 1.3); // 30% más para insights
    } else if (analysisType === 'quality') {
      calculatedTokens = Math.floor(calculatedTokens * 1.2); // 20% más para análisis de calidad
    }
    
    // Límites mínimos y máximos inteligentes
    const minTokens = 1000;
    let maxTokens = 6000;
    
    // Para conversaciones muy largas, aumentar el límite máximo
    if (totalWords > 1000 || messages.length > 30) {
      maxTokens = 8000;
    }
    
    const finalTokens = Math.max(minTokens, Math.min(maxTokens, calculatedTokens));
    
    // Determinar eficiencia esperada
    const complexityRating = finalTokens <= 2000 ? 'Baja' : finalTokens <= 4000 ? 'Media' : 'Alta';
    const costEstimate = (finalTokens * 0.000015).toFixed(6);
    
    console.log('🔢 [ANALIZADOR] CÁLCULO INTELIGENTE DE TOKENS:');
    console.log(`   📊 Mensajes: ${messages.length} → +${messageComplexity} tokens`);
    console.log(`   ⏱️ Duración: ${Math.floor(duration / 60)} min → +${durationComplexity} tokens`);
    console.log(`   📝 Palabras: ${totalWords} → +${wordComplexity} tokens`);
    console.log(`   🔄 Interacciones: ${messages.length} → +${interactionComplexity} tokens`);
    console.log(`   📖 Verbosidad: ${averageWordsPerMessage.toFixed(1)} p/msg → +${verbosityBonus} tokens`);
    console.log(`   💎 Densidad: ${densityBonus > 0 ? 'Alta' : 'Normal'} → +${densityBonus} tokens`);
    console.log(`   🎯 Tipo análisis: ${analysisType || 'standard'}`);
    console.log(`   📈 Tokens calculados: ${calculatedTokens}`);
    console.log(`   ✅ Tokens asignados: ${finalTokens} (min: ${minTokens}, max: ${maxTokens})`);
    console.log(`   🎚️ Complejidad: ${complexityRating} | Costo estimado: $${costEstimate}`);
    
    return finalTokens;
  }

  /**
   * Llamar OpenAI directamente con configuración del .env
   */
  private async callDirectOpenAI(prompt: string, analysisType?: string, customTemperature?: number, transcript?: ConversationTranscript) {
    try {
      console.log('🤖 [ANALIZADOR] Llamando a OpenAI directamente desde configuración .env');
      
      const apiKey = process.env.OPENAI_API_KEY;
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      
      // 🚀 NUEVA IMPLEMENTACIÓN: Tokens dinámicos basados en complejidad
      let maxTokens: number;
      
      if (transcript) {
        // Usar cálculo dinámico si tenemos datos de transcript
        maxTokens = this.calculateRequiredTokens(transcript, analysisType);
      } else {
        // Fallback al sistema anterior si no hay transcript
        maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');
        if (analysisType === 'sentiment' || analysisType === 'complete') {
          maxTokens = Math.floor(maxTokens * 1.5);
        } else if (analysisType === 'insights') {
          maxTokens = Math.floor(maxTokens * 1.3);
        } else if (analysisType === 'quality') {
          maxTokens = Math.floor(maxTokens * 1.2);
        }
      }
      
      const endpoint = 'https://api.openai.com/v1/chat/completions';
      
      // 📊 LOG DETALLADO DE CONFIGURACIÓN
      console.log('📋 [ANALIZADOR] CONFIGURACIÓN ANÁLISIS:');
      console.log(`   🎯 Modelo: ${model}`);
      console.log(`   🔗 Endpoint: ${endpoint}`);
      console.log(`   🔑 API Key: ${apiKey ? `${apiKey.substring(0, 20)}...` : 'NO ENCONTRADA'}`);
      console.log(`   🎛️ Max Tokens: ${maxTokens} ${transcript ? '(dinámico)' : '(fijo)'} - Tipo: ${analysisType || 'standard'}`);
      console.log(`   🌡️ Temperature: ${customTemperature ?? 0.3} ${customTemperature ? '(personalizada)' : '(por defecto)'}`);
      console.log(`   📝 Prompt Length: ${prompt.length} caracteres`);
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY no encontrada en variables de entorno');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Eres un experto analista de conversaciones de ventas. Analiza conversaciones y extrae insights precisos en formato JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: customTemperature ?? 0.3,
          max_tokens: maxTokens
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 🚨 LOG DETALLADO DE ERROR
        console.error('🚨 [ANALIZADOR] ERROR EN ANÁLISIS:');
        console.error(`   🎯 Modelo: ${model}`);
        console.error(`   🔗 Endpoint: ${endpoint}`);
        console.error(`   📊 Status: ${response.status}`);
        console.error(`   📄 Error completo: ${errorText}`);
        console.error(`   ⚠️ Headers:`, Object.fromEntries(response.headers.entries()));
        
        // Primero, verificar si es un error de cuota, que también puede dar 429
        if (errorText.includes('insufficient_quota')) {
          console.error('💳 [ANALIZADOR] DIAGNÓSTICO: Sin créditos/cuota insuficiente');
          throw new Error('insufficient_quota');
        }

        // Si es 429 y no es por cuota, es rate limit, entonces reintentar
        if (response.status === 429) {
          console.log('⏳ [ANALIZADOR] Límite de velocidad detectado, esperando 60 segundos...');
          await new Promise(resolve => setTimeout(resolve, 60000));
          
          console.log('🔄 [ANALIZADOR] Reintentando después del límite de velocidad...');
          const retryResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: 'Eres un experto analista de conversaciones de ventas. Analiza conversaciones y extrae insights precisos en formato JSON.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: customTemperature ?? 0.3,
              max_tokens: maxTokens
            })
          });
          
          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            // También verificar error de cuota en el reintento
            if (retryErrorText.includes('insufficient_quota')) {
               console.error('❌ [ANALIZADOR] Error de OpenAI API en reintento: Cuota Insuficiente');
               throw new Error('insufficient_quota');
            }
            throw new Error(`OpenAI API error después de retry: ${retryResponse.status} - ${retryErrorText}`);
          }
          
          return await retryResponse.json();
        }
        
        // Si es 503 (Service Unavailable), reintentar una vez después de 10 segundos
        if (response.status === 503) {
          console.log('🔄 [ANALIZADOR] OpenAI 503 detectado, esperando 10 segundos...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          console.log('🔄 [ANALIZADOR] Reintentando después de error 503...');
          const retryResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: 'Eres un experto analista de conversaciones de ventas. Analiza conversaciones y extrae insights precisos en formato JSON.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: customTemperature ?? 0.3,
              max_tokens: maxTokens
            })
          });
          
          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text();
            console.error('❌ [ANALIZADOR] Reintento también falló:', retryResponse.status, retryErrorText);
            throw new Error(`OpenAI API error después de retry 503: ${retryResponse.status} - ${retryErrorText}`);
          }
          
          return await retryResponse.json();
        }
        
        // Para todos los demás errores que no son 429
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // 📊 LOG DETALLADO DE RESULTADOS
      console.log('✅ [ANALIZADOR] ANÁLISIS EXITOSO:');
      console.log(`   🎯 Modelo usado: ${model}`);
      console.log(`   🔗 Endpoint: ${endpoint}`);
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   🏷️ Tokens reservados: ${maxTokens} ${transcript ? '(calculados dinámicamente)' : '(fijos)'}`);
      console.log(`   🏷️ Tokens realmente usados: ${data.usage?.total_tokens || 0}`);
      console.log(`   💡 Eficiencia: ${maxTokens > 0 ? Math.round(((data.usage?.total_tokens || 0) / maxTokens) * 100) : 0}% de tokens reservados utilizados`);
      console.log(`   💰 Costo estimado: $${((data.usage?.total_tokens || 0) * 0.000015).toFixed(6)} (ULTRA ECONÓMICO)`);
      console.log(`   📝 Respuesta length: ${data.choices[0].message.content?.length || 0} caracteres`);
      console.log(`   🔍 Primera parte respuesta: ${data.choices[0].message.content?.substring(0, 100)}...`);
      
      return {
        content: data.choices[0].message.content,
        tokensUsed: data.usage?.total_tokens || 0,
        cost: this.calculateCost(data.usage?.total_tokens || 0),
        model: model,
        agentName: 'OpenAI Direct'
      };
      
    } catch (error) {
      console.error(`❌ [ANALIZADOR] OpenAI API falló: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Procesar respuesta de IA y extraer datos estructurados
   */
  private parseAIResponse(aiResponse: any): any {
    try {
      // Si es respuesta real de OpenAI
      const jsonContent = aiResponse.content || aiResponse;
      
      // Limpiar respuesta y extraer JSON
      let cleanJson = jsonContent;
      if (typeof cleanJson === 'string') {
        // Remover markdown code blocks si existen
        cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanJson = cleanJson.trim();
      }

      const parsed = JSON.parse(cleanJson);
      
      // Validar estructura básica
      this.validateAnalysisStructure(parsed);
      
      return parsed;
      
    } catch (error) {
      console.error('❌ [ANALIZADOR] Error parseando respuesta de IA:', error);
      console.error('Respuesta recibida:', aiResponse);
      
      // Retornar estructura por defecto en caso de error
      return this.getDefaultAnalysisStructure();
    }
  }

  /**
   * Validar estructura del análisis
   */
  private validateAnalysisStructure(analysis: any): void {
    const requiredFields = [
      'sentiment', 'quality', 'insights', 'engagement', 
      'predictions', 'metrics', 'confidence', 'fullAnalysis'
    ];
    
    for (const field of requiredFields) {
      // Usar hasOwnProperty para verificar existencia, no solo truthiness
      // Esto permite valores como 0, false, "" que son válidos pero falsy
      if (!analysis.hasOwnProperty(field) || analysis[field] === null || analysis[field] === undefined) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }
    
    // Validación adicional para campos críticos con estructura específica
    if (typeof analysis.sentiment !== 'object' || !analysis.sentiment.overall) {
      throw new Error('Campo sentiment.overall requerido');
    }
    if (typeof analysis.quality !== 'object') {
      throw new Error('Campo quality debe ser un objeto');
    }
    if (!Array.isArray(analysis.insights.keyTopics)) {
      throw new Error('Campo insights.keyTopics debe ser un array');
    }
  }

  /**
   * Calcular costo de análisis
   */
  private calculateCost(tokens: number): number {
    // Precios de GPT-4o-mini (el más barato)
    const costPerToken = 0.000015; // $0.15 per 1M tokens (súper barato!)
    return tokens * costPerToken;
  }


  /**
   * Estructura por defecto en caso de error
   */
  private getDefaultAnalysisStructure(): any {
    return {
      sentiment: {
        overall: "neutral" as SentimentType,
        score: 0,
        confidence: 0.5,
        reasoning: "Análisis no disponible"
      },
      quality: {
        overall: 50,
        agentPerformance: 50,
        flow: "fair" as ConversationFlow,
        reasoning: "Análisis no disponible"
      },
      insights: {
        keyTopics: [],
        painPoints: [],
        buyingSignals: [],
        objections: [],
        competitors: []
      },
      engagement: {
        interestLevel: 5,
        score: 50,
        responseQuality: "fair" as ResponseQuality,
        reasoning: "Análisis no disponible"
      },
      predictions: {
        conversionLikelihood: 50,
        recommendedAction: "qualify_further" as RecommendedAction,
        urgency: "medium" as UrgencyLevel,
        followUpTimeline: "1_week" as FollowUpTimeline,
        reasoning: "Análisis no disponible"
      },
      metrics: {
        questionsAsked: 0,
        questionsAnswered: 0,
        interruptions: 0,
        talkTimeRatio: 0.5
      },
      confidence: 30,
      fullAnalysis: {
        summary: "Análisis no disponible",
        strengths: [],
        improvements: [],
        nextSteps: ["Revisar transcripción manualmente"]
      }
    };
  }
}

/**
 * FUNCIONES DE UTILIDAD
 */

/**
 * Convertir transcripción de ElevenLabs a formato estándar
 */
export function convertElevenLabsTranscript(rawTranscript: any[]): ConversationTranscript {
  // 🔍 DEBUG: Log input data
  console.log('🔄 [TRANSCRIPT CONVERTER] Converting ElevenLabs transcript:');
  console.log(`   📊 Raw transcript type: ${typeof rawTranscript}`);
  console.log(`   📊 Is array: ${Array.isArray(rawTranscript)}`);
  console.log(`   📊 Length: ${Array.isArray(rawTranscript) ? rawTranscript.length : 'N/A'}`);
  
  // Handle empty or invalid input
  if (!Array.isArray(rawTranscript) || rawTranscript.length === 0) {
    console.log('   ⚠️ Raw transcript is empty or invalid, returning empty transcript');
    return {
      messages: [],
      duration: 0,
      totalWords: 0,
      participantCount: 0
    };
  }

  const messages = rawTranscript.map((msg, index) => {
    console.log(`   📝 Message ${index + 1}:`, {
      role: msg.role,
      content: (msg.message || msg.text || '').substring(0, 50) + '...',
      timestamp: msg.time_in_call_secs,
      confidence: msg.confidence
    });
    
    return {
      role: msg.role === 'agent' ? 'agent' as const : 'lead' as const,
      content: msg.message || msg.text || '',
      timestamp: msg.time_in_call_secs || 0,
      confidence: msg.confidence || 0.9
    };
  });

  const totalWords = messages.reduce((sum, msg) => 
    sum + (msg.content ? msg.content.split(' ').length : 0), 0
  );

  const duration = Math.max(...messages.map(msg => msg.timestamp)) || 0;

  const result = {
    messages,
    duration,
    totalWords,
    participantCount: messages.length > 0 ? 2 : 0 // Agente + Lead si hay mensajes
  };
  
  console.log('✅ [TRANSCRIPT CONVERTER] Conversion complete:', {
    messagesCount: result.messages.length,
    duration: result.duration,
    totalWords: result.totalWords,
    participantCount: result.participantCount
  });

  return result;
}

/**
 * Instancia global del analizador
 */
export const conversationAnalyzer = new ConversationAnalyzer();

/**
 * FUNCIONES PÚBLICAS PARA EL FRONTEND
 */

/**
 * Verificar si hay agentes de análisis disponibles para un tenant
 */
export async function checkAnalysisAgents(tenantId: string) {
  try {
    const analyzer = new ConversationAnalyzer();
    const agents = await (analyzer as any).findAnalysisAgents(tenantId);
    
    return {
      success: true,
      hasAgents: agents.length > 0,
      agentCount: agents.length,
      agents: agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        provider: agent.provider,
        model: agent.model,
        purpose: agent.purpose
      }))
    };
  } catch (error) {
    console.error('❌ [VERIFICAR_AGENTES] Error:', error);
    return {
      success: false,
      hasAgents: false,
      agentCount: 0,
      agents: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}