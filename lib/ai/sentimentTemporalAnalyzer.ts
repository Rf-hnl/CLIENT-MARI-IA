/**
 * TEMPORAL SENTIMENT ANALYZER
 * 
 * Servicio para análisis de sentiment multinivel con segmentos temporales
 * Extiende el sistema existente para análisis más detallado por períodos de tiempo
 */

import { OpenAI } from 'openai';
import { SentimentTimeline, SentimentPoint, SentimentChange, CriticalMoment } from '@/types/bulkCalls';

// Configuración para análisis temporal
interface TemporalAnalysisConfig {
  segmentDurationSeconds?: number;  // Duración de cada segmento (default: 30s)
  overlapSeconds?: number;          // Superposición entre segmentos (default: 5s)
  minSegmentLength?: number;        // Mínima duración para analizar (default: 10s)
  model?: 'gpt-4o' | 'gpt-4o-mini'; // Modelo de OpenAI
  temperature?: number;             // Creatividad del análisis
}

interface ConversationMessage {
  role: 'agent' | 'lead' | 'system';
  content: string;
  timestamp: number; // Segundos desde el inicio
  confidence?: number;
}

interface ConversationTranscript {
  messages: ConversationMessage[];
  duration: number; // Duración total en segundos
  totalWords: number;
  participantCount: number;
}

export class SentimentTemporalAnalyzer {
  private openai: OpenAI;
  private config: TemporalAnalysisConfig;

  constructor(config: TemporalAnalysisConfig = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.config = {
      segmentDurationSeconds: 30,
      overlapSeconds: 5,
      minSegmentLength: 10,
      model: 'gpt-4o-mini',
      temperature: 0.3,
      ...config
    };
  }

