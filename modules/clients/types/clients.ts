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

// --- Client Model ---
export interface IClient {
  id: string; // Unique system identifier
  // REQUIRED FIELDS - Critical for operation
  name: string;
  national_id: string;
  phone: string;
  debt: number;
  status: string; // e.g., "current", "overdue", "paid"
  loan_letter: string;
  
  // RECOMMENDED FIELDS - Important for effectiveness
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  employment_status?: string;
  monthly_income?: number;
  preferred_contact_method?: "whatsapp" | "phone" | "email";
  
  // OPTIONAL FIELDS - Nice to have
  postal_code?: string;
  country?: string;
  employer?: string;
  position?: string;
  employment_verified?: boolean;
  best_contact_time?: string;
  response_score?: number;
  collection_strategy?: string;
  notes?: string;
  internal_notes?: string;
  tags?: string[];
  
  // SYSTEM CALCULATED FIELDS - Auto-generated
  payment_date: IFirebaseTimestamp;
  installment_amount: number;
  pending_installments: number;
  due_date: IFirebaseTimestamp;
  loan_start_date: IFirebaseTimestamp;
  days_overdue: number;
  last_payment_date: IFirebaseTimestamp;
  last_payment_amount: number;
  credit_score: number;
  risk_category: string;
  credit_limit: number;
  available_credit: number;
  recovery_probability: number;
  created_at: IFirebaseTimestamp;
  updated_at: IFirebaseTimestamp;
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

// --- AI Client Profile Model ---
export interface IClientAIProfile {
  clientId: string; // Foreign key to IClient
  analysisDate: IFirebaseTimestamp;
  profileSegment: string; // e.g., "HighValue", "AtRisk", "Engaged"
  riskScore?: number; // Optional, e.g., 0-100
  engagementScore?: number; // Optional, e.g., 0-100
  predictedChurnRisk?: boolean; // Optional
  recommendedAction?: string; // Optional, e.g., "OfferDiscount", "PersonalizedOutreach"
  lastUpdatedByAI: IFirebaseTimestamp;
}
