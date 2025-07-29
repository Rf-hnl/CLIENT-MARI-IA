import { Timestamp } from 'firebase/firestore';

// Configuración global de ElevenLabs por tenant
export interface ITenantElevenLabsConfig {
  tenantId: string;
  apiKey: string;                    // ELEVENLABS_API_KEY
  apiUrl: string;                    // ELEVENLABS_API_URL
  phoneId: string;                   // ELEVENLABS_PHONE_ID (teléfono por defecto)
  
  // Configuración adicional del tenant
  settings: {
    defaultVoiceId: string;
    timezone: string;                // "America/Bogota"
    allowedCallHours: {
      start: string;                 // "09:00"
      end: string;                   // "18:00"
    };
    allowedDays: number[];           // [1,2,3,4,5] (Lun-Vie)
    maxConcurrentCalls: number;      // Límite de llamadas simultáneas
    costLimitPerMonth: number;       // Límite de gasto mensual en USD
  };
  
  metadata: {
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;               // UID del usuario que configuró
  };
}

// Configuración de voz para ElevenLabs
export interface IElevenLabsVoiceConfig {
  voiceId: string;                   // ID de la voz en ElevenLabs
  voiceName: string;                 // "María - Profesional"
  stability: number;                 // 0.0-1.0
  similarityBoost: number;           // 0.0-1.0
  style: number;                     // 0.0-1.0
}

// Configuración de conversación
export interface IElevenLabsConversationConfig {
  model: string;                     // "eleven_turbo_v2"
  temperature: number;               // 0.0-1.0
  maxTokens: number;                 // Token limit
  systemPrompt: string;              // Prompt del sistema
  firstMessage: string;              // Mensaje inicial de la llamada
}

// Configuración específica del agente ElevenLabs
export interface IElevenLabsAgentConfig {
  agentId: string;                   // ELEVENLABS_AGENT_ID específico
  voice: IElevenLabsVoiceConfig;
  conversation: IElevenLabsConversationConfig;
}

// Reglas de uso para el agente
export interface IAgentUsageRules {
  targetScenarios: string[];         // ["overdue_payment", "follow_up", "reminder"]
  daysOverdueRange: {
    min: number;                     // Mínimo días de atraso
    max: number;                     // Máximo días de atraso
  };
  riskCategories: string[];          // ["bajo", "medio", "alto"]
  clientStatuses: string[];          // ["current", "overdue", "paid"]
  priority: number;                  // 1-10, mayor número = mayor prioridad
}

// Estadísticas del agente
export interface IAgentStats {
  totalCalls: number;
  successfulCalls: number;
  averageDuration: number;           // En segundos
  averageSuccessRate: number;        // 0.0-1.0
  lastUsed: Timestamp | null;
  costPerCall: number;               // En USD
  totalCost: number;                 // Costo acumulado
}

// Metadata del agente
export interface IAgentMetadata {
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                 // UID del usuario
  version: string;                   // "1.0.0"
  tags: string[];                    // ["cobranza", "suave", "profesional"]
}

// Respuesta de API para test de conexión
export interface IElevenLabsConnectionTest {
  success: boolean;
  message: string;
  details?: {
    apiKeyValid: boolean;
    phoneIdValid: boolean;
    voicesAvailable: number;
    rateLimitRemaining: number;
  };
  error?: string;
}

// Respuesta de API para listar voces disponibles
export interface IElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  preview_url: string;
  available_for_tiers: string[];
}

// Resultado de operaciones CRUD
export interface IElevenLabsConfigResult {
  success: boolean;
  message: string;
  config?: ITenantElevenLabsConfig;
  error?: string;
}

// Datos para crear/actualizar configuración
export interface ICreateElevenLabsConfigData {
  apiKey: string;
  apiUrl: string;
  phoneId: string;
  settings: ITenantElevenLabsConfig['settings'];
}

export interface IUpdateElevenLabsConfigData extends Partial<ICreateElevenLabsConfigData> {
  // Permite actualizaciones parciales
}