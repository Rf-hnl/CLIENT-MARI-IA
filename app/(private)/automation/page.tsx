'use client';

/**
 * MÓDULO DE AUTOMATIZACIÓN - Sistema de Auto-Progresión de Leads
 * 
 * Página independiente para gestión de automatización y auto-progresión
 * Ruta: /automation
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot,
  Settings, 
  TrendingUp,
  Zap,
  RefreshCw,
  Play,
  Pause,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AutomationModule() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('engine');
  const [isEngineActive, setIsEngineActive] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if no user
  if (!loading && !user) {
    window.location.href = '/auth/register';
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Cargando Automatización...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const toggleEngine = () => {
    setIsEngineActive(!isEngineActive);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
            🤖 Automatización Inteligente
            {isEngineActive && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  ACTIVO
                </Badge>
              </div>
            )}
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Motor de auto-progresión y automatización de leads con IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleEngine}
            variant={isEngineActive ? "default" : "outline"}
            size="sm"
            className={`flex items-center gap-2 ${isEngineActive ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
          >
            {isEngineActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isEngineActive ? 'Pausar Motor' : 'Activar Motor'}
          </Button>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Tabs para diferentes vistas de automatización */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="engine" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Motor IA
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Reglas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Motor de Auto-Progresión */}
        <TabsContent value="engine" className="mt-6">
          <div className="grid gap-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Progresiones Hoy
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +3 vs ayer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tasa de Éxito
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">87%</div>
                  <p className="text-xs text-muted-foreground">
                    +5% vs semana pasada
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Reglas Activas
                  </CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">
                    2 personalizadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Próx. Evaluación
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">15min</div>
                  <p className="text-xs text-muted-foreground">
                    Cada 30 minutos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Motor Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-orange-600" />
                  🤖 Estado del Motor de Auto-Progresión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`p-4 rounded-lg border ${isEngineActive 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {isEngineActive ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      )}
                      <div>
                        <h4 className={`font-medium ${isEngineActive 
                          ? 'text-green-900 dark:text-green-300' 
                          : 'text-red-900 dark:text-red-300'
                        }`}>
                          Motor {isEngineActive ? 'Activo' : 'Pausado'}
                        </h4>
                        <p className={`text-sm ${isEngineActive 
                          ? 'text-green-700 dark:text-green-400' 
                          : 'text-red-700 dark:text-red-400'
                        }`}>
                          {isEngineActive 
                            ? 'Evaluando leads automáticamente cada 30 minutos'
                            : 'Motor pausado - leads no progresan automáticamente'
                          }
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isEngineActive}
                      onCheckedChange={toggleEngine}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h5 className="font-medium">Última Ejecución</h5>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Fecha:</strong> {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Leads Evaluados:</strong> 156
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Progresiones:</strong> 7 exitosas, 2 rechazadas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium">Configuración Actual</h5>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>Intervalo:</strong> 30 minutos
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Confidence Mínimo:</strong> 75%
                      </p>
                      <p className="text-sm mt-1">
                        <strong>Límite por Ejecución:</strong> 50 leads
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Configuración de Reglas */}
        <TabsContent value="rules" className="mt-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Reglas de Auto-Progresión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      High Sentiment Progression
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Sentiment ≥ 0.8 + Engagement ≥ 15% → Qualified
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Activa
                    </Badge>
                    <Switch checked={true} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      Stale Lead Detection
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Sin contacto &gt;14 días + Score &lt;30 → Cold
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Activa
                    </Badge>
                    <Switch checked={true} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div>
                    <p className="font-medium text-orange-800 dark:text-orange-300">
                      Ready for Proposal
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Qualified + Engagement &gt;70% → Proposal Sent
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Activa
                    </Badge>
                    <Switch checked={true} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-300">
                      Nurturing to Cold
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Nurturing &gt;30 días + No respuesta → Cold
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      Inactiva
                    </Badge>
                    <Switch checked={false} />
                  </div>
                </div>

                <Button className="w-full mt-4" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar Nueva Regla
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Historial */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Progresiones Automáticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        María González: Interested → Qualified
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Hace 2 horas • Regla: High Sentiment Progression
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Exitosa
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        Juan Pérez: Contacted → Interested
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Hace 4 horas • Regla: High Sentiment Progression
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Exitosa
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300">
                        Carlos Ruiz: Contacted → Cold (Rechazado)
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Hace 6 horas • Regla: Stale Lead Detection
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-red-700 border-red-300">
                    Rechazada
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}