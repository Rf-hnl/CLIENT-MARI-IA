'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Bot, 
  Phone, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Target,
  Award
} from 'lucide-react';
import { ITenantAgentsStats } from '@/types/agents';

interface AgentsStatsProps {
  stats: ITenantAgentsStats | null;
}

export function AgentsStats({ stats }: AgentsStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Estadísticas Disponibles</h3>
            <p className="text-muted-foreground">
              Las estadísticas aparecerán una vez que los agentes comiencen a realizar llamadas
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Estadísticas de Agentes</h2>
      </div>

      {/* Cards de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                {stats.activeAgents} activos
              </Badge>
              {stats.totalAgents - stats.activeAgents > 0 && (
                <Badge variant="outline">
                  {stats.totalAgents - stats.activeAgents} inactivos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Llamadas</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
              <TrendingUp className="h-3 w-3" />
              <span>
                {stats.averageSuccessRate.toFixed(1)}% tasa de éxito
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Promedio por llamada: ${stats.totalCalls > 0 ? (stats.totalCost / stats.totalCalls).toFixed(3) : '0.000'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageSuccessRate.toFixed(1)}%</div>
            <Progress 
              value={stats.averageSuccessRate} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Card del mejor agente */}
      {stats.topPerformingAgent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Agente con Mejor Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{stats.topPerformingAgent.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {stats.topPerformingAgent.id}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {stats.topPerformingAgent.successRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Tasa de éxito</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de actividad reciente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Llamadas Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.callsToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Actividad del día actual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.callsThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Llamadas en los últimos 7 días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity.callsThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Llamadas en los últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Estado del Sistema</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Agentes Activos:</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {stats.activeAgents}/{stats.totalAgents}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Sistema:</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    Operativo
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Métricas Clave</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Costo Promedio/Llamada:</span>
                  <span className="text-sm font-medium">
                    ${stats.totalCalls > 0 ? (stats.totalCost / stats.totalCalls).toFixed(3) : '0.000'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Eficiencia Global:</span>
                  <span className="text-sm font-medium">
                    {stats.averageSuccessRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}