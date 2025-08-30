/**
 * CALL PERSONALIZER SERVICE
 * 
 * Motor principal de personalización de llamadas con IA
 * Analiza contexto del lead y genera scripts personalizados
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import {
  LeadContext,
  PersonalizationRequest,
  PersonalizedScript,
  PersonalizationResult,
  ContextAnalysis,
  PersonalizationStrategy,
  CallObjective,
  PersonalityProfile,
  CommunicationStyle,
  ScriptSection,
  PersonalizedElement,
  CallPersonalizerConfig,
  DEFAULT_PERSONALIZATION_CONFIG,
  STRATEGY_DESCRIPTIONS,
  OBJECTIVE_DESCRIPTIONS
} from '@/types/personalization';

export class CallPersonalizer {
  private openai: OpenAI;
  private config: CallPersonalizerConfig;
  private contextCache: Map<string, { analysis: ContextAnalysis; timestamp: Date }> = new Map();

  constructor(config?: Partial<CallPersonalizerConfig>) {
    this.config = { ...DEFAULT_PERSONALIZATION_CONFIG, ...config };
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    console.log('🤖 [CALL PERSONALIZER] Initialized with config:', {
      model: this.config.defaultModel,
      abTesting: this.config.enableABTesting,
      caching: this.config.enableContextCaching
    });
  }

  /**
   * Generar script personalizado para un lead
   */
  async personalizeCall(request: PersonalizationRequest): Promise<PersonalizationResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎯 [CALL PERSONALIZER] Starting personalization for lead:', {
        leadId: request.leadContext.leadId.slice(0, 8) + '...',
        objective: request.callObjective,
        strategy: request.preferredStrategy || 'auto-select'
      });

      // 1. Analizar contexto del lead si es necesario
      let contextAnalysis = await this.getOrAnalyzeContext(request.leadContext.leadId);
      if (!contextAnalysis) {
        contextAnalysis = await this.analyzeLeadContext(request.leadContext);
      }

      // 2. Determinar estrategia óptima
      const strategy = request.preferredStrategy || contextAnalysis.recommendedStrategy;

      // 3. Generar script personalizado
      const script = await this.generatePersonalizedScript(
        request,
        contextAnalysis,
        strategy
      );

      const processingTime = Date.now() - startTime;

      console.log('✅ [CALL PERSONALIZER] Script generated successfully:', {
        scriptId: script.id,
        strategy: script.strategy,
        confidence: script.confidence,
        duration: script.estimatedDuration,
        processingTime: processingTime + 'ms'
      });

      return {
        success: true,
        script,
        processingTime,
        tokensUsed: this.estimateTokensUsed(script),
        confidence: script.confidence,
        recommendations: this.generateRecommendations(contextAnalysis, script),
        warnings: this.generateWarnings(contextAnalysis, script)
      };

    } catch (error) {
      console.error('❌ [CALL PERSONALIZER] Error in personalization:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        confidence: 0
      };
    }
  }

  /**
   * Analizar contexto completo del lead
   */
  async analyzeLeadContext(leadContext: LeadContext): Promise<ContextAnalysis> {
    try {
      console.log('🔍 [CALL PERSONALIZER] Analyzing lead context:', leadContext.leadId.slice(0, 8) + '...');

      // Obtener datos adicionales del lead desde la base de datos
      const leadData = await this.enrichLeadContext(leadContext);

      // Prompt para análisis de contexto
      const contextPrompt = this.buildContextAnalysisPrompt(leadData);

      const response = await this.openai.chat.completions.create({
        model: this.config.defaultModel,
        messages: [
          {
            role: 'system',
            content: `Eres un experto analista de leads y psicología de ventas. Analiza el contexto del lead y determina:
            1. Perfil de personalidad del lead
            2. Estilo de comunicación preferido  
            3. Estrategia de ventas más efectiva
            4. Factores de valor clave
            5. Objeciones potenciales
            
            Responde SOLO con un JSON válido siguiendo exactamente esta estructura:
            {
              "personalityProfile": "analytical|driver|expressive|amiable",
              "communicationStyle": "formal|casual|technical|business", 
              "recommendedStrategy": "consultative|direct|educational|relationship|urgency|social_proof",
              "keyValueDrivers": ["driver1", "driver2"],
              "potentialObjections": ["objection1", "objection2"],
              "recommendedApproach": {
                "openingStyle": "warm|professional|direct|question_based",
                "pacePreference": "fast|moderate|slow",
                "informationDensity": "high|medium|low"
              },
              "keyTalkingPoints": ["point1", "point2", "point3"],
              "avoidanceTopics": ["topic1", "topic2"],
              "profileConfidence": 85,
              "recommendationConfidence": 92
            }`
          },
          {
            role: 'user',
            content: contextPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parsear respuesta
      const analysisData = this.parseAIResponse(aiResponse);
      
      // Construir análisis completo
      const contextAnalysis: ContextAnalysis = {
        leadId: leadContext.leadId,
        analysisDate: new Date(),
        personalityProfile: analysisData.personalityProfile,
        communicationStyle: analysisData.communicationStyle,
        decisionMakingStyle: this.inferDecisionMakingStyle(analysisData.personalityProfile),
        
        // Patrones (simplificados para esta implementación)
        engagementPatterns: [],
        responsePatterns: [],
        preferenceIndicators: [],
        
        // Análisis de empresa y rol (inferidos de datos disponibles)
        companyAnalysis: this.analyzeCompanyContext(leadContext),
        roleAnalysis: this.analyzeRoleContext(leadContext),
        industryInsights: this.getIndustryInsights(leadContext.industry),
        
        // Insights de conversación
        topicAffinities: [],
        objectionPatterns: [],
        valueDrivers: analysisData.keyValueDrivers.map(driver => ({
          driver,
          importance: 80,
          evidence: ['Context analysis'],
          businessImpact: 'efficiency' as const
        })),
        
        // Recomendaciones
        recommendedStrategy: analysisData.recommendedStrategy,
        recommendedApproach: analysisData.recommendedApproach,
        keyTalkingPoints: analysisData.keyTalkingPoints,
        avoidanceTopics: analysisData.avoidanceTopics,
        
        // Confianza
        profileConfidence: analysisData.profileConfidence,
        recommendationConfidence: analysisData.recommendationConfidence,
        
        generatedBy: this.config.defaultModel,
        processingTime: Date.now() - Date.now()
      };

      // Cache del análisis
      if (this.config.enableContextCaching) {
        this.contextCache.set(leadContext.leadId, {
          analysis: contextAnalysis,
          timestamp: new Date()
        });
      }

      console.log('✅ [CALL PERSONALIZER] Context analysis completed:', {
        personality: contextAnalysis.personalityProfile,
        strategy: contextAnalysis.recommendedStrategy,
        confidence: contextAnalysis.profileConfidence
      });

      return contextAnalysis;

    } catch (error) {
      console.error('❌ [CALL PERSONALIZER] Error analyzing context:', error);
      throw error;
    }
  }

  /**
   * Generar script personalizado
   */
  private async generatePersonalizedScript(
    request: PersonalizationRequest,
    contextAnalysis: ContextAnalysis,
    strategy: PersonalizationStrategy
  ): Promise<PersonalizedScript> {
    try {
      console.log('📝 [CALL PERSONALIZER] Generating personalized script');

      const scriptPrompt = this.buildScriptGenerationPrompt(request, contextAnalysis, strategy);

      const response = await this.openai.chat.completions.create({
        model: this.config.defaultModel,
        messages: [
          {
            role: 'system',
            content: `Eres un experto en ventas consultivas y generación de scripts personalizados. 

            Genera un script de llamada ALTAMENTE PERSONALIZADO que:
            1. Se adapte a la personalidad y estilo del lead
            2. Use información específica del lead (nombre, empresa, industria)
            3. Aborde sus pain points y intereses identificados
            4. Siga la estrategia recomendada
            5. Incluya manejo de objeciones probables
            
            IMPORTANTE: Usa un tono ${contextAnalysis.communicationStyle} y enfoque ${strategy}.
            
            Responde SOLO con JSON válido siguiendo exactamente esta estructura:
            {
              "opening": {
                "title": "Apertura",
                "content": "Script de apertura personalizado...",
                "keyPoints": ["punto1", "punto2"],
                "estimatedDuration": 45,
                "personalizedElements": [
                  {
                    "type": "name",
                    "placeholder": "{{lead_name}}",
                    "actualValue": "${request.leadContext.name}",
                    "confidence": 100,
                    "source": "lead_data"
                  }
                ]
              },
              "discovery": {
                "title": "Descubrimiento",
                "content": "Preguntas de descubrimiento personalizadas...",
                "keyPoints": ["punto1", "punto2"],
                "estimatedDuration": 180,
                "personalizedElements": []
              },
              "presentation": {
                "title": "Presentación de Valor",
                "content": "Propuesta de valor personalizada...", 
                "keyPoints": ["punto1", "punto2"],
                "estimatedDuration": 240,
                "personalizedElements": []
              },
              "objectionHandling": {
                "title": "Manejo de Objeciones",
                "content": "Respuestas a objeciones comunes...",
                "keyPoints": ["punto1", "punto2"],
                "estimatedDuration": 120,
                "personalizedElements": []
              },
              "closing": {
                "title": "Cierre",
                "content": "Cierre personalizado con siguiente paso claro...",
                "keyPoints": ["punto1", "punto2"],
                "estimatedDuration": 90,
                "personalizedElements": []
              },
              "confidence": 88,
              "estimatedTotalDuration": 11,
              "keyPersonalizationFactors": ["factor1", "factor2", "factor3"],
              "suggestedToneOfVoice": "Profesional y consultivo"
            }`
          },
          {
            role: 'user',
            content: scriptPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 2500
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No script generated by OpenAI');
      }

      const scriptData = this.parseAIResponse(aiResponse);

      // Construir script personalizado
      const script: PersonalizedScript = {
        id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        leadId: request.leadContext.leadId,
        strategy,
        objective: request.callObjective,
        
        opening: scriptData.opening,
        discovery: scriptData.discovery,
        presentation: scriptData.presentation,
        objectionHandling: scriptData.objectionHandling,
        closing: scriptData.closing,
        
        confidence: scriptData.confidence,
        estimatedDuration: scriptData.estimatedTotalDuration,
        keyPersonalizationFactors: scriptData.keyPersonalizationFactors,
        suggestedToneOfVoice: scriptData.suggestedToneOfVoice,
        
        dynamicVariables: this.extractDynamicVariables(request.leadContext),
        
        createdAt: new Date(),
        generatedByModel: this.config.defaultModel
      };

      return script;

    } catch (error) {
      console.error('❌ [CALL PERSONALIZER] Error generating script:', error);
      throw error;
    }
  }

  /**
   * Obtener análisis de contexto desde cache o base de datos
   */
  private async getOrAnalyzeContext(leadId: string): Promise<ContextAnalysis | null> {
    try {
      // Verificar cache
      if (this.config.enableContextCaching) {
        const cached = this.contextCache.get(leadId);
        if (cached) {
          const ageMinutes = (Date.now() - cached.timestamp.getTime()) / (1000 * 60);
          if (ageMinutes < this.config.cacheExpirationMinutes) {
            console.log('📋 [CALL PERSONALIZER] Using cached context analysis');
            return cached.analysis;
          }
        }
      }

      // TODO: Buscar en base de datos si implementamos persistencia
      return null;

    } catch (error) {
      console.warn('⚠️ [CALL PERSONALIZER] Error getting cached context:', error);
      return null;
    }
  }

  /**
   * Enriquecer contexto del lead con datos de la base de datos
   */
  private async enrichLeadContext(leadContext: LeadContext): Promise<LeadContext> {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadContext.leadId },
        include: {
          conversationAnalysis: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          callLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
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

      if (!lead) {
        return leadContext;
      }

      // Enriquecer con datos de la BD
      return {
        ...leadContext,
        company: lead.company || leadContext.company,
        position: lead.position || leadContext.position,
        currentStatus: lead.status,
        qualificationScore: lead.qualificationScore,
        interestLevel: lead.interestLevel,
        lastSentimentScore: lead.lastSentimentScore ? Number(lead.lastSentimentScore) : undefined,
        lastEngagementScore: lead.lastEngagementScore || undefined,
        totalCalls: lead.callLogs.length,
        lastCallDate: lead.lastContactDate || undefined,
        // NEW: Campaign and products information
        campaignName: lead.campaign?.name || undefined,
        campaignDescription: lead.campaign?.description || undefined,
        campaignProducts: lead.campaign?.products?.map(cp => ({
          name: cp.product.name,
          description: cp.product.description || undefined,
          price: cp.product.price ? Number(cp.product.price) : undefined,
          sku: cp.product.sku || undefined
        })) || [],
        conversationHistory: lead.conversationAnalysis.map(analysis => ({
          conversationId: analysis.conversationId || `analysis_${analysis.id}`,
          date: analysis.createdAt,
          duration: 0, // TODO: Extract from call logs
          outcome: analysis.recommendedNextAction || 'unknown',
          keyTopics: analysis.keyTopics,
          sentiment: Number(analysis.sentiment) || 0,
          engagement: 0, // TODO: Calculate engagement
          objections: analysis.objections,
          buyingSignals: analysis.buyingSignals,
          nextSteps: analysis.recommendedNextAction
        }))
      };

    } catch (error) {
      console.warn('⚠️ [CALL PERSONALIZER] Error enriching lead context:', error);
      return leadContext;
    }
  }

  /**
   * Construir prompt para análisis de contexto
   */
  private buildContextAnalysisPrompt(leadContext: LeadContext): string {
    return `
ANÁLISIS DE CONTEXTO DEL LEAD:

=== INFORMACIÓN BÁSICA ===
Nombre: ${leadContext.name}
Empresa: ${leadContext.company || 'No especificada'}
Posición: ${leadContext.position || 'No especificada'}
Industria: ${leadContext.industry || 'No especificada'}

=== HISTORIAL DE INTERACCIONES ===
Total de llamadas: ${leadContext.totalCalls}
Última llamada: ${leadContext.lastCallDate?.toISOString() || 'Nunca'}
Resultado última llamada: ${leadContext.lastCallResult || 'No disponible'}
Patrón de respuesta: ${leadContext.responsePattern || 'No identificado'}

=== ANÁLISIS PREVIOS ===
Sentiment score: ${leadContext.lastSentimentScore || 'No disponible'}
Engagement score: ${leadContext.lastEngagementScore || 'No disponible'}
Score de calificación: ${leadContext.qualificationScore || 'No disponible'}
Nivel de interés: ${leadContext.interestLevel || 'No disponible'}

=== CONTEXTO DE NEGOCIO ===
Estado actual: ${leadContext.currentStatus}
Método de contacto preferido: ${leadContext.preferredContactMethod || 'No especificado'}
Mejor horario: ${leadContext.bestCallTimeWindow || 'No especificado'}
¿Indicó presupuesto?: ${leadContext.budgetIndicated ? 'Sí' : 'No'}
Nivel decision maker: ${leadContext.decisionMakerLevel || 'Desconocido'}

=== CAMPAÑA Y PRODUCTOS ===
Campaña origen: ${(leadContext as any).campaignName || 'Sin campaña específica'}
Descripción campaña: ${(leadContext as any).campaignDescription || 'N/A'}
Productos de la campaña: ${(leadContext as any).campaignProducts?.length > 0 ? 
  (leadContext as any).campaignProducts.map((p: any) => 
    `${p.name}${p.price ? ` ($${p.price})` : ''}${p.description ? ` - ${p.description}` : ''}`
  ).join(', ') : 'No hay productos específicos'}

=== OBJECIONES Y CONCERNS ===
Objeciones comunes: ${leadContext.commonObjections.join(', ') || 'Ninguna identificada'}
Pain points: ${leadContext.painPointsIdentified.join(', ') || 'No identificados'}
Intereses value prop: ${leadContext.valuePropInterests.join(', ') || 'No identificados'}

=== HISTORIAL DE CONVERSACIONES ===
${leadContext.conversationHistory.map(conv => `
- Fecha: ${conv.date.toISOString()}
- Duración: ${conv.duration}min
- Resultado: ${conv.outcome}
- Temas clave: ${conv.keyTopics.join(', ')}
- Sentiment: ${conv.sentiment}
- Objeciones: ${conv.objections.join(', ')}
- Buying signals: ${conv.buyingSignals.join(', ')}
`).join('\n')}

Analiza toda esta información y determina el perfil psicológico del lead, su estilo de comunicación preferido, y la estrategia de ventas más efectiva.
`.trim();
  }

  /**
   * Construir prompt para generación de script
   */
  private buildScriptGenerationPrompt(
    request: PersonalizationRequest,
    contextAnalysis: ContextAnalysis,
    strategy: PersonalizationStrategy
  ): string {
    const lead = request.leadContext;
    
    return `
GENERAR SCRIPT PERSONALIZADO PARA LLAMADA:

=== OBJETIVO DE LA LLAMADA ===
Objetivo: ${OBJECTIVE_DESCRIPTIONS[request.callObjective]}
Estrategia: ${STRATEGY_DESCRIPTIONS[strategy]}

=== PERFIL DEL LEAD ===
Nombre: ${lead.name}
Empresa: ${lead.company || 'No especificada'}
Posición: ${lead.position || 'No especificada'}  
Industria: ${lead.industry || 'General'}
Personalidad: ${contextAnalysis.personalityProfile}
Estilo comunicación: ${contextAnalysis.communicationStyle}

=== INFORMACIÓN DE CAMPAÑA ===
Campaña origen: ${(lead as any).campaignName || 'Sin campaña específica'}
Descripción: ${(lead as any).campaignDescription || 'N/A'}
Productos a ofrecer: ${(lead as any).campaignProducts?.length > 0 ? 
  (lead as any).campaignProducts.map((p: any) => 
    `${p.name}${p.price ? ` ($${p.price})` : ''}${p.description ? ` - ${p.description}` : ''}`
  ).join('\n  ') : 'No hay productos específicos'}

=== CONTEXTO PREVIO ===
Estado actual: ${lead.currentStatus}
Última interacción: ${lead.lastCallDate?.toISOString() || 'Primera llamada'}
Sentiment previo: ${lead.lastSentimentScore || 'No disponible'}
Engagement previo: ${lead.lastEngagementScore || 'No disponible'}

=== FACTORES CLAVE ===
Talking points principales: ${contextAnalysis.keyTalkingPoints.join(', ')}
Value drivers: ${contextAnalysis.valueDrivers.map(v => v.driver).join(', ')}
Evitar temas: ${contextAnalysis.avoidanceTopics.join(', ')}

=== OBJECIONES PROBABLES ===
${lead.commonObjections.map(obj => `- ${obj}`).join('\n')}

=== INSTRUCCIONES ESPECIALES ===
${request.customInstructions || 'Ninguna'}

Genera un script conversacional y natural que:
1. Use el nombre del lead frecuentemente
2. Referencie su empresa e industria específicamente  
3. Aborde sus pain points conocidos
4. Use ejemplos relevantes a su contexto
5. Mantenga un tono ${contextAnalysis.communicationStyle}
6. Siga un enfoque ${strategy}
7. Incluya transiciones naturales entre secciones
8. Sea específico y accionable
9. IMPORTANTE: Si el lead proviene de una campaña específica, menciona la campaña y enfócate en los productos asociados
10. IMPORTANTE: Si hay productos específicos de la campaña, úsalos como ejemplos concretos y menciona precios si están disponibles
11. IMPORTANTE: Adapta el mensaje según el contexto de la campaña (ej: "Sobre la promoción que viste..." si es de campaña)
`.trim();
  }

  /**
   * Parsear respuesta JSON de OpenAI con manejo de errores
   */
  private parseAIResponse(response: string): any {
    try {
      // Limpiar respuesta de posibles caracteres extra
      const cleanResponse = response.trim();
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('❌ [CALL PERSONALIZER] Error parsing AI response:', error);
      console.error('Response was:', response);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  /**
   * Extraer variables dinámicas del contexto
   */
  private extractDynamicVariables(leadContext: LeadContext): Record<string, string> {
    const campaignName = (leadContext as any).campaignName;
    const campaignProducts = (leadContext as any).campaignProducts || [];
    
    return {
      lead_name: leadContext.name,
      company_name: leadContext.company || 'su empresa',
      industry: leadContext.industry || 'su industria',
      position: leadContext.position || 'su posición',
      current_status: leadContext.currentStatus,
      qualification_score: leadContext.qualificationScore?.toString() || 'N/A',
      // NEW: Campaign variables
      campaign_name: campaignName || 'sin campaña específica',
      campaign_description: (leadContext as any).campaignDescription || '',
      campaign_products: campaignProducts.length > 0 ? 
        campaignProducts.map((p: any) => p.name).join(', ') : 'productos generales',
      product_list: campaignProducts.length > 0 ? 
        campaignProducts.map((p: any) => 
          `${p.name}${p.price ? ` ($${p.price})` : ''}`
        ).join(', ') : 'nuestros servicios'
    };
  }

  /**
   * Generar recomendaciones basadas en el análisis
   */
  private generateRecommendations(contextAnalysis: ContextAnalysis, script: PersonalizedScript): string[] {
    const recommendations: string[] = [];

    if (contextAnalysis.profileConfidence < 70) {
      recommendations.push('Confianza del perfil baja - considera hacer más preguntas de descubrimiento');
    }

    if (script.confidence < 80) {
      recommendations.push('Script generado con confianza media - revisa y personaliza más');
    }

    if (contextAnalysis.personalityProfile === 'analytical') {
      recommendations.push('Lead analítico - incluye datos, estadísticas y casos de estudio');
    }

    if (contextAnalysis.personalityProfile === 'driver') {
      recommendations.push('Lead orientado a resultados - enfócate en ROI y beneficios tangibles');
    }

    return recommendations;
  }

  /**
   * Generar warnings sobre el script
   */
  private generateWarnings(contextAnalysis: ContextAnalysis, script: PersonalizedScript): string[] {
    const warnings: string[] = [];

    if (contextAnalysis.avoidanceTopics.length > 0) {
      warnings.push(`Evita mencionar: ${contextAnalysis.avoidanceTopics.join(', ')}`);
    }

    if (script.estimatedDuration > 20) {
      warnings.push('Script largo - considera acortarlo para mantener atención');
    }

    return warnings;
  }

  /**
   * Inferir estilo de toma de decisiones
   */
  private inferDecisionMakingStyle(personality: PersonalityProfile): 'analytical' | 'intuitive' | 'consensus' | 'authority' {
    const mapping: Record<PersonalityProfile, 'analytical' | 'intuitive' | 'consensus' | 'authority'> = {
      analytical: 'analytical',
      driver: 'authority',
      expressive: 'intuitive',
      amiable: 'consensus'
    };
    return mapping[personality];
  }

  /**
   * Analizar contexto de empresa
   */
  private analyzeCompanyContext(leadContext: LeadContext): any {
    // Simplificado - en implementación real usaría APIs externas
    return {
      size: 'unknown',
      stage: 'unknown',
      culture: 'unknown',
      decisionSpeed: 'moderate',
      budgetIndicators: leadContext.budgetIndicated ? 'medium' : 'unknown'
    };
  }

  /**
   * Analizar contexto de rol
   */
  private analyzeRoleContext(leadContext: LeadContext): any {
    return {
      level: 'unknown',
      department: 'unknown',
      influence: leadContext.decisionMakerLevel === 'decision_maker' ? 'high' : 'medium',
      decisionAuthority: leadContext.decisionMakerLevel || 'unknown',
      priorities: []
    };
  }

  /**
   * Obtener insights de industria
   */
  private getIndustryInsights(industry?: string): any {
    // Simplificado - en implementación real tendría base de datos de industrias
    return {
      industry: industry || 'general',
      commonChallenges: ['Crecimiento', 'Eficiencia', 'Competencia'],
      typicalBuyingProcess: 'Standard B2B process',
      keyDecisionFactors: ['ROI', 'Implementación', 'Soporte'],
      competitiveLandscape: [],
      regulatoryConsiderations: []
    };
  }

  /**
   * Estimar tokens utilizados
   */
  private estimateTokensUsed(script: PersonalizedScript): number {
    // Estimación aproximada: ~4 caracteres por token
    const totalContent = 
      script.opening.content.length +
      script.discovery.content.length +
      script.presentation.content.length +
      (script.objectionHandling?.content.length || 0) +
      script.closing.content.length;
    
    return Math.ceil(totalContent / 4);
  }

  /**
   * Actualizar configuración
   */
  updateConfig(newConfig: Partial<CallPersonalizerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [CALL PERSONALIZER] Configuration updated');
  }

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.contextCache.clear();
    console.log('🧹 [CALL PERSONALIZER] Cache cleared');
  }

  /**
   * Obtener estadísticas del servicio
   */
  getStats(): {
    cacheSize: number;
    cacheHitRate: number;
    averageProcessingTime: number;
  } {
    return {
      cacheSize: this.contextCache.size,
      cacheHitRate: 0, // TODO: Implementar tracking
      averageProcessingTime: 0 // TODO: Implementar tracking
    };
  }
}

export default CallPersonalizer;