/**
 * BULK CALLING SYSTEM TYPES
 * 
 * Definiciones de tipos para el sistema de llamadas masivas
 * Incluye filtros avanzados, queues, y análisis IA
 */

import { LeadStatus, LeadPriority, LeadSource } from '@/modules/leads/types/leads';

// === CALL RESULTS ===
export type CallResult = 
  | 'CALL_FAILED'        // Error técnico en la llamada
  | 'NO_ANSWER'          // Lead no respondió
  | 'EARLY_HANGUP'       // Lead colgó rápidamente  
  | 'INTERRUPTED'        // Llamada se cortó
  | 'SHORT_SUCCESS'      // Conversación exitosa pero breve
  | 'FULL_SUCCESS'       // Conversación extensa y exitosa

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  'CALL_FAILED': 'Fallo Técnico',
  'NO_ANSWER': 'No Respondió', 
  'EARLY_HANGUP': 'Colgó Rápido',
  'INTERRUPTED': 'Interrumpida',
  'SHORT_SUCCESS': 'Éxito Breve',
  'FULL_SUCCESS': 'Éxito Completo'
};

// === ELIGIBILITY ===
export interface CallEligibility {
  eligible: boolean;
  reason: string;
  suggestedCallTime?: Date;
  riskLevel: 'low' | 'medium' | 'high';
  cooldownEndsAt?: Date;
}

// === ADVANCED FILTERS ===
export interface MassiveCallFilters {
  // Filtros básicos
  status?: LeadStatus[];
  priority?: LeadPriority[];
  source?: LeadSource[];
  
  // Filtros de scoring
  qualificationScore?: {
    min: number;
    max: number;
  };
  engagementScore?: {
    min: number;
    max: number;
  };
  responseRate?: {
    min: number;
    max: number;
  };
  
  // Filtros temporales críticos
  lastContactDate?: {
    before?: Date;          // No contactado después de X
    after?: Date;           // Contactado después de X
    never?: boolean;        // Nunca contactado
  };
  
  nextFollowUpDate?: {
    overdue?: boolean;      // Seguimientos vencidos
    today?: boolean;        // Programados para hoy
    thisWeek?: boolean;     // Programados esta semana
  };
  
  // Filtros de historial de llamadas
  contactAttempts?: {
    min: number;
    max: number;
  };
  
  lastCallResult?: CallResult[];
  daysSinceLastCall?: {
    min: number;
    max: number;
  };
  
  // Filtros de análisis IA
  sentimentScore?: {
    min: number;            // -1.0 a 1.0
    max: number;
  };
  
  // Filtros de elegibilidad
  eligibleForCall?: boolean;
  blacklistedForCalls?: boolean;
  autoProgressionEnabled?: boolean;
  
  // Filtros de calendar
  preferredCallTimeWindow?: ('morning' | 'afternoon' | 'evening')[];
  bestCallDays?: string[];  // ['monday', 'tuesday', etc.]
  
  // Filtros de negocio
  assignedAgent?: string[];
  company?: string;
  location?: string;
}

// === BULK CALL QUEUE ===
export type BulkCallQueueStatus = 
  | 'PENDING'     // En espera de ejecución
  | 'RUNNING'     // Ejecutándose actualmente
  | 'PAUSED'      // Pausado manualmente
  | 'COMPLETED'   // Completado exitosamente
  | 'FAILED'      // Falló por error
  | 'CANCELLED'   // Cancelado por usuario

export interface BulkCallQueue {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  organizationId: string;
  createdByUserId: string;
  
  // Configuración
  totalLeadsSelected: number;
  concurrency: number;                    // Llamadas simultáneas
  delayBetweenCalls: number;             // Segundos entre llamadas
  maxDailyVolume?: number;               // Límite diario
  
  // Ventana horaria
  timeWindowStart?: string;              // "09:00"
  timeWindowEnd?: string;                // "18:00"  
  timezone: string;
  allowedDays?: string;                  // "monday,tuesday,wednesday"
  
  // Estado y progreso
  status: BulkCallQueueStatus;
  progress: {
    completed: number;
    successful: number;
    failed: number;
    pending: number;
  };
  
