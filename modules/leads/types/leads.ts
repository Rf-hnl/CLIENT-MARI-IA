/**
 * LEADS MODULE TYPES
 * 
 * Definiciones de tipos para el módulo de leads (prospectos)
 * Integrado con Firebase Firestore
 * Estructura: /tenants/{tenantId}/organizations/{organizationId}/leads
 */

// For Firebase Timestamps like { "_seconds": 1705276800, "_nanoseconds": 0 }
export interface IFirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// --- Lead States and Status ---
export type LeadStatus = 
  | "new"           // Nuevo prospecto, sin contactar
  | "contacted"     // Contactado por primera vez
  | "interested"    // Mostró interés
  | "qualified"     // Calificado como prospecto válido
  | "proposal"      // Propuesta enviada
  | "negotiation"   // En negociación
  | "won"           // Convertido a cliente
  | "lost"          // Perdido/rechazado
  | "nurturing"     // En proceso de nutrición
  | "follow_up"     // Requiere seguimiento
  | "cold"          // Prospecto frío

export type LeadSource = 
  | "website"       // Sitio web
  | "social_media"  // Redes sociales
  | "referral"      // Referido
  | "cold_call"     // Llamada en frío
  | "advertisement" // Publicidad
  | "email"         // Email marketing
  | "event"         // Evento/conferencia
  | "whatsapp"      // WhatsApp
  | "other"         // Otros

export type LeadPriority = "low" | "medium" | "high" | "urgent";

export type LeadInterestLevel = 1 | 2 | 3 | 4 | 5; // 1 = muy bajo, 5 = muy alto

// --- Lead Data Classification ---
export type FieldRequirement = "required" | "optional" | "recommended";

export interface ILeadFieldConfig {
  [key: string]: {
    requirement: FieldRequirement;
    category: "personal" | "contact" | "business" | "qualification" | "system";
    description: string;
    warningMessage?: string;
  };
}

// Configuration for lead fields
export const LEAD_FIELD_CONFIG: ILeadFieldConfig = {
  // REQUIRED - Critical for basic operation
  name: { requirement: "required", category: "personal", description: "Nombre completo del prospecto" },
  phone: { requirement: "required", category: "contact", description: "Teléfono principal" },
  status: { requirement: "required", category: "qualification", description: "Estado del prospecto" },
  source: { requirement: "required", category: "qualification", description: "Fuente del prospecto" },
  
  // RECOMMENDED - Important for qualification
  email: { requirement: "recommended", category: "contact", description: "Correo electrónico", 
          warningMessage: "Email importante para seguimiento automatizado" },
  company: { requirement: "recommended", category: "business", description: "Empresa donde trabaja",
            warningMessage: "Información de empresa ayuda en calificación" },
  position: { requirement: "recommended", category: "business", description: "Cargo o posición",
             warningMessage: "Posición indica poder de decisión" },
  interest_level: { requirement: "recommended", category: "qualification", description: "Nivel de interés",
                   warningMessage: "Nivel de interés ayuda a priorizar seguimiento" },
  
  // OPTIONAL - Useful but not critical
  national_id: { requirement: "optional", category: "personal", description: "Cédula de identidad" },
  address: { requirement: "optional", category: "personal", description: "Dirección" },
  city: { requirement: "optional", category: "personal", description: "Ciudad" },
  province: { requirement: "optional", category: "personal", description: "Provincia" },
  country: { requirement: "optional", category: "personal", description: "País" },
  budget_range: { requirement: "optional", category: "business", description: "Rango de presupuesto" },
  decision_timeline: { requirement: "optional", category: "business", description: "Timeline de decisión" },
  notes: { requirement: "optional", category: "qualification", description: "Notas generales" },
  tags: { requirement: "optional", category: "qualification", description: "Etiquetas del prospecto" }
};

// --- Main Lead Model ---
export interface ILead {
  id: string; // Unique system identifier
  
  // REQUIRED FIELDS - Critical for operation
  name: string;
  phone: string;
  status: LeadStatus;
  source: LeadSource;
  
