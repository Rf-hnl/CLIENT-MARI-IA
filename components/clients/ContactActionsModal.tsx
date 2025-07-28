'use client';

import { useRouter } from 'next/navigation';
import { IClient } from '@/modules/clients/types/clients';
import { Button } from '@/components/ui/button';
import { Phone, MessageSquare } from 'lucide-react'; // Import MessageSquare for WhatsApp icon
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // Import Dialog components

interface ContactActionsModalProps {
  client: IClient;
  trigger?: React.ReactNode;
}

export default function ContactActionsModal({ client, trigger }: ContactActionsModalProps) {
  const router = useRouter();

  const handleNavigateToContactActions = () => {
    router.push(`/clients/${client.id}/contact-actions`);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" onClick={handleNavigateToContactActions}>
      <Phone className="h-4 w-4 mr-2" />
      Acciones de Contacto
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ? (
          <div onClick={handleNavigateToContactActions}>
            {trigger}
          </div>
        ) : (
          defaultTrigger
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acciones de Contacto para {client.name}</DialogTitle>
          <DialogDescription>
            Selecciona una acción para contactar al cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button variant="outline" onClick={() => router.push(`/clients/${client.id}/contact-actions?method=phone`)}>
            <Phone className="h-4 w-4 mr-2" />
            Llamada Telefónica
          </Button>
          <Button variant="outline" onClick={() => router.push(`/clients/${client.id}/contact-actions?method=whatsapp`)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Enviar WhatsApp
          </Button>
          {/* You can add more buttons here for other contact methods like email */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
