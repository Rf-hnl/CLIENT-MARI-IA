import { Timestamp } from 'firebase/firestore';
import { 
  IElevenLabsAgentConfig, 
  IAgentUsageRules, 
  IAgentStats, 
  IAgentMetadata,
  IElevenLabsAgentInfo
} from './elevenlabs';

// ==========================================
// REFERENCIA LOCAL DE AGENTE (OPTIMIZADA)
// ==========================================
// Solo guarda lo mínimo necesario en Firebase
export interface ILocalAgentReference {
  id: string;                        // ID local único
  tenantId: string;                  // Tenant al que pertenece
  
  // SOLO referencia a ElevenLabs (sin duplicar datos)
  elevenLabsConfig: {
    agentId: string;                 // ID del agente en ElevenLabs
  };
  
  // Cache opcional para performance (se actualiza en cada consulta)
  cache?: {
    name?: string;                   // Último nombre conocido
    lastSyncAt?: Timestamp;          // Última sincronización
  };
  
  // Reglas de uso LOCALES (tu lógica de negocio)
  usage: IAgentUsageRules;
  
  // Metadata LOCAL
  metadata: IAgentMetadata;
  
  // Estadísticas LOCALES
  stats: IAgentStats;
}

// ==========================================
// AGENTE ENRIQUECIDO (RUNTIME)
// ==========================================
// Combina referencia local + datos frescos de ElevenLabs
export interface ITenantElevenLabsAgent extends ILocalAgentReference {
  // Datos frescos de ElevenLabs (no guardados en Firebase)
  name: string;                      // Viene de ElevenLabs API
  description?: string;              // Opcional
  elevenLabsData: IElevenLabsAgentInfo; // Datos completos de ElevenLabs
}

// ==========================================
// DATOS DE ENTRADA PARA APIS
// ==========================================
// Datos para crear una nueva referencia de agente (OPTIMIZADA)
export interface ICreateAgentData {
  elevenLabsAgentId: string;         // Solo el ID del agente en ElevenLabs
  usage: IAgentUsageRules;           // Reglas de negocio locales
  tags?: string[];                   // Etiquetas locales
}

// Datos para actualizar reglas locales solamente
export interface IUpdateAgentData {
  usage?: Partial<IAgentUsageRules>; // Solo reglas de negocio
  tags?: string[];                   // Etiquetas locales
}

// Resultado de operaciones con agentes
export interface IAgentOperationResult {
  success: boolean;
  message: string;
  agent?: ITenantElevenLabsAgent;
  error?: string;
}

// Lista de agentes con paginación
export interface IAgentsListResult {
  success: boolean;
  agents: ITenantElevenLabsAgent[];
  total: number;
  page?: number;
  limit?: number;
  error?: string;
}

// Filtros para búsqueda de agentes
export interface IAgentsFilter {
  isActive?: boolean;
  tags?: string[];
  scenarios?: string[];
  riskCategories?: string[];
  search?: string;                   // Búsqueda por nombre o descripción
}

// Datos para selección automática de agente
export interface IAgentSelectionCriteria {
  clientId: string;
  daysOverdue: number;
  riskCategory: string;
  clientStatus: string;
  scenario: string;                  // "overdue_payment", "follow_up", etc.
}

// Resultado de selección de agente
export interface IAgentSelectionResult {
  success: boolean;
  agent: ITenantElevenLabsAgent | null;
  reason: string;                    // Razón de la selección o por qué no se seleccionó
  alternatives?: ITenantElevenLabsAgent[]; // Agentes alternativos disponibles
}

// Configuración de agentes predeterminados
export interface IDefaultAgentTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  firstMessage: string;
  usage: IAgentUsageRules;
  tags: string[];
}

// Estadísticas agregadas de todos los agentes del tenant
export interface ITenantAgentsStats {
  totalAgents: number;
  activeAgents: number;
  totalCalls: number;
  totalCost: number;
  averageSuccessRate: number;
  topPerformingAgent?: {
    id: string;
    name: string;
    successRate: number;
  };
  recentActivity: {
    callsToday: number;
    callsThisWeek: number;
    callsThisMonth: number;
  };
}

// Evento de llamada para tracking
export interface ICallEvent {
  id: string;
  agentId: string;
  clientId: string;
  tenantId: string;
  organizationId: string;
  
  status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number;                 // En segundos
  
  // Datos de la llamada
  phoneNumber: string;
  scenario: string;
  outcome?: string;                  // "payment_promise", "callback_requested", etc.
  
  // Costos y métricas
  cost?: number;
  tokensUsed?: number;
  
  // Transcripción y análisis
  transcription?: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  
  metadata: {
    elevenLabsCallId?: string;       // ID de la llamada en ElevenLabs
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };
}

// Plantillas de prompts predefinidos
export interface IPromptTemplate {
  id: string;
  name: string;
  description: string;
  scenario: string;
  systemPrompt: string;
  firstMessage: string;
  variables: string[];               // Variables que pueden ser reemplazadas
}

// Configuración de webhooks para eventos de llamadas
export interface IWebhookConfig {
  url: string;
  events: string[];                  // ["call_started", "call_ended", "transcript_ready"]
  isActive: boolean;
  secretKey?: string;                // Para validar la autenticidad
}