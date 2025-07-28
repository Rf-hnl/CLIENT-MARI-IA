'use client';

import { useEffect } from 'react';
import { useAuth } from '@/modules/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function ClientsAdmin() {
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
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-muted-foreground">Administración de Clientes</h1>
          <p className="text-lg text-muted-foreground mt-4">Módulo en desarrollo</p>
        </div>
        
        <div>
          <Button 
            variant="outline"
            onClick={async () => {
              try {
                console.log('🔍 Testing Firebase Admin DB connection...');
                const response = await fetch('/api/debug/database-analysis');
                const result = await response.json();
                
                if (result.success) {
                  console.log('✅ Firebase Admin DB connected successfully');
                  console.log('Total documents:', result.totalDocuments);
                  console.log('Collection counts (tree-formatted):', JSON.stringify(result.collectionCounts, null, 2));
                  console.log('Connection: Has documents');
                  console.log('Database Tree Structure (nested):', JSON.stringify(result.data, null, 2)); // Log nested data with indentation
                } else {
                  console.error('❌ Firebase Admin DB error:', result.error);
                }
              } catch (error) {
                console.error('❌ API call failed:', error);
              }
            }}
          >
            Debug DB
          </Button>
        </div>
      </div>
    </div>
  );
}
