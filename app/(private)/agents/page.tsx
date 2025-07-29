'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Bot, 
  BarChart3, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Loader2 
} from 'lucide-react';
import { AgentsProvider, useAgentsContext } from '@/modules/agents/context/AgentsContext';
import { ElevenLabsConfigSection } from './components/ElevenLabsConfigSection';
import { AgentsList } from './components/AgentsList';
import { AgentForm } from './components/AgentForm';
import { AgentsStats } from './components/AgentsStats';
import { WelcomeCard } from './components/WelcomeCard';
import { BreadcrumbNav } from './components/BreadcrumbNav';
import { ITenantElevenLabsAgent } from '@/types/agents';

function AgentsPageContent() {
  const { 
    isConfigured, 
    loading, 
    error, 
    agents, 
    stats,
    clearError 
  } = useAgentsContext();
  
  const [activeTab, setActiveTab] = useState(isConfigured ? 'agents' : 'config');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<ITenantElevenLabsAgent | null>(null);

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setShowAgentForm(true);
  };

  const handleEditAgent = (agent: ITenantElevenLabsAgent) => {
    setEditingAgent(agent);
    setShowAgentForm(true);
  };

  const handleCloseForm = () => {
    setShowAgentForm(false);
    setEditingAgent(null);
  };

  // Mostrar welcome card si no está configurado y no está en modo edición
  if (!isConfigured && !loading && !error) {
    return (
      <div className="container mx-auto p-6">
        <WelcomeCard onGetStarted={() => setActiveTab('config')} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BreadcrumbNav />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes IA</h1>
          <p className="text-muted-foreground">
            Configura y administra tus agentes de ElevenLabs para llamadas automatizadas de cobranza
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Configurado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Sin configurar
            </Badge>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
            >
              Cerrar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Cargando configuración...</span>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Mis Agentes ({agents.length})
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Configuración ElevenLabs */}
          <TabsContent value="config" className="space-y-6">
            <ElevenLabsConfigSection />
          </TabsContent>

          {/* Gestión de Agentes */}
          <TabsContent value="agents" className="space-y-6">
            {!isConfigured ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Configuración Requerida</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Necesitas configurar ElevenLabs antes de crear agentes
                  </p>
                  <Button onClick={() => setActiveTab('config')}>
                    Ir a Configuración
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold">Agentes de ElevenLabs</h2>
                    <p className="text-muted-foreground">
                      Gestiona los agentes disponibles para llamadas automatizadas
                    </p>
                  </div>
                  <Button onClick={handleCreateAgent} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Agente
                  </Button>
                </div>

                <AgentsList onEditAgent={handleEditAgent} />
              </>
            )}
          </TabsContent>

          {/* Estadísticas */}
          <TabsContent value="stats" className="space-y-6">
            {!isConfigured ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin Datos Disponibles</h3>
                  <p className="text-muted-foreground text-center">
                    Las estadísticas estarán disponibles una vez que configures y uses los agentes
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AgentsStats stats={stats} />
            )}
          </TabsContent>

        </Tabs>
      )}

      {/* Agent Form Modal */}
      {showAgentForm && (
        <AgentForm
          agent={editingAgent}
          onClose={handleCloseForm}
          onSave={() => {
            handleCloseForm();
            // La lista se actualizará automáticamente gracias al context
          }}
        />
      )}
    </div>
  );
}

export default function AgentsPage() {
  return (
    <AgentsProvider>
      <AgentsPageContent />
    </AgentsProvider>
  );
}