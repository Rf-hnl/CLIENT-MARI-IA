// Tipos para la interfaz de cobros y batch calling

export interface IBatchCall {
  id: string;
  phone_number_id: string;
  name: string;
  agent_id: string;
  agent_name: string;
  phone_provider: string;
  
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