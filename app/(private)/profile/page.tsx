'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import UserProfileCard from '@/components/profile/UserProfileCard';
import QuickActions from '@/components/profile/QuickActions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ProfileUpdateResult } from '@/types/firebaseUser';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const [updateResult, setUpdateResult] = useState<ProfileUpdateResult | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      router.push('/');
      return;
    }

    if (!currentUser.emailVerified) {
      router.push('/verify');
      return;
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !currentUser.emailVerified) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold tracking-tight">
              Mi Perfil
            </h1>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {currentUser.email}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Profile Card - Main Content */}
        <div className="lg:col-span-3">
          {updateResult && (
            <Alert className={`mb-6 ${updateResult.success ? 'border-green-500' : 'border-red-500'}`}>
              {updateResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription className={updateResult.success ? 'text-green-600' : 'text-red-600'}>
                {updateResult.message}
              </AlertDescription>
            </Alert>
          )}
          
          <UserProfileCard 
            user={currentUser} 
            onProfileUpdate={(result) => {
              setUpdateResult(result);
              // Auto-ocultar el mensaje después de 5 segundos
              setTimeout(() => setUpdateResult(null), 5000);
            }}
          />
        </div>

        {/* Quick Actions - Side Panel */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}