  // CONTACT FIELDS - Recommended for effectiveness
  email?: string;
  preferred_contact_method?: "whatsapp" | "phone" | "email";
  best_contact_time?: string;
  
  // PERSONAL FIELDS - Optional
  national_id?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  
  // BUSINESS/QUALIFICATION FIELDS
  company?: string;
  position?: string;
  budget_range?: string; // e.g., "$1000-5000", "5000+"
  decision_timeline?: string; // e.g., "1-3 months", "6+ months"
  interest_level?: LeadInterestLevel;
  priority: LeadPriority;
  
  // LEAD QUALIFICATION
  qualification_score: number; // 0-100, calculated score
  is_qualified: boolean; // Whether lead meets qualification criteria
  qualification_notes?: string;
  
  // TRACKING FIELDS
  last_contact_date?: IFirebaseTimestamp;
  next_follow_up_date?: IFirebaseTimestamp;
  contact_attempts: number; // Number of contact attempts
  response_rate: number; // 0-100, percentage of responses
  
  // CONVERSION TRACKING
  converted_to_client: boolean;
  client_id?: string; // Reference to client if converted
  conversion_date?: IFirebaseTimestamp;
  conversion_value?: number; // Value of deal if converted
  
  // NOTES AND TAGS
  notes?: string;
  internal_notes?: string;
  tags?: string[];
  
  // ASSIGNED AGENT
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  
  // SYSTEM FIELDS
  created_at: IFirebaseTimestamp;
  updated_at: IFirebaseTimestamp;
}

// --- Lead Document Wrapper (for Firebase structure) ---
export interface ILeadDocument {
  _data: ILead;
  leadInteractions?: ILeadInteractions;
}

// --- Lead Interactions Container ---
export interface ILeadInteractions {
  callLogs?: ILeadCallLog[];
  emailRecords?: ILeadEmailRecord[];
  whatsappRecords?: ILeadWhatsAppRecord[];
  meetingRecords?: ILeadMeetingRecord[];
  leadAIProfile?: ILeadAIProfile;
}

// --- Lead Interaction Models ---

export interface ILeadCallLog {
  id: string;
  leadId: string;
  timestamp: IFirebaseTimestamp;
  callType: "prospecting" | "qualification" | "follow_up" | "closing";
  durationMinutes: number;
  agentId: string;
  outcome: "answered" | "no_answer" | "voicemail" | "busy" | "interested" | "not_interested" | "callback_requested";
  notes?: string;
  next_action?: string;
  // ElevenLabs Integration
  audioUrl?: string;
  transcription?: string;
  transcriptionConfidence?: number;
  elevenLabsJobId?: string;
  transcriptionStatus?: "pending" | "processing" | "completed" | "failed";
}

export interface ILeadEmailRecord {
  id: string;
  leadId: string;
  timestamp: IFirebaseTimestamp;
  direction: "inbound" | "outbound";
  agentId?: string;
  subject: string;
  content: string;
  attachments?: string[];
  emailType: "prospecting" | "follow_up" | "proposal" | "nurturing" | "other";
  status: "sent" | "delivered" | "opened" | "clicked" | "replied" | "bounced" | "failed";
  threadId?: string;
  priority: "low" | "normal" | "high" | "urgent";
}

export interface ILeadWhatsAppRecord {
  id: string;
  leadId: string;
  timestamp: IFirebaseTimestamp;
  messageDirection: "inbound" | "outbound";
  agentId?: string;
  messageContent: string;
  attachments?: string[];
  interactionType: "text" | "media" | "template" | "other";
  // Bot Integration
  isBotConversation?: boolean;
  botTranscription?: Array<{
    role: "lead" | "bot" | "agent";
    content: string;
    timestamp: IFirebaseTimestamp;
  }>;
  botSessionId?: string;
  botIntent?: string;
  botConfidence?: number;
  requiresHumanHandoff?: boolean;
}