  // Métricas en tiempo real
  metrics: {
    connectionRate: number;              // % que respondieron
    conversionRate: number;              // % que progresaron
    averageDuration: number;             // Duración promedio
    topFailureReasons: string[];         // Razones de fallo comunes
  };
  
  // Filtros aplicados
  appliedFilters: MassiveCallFilters;
  
  // Timestamps de control
  startedAt?: Date;
  completedAt?: Date;  
  pausedAt?: Date;
  cancelledAt?: Date;
  
  // Sistema
  createdAt: Date;
  updatedAt: Date;
}

// === QUEUE ITEMS ===
export type BulkCallItemStatus = 
  | 'PENDING'      // Pendiente de procesar
  | 'PROCESSING'   // Procesándose ahora
  | 'COMPLETED'    // Completado exitosamente
  | 'FAILED'       // Falló por error
  | 'SKIPPED'      // Omitido (no elegible)

export interface BulkCallQueueItem {
  id: string;
  queueId: string;
  leadId: string;
  
  // Estado del item
  status: BulkCallItemStatus;
  priority: number;                      // 0-100, mayor prioridad primero
  
  // Personalización generada por IA
  personalizedScript?: string;           // Script personalizado para este lead
  personalizationData?: {
    leadContext: LeadContext;
    sentimentHistory?: SentimentPoint[];
    calendarContext?: OptimalCallTiming;
  };
  
  // Resultado de la llamada
  callLogId?: string;
  callResult?: CallResult;
  callDuration?: number;                 // Segundos
  
  // Análisis post-llamada
  sentimentScore?: number;               // -1.0 a 1.0
  engagementScore?: number;              // 0-100
  qualityScore?: number;                 // 0-100
  
  // Progresión automática
  leadStateChanged: boolean;
  previousState?: string;
  newState?: string;
  progressionReason?: string;
  
  // Timing
  scheduledAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Errores y reintentos
  errorMessage?: string;
  retryCount: number;
  
  // Sistema
  createdAt: Date;
  updatedAt: Date;
}

// === LEAD CONTEXT ===
export interface LeadContext {
  name: string;
  company?: string;
  position?: string;
  industry?: string;
  source: LeadSource;
  currentStatus: LeadStatus;
  qualificationScore: number;
  
  // Historial de interacciones
  interactionHistory?: {
    lastCallSummary?: string;
    previousObjections?: string[];
    expressedInterests?: string[];
    painPoints?: string[];
    competitorsmentioned?: string[];
  };
}

// === PERSONALIZED SCRIPT ===
export interface PersonalizedScript {
  leadId: string;
  callType: 'prospecting' | 'qualification' | 'follow_up' | 'closing' | 'reactivation' | 'recovery';
  
  // Variables dinámicas para el script
  scriptVariables: {
    greeting: string;                    // Saludo personalizado
    companyContext: string;              // Contexto de la empresa
    valueProposition: string;           // Propuesta específica
    objectionHandling: string[];        // Manejo de objeciones conocidas  
    nextStepSuggestion: string;         // Siguiente paso sugerido
  };
  
  // Configuración de llamada
  callConfiguration: {
    suggestedDuration: number;          // Duración sugerida en minutos
    maxAttempts: number;                // Máximos intentos
    priority: 'low' | 'medium' | 'high';
    optimalTimeWindow: string;          // Mejor horario para llamar
  };
  
  // Metadatos
  generatedAt: Date;
  aiModel: string;                     // Modelo de IA usado
  confidence: number;                  // 0-1, confianza en la personalización
}

// === SENTIMENT ANALYSIS ===
export interface SentimentPoint {
  timeStart: number;                   // Segundos desde inicio
  timeEnd: number;
  sentiment: number;                   // -1.0 a 1.0
  confidence: number;                  // 0-1
  dominantEmotion: string;
  keyPhrases: string[];
}

export interface SentimentChange {
  timePoint: number;
  fromSentiment: number;
  toSentiment: number;
  magnitude: number;                   // Qué tan dramático fue el cambio
  triggerPhrase?: string;              // Qué causó el cambio
}

