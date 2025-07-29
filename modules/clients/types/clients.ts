/**
 * CLIENT MODULE TYPES
 * 
 * Definiciones de tipos para el módulo de clientes
 * Integrado con Firebase Firestore
 */

// For Firebase Timestamps like { "_seconds": 1705276800, "_nanoseconds": 0 }
export interface IFirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

// --- Client Data Classification ---
export type FieldRequirement = "required" | "optional" | "recommended";

export interface IClientFieldConfig {
  [key: string]: {
    requirement: FieldRequirement;
    category: "personal" | "financial" | "contact" | "employment" | "collection" | "system";
    description: string;
    warningMessage?: string;
  };
}

// Configuration for client fields
export const CLIENT_FIELD_CONFIG: IClientFieldConfig = {
  // REQUIRED - Critical for basic operation
  name: { requirement: "required", category: "personal", description: "Nombre completo del cliente" },
  national_id: { requirement: "required", category: "personal", description: "Cédula de identidad" },
  phone: { requirement: "required", category: "contact", description: "Teléfono principal" },
  debt: { requirement: "required", category: "financial", description: "Monto de la deuda" },
  status: { requirement: "required", category: "financial", description: "Estado del préstamo" },
  loan_letter: { requirement: "required", category: "financial", description: "Número de préstamo" },
  
  // RECOMMENDED - Important for collection effectiveness
  email: { requirement: "recommended", category: "contact", description: "Correo electrónico", 
          warningMessage: "Email faltante puede limitar opciones de contacto" },
  address: { requirement: "recommended", category: "personal", description: "Dirección completa",
            warningMessage: "Dirección necesaria para gestión de cobranza" },
  city: { requirement: "recommended", category: "personal", description: "Ciudad" },
  province: { requirement: "recommended", category: "personal", description: "Provincia" },
  employment_status: { requirement: "recommended", category: "employment", description: "Estado laboral",
                      warningMessage: "Estado laboral crítico para evaluación de riesgo" },
  monthly_income: { requirement: "recommended", category: "employment", description: "Ingresos mensuales",
                   warningMessage: "Ingresos necesarios para calcular capacidad de pago" },
  preferred_contact_method: { requirement: "recommended", category: "contact", description: "Método de contacto preferido",
                             warningMessage: "Método de contacto mejora efectividad de cobranza" },
  
  // OPTIONAL - Useful but not critical
  postal_code: { requirement: "optional", category: "personal", description: "Código postal" },
  country: { requirement: "optional", category: "personal", description: "País" },
  employer: { requirement: "optional", category: "employment", description: "Empleador actual" },
  position: { requirement: "optional", category: "employment", description: "Cargo o posición" },
  employment_verified: { requirement: "optional", category: "employment", description: "Empleo verificado" },
  best_contact_time: { requirement: "optional", category: "contact", description: "Mejor horario de contacto" },
  response_score: { requirement: "optional", category: "collection", description: "Puntuación de respuesta" },
  collection_strategy: { requirement: "optional", category: "collection", description: "Estrategia de cobranza" },
  notes: { requirement: "optional", category: "collection", description: "Notas generales" },
  internal_notes: { requirement: "optional", category: "collection", description: "Notas internas" },
  tags: { requirement: "optional", category: "collection", description: "Etiquetas del cliente" }
};

// --- Client Model (Actualizado para coincidir con estructura real) ---
export interface IClient {
  id: string; // Unique system identifier
  
  // REQUIRED FIELDS - Critical for operation
  name: string;
  national_id: string;
  phone: string;
  debt: number;
  status: string; // e.g., "current", "overdue", "paid"
  loan_letter: string;
  
  // CONTACT FIELDS - Recommended for effectiveness
  email?: string; // Campo directo del cliente (encontrado en datos reales)
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  preferred_contact_method?: "whatsapp" | "phone" | "email";
  best_contact_time?: string;
  
  // EMPLOYMENT FIELDS - Optional but important
  employment_status?: string;
  employer?: string;
  position?: string;
  monthly_income?: number;
  employment_verified?: boolean;
  
  // FINANCIAL FIELDS - System calculated
  payment_date: IFirebaseTimestamp;
  installment_amount: number;
  pending_installments: number;
  due_date: IFirebaseTimestamp;
  loan_start_date: IFirebaseTimestamp;
  days_overdue: number;
  last_payment_date: IFirebaseTimestamp;
  last_payment_amount: number;
  
  // RISK ASSESSMENT FIELDS
  credit_score: number;
  risk_category: string; // e.g., "prime", "near-prime", "subprime"
  credit_limit: number;
  available_credit: number; // Encontrado en datos reales
  recovery_probability: number;
  
  // COLLECTION FIELDS
  response_score?: number;
  collection_strategy?: string;
  notes?: string;
  internal_notes?: string;
  tags?: string[];
  
  // SYSTEM FIELDS
  created_at: IFirebaseTimestamp;
  updated_at: IFirebaseTimestamp;
}

// --- Client Data Wrapper (estructura real en Firebase) ---
export interface IClientDocument {
  _data: IClient;
  customerInteractions?: ICustomerInteractions;
}

// --- Customer Interactions Container ---
export interface ICustomerInteractions {
  callLogs?: ICallLog[];
  emailRecords?: IEmailRecord[];
  clientAIProfiles?: IClientAIProfile;
}

// --- Customer Interaction Models ---

