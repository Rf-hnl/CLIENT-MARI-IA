import { Timestamp } from 'firebase/firestore';

// ==========================================
// CONFIGURACIÓN GLOBAL DE ELEVENLABS
// ==========================================
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

// ==========================================
// CONFIGURACIÓN DE AGENTES
// ==========================================
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

// ==========================================
// REGLAS Y ESTADÍSTICAS DE AGENTES
// ==========================================
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

// ==========================================
// RESPUESTAS DE API Y CONEXIONES
// ==========================================
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
  voices?: IElevenLabsVoice[];
  error?: string;
}

// ==========================================
// CONVERSATION DETAILS FROM ELEVENLABS API
// ==========================================
export interface IConversationDetail {
  agent_id: string;
  conversation_id: string;
  status: 'initiated' | 'in-progress' | 'processing' | 'done' | 'failed';
  transcript: Array<{
    role: 'user' | 'agent'; // Assuming roles are user or agent
    time_in_call_secs: number;
    message: string;
  }>;
  metadata: {
    start_time_unix_secs: number;
    call_duration_secs: number;
    // Add other metadata fields as needed from the ElevenLabs API response
    [key: string]: any; // Allow for other unknown metadata properties
  };
  has_audio: boolean;
  has_user_audio: boolean;
  has_response_audio: boolean;
  user_id?: string | null;
  analysis?: { // Assuming a basic structure for analysis
    [key: string]: any; // Allow for other unknown analysis properties
  } | null;
  conversation_initiation_client_data?: { // Reusing the type from IBatchCallRecipient
    conversation_config_override?: {
      tts?: {
        voice_id?: string;
      };
      conversation?: {
        text_only?: boolean;
      };
      agent?: {
        first_message?: string;
        language?: string;
        prompt?: {
          prompt?: string;
        };
      };
    };
    custom_llm_extra_body?: Record<string, any>;
    user_id?: string;
    source_info?: {
      source?: string;
      version?: string;
    };
    dynamic_variables?: Record<string, any>;
  } | null;
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

// ==========================================
// DATOS DE ENTRADA PARA APIS
// ==========================================
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

// ==========================================
// INFORMACIÓN DE AGENTES DESDE ELEVENLABS API
// ==========================================
// Información del agente desde ElevenLabs API (estructura real de la API)
export interface IElevenLabsAgentInfo {
  agent_id: string;                      // ID único del agente en ElevenLabs
  name: string;                          // Nombre del agente
  conversation_config: {
    // Configuración de ASR (Automatic Speech Recognition)
    asr: {
      quality: string;                   // Calidad del reconocimiento de voz
      provider: string;                  // Proveedor de ASR
      user_input_audio_format: string;  // Formato de audio de entrada
      keywords: string[];                // Palabras clave para reconocimiento
    };
    // Configuración de turnos de conversación
    turn: {
      turn_timeout: number;              // Timeout entre turnos
      silence_end_call_timeout: number; // Timeout de silencio para finalizar llamada
      mode: string;                      // Modo de conversación
    };
    // Configuración de TTS (Text to Speech) - IMPORTANTE para edición
    tts: {
      model_id: string;                  // 🎯 Modelo de TTS (eleven_turbo_v2_5, etc.)
      voice_id: string;                  // 🎯 ID de la voz seleccionada
      supported_voices: string[];        // Voces soportadas
      agent_output_audio_format: string;// Formato de audio de salida
      optimize_streaming_latency: number;// Optimización de latencia
      stability: number;                 // 🎯 Estabilidad de la voz (0-1)
      speed: number;                     // Velocidad de habla
      similarity_boost: number;          // 🎯 Boost de similitud (0-1)
      pronunciation_dictionary_locators: string[];
    };
    // Configuración general de conversación
    conversation: {
      text_only: boolean;                // Solo texto o con audio
      max_duration_seconds: number;      // Duración máxima
      client_events: string[];           // Eventos del cliente
    };
    // Configuración del agente - IMPORTANTE para edición
    agent: {
      first_message: string;             // 🎯 Mensaje inicial de la conversación
      language: string;                  // Idioma del agente
      prompt: {
        prompt: string;                  // 🎯 Prompt del sistema
        llm: string;                     // Modelo de LLM utilizado
        temperature: number;             // 🎯 Temperatura del modelo (0-2)
        max_tokens: number;              // 🎯 Máximo número de tokens (-1 = ilimitado)
        tool_ids: string[];              // IDs de herramientas habilitadas
      };
    };
  };
  // Metadata del agente
  metadata: {
    created_at_unix_secs: number;        // Timestamp de creación
  };
  platform_settings: any;               // Configuraciones de plataforma (varía según ElevenLabs)
  phone_numbers: string[];               // Números de teléfono asociados
  workflow: any;                         // Flujo de trabajo (varía según configuración)
  // Información de acceso y permisos
  access_info: {
    is_creator: boolean;                 // Si el usuario actual es el creador
    creator_name: string;                // Nombre del creador
    creator_email: string;               // Email del creador
    role: string;                        // Rol del usuario actual
  };
  tags: string[];                        // Etiquetas del agente en ElevenLabs
}

// Resultado de API para obtener información del agente
export interface IAgentInfoResult {
  success: boolean;
  agent?: IElevenLabsAgentInfo;
  error?: string;
}

// ==========================================
// ANÁLISIS Y COSTOS DE AGENTES
// ==========================================
// Parámetros para calcular costos esperados de LLM
export interface IAgentLLMUsageCalculateRequest {
  prompt_length?: number;            // Longitud del prompt en caracteres
  number_of_pages?: number;          // Páginas de contenido en PDF o URLs en Knowledge Base
  rag_enabled?: boolean;             // Si está habilitado Retrieval-Augmented Generation
}

// Respuesta del cálculo de costos de LLM
export interface IAgentLLMUsageCalculateResponse {
  success: boolean;
  llm_prices?: {
    [model: string]: number;         // Precio por minuto para cada modelo (ej: "gpt-4o-mini": 42)
  };
  error?: string;
}

// Resultado completo del cálculo de costos
export interface IAgentCostCalculationResult {
  success: boolean;
  calculation?: IAgentLLMUsageCalculateResponse;
  error?: string;
}