export interface ILeadMeetingRecord {
  id: string;
  leadId: string;
  scheduledDate: IFirebaseTimestamp;
  actualDate?: IFirebaseTimestamp;
  duration?: number; // minutes
  meetingType: "phone" | "video" | "in_person";
  agentId: string;
  status: "scheduled" | "completed" | "no_show" | "rescheduled" | "cancelled";
  outcome?: "interested" | "not_interested" | "needs_follow_up" | "ready_to_close";
  notes?: string;
  next_steps?: string;
  proposal_sent?: boolean;
}

// --- AI Lead Profile Model ---
export interface ILeadAIProfile {
  leadId: string;
  analysisDate: IFirebaseTimestamp;
  lastUpdatedByAI: IFirebaseTimestamp;
  
  // === LEAD SCORING ===
  leadScore: number; // 0-100, overall lead quality score
  conversionProbability: number; // 0-100, probability of conversion
  engagementScore: number; // 0-100, level of engagement
  responsivenesScore: number; // 0-100, how responsive the lead is
  
  // === BEHAVIORAL ANALYSIS ===
  communicationPreference: "whatsapp" | "phone" | "email" | "mixed" | "unknown";
  bestContactTime: "morning" | "afternoon" | "evening" | "flexible" | "unknown";
  responsePattern: "immediate" | "delayed" | "business_hours_only" | "inconsistent" | "non_responsive";
  decisionMakingStyle: "quick" | "analytical" | "collaborative" | "cautious" | "unknown";
  
  // === PREDICTIONS ===
  predictedConversionDate?: IFirebaseTimestamp;
  predictedDealValue?: number;
  churnRisk: number; // 0-100, risk of losing the lead
  optimalContactFrequency: "daily" | "every_few_days" | "weekly" | "biweekly" | "monthly";
  
  // === RECOMMENDATIONS ===
  recommendedAction: "immediate_follow_up" | "send_proposal" | "schedule_meeting" | "nurture" | "qualify_further" | "close" | "archive";
  recommendedContactMethod: "whatsapp" | "phone" | "email" | "in_person";
  recommendedMessageTone: "formal" | "friendly" | "urgent" | "consultative" | "relationship_building";
  
  // === AI INSIGHTS ===
  aiInsights: string[]; // Key insights generated by AI
  keyInterests: string[]; // Detected interests and pain points
  objections: string[]; // Potential objections identified
  buyingSignals: string[]; // Positive buying signals detected
  
  // === COMPETITIVE ANALYSIS ===
  competitorMentions?: string[]; // Competitors mentioned by lead
  competitiveAdvantages?: string[]; // Our advantages over competition
  
  // === TIMING ANALYSIS ===
  urgencyLevel: "low" | "medium" | "high" | "critical";
  seasonalPattern?: "consistent" | "quarter_end" | "year_end" | "seasonal";
  nextOptimalContactDate: IFirebaseTimestamp;
  
  // === METADATA ===
  aiModel: string; // AI model used for analysis
  confidenceScore: number; // 0-100, confidence in analysis
  dataQuality: "high" | "medium" | "low";
  lastInteractionAnalyzed: IFirebaseTimestamp;
}

// --- Lead Statistics and Analytics ---
export interface ILeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  byPriority: Record<LeadPriority, number>;
  conversionRate: number; // percentage
  averageTimeToConversion: number; // days
  totalConversionValue: number;
}

// --- Lead Filters and Search ---
export interface ILeadFilters {
  status?: LeadStatus[];
  source?: LeadSource[];
  priority?: LeadPriority[];
  assignedAgent?: string[];
  interestLevel?: LeadInterestLevel[];
  isQualified?: boolean;
  convertedToClient?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  qualificationScoreRange?: {
    min: number;
    max: number;
  };
}

export interface ILeadSearchParams {
  query?: string; // Search in name, email, phone, company
  filters?: ILeadFilters;
  sortBy?: "created_at" | "updated_at" | "last_contact_date" | "qualification_score" | "name";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}