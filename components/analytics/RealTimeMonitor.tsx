/**
 * REAL-TIME MONITOR
 * 
 * Componente de monitoreo en tiempo real para llamadas, conversiones
 * y métricas críticas del sistema con alertas automáticas
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity,
  Zap,
  Phone,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Heart,
  Brain,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { RealTimeMetrics, ActivityFeed } from '@/types/analytics';

interface RealTimeMonitorProps {
  tenantId: string;
  organizationId: string;
  onAlert?: (alert: RealTimeAlert) => void;
  className?: string;
}

interface RealTimeAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  autoAcknowledge?: number; // seconds
}

interface LiveMetric {
  id: string;
  name: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
  unit: string;
  icon: React.ElementType;
  color: string;
}

export function RealTimeMonitor({
  tenantId,
  organizationId,
  onAlert,
  className = ""
}: RealTimeMonitorProps) {
  // Estados principales
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Estados de datos
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityFeed[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<RealTimeAlert[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  // Referencias
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const alertIdCounter = useRef(0);

  /**
   * Inicializar monitoreo
   */
  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [isMonitoring, tenantId, organizationId]);

  /**
   * Iniciar monitoreo en tiempo real
   */
  const startMonitoring = () => {
    console.log('📡 [REAL-TIME MONITOR] Starting real-time monitoring');
    setConnectionStatus('connecting');

    // Cargar datos iniciales
    loadRealTimeData();

    // Configurar actualizaciones cada 5 segundos
    intervalRef.current = setInterval(() => {
      loadRealTimeData();
    }, 5000);

    setConnectionStatus('connected');
    setIsConnected(true);
  };

  /**
   * Detener monitoreo
   */
  const stopMonitoring = () => {
    console.log('⏹️ [REAL-TIME MONITOR] Stopping real-time monitoring');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setConnectionStatus('error');
    setIsConnected(false);
  };

  /**
   * Cargar datos en tiempo real
   */
  const loadRealTimeData = async () => {
    try {
      const response = await fetch(
        `/api/analytics/dashboard?tenantId=${tenantId}&organizationId=${organizationId}&period=realtime`
      );

      const data = await response.json();

      if (data.success) {
        const metrics = data.data.realTimeMetrics;
        updateLiveMetrics(metrics);
        setRecentActivity(data.data.recentActivity);
        checkForAlerts(metrics);
        setLastUpdated(new Date());
      }

    } catch (error) {
      console.error('❌ [REAL-TIME MONITOR] Error loading real-time data:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  };

  /**
   * Actualizar métricas en vivo
   */
  const updateLiveMetrics = (metrics: RealTimeMetrics) => {
    const newMetrics: LiveMetric[] = [
      {
        id: 'active_calls',
        name: 'Llamadas Activas',
        value: metrics.activeCalls,
        trend: 'stable',
        status: metrics.activeCalls > 5 ? 'normal' : 'warning',
        unit: '',
        icon: Phone,
        color: 'blue'
      },
      {
        id: 'success_rate',
        name: 'Tasa de Éxito',
        value: metrics.currentConversionRate.toFixed(1),
        trend: 'up',
        status: metrics.currentConversionRate > 20 ? 'normal' : 
               metrics.currentConversionRate > 10 ? 'warning' : 'critical',
        unit: '%',
        icon: Target,
        color: 'green'
      },
      {
        id: 'hot_leads',
        name: 'Leads Calientes',
        value: metrics.hotLeads,
        trend: metrics.hotLeads > 5 ? 'up' : 'stable',
        status: 'normal',
        unit: '',
        icon: Zap,
        color: 'orange'
      },
      {
        id: 'pipeline_leads',
        name: 'Leads en Pipeline',
        value: metrics.leadsInPipeline,
        trend: 'stable',
        status: 'normal',
        unit: '',
        icon: Users,
        color: 'purple'
      },
      {
        id: 'avg_duration',
        name: 'Duración Promedio',
        value: metrics.averageCallDuration.toFixed(1),
        trend: 'stable',
        status: metrics.averageCallDuration > 5 ? 'normal' : 'warning',
        unit: 'min',
        icon: Clock,
        color: 'indigo'
      },
      {
        id: 'successful_today',
        name: 'Exitosas Hoy',
        value: metrics.successfulCallsToday,
        trend: 'up',
        status: 'normal',
        unit: '',
        icon: CheckCircle,
        color: 'green'
      }
    ];

    setLiveMetrics(newMetrics);
  };

  /**
   * Verificar condiciones de alerta
   */
  const checkForAlerts = (metrics: RealTimeMetrics) => {
    const newAlerts: RealTimeAlert[] = [];

    // Alerta: Tasa de conversión baja
    if (metrics.currentConversionRate < 10) {
      newAlerts.push({
        id: `alert_${++alertIdCounter.current}`,
        type: 'warning',
        title: 'Tasa de Conversión Baja',
        message: `La tasa actual es ${metrics.currentConversionRate.toFixed(1)}% (objetivo: >15%)`,
        timestamp: new Date(),
        acknowledged: false,
        autoAcknowledge: 30
      });
    }

    // Alerta: Muchos leads calientes
    if (metrics.hotLeads > 10) {
      newAlerts.push({
        id: `alert_${++alertIdCounter.current}`,
        type: 'info',
        title: 'Muchos Leads Calientes',
        message: `${metrics.hotLeads} leads calientes necesitan atención inmediata`,
        timestamp: new Date(),
        acknowledged: false,
        autoAcknowledge: 60
      });
    }

    // Alerta: Sin llamadas activas
    if (metrics.activeCalls === 0 && isMonitoring) {
      newAlerts.push({
        id: `alert_${++alertIdCounter.current}`,
        type: 'warning',
        title: 'Sin Llamadas Activas',
        message: 'No hay llamadas en proceso actualmente',
        timestamp: new Date(),
        acknowledged: false,
        autoAcknowledge: 45
      });
    }

    // Procesar nuevas alertas
    newAlerts.forEach(alert => {
      addAlert(alert);
    });
  };

  /**
   * Agregar nueva alerta
   */
  const addAlert = (alert: RealTimeAlert) => {
    setActiveAlerts(prev => [...prev, alert]);
    onAlert?.(alert);

    // Reproducir sonido si está habilitado
    if (soundEnabled) {
      playAlertSound(alert.type);
    }

    // Auto-acknowledge si está configurado
    if (alert.autoAcknowledge) {
      setTimeout(() => {
        acknowledgeAlert(alert.id);
      }, alert.autoAcknowledge * 1000);
    }
  };

  /**
   * Reconocer alerta
   */
  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  };

  /**
   * Limpiar alertas reconocidas
   */
  const clearAcknowledgedAlerts = () => {
    setActiveAlerts(prev => prev.filter(alert => !alert.acknowledged));
  };

  /**
   * Reproducir sonido de alerta
   */
  const playAlertSound = (type: RealTimeAlert['type']) => {
    try {
      // En una implementación real, aquí se reproducirían diferentes sonidos
      // basados en el tipo de alerta
      const audio = new Audio('/sounds/alert.wav');
      audio.play().catch(() => {
        console.log('Could not play alert sound');
      });
    } catch (error) {
      console.log('Alert sound not available');
    }
  };

  /**
   * Obtener icono de estado de conexión
   */
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting': return <Activity className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case 'error': return <WifiOff className="w-4 h-4 text-red-600" />;
    }
  };

  /**
   * Obtener color de métrica por estado
   */
  const getMetricStatusColor = (status: LiveMetric['status']) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  /**
   * Obtener icono de tendencia
   */
  const getTrendIcon = (trend: LiveMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-500" />;
      case 'stable': return <Activity className="w-3 h-3 text-gray-500" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {getConnectionIcon()}
            <h3 className="text-lg font-semibold text-gray-900">
              📡 Monitor Tiempo Real
            </h3>
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-500">
                {isConnected ? 'En línea' : 'Desconectado'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Alertas activas */}
            {activeAlerts.filter(a => !a.acknowledged).length > 0 && (
              <div className="flex items-center space-x-1 bg-red-50 text-red-700 px-2 py-1 rounded-md">
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {activeAlerts.filter(a => !a.acknowledged).length}
                </span>
              </div>
            )}

            {/* Controles */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-md ${
                soundEnabled 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-gray-50 text-gray-600'
              }`}
              title={soundEnabled ? 'Deshabilitar sonidos' : 'Habilitar sonidos'}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`p-2 rounded-md ${
                isMonitoring 
                  ? 'bg-green-50 text-green-600' 
                  : 'bg-gray-50 text-gray-600'
              }`}
              title={isMonitoring ? 'Pausar monitoreo' : 'Iniciar monitoreo'}
            >
              {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Estado de conexión y última actualización */}
        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
          <span>Estado: {
            connectionStatus === 'connected' ? 'Conectado' :
            connectionStatus === 'connecting' ? 'Conectando...' : 'Error de conexión'
          }</span>
          <span>Última actualización: {lastUpdated.toLocaleTimeString('es-ES')}</span>
        </div>
      </div>

      {/* Alertas activas */}
      {activeAlerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-red-50">
          <div className="space-y-2">
            {activeAlerts.filter(a => !a.acknowledged).map(alert => (
              <div
                key={alert.id}
                className={`flex items-start space-x-3 p-3 rounded-md ${
                  alert.type === 'critical' ? 'bg-red-100 border border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-100 border border-yellow-200' :
                  alert.type === 'info' ? 'bg-blue-100 border border-blue-200' :
                  'bg-green-100 border border-green-200'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  alert.type === 'critical' ? 'text-red-600' :
                  alert.type === 'warning' ? 'text-yellow-600' :
                  alert.type === 'info' ? 'text-blue-600' : 'text-green-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    alert.type === 'critical' ? 'text-red-800' :
                    alert.type === 'warning' ? 'text-yellow-800' :
                    alert.type === 'info' ? 'text-blue-800' : 'text-green-800'
                  }`}>
                    {alert.title}
                  </p>
                  <p className={`text-sm mt-1 ${
                    alert.type === 'critical' ? 'text-red-700' :
                    alert.type === 'warning' ? 'text-yellow-700' :
                    alert.type === 'info' ? 'text-blue-700' : 'text-green-700'
                  }`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {alert.timestamp.toLocaleTimeString('es-ES')}
                  </p>
                </div>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métricas en vivo */}
      <div className="p-4">
        <div className={`grid gap-4 ${
          isExpanded 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
        }`}>
          {liveMetrics.map(metric => {
            const IconComponent = metric.icon;
            return (
              <div
                key={metric.id}
                className={`p-3 rounded-lg border ${getMetricStatusColor(metric.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className={`w-5 h-5 text-${metric.color}-600`} />
                  {getTrendIcon(metric.trend)}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}{metric.unit}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {metric.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actividad reciente (modo expandido) */}
      {isExpanded && recentActivity.length > 0 && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Actividad Reciente
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {recentActivity.slice(0, 5).map(activity => (
              <div
                key={activity.id}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md"
              >
                <div className={`w-2 h-2 rounded-full ${
                  activity.priority === 'urgent' ? 'bg-red-500' :
                  activity.priority === 'high' ? 'bg-orange-500' :
                  activity.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {activity.leadName} • {activity.timestamp.toLocaleTimeString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer con controles adicionales */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-600">
            Actualización cada 5s • {liveMetrics.length} métricas
          </div>
          
          <div className="flex items-center space-x-2">
            {activeAlerts.filter(a => a.acknowledged).length > 0 && (
              <button
                onClick={clearAcknowledgedAlerts}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Limpiar alertas
              </button>
            )}
            
            <button
              onClick={loadRealTimeData}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}