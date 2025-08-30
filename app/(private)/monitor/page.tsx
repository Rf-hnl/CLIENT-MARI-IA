'use client';

/**
 * MÓDULO DE MONITOR - Sistema de Monitoreo en Tiempo Real
 * 
 * Página independiente para monitoreo de actividad en tiempo real
 * Ruta: /monitor
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity,
  AlertTriangle, 
  Zap,
  Eye,
  RefreshCw,
  Wifi,
  Bell
} from 'lucide-react';

// Componentes de monitor
import { RealTimeMonitor } from '@/components/analytics/RealTimeMonitor';

export default function MonitorModule() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('realtime');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Redirect if no user
  if (!loading && !user) {
    window.location.href = '/auth/register';
    return null;
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 dark:border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Iniciando Monitor...</p>
        </div>
      </div>
    );
  }

  const toggleLiveMode = () => {
    setIsLive(!isLive);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3">
            ⚡ Monitor en Tiempo Real
            {isLive && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  LIVE
                </Badge>
              </div>
            )}
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Monitoreo en vivo de actividad del sistema • Última actualización: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleLiveMode}
            variant={isLive ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Wifi className="h-4 w-4" />
            {isLive ? 'LIVE' : 'Pausado'}
          </Button>
          <Button 
            onClick={() => setLastUpdate(new Date())}
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes vistas de monitor */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Tiempo Real
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Monitor en Tiempo Real */}
        <TabsContent value="realtime" className="mt-6">
          {user?.activeOrganization?.id && (
            <RealTimeMonitor
              tenantId={user.id}
              organizationId={user.activeOrganization.id}
              className="w-full"
            />
          )}
        </TabsContent>

        {/* Tab 2: Alertas del Sistema */}
        <TabsContent value="alerts" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alertas Activas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">
                        Alto uso de tokens OpenAI
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        85% del límite mensual utilizado
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    Advertencia
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        Sistema funcionando correctamente
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Todos los servicios operativos
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    OK
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Métricas del Sistema */}
        <TabsContent value="system" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  CPU Usage
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Memoria RAM
                </CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2GB</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Requests/min
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">147</div>
                <p className="text-xs text-muted-foreground">
                  +15% vs promedio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Uptime
                </CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground">
                  7 días, 12 horas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}