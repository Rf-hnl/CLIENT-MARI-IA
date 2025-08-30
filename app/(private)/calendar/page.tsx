'use client';

/**
 * MÓDULO DE CALENDARIO - Sistema de Calendario Inteligente
 * 
 * Página independiente para gestión de calendario y auto-scheduling
 * Ruta: /calendar
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon,
  Users,
  Zap,
  Settings,
  Target,
  Sliders
} from 'lucide-react';

// Componentes de calendario
import CalendarView from '@/components/calendar/CalendarView';

export default function CalendarModule() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

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
          <p className="text-gray-900 dark:text-gray-100">Cargando Calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            📅 Calendario Inteligente
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Gestión de reuniones y programación automática con IA
          </p>
        </div>
      </div>

      {/* Tabs para diferentes vistas de calendario */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Vista Calendario
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Auto-Scheduling
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Vista Principal del Calendario */}
        <TabsContent value="calendar" className="mt-6">
          {user?.organizationId && (
            <CalendarView
              tenantId={user.tenantId}
              organizationId={user.organizationId}
              userId={user.id}
              className="w-full"
            />
          )}
        </TabsContent>

        {/* Tab 2: Auto-Scheduling IA con Calendly */}
        <TabsContent value="scheduling" className="mt-6">
          <div className="grid gap-6">
            {/* Calendly Integration Status */}
            <Card className="border-2 border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-gray-400 rounded-full"></div>
                  🔗 Integración Calendly
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado</span>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    No Configurado
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure la integración con Calendly para habilitar la programación automática de reuniones.
                </p>
                <Button size="sm" variant="outline">
                  Configurar Integración
                </Button>
              </CardContent>
            </Card>


            {/* Auto-Scheduling Panel con Calendly */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  🤖 Motor de Auto-Scheduling + Calendly
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <h4 className="font-medium text-orange-900 dark:text-orange-300 mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Auto-Scheduling Inteligente
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                    El sistema detectará automáticamente leads calificados con alto sentiment y engagement para programar reuniones.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                      <Zap className="h-4 w-4 mr-1" />
                      Detectar Leads Calificados
                    </Button>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700">
                      Configurar Criterios
                    </Button>
                  </div>
                </div>

                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">No hay leads detectados para programar reuniones automáticamente.</p>
                  <p className="text-xs mt-1">Los leads calificados aparecerán aquí cuando cumplan los criterios configurados.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Configuración */}
        <TabsContent value="settings" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Auto-Scheduling</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto-Scheduling</p>
                    <p className="text-sm text-muted-foreground">
                      Programar reuniones automáticamente
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-gray-50 text-gray-700">
                    Desactivado
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Horario de Reuniones</p>
                    <p className="text-sm text-muted-foreground">
                      No configurado
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Duración por Defecto</p>
                    <p className="text-sm text-muted-foreground">
                      No configurado
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Criterios de Detección IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Sliders className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">Criterios de detección no configurados</p>
                  <p className="text-xs mt-1">Configure los parámetros para la detección automática de leads calificados.</p>
                  <Button size="sm" variant="outline" className="mt-3">
                    Configurar Criterios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}