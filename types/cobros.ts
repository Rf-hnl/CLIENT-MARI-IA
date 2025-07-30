// Tipos para la interfaz de cobros y batch calling

export interface IBatchCall {
  id: string;
  phone_number_id: string;
  name: string;
  agent_id: string;
  agent_name: string;
  phone_provider: string;
  workspace_id?: string; // Add workspace_id
  total_cost_usd?: number; // Add total_cost_usd
  
  // Timestamps originales (unix)
  created_at_unix: number;
  scheduled_time_unix: number;
  last_updated_at_unix: number;
  
  // Timestamps procesados (ISO)
  created_at: string;
  scheduled_time: string;
  last_updated_at: string;
  
  // Estadísticas
  total_calls_dispatched: number;
  total_calls_scheduled: number;
  progress: number; // Porcentaje calculado
  
  // Estado
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  
  // Categorización
  call_type: string; // Extraído del nombre

  // Configuración de la llamada
  conversation_config?: {
    voice_id: string;
    voice_name?: string;
    model_id: string;
    language: string;
    max_duration_seconds: number;
    webhook_url?: string;
  };
  retry_settings?: {
    max_retries: number;
    retry_delay_seconds: number;
  };
}

export interface IBatchCallRecipient {
  phone_number: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  
  // IDs relacionados
  conversation_id?: string;
  call_id?: string;
  
  // Timing
  started_at_unix?: number;
  ended_at_unix?: number;
  started_at?: string | null;
  ended_at?: string | null;
  
  // Duración
  duration_seconds?: number;
  duration_minutes: number;
  duration_formatted?: string; // Add duration_formatted
  
  // Costo
  cost_usd?: number; // Add cost_usd

  // Reintentos
  retry_count?: number; // Add retry_count

  // Transcripción y Audio
  transcript?: string; // Add transcript
  audio_url?: string; // Add audio_url

  // Calidad y Errores
  quality_score?: number; // Add quality_score
  error_message?: string; // Add error_message
  conversation_initiation_client_data?: { // Add conversation_initiation_client_data
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
  };
}

export interface IBatchCallDetail extends IBatchCall {
  recipients: IBatchCallRecipient[];
}

export interface IBatchCallsListResponse {
  success: boolean;
  data: {
    batch_calls: IBatchCall[];
    pagination: {
      next_doc?: string;
      has_more: boolean;
      limit: number;
      current_count: number;
    };
  };
  summary: {
    total_calls: number;
    by_status: Record<string, number>;
    by_agent: Record<string, number>;
  };
  error?: string;
}

export interface IBatchCallDetailResponse {
  success: boolean;
  data: IBatchCallDetail;
  stats: {
    total: number;
    by_status: Record<string, number>;
    total_duration_minutes: number;
  };
  error?: string;
}

// Filtros para la lista de cobros
export interface ICobrosFiltros {
  status?: string[];
  agent_id?: string;
  call_type?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Hook para la lista de cobros
export interface IUseBatchCallsOptions {
  tenantId: string | null;
  limit?: number;
  filters?: ICobrosFiltros;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
}

// Estados de carga
export interface IBatchCallsState {
  calls: IBatchCall[];
  loading: boolean;
  error: string | null;
  pagination: {
    next_doc?: string;
    has_more: boolean;
    limit: number;
  };
  summary: {
    total_calls: number;
    by_status: Record<string, number>;
    by_agent: Record<string, number>;
  };
}

// Colores por estado
export const BATCH_CALL_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
} as const;

// Iconos por estado
export const BATCH_CALL_STATUS_ICONS = {
  pending: '⏳',
  in_progress: '📞',
  completed: '✅',
  failed: '❌',
  cancelled: '🚫'
} as const;

// Estados híbridos más descriptivos
export const BATCH_CALL_HYBRID_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  processed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  completed_success: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  completed_partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  completed_failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
} as const;

export const BATCH_CALL_HYBRID_STATUS_ICONS = {
  pending: '⏳',
  in_progress: '📞',
  processed: '🔵',
  completed_success: '✅',
  completed_partial: '⚠️',
  completed_failed: '❌',
  failed: '❌',
  cancelled: '🚫'
} as const;

// Función helper para determinar el estado híbrido
export function getBatchHybridStatus(batchCall: IBatchCall, recipients?: IBatchCallRecipient[]): {
  status: keyof typeof BATCH_CALL_HYBRID_STATUS_COLORS;
  display: string;
  description: string;
} {
  // Si el batch no está completado, usar su estado original
  if (batchCall.status !== 'completed') {
    return {
      status: batchCall.status as keyof typeof BATCH_CALL_HYBRID_STATUS_COLORS,
      display: batchCall.status_display,
      description: batchCall.status_display
    };
  }

  // Si no tenemos recipients, usar información básica disponible
  if (!recipients) {
    const totalCalls = batchCall.total_calls_scheduled;
    const dispatchedCalls = batchCall.total_calls_dispatched;
    
    if (dispatchedCalls < totalCalls) {
      return {
        status: 'in_progress',
        display: 'En Progreso',
        description: `${dispatchedCalls}/${totalCalls} procesadas`
      };
    }
    
    // Si todas fueron despachadas pero no tenemos info detallada
    return {
      status: 'processed', // Usar azul para indicar "procesada" sin info de éxito
      display: 'Procesada',
      description: `${dispatchedCalls}/${totalCalls} llamadas completadas`
    };
  }

  // Si está completado, analizar los recipients
  const totalRecipients = recipients.length;
  const completedRecipients = recipients.filter(r => r.status === 'completed').length;
  const failedRecipients = recipients.filter(r => r.status === 'failed').length;
  const inProgressRecipients = recipients.filter(r => r.status === 'in_progress').length;

  // Si hay llamadas aún en progreso
  if (inProgressRecipients > 0) {
    return {
      status: 'in_progress',
      display: 'En Progreso',
      description: `${completedRecipients + failedRecipients}/${totalRecipients} procesadas`
    };
  }

  // Todas completadas exitosamente
  if (completedRecipients === totalRecipients) {
    return {
      status: 'completed_success',
      display: 'Completada con Éxito',
      description: `${completedRecipients}/${totalRecipients} exitosas`
    };
  }

  // Todas fallaron
  if (failedRecipients === totalRecipients) {
    return {
      status: 'completed_failed',
      display: 'Completada con Errores',
      description: `0/${totalRecipients} exitosas - Todas fallaron`
    };
  }

  // Mix de éxito y fallo
  return {
    status: 'completed_partial',
    display: 'Completada Parcialmente',
    description: `${completedRecipients}/${totalRecipients} exitosas`
  };
}
