'use client';

/**
 * COMPONENTS - CLIENTS MODULE
 * 
 * Componente para proteger rutas de clientes
 * Integrado con el sistema de autenticación
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth';

interface ProtectedClientRouteProps {
  children: React.ReactNode;
  requiredPermission?: 'admin' | 'billing' | 'view';
}

export function ProtectedClientRoute({ 
  children, 
  requiredPermission = 'view' 
}: ProtectedClientRouteProps) {
  const { currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }

    if (!currentUser.emailVerified) {
      router.push('/auth/verify');
      return;
    }

    // TODO: Implementar sistema de permisos con Firebase
    // Por ahora, solo verificamos autenticación básica
    console.log(`Protected client route accessed with permission: ${requiredPermission}`);
  }, [currentUser, router, requiredPermission]);

  if (!currentUser || !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}