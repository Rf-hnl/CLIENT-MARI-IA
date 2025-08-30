'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/forgot-password" className="block">
          <Button variant="outline" className="w-full justify-start">
            <Shield className="h-4 w-4 mr-2" />
            Cambiar Contraseña
          </Button>
        </Link>
        <Link href="/dashboard" className="block">
          <Button className="w-full justify-start">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ir al Dashboard
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}