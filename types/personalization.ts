/**
 * PERSONALIZATION TYPES
 * 
 * Tipos para el sistema de personalización de llamadas con IA
 * Incluye análisis de contexto, generación de scripts y A/B testing
 */

export type PersonalizationStrategy = 
  | 'consultative'    // Enfoque consultivo - hacer preguntas, descubrir necesidades
  | 'direct'          // Enfoque directo - ir al grano, propuesta clara
  | 'educational'     // Enfoque educativo - explicar valor, educar sobre problema
  | 'relationship'    // Enfoque relacional - construir relación personal
  | 'urgency'         // Enfoque de urgencia - crear sentido de urgencia
  | 'social_proof'    // Enfoque de prueba social - casos de éxito similares

export type CallObjective =
  | 'prospecting'     // Llamada de prospección inicial
  | 'qualification'   // Calificar al lead
  | 'demo_scheduling' // Programar demostración
  | 'follow_up'       // Seguimiento general
  | 'closing'         // Cerrar venta
  | 'reactivation'    // Reactivar lead frío
  | 'objection_handling' // Manejar objeciones
  | 'nurturing'       // Mantener relación

export type PersonalityProfile = 
  | 'analytical'      // Datos, números, análisis detallado
  | 'driver'          // Resultados rápidos, eficiencia, ROI
  | 'expressive'      // Innovación, visión, impacto
  | 'amiable'         // Relaciones, consensus, seguridad

export type CommunicationStyle =
  | 'formal'          // Lenguaje formal, protocolo
  | 'casual'          // Lenguaje informal, cercano
  | 'technical'       // Enfoque técnico, detalles
  | 'business'        // Enfoque de negocio, ROI

export interface LeadContext {
  // Datos básicos del lead
  leadId: string;
  name: string;
  company?: string;
  position?: string;
  industry?: string;
  
  // Historial de interacciones
  totalCalls: number;
  lastCallDate?: Date;
  lastCallResult?: string;
  conversationHistory: ConversationSummary[];
  
  // Análisis previos
  lastSentimentScore?: number;
  lastEngagementScore?: number;
  averageCallDuration?: number;
  responsePattern?: 'quick' | 'delayed' | 'inconsistent';
  
  // Preferencias identificadas
  preferredContactMethod?: string;
  bestCallTimeWindow?: string;
  communicationStyle?: CommunicationStyle;
  personalityProfile?: PersonalityProfile;
  
  // Contexto de negocio
  currentStatus: string;
  qualificationScore?: number;
  interestLevel?: number;
  budgetIndicated?: boolean;
  decisionMakerLevel?: 'decision_maker' | 'influencer' | 'user' | 'unknown';
  
  // Objeciones y concerns identificados
  commonObjections: string[];
  painPointsIdentified: string[];
  valuePropInterests: string[];
  competitorsMentioned: string[];
}

export interface ConversationSummary {
  conversationId: string;
  date: Date;
  duration: number;
  outcome: string;
  keyTopics: string[];
  sentiment: number;
  engagement: number;
  objections: string[];
  buyingSignals: string[];
  nextSteps?: string;
}

export interface PersonalizationRequest {
  leadContext: LeadContext;
  callObjective: CallObjective;
  preferredStrategy?: PersonalizationStrategy;
  maxScriptLength?: number; // En palabras
  includeObjectionHandling?: boolean;
  includeValueProps?: boolean;
  includeSocialProof?: boolean;
  customInstructions?: string;
}

export interface PersonalizedScript {
  id: string;
  leadId: string;
  strategy: PersonalizationStrategy;
  objective: CallObjective;
  
  // Script sections
  opening: ScriptSection;
  discovery: ScriptSection;
  presentation: ScriptSection;
  objectionHandling?: ScriptSection;
  closing: ScriptSection;
  
  // Metadata
  confidence: number; // 0-100 qué tan confiado está la IA
  estimatedDuration: number; // En minutos
  keyPersonalizationFactors: string[];
  suggestedToneOfVoice: string;
  