export interface CriticalMoment {
  timePoint: number;
  type: 'objection' | 'interest_peak' | 'frustration' | 'buying_signal';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SentimentTimeline {
  overallSentiment: {
    score: number;                     // -1.0 a 1.0
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  sentimentProgression: SentimentPoint[];
  sentimentChanges: SentimentChange[];
  criticalMoments: CriticalMoment[];
}

// === OPTIMAL CALL TIMING ===
export interface OptimalCallTiming {
  recommendedTime: Date;
  timeWindow: 'morning' | 'afternoon' | 'evening';
  dayOfWeek: string;
  timezone: string;
  confidence: number;                  // 0-1
  reasoning: string;
}

// === DASHBOARD METRICS ===
export interface BulkCallDashboard {
  // Métricas generales
  activeQueues: number;
  totalCallsToday: number;
  successRate: number;
  
  // Métricas por queue activo
  queueMetrics: {
    [queueId: string]: {
      name: string;
      progress: number;                // 0-100%
      callsPerMinute: number;
      successRate: number;
      averageCallDuration: number;
      leadsProgressed: number;
      
      // Distribución de resultados
      resultDistribution: Record<CallResult, number>;
      
      // Top insights
      topProgressions: Array<{
        from: LeadStatus;
        to: LeadStatus;
        count: number;
      }>;
    };
  };
  
  // Alertas automáticas
  alerts: Array<{
    type: 'high_failure_rate' | 'low_connection_rate' | 'quota_warning';
    message: string;
    queueId?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

// === FREQUENCY CONTROLS ===
export interface CallFrequencyControls {
  // Límites globales
  globalLimits: {
    maxCallsPerDay: number;            // Límite diario total
    maxCallsPerLead: number;           // Máximo por lead individual
    maxConcurrentCalls: number;        // Llamadas simultáneas
  };
  
  // Límites por lead
  leadSpecificLimits: {
    [leadId: string]: {
      lastCallDate: Date;
      callsToday: number;
      callsThisWeek: number;
      consecutiveFailures: number;
      blacklisted: boolean;
      blacklistReason?: string;
    };
  };
  
  // Reglas de cool-down
  cooldownRules: {
    afterSuccess: number;              // Días después de éxito
    afterFailure: number;              // Días después de fallo
    afterComplaint: number;            // Días después de queja
    afterMultipleNoAnswer: number;     // Después de varios "no answer"
  };
}

// === FILTER STATS ===
export interface EligibilityStats {
  total: number;
  eligible: number;
  reasons: Record<string, number>;    // Razones de no elegibilidad
}

// === HOOKS RETURNS ===
export interface UseLeadsFiltersReturn {
  filters: MassiveCallFilters;
  eligibleLeads: any[];               // Array de leads elegibles
  setFilter: (key: keyof MassiveCallFilters, value: any) => void;
  clearFilters: () => void;
  eligibilityStats: EligibilityStats;
  isLoading: boolean;
  error: string | null;
}

export interface UseBulkCallsReturn {
  // Queue management
  createQueue: (config: Omit<BulkCallQueue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<BulkCallQueue>;
  startQueue: (queueId: string) => Promise<void>;
  pauseQueue: (queueId: string) => Promise<void>;
  cancelQueue: (queueId: string) => Promise<void>;
  
  // Queue monitoring
  activeQueues: BulkCallQueue[];
  queueProgress: (queueId: string) => BulkCallQueue | null;
  
  // Metrics
  dashboard: BulkCallDashboard;
  
  // Loading states
  isCreating: boolean;
  isLoading: boolean;
  error: string | null;
}

// === CALENDAR TYPES ===
export interface SchedulingOptions {
  meetingType: 'demo' | 'proposal_presentation' | 'closing_meeting' | 'follow_up';
  duration: number;                    // minutos
  preferredTimeSlots: string[];        // ['morning', 'afternoon', 'evening']
  timezone: string;
  description?: string;
  location?: 'online' | 'office' | 'client_location';
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: Array<{
    email: string;
    name: string;
    responseStatus?: 'accepted' | 'declined' | 'tentative';
  }>;
  meetingLink?: string;                // Para reuniones virtuales
  location?: string;
  reminder: number;                    // minutos antes
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  agentId: string;
  conflictReason?: string;
}