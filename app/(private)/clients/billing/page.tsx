'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';

export default function ClientsBilling() {
  const { currentUser } = useAuth();
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

  if (!currentUser || !currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-muted-foreground">Cobros y Facturación</h1>
        <p className="text-lg text-muted-foreground mt-4">Módulo en desarrollo</p>
      </div>
    </div>
  );
}