  // Variables dinámicas
  dynamicVariables: Record<string, string>;
  
  // A/B testing
  variant?: string;
  testGroup?: string;
  
  createdAt: Date;
  generatedByModel: string;
}

export interface ScriptSection {
  title: string;
  content: string;
  keyPoints: string[];
  estimatedDuration: number; // En segundos
  personalizedElements: PersonalizedElement[];
  alternatives?: string[]; // Variaciones para A/B testing
}

export interface PersonalizedElement {
  type: 'name' | 'company' | 'industry' | 'pain_point' | 'value_prop' | 'social_proof' | 'objection_response';
  placeholder: string;
  actualValue: string;
  confidence: number;
  source: 'lead_data' | 'conversation_history' | 'industry_knowledge' | 'ai_inference';
}

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  strategy: PersonalizationStrategy;
  objective: CallObjective;
  targetIndustries: string[];
  targetRoles: string[];
  
  // Template structure
  sections: ScriptTemplateSection[];
  variables: TemplateVariable[];
  
  // Performance metrics
  usageCount: number;
  averageRating?: number;
  successRate?: number; // Based on call outcomes
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string;
}

export interface ScriptTemplateSection {
  id: string;
  title: string;
  contentTemplate: string; // Con placeholders {{variable}}
  isRequired: boolean;
  order: number;
  estimatedDuration: number;
  adaptationRules: AdaptationRule[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  defaultValue?: any;
  isRequired: boolean;
  source: 'lead_data' | 'user_input' | 'ai_generated' | 'external_api';
  validationRules?: string[];
}

export interface AdaptationRule {
  condition: string; // Expresión lógica
  modification: 'include' | 'exclude' | 'replace' | 'append';
  content?: string;
  priority: number;
}

// A/B Testing Types
export interface ABTest {
  id: string;
  name: string;
  description: string;
  
  // Test configuration
  variants: ABVariant[];
  trafficSplit: Record<string, number>; // variant_id: percentage
  
  // Targeting
  targetCriteria: ABTestCriteria;
  
  // Metrics to track
  primaryMetric: 'call_success' | 'engagement_score' | 'sentiment_improvement' | 'conversion_rate';
  secondaryMetrics: string[];
  
  // Status and results
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  results?: ABTestResults;
  
  // Configuration
  minSampleSize: number;
  confidenceLevel: number; // 0.95 for 95%
  
  createdAt: Date;
  createdBy: string;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  scriptTemplateId?: string;
  strategy: PersonalizationStrategy;
  modifications: VariantModification[];
  isControl: boolean;
}

export interface VariantModification {
  type: 'script_section' | 'tone' | 'strategy' | 'timing' | 'content';
  target: string;
  value: any;
  description: string;
}

export interface ABTestCriteria {
  industries?: string[];
  leadStatuses?: string[];
  sentimentRange?: [number, number];
  engagementRange?: [number, number];
  callObjectives?: CallObjective[];
  personalityProfiles?: PersonalityProfile[];
}

export interface ABTestResults {
  totalParticipants: number;
  variantResults: Record<string, VariantResults>;
  statisticalSignificance: boolean;
  winningVariant?: string;
  improvementPercentage?: number;
  analysisNotes: string;
  generatedAt: Date;
}

export interface VariantResults {
  participants: number;
  primaryMetricValue: number;
  secondaryMetrics: Record<string, number>;
  conversionRate: number;
  averageSentiment: number;
  averageEngagement: number;
  averageCallDuration: number;
  callOutcomes: Record<string, number>;
}

// Context Analysis Types
export interface ContextAnalysis {
  leadId: string;
  analysisDate: Date;
  
  // Lead profiling
  personalityProfile: PersonalityProfile;
  communicationStyle: CommunicationStyle;
  decisionMakingStyle: 'analytical' | 'intuitive' | 'consensus' | 'authority';
  
  // Behavioral patterns
  engagementPatterns: EngagementPattern[];
  responsePatterns: ResponsePattern[];
  preferenceIndicators: PreferenceIndicator[];
  
