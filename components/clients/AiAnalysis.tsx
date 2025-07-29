'use client';

import React, { useState } from 'react';
import { useClients } from '@/modules/clients/hooks/useClients';
import { ExtendedClient } from '@/modules/clients/context/ClientsContext';
import { ClientAIProfileCard } from './ClientAIProfileCard';
import { ClientMigrationBadge } from './ClientMigrationBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  AlertTriangle, 
  Database, 
  Zap, 
  Brain,
  TrendingUp,
  Settings
} from 'lucide-react';

interface AiAnalysisProps {
  clientId: string;
}

export const AiAnalysis = ({ clientId }: AiAnalysisProps) => {
  const { clients, migrateClient, getClientInteractions, isLoading } = useClients();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  // Find the specific client
  const client = clients.find(c => c.id === clientId) as ExtendedClient | undefined;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Cliente no encontrado en el contexto.
        </AlertDescription>
      </Alert>
    );
  }

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationMessage('');
    
    try {
      await migrateClient(clientId);
      setMigrationMessage('✅ Cliente migrado exitosamente con perfil de IA generado');
    } catch (error) {
      setMigrationMessage(`❌ Error en migración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsMigrating(false);
      // Clear message after 5 seconds
      setTimeout(() => setMigrationMessage(''), 5000);
    }
  };

  const customerInteractions = client.customerInteractions;
  const aiProfile = customerInteractions?.clientAIProfiles;
  const needsMigration = !customerInteractions;

  // If client needs migration
  if (needsMigration) {
    return (
      <div className="space-y-6">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Database className="h-5 w-5" />
              Migración Requerida
              <ClientMigrationBadge client={client} variant="minimal" showTooltip={false} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-300 bg-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Este cliente necesita ser migrado a la nueva estructura para acceder al análisis de IA completo.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-medium">¿Qué incluye la migración?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  Perfil de IA con análisis de riesgo y recomendaciones
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Puntuaciones de comportamiento y predicciones
                </li>
                <li className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  Estructura para historial de llamadas y emails
                </li>
                <li className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-600" />
                  Compatibilidad total con funciones existentes
                </li>
              </ul>
            </div>

            {migrationMessage && (
              <Alert className={migrationMessage.includes('❌') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <AlertDescription>
                  {migrationMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-medium">Cliente: {client.name}</p>
                <p className="text-sm text-muted-foreground">
                  Deuda: ${client.debt?.toLocaleString() || '0'}
                  {client.days_overdue > 0 && (
                    <span className="text-red-600 ml-2">• {client.days_overdue} días vencidos</span>
                  )}
                </p>
              </div>
              
              <Button 
                onClick={handleMigration}
                disabled={isMigrating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Migrar Cliente
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Client is migrated - show full AI analysis
  return (
    <div className="space-y-6">
      {/* Migration Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Análisis de Inteligencia Artificial</h2>
          <ClientMigrationBadge client={client} variant="full" />
        </div>
        
        {aiProfile && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Brain className="h-3 w-3 mr-1" />
              Perfil Activo
            </Badge>
            <Badge variant="outline">
              Confianza: {aiProfile.confidenceScore}%
            </Badge>
          </div>
        )}
      </div>

      {/* AI Profile Card */}
      <ClientAIProfileCard 
        profile={aiProfile} 
        clientName={client.name}
      />

      {/* Additional Actions */}
      {aiProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Acciones Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" size="sm" className="justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Análisis
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Ver Histórico
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Configurar IA
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              <p>• El análisis se actualiza automáticamente con cada interacción</p>
              <p>• Los insights se generan basados en datos reales del cliente</p>
              <p>• Las recomendaciones se ajustan según el comportamiento de pago</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
