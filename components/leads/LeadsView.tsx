'use client';

/**
 * LEADS VIEW COMPONENT
 * 
 * Componente principal que integra las vistas Kanban y Tabla
 * Permite alternar entre ambas vistas con estado persistente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutGrid, 
  Table, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  RefreshCw,
  Settings,
  Filter,
  Download,
  UserPlus
} from 'lucide-react';

import { LeadsPipeline } from './LeadsPipeline';
import { LeadsTable } from './LeadsTable';
import { LeadsStatsCards } from './LeadsStatsCards';
import { useLeads } from '@/modules/leads/hooks/useLeads';

type ViewMode = 'kanban' | 'table';

interface LeadsViewProps {
  defaultView?: ViewMode;
}

export function LeadsView({ defaultView = 'kanban' }: LeadsViewProps) {
  const { leads, stats, isLoading, refetch } = useLeads();
  const [currentView, setCurrentView] = useState<ViewMode>(defaultView);

  // Persistir vista seleccionada en localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('leads-view-mode') as ViewMode;
    if (savedView && (savedView === 'kanban' || savedView === 'table')) {
      setCurrentView(savedView);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('leads-view-mode', currentView);
  }, [currentView]);

  // Calcular estadísticas rápidas
  const quickStats = React.useMemo(() => {
    if (!leads.length) return { total: 0, qualified: 0, totalValue: 0, conversionRate: 0 };
    
    const total = leads.length;
    const qualified = leads.filter(l => l.is_qualified).length;
    const converted = leads.filter(l => l.converted_to_client).length;
    const totalValue = leads.reduce((sum, l) => sum + (l.conversion_value || 0), 0);
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return { total, qualified, totalValue, conversionRate };
  }, [leads]);

  // Handler para clicks en las cards de estadísticas
  const handleStatsCardClick = (cardId: string, value: number) => {
    console.log(`Clicked on ${cardId} with value ${value}`);
    // Aquí puedes implementar navegación a filtros específicos
    // Por ejemplo, filtrar la tabla por el estado clickeado
  };

  return (
    <div className="space-y-6">
      {/* Header principal */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Título y controles */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestión de Leads</h1>
              <p className="text-muted-foreground">
                Administra tu pipeline de prospectos desde contacto inicial hasta conversión
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={refetch}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Lead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de estadísticas del pipeline - Componente reutilizable */}
      <LeadsStatsCards
        onCardClick={handleStatsCardClick}
        gridCols={{
          mobile: 2,
          tablet: 4,
          desktop: 8
        }}
      />

      {/* Tabs para alternar entre vistas */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewMode)}>
              <TabsList className="grid w-auto grid-cols-2">
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Vista Kanban
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Vista Tabla
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                {currentView === 'kanban' ? 'Pipeline Visual' : 'Vista Detallada'}
              </Badge>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Vista
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Contenido de las vistas */}
          {currentView === 'kanban' ? (
            <div className="p-6">
              <LeadsPipeline />
            </div>
          ) : (
            <div className="p-6">
              <LeadsTable />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicadores de estado */}
      {isLoading && (
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sincronizando datos...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Exportar también componentes individuales para uso directo
export { LeadsPipeline, LeadsTable };