  // Business context
  companyAnalysis: CompanyAnalysis;
  roleAnalysis: RoleAnalysis;
  industryInsights: IndustryInsights;
  
  // Conversation insights
  topicAffinities: TopicAffinity[];
  objectionPatterns: ObjectionPattern[];
  valueDrivers: ValueDriver[];
  
  // Recommendations
  recommendedStrategy: PersonalizationStrategy;
  recommendedApproach: CallApproach;
  keyTalkingPoints: string[];
  avoidanceTopics: string[];
  
  // Confidence scores
  profileConfidence: number;
  recommendationConfidence: number;
  
  generatedBy: string;
  processingTime: number;
}

export interface EngagementPattern {
  type: 'question_frequency' | 'interruption_rate' | 'topic_switching' | 'call_length_preference';
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface ResponsePattern {
  type: 'response_time' | 'callback_preference' | 'follow_up_engagement';
  pattern: string;
  frequency: number;
  lastObserved: Date;
}

export interface PreferenceIndicator {
  category: 'communication' | 'content' | 'timing' | 'approach';
  indicator: string;
  strength: number; // 0-100
  evidence: string[];
}

export interface CompanyAnalysis {
  size: 'startup' | 'small' | 'medium' | 'enterprise';
  stage: 'early' | 'growth' | 'mature' | 'declining';
  culture: 'conservative' | 'innovative' | 'relationship_focused' | 'results_driven';
  decisionSpeed: 'fast' | 'moderate' | 'slow';
  budgetIndicators: 'high' | 'medium' | 'low' | 'unknown';
}

export interface RoleAnalysis {
  level: 'c_level' | 'vp_level' | 'director' | 'manager' | 'individual_contributor';
  department: string;
  influence: 'high' | 'medium' | 'low';
  decisionAuthority: 'final_decision' | 'strong_influence' | 'some_influence' | 'implementer';
  priorities: string[];
}

export interface IndustryInsights {
  industry: string;
  commonChallenges: string[];
  typicalBuyingProcess: string;
  keyDecisionFactors: string[];
  competitiveLandscape: string[];
  regulatoryConsiderations: string[];
}

export interface TopicAffinity {
  topic: string;
  affinity: number; // -100 to 100
  engagementWhenDiscussed: number;
  lastDiscussed?: Date;
  contextWhenPositive: string[];
  contextWhenNegative: string[];
}

export interface ObjectionPattern {
  objection: string;
  frequency: number;
  context: string[];
  successfulResponses: string[];
  ineffectiveResponses: string[];
}

export interface ValueDriver {
  driver: string;
  importance: number; // 0-100
  evidence: string[];
  businessImpact: 'revenue' | 'cost_savings' | 'efficiency' | 'risk_mitigation' | 'competitive_advantage';
}

export interface CallApproach {
  openingStyle: 'warm' | 'professional' | 'direct' | 'question_based';
  pacePreference: 'fast' | 'moderate' | 'slow';
  informationDensity: 'high' | 'medium' | 'low';
  interactionStyle: 'collaborative' | 'presentational' | 'consultative';
  closingStyle: 'assumptive' | 'alternative' | 'soft' | 'direct';
}

// Performance and Analytics Types
export interface PersonalizationAnalytics {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  
  // Volume metrics
  totalScriptsGenerated: number;
  totalCallsWithPersonalization: number;
  uniqueLeadsPersonalized: number;
  
  // Performance metrics
  averagePersonalizationScore: number;
  scriptUsageRate: number; // % of generated scripts actually used
  scriptModificationRate: number; // % of scripts modified by users
  
  // Outcome metrics
  personalizedCallSuccessRate: number;
  nonPersonalizedCallSuccessRate: number;
  improvementPercentage: number;
  averageSentimentImprovement: number;
  averageEngagementImprovement: number;
  
  // Strategy breakdown
  strategyPerformance: Record<PersonalizationStrategy, StrategyPerformance>;
  objectivePerformance: Record<CallObjective, ObjectivePerformance>;
  
  // A/B test results
  activeABTests: number;
  completedABTests: number;
  significantFindings: number;
  
