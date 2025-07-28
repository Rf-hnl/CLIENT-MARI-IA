'use client';

import { User } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { formatDate } from '@/utils/dateFormat';

interface AccountInfoProps {
  user: User;
}

export default function AccountInfo({ user }: AccountInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4" />
          Información de Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Miembro desde</span>
          <span className="text-sm font-medium">
            {formatDate(user.metadata.creationTime)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Último acceso</span>
          <span className="text-sm font-medium">
            {formatDate(user.metadata.lastSignInTime)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">ID de Usuario</span>
          <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
            {user.uid.slice(0, 8)}...
          </span>
        </div>
      </CardContent>
    </Card>
  );
}