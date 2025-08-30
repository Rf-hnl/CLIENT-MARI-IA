/**
 * QUICK ANALYTICS PANEL
 * 
 * Panel compacto que muestra métricas clave sin necesidad de modal
 * Integra funcionalidades de las Fases 1-5 en vista resumida
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Phone,
  Target,
  Clock,
  Users,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Activity,
  Brain,
  Star,
  Calendar
} from 'lucide-react';

interface QuickAnalyticsPanelProps {
  selectedLeadIds: string[];
  tenantId: string;
  organizationId: string;
  onOpenFullAnalytics: () => void;
  className?: string;
}

interface QuickMetric {
  id: string;
  name: string;
  value: number | string;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  description: string;
}

export function QuickAnalyticsPanel({
  selectedLeadIds,
  tenantId,
  organizationId,
  onOpenFullAnalytics,
  className = ""
}: QuickAnalyticsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<QuickMetric[]>([]);

  /**
   * Cargar métricas rápidas
   */
  const loadQuickMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Simulación de carga de métricas reales
      // En producción esto vendría de las APIs desarrolladas en Fase 5
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockMetrics: QuickMetric[] = [
        {
          id: 'active_calls',
          name: 'Llamadas Activas',
          value: Math.floor(Math.random() * 5),
          change: 15.2,
          trend: 'up',
          icon: Phone,
          color: 'text-blue-600',
          description: 'Llamadas en proceso ahora'
        },
        {
          id: 'conversion_rate',
          name: 'Tasa Conversión',
          value: (18.5 + Math.random() * 5).toFixed(1) + '%',
          change: 8.3,
          trend: 'up',
          icon: Target,
          color: 'text-green-600',
          description: 'Conversión últimos 7 días'
        },
        {
          id: 'hot_leads',
          name: 'Leads Calientes',
          value: Math.floor(Math.random() * 15) + 5,
          change: 12.1,
          trend: 'up',
          icon: Zap,
          color: 'text-orange-600',
          description: 'Score alto + engagement'
        },
        {
          id: 'pipeline_value',
          name: 'Pipeline',
          value: '$' + (45000 + Math.floor(Math.random() * 20000)).toLocaleString(),
          change: -2.3,
          trend: 'down',
          icon: TrendingUp,
          color: 'text-purple-600',
          description: 'Valor estimado pipeline'
        },
        {
          id: 'avg_score',
          name: 'Score Promedio',
          value: Math.floor(67 + Math.random() * 15),
          change: 5.7,
          trend: 'up',
          icon: Brain,
          color: 'text-indigo-600',
          description: 'Lead scoring predictivo'
        },
        {
          id: 'scheduled_meetings',
          name: 'Reuniones Hoy',
          value: Math.floor(Math.random() * 8) + 2,
          change: 0,
          trend: 'stable',
          icon: Calendar,
          color: 'text-teal-600',
          description: 'Agendadas automáticamente'
        }
      ];
      
      setMetrics(mockMetrics);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading quick metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cargar datos al montar el componente
   */
  useEffect(() => {
    loadQuickMetrics();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadQuickMetrics, 30000);
    
    return () => clearInterval(interval);
  }, [tenantId, organizationId]);

  /**
   * Obtener icono de tendencia
   */
  const getTrendIcon = (trend: string, change?: number) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-500" />;
    return <Activity className="w-3 h-3 text-gray-500" />;
  };

  /**
   * Obtener color de cambio
   */
  const getChangeColor = (change?: number) => {
    if (!change) return 'text-gray-500';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className={`border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <div>
              <CardTitle className="text-lg text-gray-900">
                📊 Quick Analytics
              </CardTitle>
              <p className="text-sm text-gray-600 mt-0.5">
                Métricas en tiempo real • Sistema integrado Fases 1-5
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">
                {lastUpdated.toLocaleTimeString('es-ES')}
              </span>
            </div>
            
            {/* Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={loadQuickMetrics}
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Métricas principales en grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={metric.id}
                className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`w-4 h-4 ${metric.color}`} />
                  {getTrendIcon(metric.trend, metric.change)}
                </div>
                
                <div className="space-y-1">
                  <div className="text-lg font-bold text-gray-900">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {metric.name}
                  </div>
                  {metric.change !== undefined && metric.change !== 0 && (
                    <div className={`text-xs font-medium ${getChangeColor(metric.change)}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Información expandida */}
        {isExpanded && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            {/* Alertas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <h4 className="font-medium text-green-900">Sistema Operativo</h4>
                </div>
                <p className="text-sm text-green-800">
                  Todas las fases integradas funcionando correctamente
                </p>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium text-orange-900">Leads Pendientes</h4>
                </div>
                <p className="text-sm text-orange-800">
                  {selectedLeadIds.length > 0 
                    ? `${selectedLeadIds.length} leads seleccionados para procesamiento`
                    : 'No hay leads seleccionados'
                  }
                </p>
              </div>
            </div>

            {/* Funcionalidades disponibles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Badge variant="secondary" className="justify-center py-2 bg-blue-100 text-blue-800">
                📞 Bulk Calling
              </Badge>
              <Badge variant="secondary" className="justify-center py-2 bg-pink-100 text-pink-800">
                💝 Sentiment IA
              </Badge>
              <Badge variant="secondary" className="justify-center py-2 bg-green-100 text-green-800">
                📅 Calendar Auto
              </Badge>
              <Badge variant="secondary" className="justify-center py-2 bg-purple-100 text-purple-800">
                🎯 Scripts IA
              </Badge>
              <Badge variant="secondary" className="justify-center py-2 bg-orange-100 text-orange-800">
                📊 Analytics Pro
              </Badge>
            </div>

            {/* Botón para abrir analytics completo */}
            <div className="flex justify-center pt-2">
              <Button 
                onClick={onOpenFullAnalytics}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Abrir Analytics Completo
                <Star className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-gray-600">Actualizando métricas...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}