  generatedAt: Date;
}

export interface StrategyPerformance {
  usageCount: number;
  successRate: number;
  averageSentiment: number;
  averageEngagement: number;
  averageDuration: number;
  topIndustries: string[];
  topRoles: string[];
}

export interface ObjectivePerformance {
  usageCount: number;
  achievementRate: number; // % of calls that achieved objective
  averageTimeToAchieve: number;
  commonSuccessFactors: string[];
  commonFailureReasons: string[];
}

// Service interfaces
export interface CallPersonalizerConfig {
  defaultModel: string;
  maxRetries: number;
  timeoutMs: number;
  enableABTesting: boolean;
  enableContextCaching: boolean;
  cacheExpirationMinutes: number;
  minConfidenceThreshold: number;
  maxConcurrentAnalysis: number;
}

export interface PersonalizationResult {
  success: boolean;
  script?: PersonalizedScript;
  error?: string;
  processingTime: number;
  tokensUsed: number;
  confidence: number;
  recommendations?: string[];
  warnings?: string[];
}

// Hook interfaces
export interface UsePersonalizationReturn {
  // State
  script: PersonalizedScript | null;
  isGenerating: boolean;
  error: string | null;
  analytics: PersonalizationAnalytics | null;
  
  // Actions  
  generateScript: (request: PersonalizationRequest) => Promise<PersonalizationResult>;
  updateScript: (scriptId: string, updates: Partial<PersonalizedScript>) => Promise<void>;
  analyzeContext: (leadId: string) => Promise<ContextAnalysis>;
  
  // Templates
  templates: ScriptTemplate[];
  loadTemplates: () => Promise<void>;
  createTemplate: (template: Omit<ScriptTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  
  // A/B Testing
  abTests: ABTest[];
  createABTest: (test: Omit<ABTest, 'id' | 'createdAt'>) => Promise<string>;
  getABTestResults: (testId: string) => Promise<ABTestResults>;
  
  // Analytics
  loadAnalytics: (period: 'daily' | 'weekly' | 'monthly') => Promise<void>;
}

// Utility types
export interface PersonalizationMetrics {
  totalPersonalizations: number;
  successRate: number;
  averageImprovement: number;
  topStrategies: PersonalizationStrategy[];
  industryBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
}

// Default configurations
export const DEFAULT_PERSONALIZATION_CONFIG: CallPersonalizerConfig = {
  defaultModel: 'gpt-4o-mini',
  maxRetries: 3,
  timeoutMs: 30000,
  enableABTesting: true,
  enableContextCaching: true,
  cacheExpirationMinutes: 60,
  minConfidenceThreshold: 0.7,
  maxConcurrentAnalysis: 5
};

export const STRATEGY_DESCRIPTIONS: Record<PersonalizationStrategy, string> = {
  consultative: 'Enfoque consultivo: Hacer preguntas para descubrir necesidades específicas',
  direct: 'Enfoque directo: Ir directo al punto con propuesta clara y concisa',
  educational: 'Enfoque educativo: Educar sobre el problema y presentar solución',
  relationship: 'Enfoque relacional: Construir relación personal y confianza',
  urgency: 'Enfoque de urgencia: Crear sentido de urgencia para acelerar decisión',
  social_proof: 'Prueba social: Usar casos de éxito y testimonios similares'
};

export const OBJECTIVE_DESCRIPTIONS: Record<CallObjective, string> = {
  prospecting: 'Prospección inicial: Identificar oportunidades y generar interés',
  qualification: 'Calificación: Determinar si el lead es un buen fit',
  demo_scheduling: 'Agendar demo: Programar demostración del producto',
  follow_up: 'Seguimiento: Mantener contacto y avanzar en proceso',
  closing: 'Cierre: Finalizar la venta y obtener compromiso',
  reactivation: 'Reactivación: Despertar interés en leads fríos',
  objection_handling: 'Manejo de objeciones: Resolver concerns específicos',
  nurturing: 'Nutrición: Mantener relación a largo plazo'
};