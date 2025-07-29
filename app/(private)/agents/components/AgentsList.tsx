'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bot, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Power,
  PowerOff,
  Phone,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { ITenantElevenLabsAgent } from '@/types/agents';
import { safeFormatDate } from '@/utils/dateFormat';

interface AgentsListProps {
  onEditAgent: (agent: ITenantElevenLabsAgent) => void;
}

export function AgentsList({ onEditAgent }: AgentsListProps) {
  const { 
    agents, 
    loading, 
    deleteAgent, 
    toggleAgentStatus 
  } = useAgentsContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Filtrar agentes
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && agent.metadata.isActive) ||
                         (filterStatus === 'inactive' && !agent.metadata.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteAgent = async (agent: ITenantElevenLabsAgent) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el agente "${agent.name}"?`)) {
      try {
        await deleteAgent(agent.id);
      } catch (error) {
        console.error('Error deleting agent:', error);
      }
    }
  };

  const handleToggleStatus = async (agent: ITenantElevenLabsAgent) => {
    try {
      await toggleAgentStatus(agent.id);
    } catch (error) {
      console.error('Error toggling agent status:', error);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Power className="h-3 w-3 mr-1" />
        Activo
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600">
        <PowerOff className="h-3 w-3 mr-1" />
        Inactivo
      </Badge>
    );
  };

  const getScenarioBadges = (scenarios: string[]) => {
    const scenarioLabels: Record<string, string> = {
      'overdue_payment': 'Pago Atrasado',
      'follow_up': 'Seguimiento',
      'reminder': 'Recordatorio',
      'negotiation': 'Negociación'
    };

    return scenarios.slice(0, 2).map(scenario => (
      <Badge key={scenario} variant="outline" className="text-xs">
        {scenarioLabels[scenario] || scenario}
      </Badge>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Agentes Disponibles ({filteredAgents.length})
          </CardTitle>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar agentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Activos
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('inactive')}
            >
              Inactivos
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterStatus !== 'all' ? 'No se encontraron agentes' : 'No hay agentes creados'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Crea tu primer agente para comenzar con las llamadas automatizadas'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Escenarios</TableHead>
                <TableHead>Configuración</TableHead>
                <TableHead>Estadísticas</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.description}
                      </div>
                      <div className="flex gap-1">
                        {agent.metadata.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(agent.metadata.isActive)}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getScenarioBadges(agent.usage.targetScenarios)}
                      {agent.usage.targetScenarios.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.usage.targetScenarios.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {agent.usage.daysOverdueRange.min}-{agent.usage.daysOverdueRange.max} días
                      </div>
                      <div>
                        Riesgo: {agent.usage.riskCategories.join(', ')}
                      </div>
                      <div>
                        Prioridad: {agent.usage.priority}/10
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {agent.stats.totalCalls} llamadas
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${agent.stats.totalCost.toFixed(2)}
                      </div>
                      <div>
                        Éxito: {agent.stats.totalCalls > 0 
                          ? `${((agent.stats.successfulCalls / agent.stats.totalCalls) * 100).toFixed(1)}%`
                          : 'Sin datos'
                        }
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs text-muted-foreground">
                      {agent.stats.lastUsed 
                        ? safeFormatDate(agent.stats.lastUsed)
                        : 'Nunca usado'
                      }
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEditAgent(agent)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(agent)}>
                          {agent.metadata.isActive ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAgent(agent)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}