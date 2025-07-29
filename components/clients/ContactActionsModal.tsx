'use client';

import { useRouter } from 'next/navigation';
import { IClient } from '@/modules/clients/types/clients';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';

interface ContactActionsModalProps {
  client: IClient;
  trigger?: React.ReactNode;
}

export default function ContactActionsModal({ client, trigger }: ContactActionsModalProps) {
  const router = useRouter();

  const handleNavigateToContactActions = () => {
    router.push(`/clients/${client.id}/contact-actions`);
  };

  // Si se proporciona un trigger personalizado, usarlo
  if (trigger) {
    return (
      <div onClick={handleNavigateToContactActions} className="cursor-pointer">
        {trigger}
      </div>
    );
  }

  // Botón por defecto
  return (
    <Button variant="outline" size="sm" onClick={handleNavigateToContactActions}>
      <Phone className="h-4 w-4 mr-2" />
      Acciones de Contacto
    </Button>
  );
}
