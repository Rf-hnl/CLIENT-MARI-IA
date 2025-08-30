/**
 * AI AGENTS TYPES - LEADS MODULE
 * 
 * Tipos para configuración de múltiples agentes de IA para análisis de leads
 * Soporte para múltiples proveedores: OpenAI, Claude, Groq, etc.
 */

import { IFirebaseTimestamp } from './leads';

// ==========================================
// PROVEEDORES DE IA SOPORTADOS
// ==========================================
export type AIProvider = 
  | "openai"
  | "anthropic"  // Claude
  | "groq"
  | "cohere"
  | "huggingface"
  | "custom";

// ==========================================
// CONFIGURACIÓN POR PROVEEDOR
// ==========================================

// Configuración base para todos los proveedores
export interface BaseAIConfig {
  apiKey: string;
  baseUrl?: string;
  organization?: string;
  maxTokens: number;
  temperature: number;
  timeout?: number; // milliseconds
}

// Configuración específica para OpenAI
export interface OpenAIConfig extends BaseAIConfig {
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-4o-mini';
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  seed?: number;
}

// Configuración específica para Anthropic (Claude)
export interface AnthropicConfig extends BaseAIConfig {
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
  version: '2023-06-01';
  topP?: number;
  topK?: number;
}

// Configuración específica para Groq
export interface GroqConfig extends BaseAIConfig {
  model: 'llama3-8b-8192' | 'llama3-70b-8192' | 'mixtral-8x7b-32768' | 'gemma-7b-it';
  topP?: number;
  stream?: boolean;
}

// Configuración específica para Cohere
export interface CohereConfig extends BaseAIConfig {
  model: 'command' | 'command-light' | 'command-nightly';
  p?: number;
  k?: number;
  stopSequences?: string[];
}

// Configuración para API custom
export interface CustomAIConfig extends BaseAIConfig {
  model: string;
  headers?: Record<string, string>;
  customParams?: Record<string, any>;
}

// Union type para todas las configuraciones
export type AIProviderConfig = 
  | { provider: 'openai'; config: OpenAIConfig }
  | { provider: 'anthropic'; config: AnthropicConfig }
  | { provider: 'groq'; config: GroqConfig }
  | { provider: 'cohere'; config: CohereConfig }
  | { provider: 'custom'; config: CustomAIConfig };

// ==========================================
// AGENTE DE IA PARA LEADS
// ==========================================
export interface ILeadAIAgent {
  id: string;
  tenantId: string;
  organizationId: string;
  
  // Información básica
  name: string;
  description: string;
  purpose: 'lead_scoring' | 'lead_classification' | 'lead_enrichment' | 'lead_analysis';
  
  // Configuración del proveedor
  providerConfig: AIProviderConfig;
  
  // Configuración del prompt
  systemPrompt: string;
  instructions: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  
  // Configuración de uso
  usage: {
    isActive: boolean;
    isDefault: boolean; // Si es el agente por defecto para su propósito
    priority: number; // Orden de preferencia (1 = más alto)
    maxRequestsPerDay?: number;
    maxCostPerMonth?: number; // USD
    allowedUsers?: string[]; // UIDs de usuarios autorizados
  };
  
  // Validación y testing
  validation: {
    isValidated: boolean;
    lastValidation?: IFirebaseTimestamp;
    validationResults?: {
      responseTime: number; // ms
      accuracy?: number; // 0-100%
      reliability?: number; // 0-100%
      costPerRequest?: number; // USD
    };
    testCases?: Array<{
      input: any;
      expectedOutput: any;
      actualOutput?: any;
      passed?: boolean;
    }>;
  };
  
  // Estadísticas de uso
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    totalCost: number; // USD
    averageResponseTime: number; // ms
    lastUsed?: IFirebaseTimestamp;
    createdAt: IFirebaseTimestamp;
    updatedAt: IFirebaseTimestamp;
  };
  
  // Metadatos
  metadata: {
    version: string;
    createdBy: string; // UID del usuario
    updatedBy: string; // UID del usuario
    tags: string[];
    notes?: string;
  };
}

// ==========================================
// CONFIGURACIÓN DE AGENTES POR TENANT
// ==========================================
export interface ITenantAIAgentsConfig {
  tenantId: string;
  organizationId: string;
  
  // Configuración global
  settings: {
    isEnabled: boolean;
    maxAgentsPerTenant: number;
    maxRequestsPerDay: number;
    maxCostPerMonth: number; // USD
    defaultProvider: AIProvider;
    allowedProviders: AIProvider[];
  };
  
