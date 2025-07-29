'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Zap,
  ArrowRight,
  Info
} from 'lucide-react';
import { useClients } from '@/modules/clients/hooks/useClients';

interface ClientMigrationPanelProps {
  className?: string;
}

export function ClientMigrationPanel({ className }: ClientMigrationPanelProps) {
  const { 
    clients, 
    getClientsWithoutInteractions, 
    migrateClient, 
    migrateAllClients, 
    isLoading 
  } = useClients();
  
  const [migrationStatus, setMigrationStatus] = useState<{
    isRunning: boolean;
    progress: number;
    message: string;
    results?: any;
  }>({
    isRunning: false,
    progress: 0,
    message: ''
  });

  const unmiratedClients = getClientsWithoutInteractions();
  const totalClients = clients.length;
  const migratedClients = totalClients - unmiratedClients.length;
  const migrationPercentage = totalClients > 0 ? (migratedClients / totalClients) * 100 : 100;

  const handleSingleMigration = async (clientId: string, clientName: string) => {
    try {
      setMigrationStatus({
        isRunning: true,
        progress: 0,
        message: `Migrando ${clientName}...`
      });

      await migrateClient(clientId);
      
      setMigrationStatus({
        isRunning: false,
        progress: 100,
        message: `✅ ${clientName} migrado exitosamente`
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setMigrationStatus(prev => ({ ...prev, message: '' }));
      }, 3000);

    } catch (error) {
      setMigrationStatus({
        isRunning: false,
        progress: 0,
        message: `❌ Error migrando ${clientName}: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    }
  };

  const handleBatchMigration = async () => {
    if (unmiratedClients.length === 0) return;

    try {
      setMigrationStatus({
        isRunning: true,
        progress: 0,
        message: `Iniciando migración de ${unmiratedClients.length} clientes...`
      });

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setMigrationStatus(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 200);

      await migrateAllClients();
      
      clearInterval(progressInterval);
      
      setMigrationStatus({
        isRunning: false,
        progress: 100,
        message: `✅ Migración completada exitosamente`
      });

      // Clear message after 5 seconds
      setTimeout(() => {
        setMigrationStatus(prev => ({ ...prev, message: '', progress: 0 }));
      }, 5000);

    } catch (error) {
      setMigrationStatus({
        isRunning: false,
        progress: 0,
        message: `❌ Error en migración: ${error instanceof Error ? error.message : 'Error desconocido'}`
      });
    }
  };

  if (unmiratedClients.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            Migración Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>¡Excelente!</strong> Todos los clientes ({totalClients}) tienen la estructura de customerInteractions actualizada.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>✅ Estructura de datos actualizada</p>
            <p>✅ Perfiles de IA inicializados</p>
            <p>✅ Sistema de interacciones listo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-600" />
          Migración de Clientes
          <Badge variant="outline" className="ml-auto">
            {unmiratedClients.length} pendientes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Migration Status */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Migración requerida:</strong> {unmiratedClients.length} clientes necesitan actualización a la nueva estructura con customerInteractions e IA.
          </AlertDescription>
        </Alert>

        {/* Progress Overview */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progreso de Migración</span>
            <span>{migratedClients}/{totalClients} clientes</span>
          </div>
          <Progress value={migrationPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {migrationPercentage.toFixed(1)}% completado
          </p>
        </div>

        {/* Migration Status Message */}
        {migrationStatus.message && (
          <Alert className={migrationStatus.message.includes('❌') ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {migrationStatus.message}
              {migrationStatus.isRunning && migrationStatus.progress > 0 && (
                <Progress value={migrationStatus.progress} className="h-1 mt-2" />
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Batch Migration Button */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="font-medium">Migración Automática</h3>
              <p className="text-sm text-muted-foreground">
                Migrar todos los {unmiratedClients.length} clientes pendientes de una vez
              </p>
            </div>
          </div>
          <Button 
            onClick={handleBatchMigration}
            disabled={isLoading || migrationStatus.isRunning}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {migrationStatus.isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Migrar Todos
              </>
            )}
          </Button>
        </div>

        {/* Individual Client List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h3 className="font-medium">Clientes Pendientes</h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2">
            {unmiratedClients.slice(0, 10).map((client) => (
              <div 
                key={client.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {client.id} • Deuda: ${client.debt?.toLocaleString() || '0'}
                    {client.days_overdue > 0 && (
                      <span className="text-red-600 ml-2">
                        • {client.days_overdue} días vencidos
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSingleMigration(client.id, client.name)}
                  disabled={isLoading || migrationStatus.isRunning}
                >
                  {migrationStatus.isRunning ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      Migrar
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            ))}
            
            {unmiratedClients.length > 10 && (
              <div className="text-center py-2 text-sm text-muted-foreground">
                ... y {unmiratedClients.length - 10} clientes más
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>¿Qué incluye la migración?</strong>
            <ul className="mt-1 space-y-1 text-sm">
              <li>• Estructura customerInteractions con historial de llamadas y emails</li>
              <li>• Perfil de IA con análisis de riesgo y recomendaciones</li>
              <li>• Compatibilidad total con funciones existentes</li>
              <li>• Análisis inteligente basado en datos actuales del cliente</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}