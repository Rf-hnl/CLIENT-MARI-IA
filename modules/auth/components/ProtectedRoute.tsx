'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireEmailVerification = true 
}: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.push('/');
      return;
    }

    if (requireEmailVerification && !currentUser.emailVerified) {
      router.push('/verify');
      return;
    }
  }, [currentUser, loading, router, requireEmailVerification]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (requireEmailVerification && !currentUser.emailVerified) {
    return null;
  }

  return <>{children}</>;
}