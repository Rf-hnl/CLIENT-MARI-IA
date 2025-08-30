'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, Target, TrendingUp, DollarSign, BarChart3, Zap, CheckCircle } from 'lucide-react';
import { useLeadsStats } from '@/modules/leads/hooks/useLeadsStats';
import { useLeadsAnalytics } from '@/modules/leads/hooks/useLeadsAnalytics';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PipelineChart } from '@/components/dashboard/PipelineChart';
import { ScoreDistributionChart } from '@/components/dashboard/ScoreDistributionChart';
import { TrendsChart } from '@/components/dashboard/TrendsChart';

// Enlaces a módulos independientes - No necesitamos imports de componentes

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { stats, loading: statsLoading, error: statsError, refreshStats } = useLeadsStats();
  const { analytics, loading: analyticsLoading, error: analyticsError, refreshAnalytics } = useLeadsAnalytics();
  
  // 🚀 Estado para dashboard avanzado
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if no user after loading
  useEffect(() => {
    if (!loading && !user) {
      console.log('🔄 No user found, redirecting to register...');
      window.location.href = '/auth/register';
    }
  }, [user, loading]);

  // Show loading while auth context initializes
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show temporary message while redirect happens
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 dark:border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-900 dark:text-gray-100">Redirigiendo al registro...</p>
        </div>
      </div>
    );
  }

  const handleRefresh = () => {
    refreshStats();
    refreshAnalytics();
  };

  // Get summary metrics
  const totalLeads = stats.find(s => s.label === 'Total Leads')?.value || 0;
  const newLeads = stats.find(s => s.label === 'Nuevos')?.value || 0;
  const qualifiedLeads = stats.find(s => s.label === 'Calificados')?.value || 0;
  const wonLeads = stats.find(s => s.label === 'Ganados')?.value || 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
            Dashboard Ejecutivo
          </h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">
            Bienvenido, {user.email?.split('@')[0] || 'Usuario'} • MAR-IA
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={statsLoading || analyticsLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${(statsLoading || analyticsLoading) ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* 📊 RESUMEN EJECUTIVO ÚNICO */}
      <div className="space-y-6">{/* Removed tabs - only executive summary */}

        {/* Error states */}
      {(statsError || analyticsError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-400 font-medium">Error al cargar datos</h3>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            {statsError || analyticsError}
          </p>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads}
          description="Total de leads en el sistema"
          icon={<Users className="h-4 w-4" />}
          loading={statsLoading}
          color="text-orange-600"
        />
        <MetricCard
          title="Nuevos Esta Semana"
          value={newLeads}
          description="Leads recién ingresados"
          icon={<Target className="h-4 w-4" />}
          loading={statsLoading}
          color="text-green-600"
        />
        <MetricCard
          title="Tasa de Conversión"
          value={analytics?.summary.conversionRate ? `${analytics.summary.conversionRate}%` : '0%'}
          description="Leads convertidos exitosamente"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={analyticsLoading}
          color="text-orange-600"
        />
        <MetricCard
          title="Score Promedio"
          value={analytics?.summary.averageScore || '0'}
          description="Calificación promedio de leads"
          icon={<Zap className="h-4 w-4" />}
          loading={analyticsLoading}
          color="text-purple-600"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard
          title="Leads Calificados"
          value={qualifiedLeads}
          description="Cumplen criterios de calificación"
          icon={<BarChart3 className="h-4 w-4" />}
          loading={statsLoading}
          color="text-orange-600"
        />
        <MetricCard
          title="Leads Convertidos"
          value={wonLeads}
          description="Convertidos exitosamente"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={statsLoading}
          color="text-green-600"
        />
        <MetricCard
          title="Valor del Pipeline"
          value={`$${(analytics?.summary.pipelineValue || 0).toLocaleString()}`}
          description="Valor potencial en pipeline"
          icon={<DollarSign className="h-4 w-4" />}
          loading={analyticsLoading}
          color="text-emerald-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PipelineChart
          data={analytics?.pipeline || []}
          loading={analyticsLoading}
        />
        <ScoreDistributionChart
          data={analytics?.scoreDistribution || []}
          loading={analyticsLoading}
        />
      </div>

      {/* Trends Chart */}
      <TrendsChart
        data={analytics?.trends.thisWeek || []}
        loading={analyticsLoading}
      />

      {/* Real Data Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-emerald-200 dark:border-emerald-700 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10 hover:shadow-xl transition-all duration-300">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-4 flex items-center gap-2">
            📊 Resumen de Actividad
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Total Leads Activos</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-200">{totalLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Nuevos Esta Semana</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-200">{newLeads}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-emerald-600 dark:text-emerald-400">Leads Calificados</span>
              <span className="font-bold text-emerald-800 dark:text-emerald-200">{qualifiedLeads}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border border-blue-200 dark:border-blue-700 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-xl transition-all duration-300">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-4 flex items-center gap-2">
            🎯 Análisis de Performance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600 dark:text-blue-400">Tasa de Conversión</span>
              <span className="font-bold text-blue-800 dark:text-blue-200">
                {analytics?.summary.conversionRate ? `${analytics.summary.conversionRate}%` : '0%'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600 dark:text-blue-400">Score Promedio</span>
              <span className="font-bold text-blue-800 dark:text-blue-200">
                {analytics?.summary.averageScore || '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-600 dark:text-blue-400">Leads Convertidos</span>
              <span className="font-bold text-blue-800 dark:text-blue-200">{wonLeads}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions with floating effects */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="relative p-6 border border-orange-200 dark:border-orange-700 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:transform hover:-translate-y-3 hover:rotate-1 group overflow-hidden">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-orange-300/30 rounded-full blur-xl opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-700"></div>
          <h3 className="relative z-10 font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
            🔥 Leads Calientes
          </h3>
          <p className="relative z-10 text-sm text-orange-600 dark:text-orange-400 mb-4 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-300">
            {analytics?.scoreDistribution.find(s => s.name.includes('Calientes'))?.value || 0} leads con score 70+
          </p>
          <Button 
            size="sm" 
            className="relative z-10 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 rounded-lg shadow-md hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group-hover:scale-105"
            onClick={() => window.location.href = '/clients/leads?filter=hot'}
          >
            Ver Leads Prioritarios
          </Button>
        </div>
        
        <div className="relative p-6 border border-blue-200 dark:border-blue-700 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:transform hover:-translate-y-3 hover:rotate-1 group overflow-hidden">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-300/30 rounded-full blur-xl opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-700"></div>
          <h3 className="relative z-10 font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
            📊 Reportes
          </h3>
          <p className="relative z-10 text-sm text-blue-600 dark:text-blue-400 mb-4 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
            Generar reportes detallados
          </p>
          <Button 
            size="sm" 
            className="relative z-10 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 rounded-lg shadow-md hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105"
          >
            Generar Reporte
          </Button>
        </div>
        
        <div className="relative p-6 border border-green-200 dark:border-green-700 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:transform hover:-translate-y-3 hover:rotate-1 group overflow-hidden">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-green-300/30 rounded-full blur-xl opacity-0 group-hover:opacity-70 group-hover:animate-ping transition-all duration-700"></div>
          <h3 className="relative z-10 font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2 group-hover:scale-105 transition-transform duration-300">
            ⚡ Acciones Rápidas
          </h3>
          <p className="relative z-10 text-sm text-green-600 dark:text-green-400 mb-4 group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-300">
            Gestionar leads pendientes
          </p>
          <Button 
            size="sm" 
            className="relative z-10 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-lg shadow-md hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 group-hover:scale-105"
            onClick={() => window.location.href = '/clients/leads'}
          >
            Ir a Leads
          </Button>
        </div>
      </div>

      {/* 🚀 Enlaces Rápidos a Módulos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1 group" onClick={() => window.location.href = '/calendar'}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Target className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">📅 Calendario</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Sistema de calendario inteligente</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-orange-200 dark:border-orange-700 rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1 group" onClick={() => window.location.href = '/clients/leads'}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Users className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">📋 Gestión de Leads</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Administración integral de leads</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer hover:transform hover:-translate-y-1 group" onClick={() => window.location.href = '/campaigns'}>
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
              <Target className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">🎯 Campañas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Organización y seguimiento de campañas</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
