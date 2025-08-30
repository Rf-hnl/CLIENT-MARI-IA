/**
 * CONVERSATION ANALYSIS TYPES
 * 
 * Tipos para el análisis automático de conversaciones con IA
 */

// Tipos básicos de análisis
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type ConversationFlow = 'excellent' | 'good' | 'fair' | 'poor';
export type ResponseQuality = 'excellent' | 'good' | 'fair' | 'poor';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type FollowUpTimeline = 'immediate' | '1_day' | '3_days' | '1_week' | '2_weeks' | '1_month';

// Acciones recomendadas
export type RecommendedAction = 
  | 'immediate_follow_up'
  | 'send_proposal' 
  | 'schedule_meeting'
  | 'nurture_lead'
  | 'qualify_further'
  | 'close_deal'
  | 'archive_lead'
  | 'escalate_to_manager'
  | 'send_technical_info'
  | 'address_objections';

export interface ConversationAnalysis {
  id: string;
  leadId: string;
  callLogId: string;
  conversationId?: string | null;
  tenantId?: string;
  organizationId?: string;

  // Sentiment Analysis (using actual DB field names)
  sentiment?: string | null;
  sentimentScore?: number | null;
  sentimentConfidence?: number | null;
  
  // Quality Analysis (using actual DB field names)
  qualityScore?: number | null;
  
  // Legacy names for backward compatibility
  overallSentiment?: string | null;
  callQualityScore?: number | null;
  agentPerformanceScore?: number | null;
  conversationFlow?: string | null;
  
  // Key Insights
  keyTopics?: string[] | null;
  mainPainPoints?: string[] | null;
  actionItems?: string[] | null;
  followUpSuggestions?: string[] | null;
  interestIndicators?: Record<string, unknown> | null;
  objections?: string[] | null;
  buyingSignals?: string[] | null;
  competitorMentions?: string[] | null;
  priceDiscussion?: Record<string, unknown> | null;
  decisionMakers?: string[] | null;
  timeframeIndicators?: Record<string, unknown> | null;
  
  // Engagement
  leadInterestLevel?: string | null;
  engagementScore?: number | null;
  responseQuality?: string | null;
  
  // Predictions
  conversionLikelihood?: number | null;
  recommendedAction?: string | null;
  urgencyLevel?: string | null;
  followUpTimeline?: string | null;
  
  // Conversation Metrics
  questionsAsked?: number | null;
  questionsAnswered?: number | null;
  interruptionCount?: number | null;
  talkTimeRatio?: number | null;
  speakingTimeDistribution?: Record<string, unknown> | null;
  interruptionAnalysis?: Record<string, unknown> | null;
  questionCount?: number | null;
  
  // Legacy fields for backward compatibility
  engagementLevel?: string | null;
  conversionProbability?: number | null;
  recommendedNextAction?: string | null;
  bestFollowUpTime?: string | null;
  suggestedApproach?: string | null;
  
  // Metadata
  analysisModel?: string | null;
  analysisVersion?: string | null;
  confidenceScore?: number | null;
  processingTime?: number | null;
  processingModel?: string | null;
  confidence?: number | null;
  
  // Raw Data
  fullAnalysis?: Record<string, unknown> | null;
  rawInsights?: Record<string, unknown> | null;
  rawAnalysis?: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;
}

// Datos para crear un nuevo análisis
export interface CreateConversationAnalysisData {
  leadId: string;
  callLogId?: string;
  conversationId: string;
  transcript?: ConversationTranscript; // Optional - backend can fetch from ElevenLabs if not provided
  conversationMetadata?: Record<string, unknown>;
}

// Estructura de transcripción para análisis
export interface ConversationTranscript {
  messages: TranscriptMessage[];
  duration: number; // seconds
  totalWords: number;
  participantCount: number;
}

export interface TranscriptMessage {
  role: 'agent' | 'lead' | 'system';
  content: string;
  timestamp: number; // seconds from start
  confidence?: number;
  emotions?: string[];
}

// Análisis por mensaje individual
export interface MessageAnalysis {
  messageIndex: number;
  content: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number; // -1.0 to 1.0
  emotions: string[];
  keyPhrases: string[];
  intent: 'question' | 'objection' | 'interest' | 'agreement' | 'concern' | 'neutral';
  urgencyLevel: 'low' | 'medium' | 'high';
}

// Resultado del análisis de IA
export interface AIAnalysisResult {
  success: boolean;
  analysis?: ConversationAnalysis;
  error?: string;
  processingTime: number;
  tokensUsed?: number;
  cost?: number;
}

