'use client';

import { useState } from 'react';
import { IClient } from '@/modules/clients/types/clients';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  ExternalLink,
  User,
  MapPin,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ContactActionsModalProps {
  client: IClient;
  trigger?: React.ReactNode;
}

export default function ContactActionsModal({ client, trigger }: ContactActionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCall = () => {
    if (client.phone) {
      window.open(`tel:${client.phone}`, '_self');
    }
  };

  const handleWhatsApp = () => {
    if (client.phone) {
      const phoneForWhatsApp = client.phone.replace(/[\s\-\(\)]/g, '');
      const message = encodeURIComponent(
        `Hola ${client.name.toUpperCase()}, me comunico desde el equipo de cobranza. ¿Podríamos conversar sobre su préstamo ${client.loan_letter}?`
      );
      window.open(`https://wa.me/${phoneForWhatsApp}?text=${message}`, '_blank');
    }
  };

  const handleEmail = () => {
    if (client.email) {
      const subject = encodeURIComponent(`Préstamo ${client.loan_letter} - Recordatorio de pago`);
      const body = encodeURIComponent(
        `Estimado/a ${client.name.toUpperCase()},\n\nEsperamos que se encuentre bien. Le escribimos para conversar sobre su préstamo ${client.loan_letter}.\n\nQuedamos atentos a su respuesta.\n\nSaludos cordiales,\nEquipo de Cobranza`
      );
      window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_self');
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Phone className="h-4 w-4 mr-2" />
      Acciones de Contacto
    </Button>
  );

  const getPreferredMethodBadge = () => {
    if (!client.preferred_contact_method) return null;
    
    const methodConfig = {
      whatsapp: { label: 'WhatsApp', color: 'bg-green-100 text-green-800' },
      phone: { label: 'Teléfono', color: 'bg-blue-100 text-blue-800' },
      email: { label: 'Email', color: 'bg-purple-100 text-purple-800' }
    };

    const config = methodConfig[client.preferred_contact_method];
    if (!config) return null;

    return (
      <Badge className={`text-xs ${config.color}`}>
        Prefiere: {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contactar a {client.name.toUpperCase()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Client Info Summary */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Préstamo:</span>
              <Badge variant="outline">{client.loan_letter}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Estado:</span>
              <Badge variant={client.status === 'current' ? 'default' : 'outline'} 
                     className={client.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' : ''}>
                {client.status === 'current' ? 'Al día' : client.status === 'overdue' ? 'Vencido' : client.status}
              </Badge>
            </div>
            {client.address && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {client.city}, {client.province}
              </div>
            )}
            {client.best_contact_time && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {client.best_contact_time}
              </div>
            )}
            {getPreferredMethodBadge()}
          </div>

          <Separator />

          {/* Contact Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Opciones de Contacto</h4>
            
            {/* Phone Call */}
            <Button 
              onClick={handleCall}
              className="w-full justify-start"
              variant="outline"
              disabled={!client.phone}
            >
              <Phone className="h-4 w-4 mr-3" />
              <div className="flex flex-col items-start">
                <span>Llamar por teléfono</span>
                <span className="text-xs text-muted-foreground">
                  {client.phone || 'No disponible'}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>

            {/* WhatsApp */}
            <Button 
              onClick={handleWhatsApp}
              className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-800 border-green-200"
              variant="outline"
              disabled={!client.phone}
            >
              <MessageCircle className="h-4 w-4 mr-3" />
              <div className="flex flex-col items-start">
                <span>Enviar WhatsApp</span>
                <span className="text-xs text-muted-foreground">
                  {client.phone || 'No disponible'}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>

            {/* Email */}
            <Button 
              onClick={handleEmail}
              className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200"
              variant="outline"
              disabled={!client.email}
            >
              <Mail className="h-4 w-4 mr-3" />
              <div className="flex flex-col items-start">
                <span>Enviar Email</span>
                <span className="text-xs text-muted-foreground">
                  {client.email || 'No disponible'}
                </span>
              </div>
              <ExternalLink className="h-3 w-3 ml-auto" />
            </Button>
          </div>

          {/* Warnings for missing contact info */}
          {(!client.email || !client.phone) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 font-medium mb-1">
                ⚠️ Información de contacto incompleta
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                {!client.phone && <li>• Teléfono faltante</li>}
                {!client.email && <li>• Email faltante</li>}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}