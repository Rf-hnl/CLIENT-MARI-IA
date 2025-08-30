'use client';

/**
 * MÓDULO DE ANALYTICS - Dashboard de Análisis Avanzado
 * 
 * Página independiente para análisis avanzado con IA
 * Ruta: /analytics
 */

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp, 
  Activity,
  FileText,
  RefreshCw
} from 'lucide-react';

// Componentes de analytics
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { PerformanceTracker } from '@/components/analytics/PerformanceTracker';
import { SmartReportsPanel } from '@/components/analytics/SmartReportsPanel';

export default function AnalyticsModule() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
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
          <p className="text-gray-900 dark:text-gray-100">Cargando Analytics...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh - in production would trigger data reload
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 Analytics Avanzado
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Análisis inteligente y métricas avanzadas con IA
          </p>
        </div>
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

      {/* Tabs para diferentes vistas de analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard IA
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reportes Inteligentes
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dashboard IA Avanzado */}
        <TabsContent value="dashboard" className="mt-6">
          {user?.activeOrganization?.id && (
            <AnalyticsDashboard
              tenantId={user.id}
              organizationId={user.activeOrganization.id}
              className="w-full"
            />
          )}
        </TabsContent>

        {/* Tab 2: Performance Tracker */}
        <TabsContent value="performance" className="mt-6">
          {user?.activeOrganization?.id && (
            <PerformanceTracker
              tenantId={user.id}
              organizationId={user.activeOrganization.id}
              className="w-full"
            />
          )}
        </TabsContent>

        {/* Tab 3: Smart Reports */}
        <TabsContent value="reports" className="mt-6">
          {user?.activeOrganization?.id && (
            <SmartReportsPanel
              tenantId={user.id}
              organizationId={user.activeOrganization.id}
              className="w-full"
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Análisis IA Realizados
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245</div>
            <p className="text-xs text-muted-foreground">
              +12% desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Precisión del Modelo
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% vs mes pasado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Insights Generados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="text-xs text-muted-foreground">
              +6 nuevos hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reportes Activos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              4 programados
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}