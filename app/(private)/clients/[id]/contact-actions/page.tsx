'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClients } from '@/modules/clients/hooks/useClients';
import { IClient } from '@/modules/clients/types/clients';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"; // Import Collapsible components
import { WhatsAppHistory } from '@/components/clients/WhatsAppHistory';
import CallHistoryAndTranscriptionView from '@/components/clients/CallHistoryAndTranscriptionView';
import { EmailHistory } from '@/components/clients/EmailHistory'; // New import for EmailHistory

export default function ContactActionsPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<IClient | null>(null);
  const [filterDays, setFilterDays] = useState<number | null>(null);
  const { clients, isLoading } = useClients();

  useEffect(() => {
    if (params.id && clients.length > 0) {
      const foundClient = clients.find(c => c.id === params.id);
      setClient(foundClient || null);
    }
  }, [params.id, clients]);

  if (isLoading) {
    return (
      <div className="p-4 bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-4 bg-white min-h-screen flex items-center justify-center">
        <p>Cliente no encontrado.</p>
      </div>
    );
  }


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
    <div className="p-4 min-h-screen flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Contactar a {client.name.toUpperCase()}</h1>
      </div>
      
      {/* Client Info Summary with Collapsible */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Préstamo:</span>
          <Badge variant="outline">{client.loan_letter}</Badge>
          <span className="font-medium ml-4">Estado:</span>
          <Badge variant={client.status === 'current' ? 'default' : 'outline'}
                 className={client.status === 'overdue' ? 'bg-red-50 text-red-600 border-red-200' : ''}>
            {client.status === 'current' ? 'Al día' : client.status === 'overdue' ? 'Vencido' : client.status}
          </Badge>
        </div>
        
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start px-0 text-muted-foreground hover:text-foreground">
              <span className="flex items-center gap-2">
                {client.city && client.province && (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>{client.city}, {client.province}</span>
                  </>
                )}
                {client.best_contact_time && (
                  <>
                    {(client.city || client.province) ? <span className="mx-1">|</span> : null}
                    <Clock className="h-3 w-3" />
                    <span>{client.best_contact_time}</span>
                  </>
                )}
                {client.preferred_contact_method && (
                  <span className="ml-auto">
                    {getPreferredMethodBadge()}
                  </span>
                )}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-2">
            {/* Additional client details can go here if needed */}
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      <Tabs defaultValue="whatsapp-chat" className="flex flex-col flex-1"> {/* Default to whatsapp-chat */}
        <TabsList className="grid w-full grid-cols-3"> {/* Changed to 3 columns */}
          <TabsTrigger value="whatsapp-chat">WhatsApp Chat</TabsTrigger>
          <TabsTrigger value="phone-call">Llamada Telefónica</TabsTrigger>
          <TabsTrigger value="email-history">Historial de Email</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp-chat" className="flex-1 flex">
          <div className="flex items-center gap-2 mb-4 flex-col  items-start"> {/* Added flex-wrap for responsiveness */}
            <span className="font-medium text-sm mb-2 mx-2">Filtrar por:</span>
            <Button className='w-40 mx-2' variant={filterDays === null ? "default" : "outline"} size="sm" onClick={() => setFilterDays(null)}>Todo el historial</Button>
            <Button className='w-40 mx-2' variant={filterDays === 1 ? "default" : "outline"} size="sm" onClick={() => setFilterDays(1)}>1 día</Button>
            <Button className='w-40 mx-2' variant={filterDays === 2 ? "default" : "outline"} size="sm" onClick={() => setFilterDays(2)}>2 días</Button>
            <Button className='w-40 mx-2' variant={filterDays === 3 ? "default" : "outline"} size="sm" onClick={() => setFilterDays(3)}>3 días</Button>
            <Button className='w-40 mx-2' variant={filterDays === 10 ? "default" : "outline"} size="sm" onClick={() => setFilterDays(10)}>10 días</Button>
            <Button className='w-40 mx-2' variant={filterDays === 15 ? "default" : "outline"} size="sm" onClick={() => setFilterDays(15)}>15 días</Button>
          </div>
          <WhatsAppHistory clientId={client.id} filterDays={filterDays} />
        </TabsContent>

        <TabsContent value="phone-call" className="flex-1 flex flex-col">
          <CallHistoryAndTranscriptionView clientId={client.id} filterDays={filterDays} />
        </TabsContent>

        <TabsContent value="email-history" className="flex-1 flex flex-col">
          <EmailHistory clientId={client.id} filterDays={filterDays} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