export interface ICallLog {
  id: string; // Document ID could also be implicitly handled by Firebase
  clientId: string;
  timestamp: IFirebaseTimestamp;
  /**
   * Type of call, e.g., "collection", "interaction", "support", "follow-up", etc.
   * Defined as a general string for flexibility.
   */
  callType: string;
  durationMinutes: number;
  agentId: string;
  notes?: string; // Optional field
  outcome?: string; // Optional field, e.g., "resolved", "escalated", "no answer"
  // ElevenLabs Integration
  audioUrl?: string; // URL to the recorded audio file
  transcription?: string; // Full transcription from ElevenLabs
  transcriptionConfidence?: number; // Confidence score (0-1)
  elevenLabsJobId?: string; // ElevenLabs job ID for tracking
  transcriptionStatus?: "pending" | "processing" | "completed" | "failed"; // Processing status
}

// WhatsApp Message Role for bot conversations
export interface IMessageRole {
  role: "client" | "bot" | "agent"; // Who is speaking
  content: string; // What they said
  timestamp: IFirebaseTimestamp; // When they said it
}

export interface IWhatsAppRecord {
  id: string; // Document ID
  clientId: string;
  timestamp: IFirebaseTimestamp;
  messageDirection: "inbound" | "outbound";
  agentId?: string; // Optional if message is initiated by client
  messageContent: string;
  attachments?: string[]; // Array of URLs or references
  interactionType: "text" | "media" | "template" | "other";
  // Bot Integration
  isBotConversation?: boolean; // Whether this is a bot conversation
  botTranscription?: IMessageRole[]; // Full conversation transcription with roles
  botSessionId?: string; // Bot session ID for tracking
  botIntent?: string; // Detected intent from bot
  botConfidence?: number; // Bot confidence score (0-1)
  requiresHumanHandoff?: boolean; // Whether bot escalated to human
}

// --- Email Record Model ---
export interface IEmailRecord {
  id: string; // Document ID
  clientId: string;
  timestamp: IFirebaseTimestamp;
  direction: "inbound" | "outbound";
  agentId?: string; // Optional if email is initiated by client
  subject: string;
  content: string;
  attachments?: string[]; // Array of URLs or references
  emailType: "collection" | "support" | "notification" | "other";
  status: "sent" | "delivered" | "read" | "bounced" | "failed";
  threadId?: string; // For email thread tracking
  priority: "low" | "normal" | "high" | "urgent";
}

// --- AI Client Profile Model (Enhanced) ---
export interface IClientAIProfile {
  clientId: string; // Foreign key to IClient
  analysisDate: IFirebaseTimestamp;
  lastUpdatedByAI: IFirebaseTimestamp;
  
  // === SEGMENTACIÓN Y CLASIFICACIÓN ===
  profileSegment: "HighValue" | "AtRisk" | "Engaged" | "Dormant" | "NewClient" | "VIP" | "Problematic";
  clientTier: "Premium" | "Standard" | "Basic" | "High-Risk";
  
  // === PUNTUACIONES DE RIESGO (0-100) ===
  riskScore: number; // Riesgo general de impago
  engagementScore: number; // Nivel de engagement con comunicaciones
  responsivenesScore: number; // Qué tan responsive es el cliente
  paymentBehaviorScore: number; // Historial de comportamiento de pago
  
  // === PREDICCIONES ===
  predictedChurnRisk: boolean; // Riesgo de abandono/fuga
  paymentProbability: number; // Probabilidad de pago en próximos 30 días (0-100)
  recoveryProbability: number; // Probabilidad de recuperación de deuda (0-100)
  defaultRisk: number; // Riesgo de default/morosidad (0-100)
  
  // === ANÁLISIS COMPORTAMENTAL ===
  communicationPreference: "whatsapp" | "phone" | "email" | "mixed" | "unknown";
  bestContactTime: "morning" | "afternoon" | "evening" | "flexible" | "unknown";
  responsePattern: "immediate" | "delayed" | "weekend-only" | "inconsistent" | "non-responsive";
  negotiationStyle: "cooperative" | "aggressive" | "evasive" | "professional" | "unknown";
  
  // === ACCIONES RECOMENDADAS ===
  recommendedAction: "PersonalizedOutreach" | "OfferDiscount" | "PaymentPlan" | "LegalAction" | "HighPriorityFollow" | "AutomatedReminder" | "HumanIntervention";
  recommendedContactMethod: "whatsapp" | "phone" | "email" | "in-person" | "legal-notice";
  urgencyLevel: "low" | "medium" | "high" | "critical";
  
  // === INSIGHTS DE IA ===
  aiInsights: string[]; // Array de insights generados por IA
  keyPersonalityTraits: string[]; // Rasgos de personalidad detectados
  financialStressIndicators: string[]; // Indicadores de estrés financiero
  
  // === EFECTIVIDAD DE ESTRATEGIAS ===
  mostEffectiveStrategy?: string; // Estrategia que mejor ha funcionado
  leastEffectiveStrategy?: string; // Estrategia que peor ha funcionado
  preferredMessageTone: "formal" | "friendly" | "urgent" | "empathetic" | "direct";
  
  // === CONTEXTO TEMPORAL ===
  seasonalPaymentPattern?: "consistent" | "holiday-affected" | "end-of-month" | "irregular";
  nextRecommendedContactDate: IFirebaseTimestamp;
  
  // === METADATOS ===
  aiModel: string; // Modelo de IA utilizado para el análisis
  confidenceScore: number; // Confianza en el análisis (0-100)
  dataQuality: "high" | "medium" | "low"; // Calidad de los datos analizados
  lastInteractionAnalyzed: IFirebaseTimestamp;
}
