'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

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

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-muted-foreground">Todo funcionando correctamente</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Módulos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-muted-foreground">Dashboard y Perfil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Versión</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">v1.0.0</p>
            <p className="text-sm text-muted-foreground">Auth Module</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}