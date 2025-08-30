'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SimpleDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // No need for manual redirect - middleware handles it
  // useEffect(() => {
  //   if (!loading && !user) {
  //     console.log('🔄 No user found, redirecting to register...');
  //     router.push('/auth/register');
  //   }
  // }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // If no user, let middleware handle redirect - don't render anything
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Simple</h1>
          <p className="text-muted-foreground">Bienvenido, {user.email}</p>
        </div>
        <Button onClick={logout} variant="outline">
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>✅ Auth Funcionando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Tenant:</strong> {user.tenantId}</p>
              <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔥 Sistema JWT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Middleware: Funcionando</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Auth Context: Funcionando</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Dashboard: Funcionando</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}