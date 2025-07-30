'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLightweightAgents } from '@/modules/agents/hooks/useLightweightAgents';
import { Bot, Users, Activity, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { currentTenant } = useClients();
  const router = useRouter();
  
  // Usar carga ligera para estadísticas básicas (NO llama a ElevenLabs API)
  const { 
    agents: lightweightAgents, 
    loading: agentsLoading, 
    error: agentsError,
    fetchLightweightAgents,
    getBasicStats 
  } = useLightweightAgents({ 
    tenantId: currentTenant?.id || null 
  });

  useEffect(() => {
    if (!currentUser) {
      router.push('/');
      return;
    }

    if (!currentUser.emailVerified) {
      router.push('/verify');
      return;
    }
  }, [currentUser, router]);

  // Cargar estadísticas básicas de agentes cuando haya un tenant
  useEffect(() => {
    if (currentTenant?.id && lightweightAgents.length === 0 && !agentsLoading) {
      console.log('📊 [DASHBOARD] Loading lightweight agent stats...');
      fetchLightweightAgents();
    }
  }, [currentTenant?.id, lightweightAgents.length, agentsLoading, fetchLightweightAgents]);

  async function handleLogout() {
    try {
      await logout();
      router.push('/');
    } catch (error: unknown) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  if (!currentUser || !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Obtener estadísticas básicas
  const basicStats = getBasicStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido de vuelta, {currentUser.displayName || currentUser.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/profile')}>
            Mi Perfil
          </Button>
          <Button onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Welcome Card */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle>¡Bienvenido al Dashboard!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Has iniciado sesión exitosamente con Firebase Authentication.
            </p>
            <p className="text-sm text-muted-foreground">
              Esta es una página protegida. Solo usuarios autenticados y verificados pueden acceder.
            </p>
          </CardContent>
        </Card>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm"><strong>Email:</strong></p>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm"><strong>UID:</strong></p>
              <p className="text-sm text-muted-foreground font-mono text-xs">{currentUser.uid}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm"><strong>Email Verificado:</strong></p>
              <p className="text-sm text-muted-foreground">{currentUser.emailVerified ? 'Sí' : 'No'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm"><strong>Creado:</strong></p>
              <p className="text-sm text-muted-foreground">{currentUser.metadata.creationTime}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm"><strong>Último acceso:</strong></p>
              <p className="text-sm text-muted-foreground">{currentUser.metadata.lastSignInTime}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agentes</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                basicStats.totalAgents
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Referencias en Firebase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {agentsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                basicStats.activeAgents
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Listos para llamadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Inactivos</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {agentsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                basicStats.inactiveAgents
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Deshabilitados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Sincronizado</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {agentsLoading ? (
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                basicStats.agentsWithCache
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Con datos actualizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Auth: Funcionando correctamente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${agentsError ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                Agentes: {agentsError ? 'Error de conexión' : 'Conectado'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${currentTenant ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-sm text-muted-foreground">
                Tenant: {currentTenant ? `Activo (${currentTenant.name})` : 'No seleccionado'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => router.push('/agents')}
            >
              <Bot className="mr-2 h-4 w-4" />
              Gestionar Agentes
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => router.push('/clients')}
            >
              <Users className="mr-2 h-4 w-4" />
              Ver Clientes
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => fetchLightweightAgents()}
              disabled={agentsLoading}
            >
              <Activity className="mr-2 h-4 w-4" />
              {agentsLoading ? 'Actualizando...' : 'Actualizar Estadísticas'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}