  // Agentes configurados
  agents: ILeadAIAgent[];
  
  // Agente por defecto para cada propósito
  defaults: {
    leadScoring?: string; // ID del agente
    leadClassification?: string;
    leadEnrichment?: string;
    leadAnalysis?: string;
  };
  
  metadata: {
    createdAt: IFirebaseTimestamp;
    updatedAt: IFirebaseTimestamp;
    createdBy: string;
    updatedBy: string;
  };
}

// ==========================================
// PETICIÓN A AGENTE DE IA
// ==========================================
export interface IAIAgentRequest {
  agentId: string;
  input: {
    leadData: any;
    context?: Record<string, any>;
    options?: {
      includeExplanation?: boolean;
      format?: 'json' | 'text';
      language?: 'es' | 'en';
    };
  };
  metadata: {
    requestId: string;
    userId: string;
    timestamp: IFirebaseTimestamp;
    source: 'manual' | 'automatic' | 'bulk';
  };
}

// ==========================================
// RESPUESTA DE AGENTE DE IA
// ==========================================
export interface IAIAgentResponse {
  requestId: string;
  agentId: string;
  
  success: boolean;
  
  // Respuesta exitosa
  result?: {
    score?: number; // Para lead scoring
    classification?: string; // Para clasificación
    enrichedData?: Record<string, any>; // Para enrichment
    analysis?: string; // Para análisis
    confidence: number; // 0-100%
    explanation?: string;
    factors?: Record<string, any>;
  };
  
  // Error
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Métricas
  metrics: {
    responseTime: number; // ms
    tokensUsed?: number;
    cost?: number; // USD
    provider: AIProvider;
    model: string;
  };
  
  metadata: {
    timestamp: IFirebaseTimestamp;
    version: string;
  };
}

// ==========================================
// PLANTILLAS DE AGENTES PREDEFINIDAS
// ==========================================
export interface IAIAgentTemplate {
  id: string;
  name: string;
  description: string;
  purpose: ILeadAIAgent['purpose'];
  provider: AIProvider;
  
  // Configuración recomendada
  recommendedConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  
  // Prompts predefinidos
  systemPrompt: string;
  instructions: string;
  examples: ILeadAIAgent['examples'];
  
  // Casos de prueba
  testCases: Array<{
    name: string;
    input: any;
    expectedOutput: any;
    description: string;
  }>;
  
  metadata: {
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedCostPerRequest: number; // USD
    tags: string[];
  };
}

// ==========================================
// UTILIDADES Y HELPERS
// ==========================================

// Resultado de validación de agente
export interface IAgentValidationResult {
  isValid: boolean;
  agent: ILeadAIAgent;
  issues: Array<{
    level: 'error' | 'warning' | 'info';
    field: string;
    message: string;
    suggestion?: string;
  }>;
  testResults: {
    connectionTest: { success: boolean; responseTime?: number; error?: string };
    promptTest: { success: boolean; response?: string; error?: string };
    costEstimate: { perRequest: number; perMonth: number };
  };
}

// Filtros para búsqueda de agentes
export interface IAIAgentsFilter {
  provider?: AIProvider;
  purpose?: ILeadAIAgent['purpose'];
  isActive?: boolean;
  isValidated?: boolean;
  createdBy?: string;
  tags?: string[];
  search?: string; // Búsqueda por nombre o descripción
}

// Estadísticas agregadas de agentes IA
export interface IAIAgentsStats {
  totalAgents: number;
  activeAgents: number;
  validatedAgents: number;
  totalRequests: number;
  totalCost: number; // USD
  averageResponseTime: number; // ms
  successRate: number; // 0-100%
  
  byProvider: Record<AIProvider, {
    agents: number;
    requests: number;
    cost: number;
    avgResponseTime: number;
  }>;
  
  byPurpose: Record<ILeadAIAgent['purpose'], {
    agents: number;
    requests: number;
    defaultAgent?: string;
  }>;
  
  recentActivity: {
    requestsToday: number;
    requestsThisWeek: number;
    requestsThisMonth: number;
    costThisMonth: number;
  };
}

// Configuración para crear un nuevo agente
export interface ICreateAIAgentData {
  name: string;
  description: string;
  purpose: ILeadAIAgent['purpose'];
  provider: AIProvider;
  
  // Configuración específica del proveedor
  apiKey: string;
  model: string;
  
  // Configuración opcional
  systemPrompt?: string;
  instructions?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Opciones de uso
  isDefault?: boolean;
  maxRequestsPerDay?: number;
  maxCostPerMonth?: number;
  tags?: string[];
}