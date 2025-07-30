'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  IBatchCall, 
  IBatchCallDetail, 
  IBatchCallsListResponse, 
  IBatchCallDetailResponse,
  IBatchCallsState,
  IUseBatchCallsOptions,
  ICobrosFiltros
} from '@/types/cobros';

export const useBatchCalls = ({
  tenantId,
  limit = 50,
  filters,
  autoRefresh = false,
  refreshInterval = 30000 // 30 segundos
}: IUseBatchCallsOptions) => {
  const [state, setState] = useState<IBatchCallsState>({
    calls: [],
    loading: false,
    error: null,
    pagination: {
      has_more: false,
      limit
    },
    summary: {
      total_calls: 0,
      by_status: {},
      by_agent: {}
    }
  });

  const fetchBatchCalls = useCallback(async (lastDoc?: string) => {
    if (!tenantId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/cobros/batch-calls/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          limit,
          last_doc: lastDoc,
          filters
        }),
      });

      const result: IBatchCallsListResponse = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          calls: lastDoc ? [...prev.calls, ...result.data.batch_calls] : result.data.batch_calls,
          loading: false,
          error: null,
          pagination: result.data.pagination,
          summary: result.summary
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Error desconocido'
        }));
        toast.error(`Error al cargar llamadas: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      toast.error(`Error de red: ${errorMessage}`);
    }
  }, [tenantId, limit, filters]);

  const loadMore = useCallback(() => {
    if (state.pagination.has_more && !state.loading) {
      fetchBatchCalls(state.pagination.next_doc);
    }
  }, [fetchBatchCalls, state.pagination.has_more, state.pagination.next_doc, state.loading]);

  const refresh = useCallback(() => {
    fetchBatchCalls();
  }, [fetchBatchCalls]);

  // Auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (autoRefresh && tenantId) {
      interval = setInterval(() => {
        fetchBatchCalls();
      }, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [autoRefresh, refreshInterval, fetchBatchCalls, tenantId]);

  // Initial load
  useEffect(() => {
    fetchBatchCalls();
  }, [fetchBatchCalls]);

  return {
    ...state,
    loadMore,
    refresh,
    hasMore: state.pagination.has_more
  };
};

// Hook para obtener detalles de una llamada batch específica
export const useBatchCallDetail = (tenantId: string | null, batchId: string | null) => {
  const [detail, setDetail] = useState<IBatchCallDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!tenantId || !batchId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cobros/batch-calls/${batchId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      const result: IBatchCallDetailResponse = await response.json();

      if (result.success) {
        setDetail(result.data);
        setError(null);
      } else {
        setError(result.error || 'Error desconocido');
        toast.error(`Error al cargar detalles: ${result.error}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error de red';
      setError(errorMessage);
      toast.error(`Error de red: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [tenantId, batchId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    detail,
    loading,
    error,
    refresh: fetchDetail
  };
};

// Hook para filtros
export const useCobrosFiltros = () => {
  const [filters, setFilters] = useState<ICobrosFiltros>({});

  const updateFilter = useCallback((key: keyof ICobrosFiltros, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ICobrosFiltros];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : value !== '');
  });

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
};