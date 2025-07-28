'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockClients } from '@/modules/clients/mock/clientsMockData';
import { IClient } from '@/modules/clients/types/clients';
import { Button } from '@/components/ui/button';
import {
  Phone,
  MessageCircle,
  Mail,
  ExternalLink,
  User,
  MapPin,
  Clock,
  ArrowLeft,
  PhoneCall // New import for PhoneCall icon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsAppHistory } from '@/components/clients/WhatsAppHistory';
import { CallHistoryAndTranscriptionView } from '@/components/clients/CallHistoryAndTranscriptionView'; // New import for the combined view

export default function ContactActionsPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<IClient | null>(null);

  useEffect(() => {
    if (params.id) {
      const foundClient = mockClients.find(c => c.id === params.id);
      setClient(foundClient || null);
    }
  }, [params.id]);

  if (!client) {
    return (
      <div className="p-4 bg-white min-h-screen flex items-center justify-center">
        <p>Cliente no encontrado.</p>
      </div>
    );
  }

  const handleCall = () => {
    if (client.phone) {
      window.open(`tel:${client.phone}`, '_self');
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
    <div className="p-4 bg-white min-h-screen flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Contactar a {client.name.toUpperCase()}</h1>
      </div>
      
      <Tabs defaultValue="contact-options" className="flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-3"> {/* Changed to 3 columns */}
          <TabsTrigger value="contact-options">Opciones de Contacto</TabsTrigger>
          <TabsTrigger value="whatsapp-chat">WhatsApp Chat</TabsTrigger>
          <TabsTrigger value="phone-call">Llamada Telefónica</TabsTrigger> {/* New tab trigger */}
        </TabsList>

        <TabsContent value="contact-options" className="flex-1 overflow-y-auto p-4">
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
        </TabsContent>

        <TabsContent value="whatsapp-chat" className="flex-1 flex flex-col">
          <WhatsAppHistory clientId={client.id} />
        </TabsContent>

        <TabsContent value="phone-call" className="flex-1 flex flex-col"> {/* New tab content */}
          <CallHistoryAndTranscriptionView clientId={client.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