// Configuración de análisis
export interface AnalysisConfig {
  model: 'gpt-4' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-2';
  includeEmotionAnalysis: boolean;
  includeTopicExtraction: boolean;
  includeBuyingSignals: boolean;
  includeCompetitorAnalysis: boolean;
  language: 'es' | 'en' | 'auto';
  customPrompt?: string;
}

// Estadísticas de análisis por lead
export interface LeadAnalysisStats {
  leadId: string;
  totalAnalyses: number;
  averageSentimentScore: number;
  averageQualityScore: number;
  averageConversionLikelihood: number;
  mostCommonTopics: string[];
  trendingBuyingSignals: string[];
  mainObjections: string[];
  recommendedNextAction: RecommendedAction;
  urgencyTrend: 'increasing' | 'decreasing' | 'stable';
}

// Resumen de análisis por organización
export interface OrganizationAnalyticsSummary {
  totalConversations: number;
  averageQualityScore: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
  topPerformingAgents: Array<{
    agentId: string;
    agentName: string;
    averageScore: number;
    conversationCount: number;
  }>;
  conversionTrends: Array<{
    period: string;
    averageLikelihood: number;
    totalConversations: number;
  }>;
  commonPainPoints: string[];
  competitorMentions: Array<{
    competitor: string;
    mentions: number;
    context: 'positive' | 'negative' | 'neutral';
  }>;
}

// Filtros para consultar análisis
export interface AnalysisFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  sentimentTypes?: SentimentType[];
  qualityScoreRange?: {
    min: number;
    max: number;
  };
  conversionLikelihoodRange?: {
    min: number;
    max: number;
  };
  urgencyLevels?: UrgencyLevel[];
  recommendedActions?: RecommendedAction[];
  agentIds?: string[];
  keyTopics?: string[];
}

// Respuesta de API para listado de análisis
export interface ConversationAnalysisListResponse {
  success: boolean;
  analyses: ConversationAnalysis[];
  total: number;
  page: number;
  pageSize: number;
  filters: AnalysisFilters;
  summary: {
    averageQualityScore: number;
    averageSentimentScore: number;
    averageConversionLikelihood: number;
    totalProcessingTime: number;
  };
}

// Hook de respuesta para useConversationAnalysis
export interface UseConversationAnalysisReturn {
  analysis: ConversationAnalysis | null;
  loading: boolean;
  error: string | null;
  analyzeConversation: (data: CreateConversationAnalysisData, config?: AnalysisConfig) => Promise<void>;
  refetchAnalysis: () => Promise<void>;
  updateAnalysis: (id: string, updates: Partial<ConversationAnalysis>) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
}

// Utilidades de clasificación
export const classifyConversationQuality = (score: number): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
  label: string;
  emoji: string;
} => {
  if (score >= 85) {
    return { level: 'excellent', color: 'text-green-700 bg-green-50', label: 'Excelente', emoji: '🌟' };
  } else if (score >= 70) {
    return { level: 'good', color: 'text-blue-700 bg-blue-50', label: 'Buena', emoji: '👍' };
  } else if (score >= 50) {
    return { level: 'fair', color: 'text-yellow-700 bg-yellow-50', label: 'Regular', emoji: '⚠️' };
  } else {
    return { level: 'poor', color: 'text-red-700 bg-red-50', label: 'Deficiente', emoji: '👎' };
  }
};

export const classifyConversionLikelihood = (likelihood: number): {
  level: 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
  color: string;
  label: string;
  emoji: string;
} => {
  if (likelihood >= 80) {
    return { level: 'very_high', color: 'text-green-700 bg-green-50', label: 'Muy Alta', emoji: '🚀' };
  } else if (likelihood >= 60) {
    return { level: 'high', color: 'text-emerald-700 bg-emerald-50', label: 'Alta', emoji: '📈' };
  } else if (likelihood >= 40) {
    return { level: 'medium', color: 'text-yellow-700 bg-yellow-50', label: 'Media', emoji: '🎯' };
  } else if (likelihood >= 20) {
    return { level: 'low', color: 'text-orange-700 bg-orange-50', label: 'Baja', emoji: '📉' };
  } else {
    return { level: 'very_low', color: 'text-red-700 bg-red-50', label: 'Muy Baja', emoji: '❄️' };
  }
};

export const getSentimentEmoji = (sentiment: SentimentType): string => {
  const emojis = {
    positive: '😊',
    negative: '😞',
    neutral: '😐',
    mixed: '🤔'
  };
  return emojis[sentiment];
};

export const getUrgencyColor = (urgency: UrgencyLevel): string => {
  const colors = {
    low: 'text-gray-600 bg-gray-50',
    medium: 'text-blue-600 bg-blue-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50'
  };
  return colors[urgency];
};
