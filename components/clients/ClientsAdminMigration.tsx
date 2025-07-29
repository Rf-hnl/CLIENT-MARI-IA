'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Database, 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useClients } from '@/modules/clients/hooks/useClients';
import { ClientMigrationPanel } from './ClientMigrationPanel';
import { ClientMigrationBadge, useMigrationStats } from './ClientMigrationBadge';

export function ClientsAdminMigration() {
  const { clients, isLoading } = useClients();
  const migrationStats = useMigrationStats(clients);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-12 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-48 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{migrationStats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Migrados</p>
                <p className="text-2xl font-bold text-green-600">{migrationStats.migrated}</p>
                <p className="text-xs text-muted-foreground">
                  {migrationStats.migrationPercentage.toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Con IA</p>
                <p className="text-2xl font-bold text-purple-600">{migrationStats.withAI}</p>
                <p className="text-xs text-muted-foreground">
                  {migrationStats.aiPercentage.toFixed(1)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{migrationStats.needsMigration}</p>
                <p className="text-xs text-muted-foreground">Por migrar</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progreso de Migración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Estructura de Datos</span>
              <span>{migrationStats.migrated}/{migrationStats.total}</span>
            </div>
            <Progress value={migrationStats.migrationPercentage} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Perfiles de IA</span>
              <span>{migrationStats.withAI}/{migrationStats.total}</span>
            </div>
            <Progress value={migrationStats.aiPercentage} className="h-2 [&>div]:bg-purple-500" />
          </div>
        </CardContent>
      </Card>

      {/* Migration Panel */}
      <ClientMigrationPanel />

      {/* Client List Preview with Migration Status */}
      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Vista Previa de Clientes
              <Badge variant="outline" className="ml-auto">
                {clients.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clients.slice(0, 20).map((client) => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{client.name}</p>
                      <ClientMigrationBadge client={client} variant="minimal" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {client.id} • ${client.debt?.toLocaleString() || '0'}
                      {client.days_overdue > 0 && (
                        <span className="text-red-600 ml-2">
                          • {client.days_overdue} días vencidos
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ClientMigrationBadge client={client} variant="full" />
                    {client.customerInteractions?.clientAIProfiles && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {client.customerInteractions.clientAIProfiles.profileSegment}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {clients.length > 20 && (
                <div className="text-center py-4 text-sm text-muted-foreground border-t">
                  ... y {clients.length - 20} clientes más
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}