  /**
   * Análisis principal de sentiment temporal
   */
  async analyzeSentimentTimeline(
    transcript: ConversationTranscript,
    leadContext?: {
      name: string;
      company?: string;
      previousAnalyses?: number;
      currentStatus: string;
    }
  ): Promise<SentimentTimeline> {
    try {
      console.log('🕐 [TEMPORAL SENTIMENT] Starting temporal sentiment analysis');
      console.log(`📊 Duration: ${transcript.duration}s, Messages: ${transcript.messages.length}`);

      // 1. Segmentar la conversación por tiempo
      const segments = this.createTimeSegments(transcript);
      console.log(`🔀 Created ${segments.length} temporal segments`);

      // 2. Analizar sentiment por cada segmento
      const sentimentPoints = await this.analyzeSentimentBySegments(segments, leadContext);
      
      // 3. Detectar cambios significativos de sentiment
      const sentimentChanges = this.detectSentimentChanges(sentimentPoints);
      
      // 4. Identificar momentos críticos
      const criticalMoments = await this.identifyCriticalMoments(transcript, sentimentPoints, leadContext);
      
      // 5. Calcular sentiment general
      const overallSentiment = this.calculateOverallSentiment(sentimentPoints);

      const timeline: SentimentTimeline = {
        overallSentiment,
        sentimentProgression: sentimentPoints,
        sentimentChanges,
        criticalMoments
      };

      console.log('✅ [TEMPORAL SENTIMENT] Analysis complete');
      console.log(`📈 Overall: ${overallSentiment.label} (${overallSentiment.score.toFixed(2)})`);
      console.log(`🔄 Changes detected: ${sentimentChanges.length}`);
      console.log(`⚠️ Critical moments: ${criticalMoments.length}`);

      return timeline;

    } catch (error) {
      console.error('❌ [TEMPORAL SENTIMENT] Error in temporal analysis:', error);
      throw new Error(`Temporal sentiment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crear segmentos temporales de la conversación
   */
  private createTimeSegments(transcript: ConversationTranscript): ConversationMessage[][] {
    const { segmentDurationSeconds = 30, overlapSeconds = 5 } = this.config;
    const segments: ConversationMessage[][] = [];
    
    const totalDuration = transcript.duration;
    let currentStart = 0;

    while (currentStart < totalDuration) {
      const segmentEnd = Math.min(currentStart + segmentDurationSeconds, totalDuration);
      
      // Obtener mensajes dentro de este segmento temporal
      const segmentMessages = transcript.messages.filter(message => 
        message.timestamp >= currentStart && message.timestamp <= segmentEnd
      );

      if (segmentMessages.length > 0) {
        segments.push(segmentMessages);
      }

      // Avanzar con superposición
      currentStart += (segmentDurationSeconds - overlapSeconds);
    }

    return segments;
  }

  /**
   * Analizar sentiment por cada segmento temporal
   */
  private async analyzeSentimentBySegments(
    segments: ConversationMessage[][],
    leadContext?: any
  ): Promise<SentimentPoint[]> {
    const sentimentPoints: SentimentPoint[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const timeStart = segment[0]?.timestamp || 0;
      const timeEnd = segment[segment.length - 1]?.timestamp || timeStart + 30;

      console.log(`🔍 [SEGMENT ${i + 1}/${segments.length}] Analyzing ${timeStart}s - ${timeEnd}s`);

      try {
        const analysis = await this.analyzeSegmentSentiment(segment, timeStart, timeEnd, leadContext);
        sentimentPoints.push(analysis);
        
        // Pequeña pausa para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.warn(`⚠️ [SEGMENT ${i + 1}] Error analyzing segment, using neutral:`, error);
        
        // Fallback para segmento con error
        sentimentPoints.push({
          timeStart,
          timeEnd,
          sentiment: 0,
          confidence: 0.3,
          dominantEmotion: 'uncertain',
          keyPhrases: ['Error en análisis']
        });
      }
    }

    return sentimentPoints;
  }

  /**
   * Analizar sentiment de un segmento específico
   */
  private async analyzeSegmentSentiment(
    segment: ConversationMessage[],
    timeStart: number,
    timeEnd: number,
    leadContext?: any
  ): Promise<SentimentPoint> {
    
    // Filtrar solo mensajes del lead para análisis de sentiment
    const leadMessages = segment.filter(msg => msg.role === 'lead');
    
    if (leadMessages.length === 0) {
      // No hay mensajes del lead en este segmento
      return {
        timeStart,
        timeEnd,
        sentiment: 0,
        confidence: 0.1,
        dominantEmotion: 'neutral',
        keyPhrases: ['Sin participación del cliente']
      };
    }

    const segmentText = segment
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    const prompt = this.buildSegmentAnalysisPrompt(segmentText, timeStart, timeEnd, leadContext);

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content || '{}';
      const analysis = this.parseSegmentResponse(content, timeStart, timeEnd);
      
      return analysis;

    } catch (error) {
      console.error('❌ Error analyzing segment sentiment:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para análisis de segmento
   */
  private buildSegmentAnalysisPrompt(
    segmentText: string,
    timeStart: number,
    timeEnd: number,
    leadContext?: any
  ): string {
    const contextInfo = leadContext ? 
      `CONTEXTO DEL LEAD: ${leadContext.name} de ${leadContext.company || 'empresa no especificada'}, estado: ${leadContext.currentStatus}` : 
      '';

    return `
ANALIZA EL SENTIMENT EN ESTE SEGMENTO TEMPORAL DE CONVERSACIÓN:

=== SEGMENTO: ${Math.floor(timeStart)}s - ${Math.floor(timeEnd)}s ===
${segmentText}

${contextInfo}

=== INSTRUCCIONES ===
Analiza ÚNICAMENTE el sentiment del CLIENTE/LEAD en este segmento específico.
Enfócate en emociones, tono y actitud del cliente durante estos segundos específicos.

Responde ÚNICAMENTE con este JSON:
{
  "sentiment": número entre -1.0 y 1.0,
  "confidence": número entre 0.0 y 1.0,
  "dominantEmotion": "happy|excited|interested|neutral|confused|frustrated|angry|worried|skeptical|disappointed",
  "keyPhrases": ["frase clave 1", "frase clave 2"],
  "reasoning": "breve explicación del sentiment detectado"
}

RESPONDE ÚNICAMENTE CON EL JSON.`;
  }

  /**
   * Parsear respuesta del análisis de segmento
   */
  private parseSegmentResponse(content: string, timeStart: number, timeEnd: number): SentimentPoint {
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      return {
        timeStart,
        timeEnd,
        sentiment: Math.max(-1, Math.min(1, parsed.sentiment || 0)),
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        dominantEmotion: parsed.dominantEmotion || 'neutral',
        keyPhrases: parsed.keyPhrases || []
      };

    } catch (error) {
      console.warn('⚠️ Error parsing segment response, using defaults:', error);
      return {
        timeStart,
        timeEnd,
        sentiment: 0,
        confidence: 0.3,
        dominantEmotion: 'neutral',
        keyPhrases: ['Error en análisis']
      };
    }
  }

  /**
   * Detectar cambios significativos de sentiment
   */
  private detectSentimentChanges(sentimentPoints: SentimentPoint[]): SentimentChange[] {
    const changes: SentimentChange[] = [];
    const SIGNIFICANT_CHANGE_THRESHOLD = 0.4; // Cambio mínimo significativo

    for (let i = 1; i < sentimentPoints.length; i++) {
      const previous = sentimentPoints[i - 1];
      const current = sentimentPoints[i];
      
      const sentimentDiff = current.sentiment - previous.sentiment;
      const magnitude = Math.abs(sentimentDiff);

      if (magnitude >= SIGNIFICANT_CHANGE_THRESHOLD) {
        changes.push({
          timePoint: current.timeStart,
          fromSentiment: previous.sentiment,
          toSentiment: current.sentiment,
          magnitude,
          triggerPhrase: current.keyPhrases[0] || 'Cambio detectado'
        });
      }
    }

    return changes;
  }

  /**
   * Identificar momentos críticos en la conversación
   */
  private async identifyCriticalMoments(
    transcript: ConversationTranscript,
    sentimentPoints: SentimentPoint[],
    leadContext?: any
  ): Promise<CriticalMoment[]> {
    // Identificar momentos con sentiment muy negativo o cambios dramáticos
    const criticalPoints = sentimentPoints.filter(point => 
      point.sentiment <= -0.6 || // Muy negativo
      point.sentiment >= 0.7 ||  // Muy positivo
      point.dominantEmotion === 'frustrated' ||
      point.dominantEmotion === 'excited' ||
      point.dominantEmotion === 'angry'
    );

    const criticalMoments: CriticalMoment[] = [];

    for (const point of criticalPoints) {
      // Obtener el contexto alrededor de este momento
      const contextMessages = transcript.messages.filter(msg => 
        msg.timestamp >= point.timeStart - 15 && // 15s antes
        msg.timestamp <= point.timeEnd + 15     // 15s después
      );

      const contextText = contextMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      try {
        const analysis = await this.analyzeCriticalMoment(contextText, point, leadContext);
        criticalMoments.push(analysis);
        
        // Pausa para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.warn('⚠️ Error analyzing critical moment:', error);
        
        // Fallback básico
        criticalMoments.push({
          timePoint: point.timeStart,
          type: point.sentiment > 0 ? 'interest_peak' : 'frustration',
          description: `Momento ${point.sentiment > 0 ? 'positivo' : 'negativo'} detectado`,
          impact: Math.abs(point.sentiment) > 0.7 ? 'high' : 'medium'
        });
      }
    }

    return criticalMoments;
  }

  /**
   * Analizar un momento crítico específico
   */
  private async analyzeCriticalMoment(
    contextText: string,
    sentimentPoint: SentimentPoint,
    leadContext?: any
  ): Promise<CriticalMoment> {
    const prompt = `
ANALIZA ESTE MOMENTO CRÍTICO EN UNA CONVERSACIÓN DE VENTAS:

=== CONTEXTO (${Math.floor(sentimentPoint.timeStart)}s) ===
${contextText}

=== INFORMACIÓN ===
Sentiment detectado: ${sentimentPoint.sentiment.toFixed(2)}
Emoción dominante: ${sentimentPoint.dominantEmotion}
Confianza: ${sentimentPoint.confidence.toFixed(2)}

=== TAREA ===
Identifica qué tipo de momento crítico es este y su importancia.

Responde ÚNICAMENTE con este JSON:
{
  "type": "objection|interest_peak|frustration|buying_signal",
  "description": "descripción breve del momento y su causa",
  "impact": "high|medium|low",
  "reasoning": "por qué es importante este momento"
}

RESPONDE ÚNICAMENTE CON EL JSON.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content || '{}';
      const analysis = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

      return {
        timePoint: sentimentPoint.timeStart,
        type: analysis.type || 'frustration',
        description: analysis.description || 'Momento crítico detectado',
        impact: analysis.impact || 'medium'
      };

    } catch (error) {
      console.warn('⚠️ Error analyzing critical moment:', error);
      return {
        timePoint: sentimentPoint.timeStart,
        type: sentimentPoint.sentiment > 0 ? 'interest_peak' : 'frustration',
        description: 'Momento crítico identificado automáticamente',
        impact: Math.abs(sentimentPoint.sentiment) > 0.7 ? 'high' : 'medium'
      };
    }
  }

  /**
   * Calcular sentiment general basado en segmentos
   */
  private calculateOverallSentiment(sentimentPoints: SentimentPoint[]): {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  } {
    if (sentimentPoints.length === 0) {
      return { score: 0, label: 'neutral', confidence: 0.5 };
    }

    // Calcular promedio ponderado por confianza
    const totalWeightedSentiment = sentimentPoints.reduce((sum, point) => 
      sum + (point.sentiment * point.confidence), 0
    );
    const totalWeight = sentimentPoints.reduce((sum, point) => sum + point.confidence, 0);
    
    const averageSentiment = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;
    const averageConfidence = sentimentPoints.reduce((sum, point) => sum + point.confidence, 0) / sentimentPoints.length;

    let label: 'positive' | 'neutral' | 'negative';
    if (averageSentiment > 0.2) {
      label = 'positive';
    } else if (averageSentiment < -0.2) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    return {
      score: averageSentiment,
      label,
      confidence: averageConfidence
    };
  }

  /**
   * Método utilitario para convertir transcripciones de diferentes formatos
   */
  static convertTranscript(rawTranscript: any): ConversationTranscript {
    // Manejar diferentes formatos de transcripción
    if (rawTranscript.messages && Array.isArray(rawTranscript.messages)) {
      // Formato estándar
      return {
        messages: rawTranscript.messages.map((msg: any, index: number) => ({
          role: msg.role || 'system',
          content: msg.content || msg.message || '',
          timestamp: msg.timestamp || index * 30, // Estimación si no hay timestamp
          confidence: msg.confidence || 0.8
        })),
        duration: rawTranscript.duration || 300, // Default 5 minutos
        totalWords: rawTranscript.totalWords || 0,
        participantCount: 2
      };
    } else if (rawTranscript.transcript?.raw) {
      // Formato ElevenLabs
      return {
        messages: rawTranscript.transcript.raw.map((msg: any, index: number) => ({
          role: msg.role || 'system',
          content: msg.message || msg.content || '',
          timestamp: msg.timestamp || index * 30,
          confidence: msg.confidence || 0.8
        })),
        duration: rawTranscript.conversationDetails?.duration || 300,
        totalWords: 0,
        participantCount: 2
      };
    }

    throw new Error('Invalid transcript format');
  }
}

export default SentimentTemporalAnalyzer;