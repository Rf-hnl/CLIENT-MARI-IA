'use client';

import { useState } from 'react';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useBatchCalls, useCobrosFiltros } from '@/hooks/useBatchCalls';
import { useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { AgentsLoader } from '@/modules/agents/components/AgentsLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw, Search, Filter, Eye, Phone, Calendar, Clock, Users } from 'lucide-react';
import { BATCH_CALL_STATUS_COLORS, BATCH_CALL_STATUS_ICONS, BATCH_CALL_HYBRID_STATUS_COLORS, BATCH_CALL_HYBRID_STATUS_ICONS, getBatchHybridStatus } from '@/types/cobros';
import { IBatchCall } from '@/types/cobros';
import { safeFormatDate } from '@/utils/dateFormat';
import { BatchCallDetailModal } from '@/components/cobros/BatchCallDetailModal';
import { CallsChart } from '@/components/cobros/CallsChart';

// Componente interno que usa los agentes
const CobrosContent = () => {
  const { currentTenant } = useClients();
  const { agents, loading: agentsLoading } = useAgentsContext();
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useCobrosFiltros();
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  
  const {
    calls,
    loading,
    error,
    summary,
    hasMore,
    loadMore,
    refresh
  } = useBatchCalls({
    tenantId: currentTenant?.id || null,
    limit: 50, // Aumentar limit para obtener más datos de una vez
    filters,
    autoRefresh: false, // Desactivar auto-refresh
    refreshInterval: 0
  });

  const handleViewDetails = (batchId: string) => {
    setSelectedBatch(batchId);
  };

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">Selecciona un tenant para ver los cobros</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Cobros</h1>
          <p className="text-muted-foreground">
            Administra las llamadas automáticas de cobranza
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Llamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_calls}</div>
            <p className="text-xs text-muted-foreground">
              Batch calls registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.by_status.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">
              Llamadas activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.by_status.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Llamadas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(summary.by_agent).length}</div>
            <p className="text-xs text-muted-foreground">
              Agentes utilizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select
                value={filters.status?.[0] || 'all'}
                onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="failed">Fallida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Llamada</label>
              <Select
                value={filters.call_type?.[0] || 'all'}
                onValueChange={(value) => updateFilter('call_type', value === 'all' ? undefined : [value])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="Pago Atrasado">Pago Atrasado</SelectItem>
                  <SelectItem value="Seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="Solicitud Info">Solicitud Info</SelectItem>
                  <SelectItem value="Consulta General">Consulta General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selector de Agente */}
            <div>
              <label className="text-sm font-medium mb-2 block">Agente</label>
              <Select
                value={filters.agent_id || 'all'}
                onValueChange={(value) => updateFilter('agent_id', value === 'all' ? undefined : value)}
                disabled={agentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los agentes</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.elevenLabsConfig.agentId}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Llamadas de Cobranza</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4">
              Error: {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calls.map((call) => (
              <BatchCallCard
                key={call.id}
                call={call}
                onViewDetails={handleViewDetails}
              />
            ))}

          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Cargando llamadas...</span>
            </div>
          )}

          {!loading && calls.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron llamadas de cobranza
            </div>
          )}

          {hasMore && !loading && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                Cargar más llamadas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <CallsChart calls={calls} loading={loading} />

      {/* Detail Modal */}
      <BatchCallDetailModal
        batchId={selectedBatch}
        isOpen={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
      />
    </div>
  );
};

// Componente principal con wrapper de AgentsLoader
export default function CobrosPage() {
  return (
    <AgentsLoader 
      autoLoad={true} 
      showLoading={true}
      onLoaded={() => console.log('🎯 [COBROS] Agents loaded for cobros filtering')}
    >
      <CobrosContent />
    </AgentsLoader>
  );
}

// Componente para cada tarjeta de llamada batch
interface BatchCallCardProps {
  call: IBatchCall;
  onViewDetails: (batchId: string) => void;
}

function BatchCallCard({ call, onViewDetails }: BatchCallCardProps) {
  const hybridStatus = getBatchHybridStatus(call);
  const statusColor = BATCH_CALL_HYBRID_STATUS_COLORS[hybridStatus.status];
  const statusIcon = BATCH_CALL_HYBRID_STATUS_ICONS[hybridStatus.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold mb-2 leading-tight line-clamp-2">
              {call.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={statusColor}>
                <span className="mr-1">{statusIcon}</span>
                {hybridStatus.display}
              </Badge>
              <Badge variant="outline">{call.call_type}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {hybridStatus.description}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Agente:</span>
            <p className="text-foreground truncate">{call.agent_name}</p>
          </div>
          
          <div>
            <span className="font-medium text-muted-foreground">Programada:</span>
            <p className="text-foreground">{safeFormatDate(call.scheduled_time)}</p>
          </div>
          
          <div>
            <span className="font-medium text-muted-foreground">Progreso:</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${call.progress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground min-w-[40px]">
                {call.progress}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {call.total_calls_dispatched}/{call.total_calls_scheduled} llamadas
            </p>
          </div>
          
          <div>
            <span className="font-medium text-muted-foreground">Actualizada:</span>
            <p className="text-foreground text-xs">{safeFormatDate(call.last_updated_at)}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(call.id)}
          className="w-full mt-4"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalles
        </Button>
      </CardContent>
    </Card>
  );
}