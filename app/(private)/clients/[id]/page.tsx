'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useClients } from '@/modules/clients/hooks/useClients';
import { IClient } from '@/modules/clients/types/clients';
import { ExtendedClient } from '@/modules/clients/context/ClientsContext';
import { ClientMigrationBadge } from '@/components/clients/ClientMigrationBadge';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { safeFormatDate } from '@/utils/dateFormat';
import { FinancialDetails } from '@/components/clients/FinancialDetails';
import { PaymentHistory } from '@/components/clients/PaymentHistory';
import { AiAnalysis } from '@/components/clients/AiAnalysis';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InfoRow = ({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-1.5 border-b last:border-b-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {value && <p className="text-sm font-semibold truncate">{value}</p>}
        {children && <div className="flex-shrink-0">{children}</div>}
    </div>
);

const ClientDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ExtendedClient | null>(null);
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

  const getCompleteness = () => {
      const requiredFields = ['name', 'national_id', 'phone', 'debt', 'status', 'loan_letter'];
      const recommendedFields = ['email', 'address', 'city', 'province', 'employment_status', 'monthly_income', 'preferred_contact_method'];
      const totalFields = requiredFields.length + recommendedFields.length;
      let completedFields = 0;

      requiredFields.forEach(field => {
          if(client[field as keyof IClient]) completedFields++;
      });

      recommendedFields.forEach(field => {
          if(client[field as keyof IClient]) completedFields++;
      });

      return Math.round((completedFields / totalFields) * 100);
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
          {client && <ClientMigrationBadge client={client} variant="minimal" />}
        </div>
      </div>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Resumen</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="ia">IA & Análisis</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <p className="text-sm text-muted-foreground">Cédula: {client.national_id}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Información Personal */}
              <Card className="rounded-lg shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <InfoRow label="F. Nacimiento" value={safeFormatDate(client.loan_start_date)} />
                  <InfoRow label="Nacionalidad" value={client.country} />
                  <InfoRow label="Estado Civil" value="N/A" />
                  <InfoRow label="Dirección" value={client.address} />
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              <Card className="rounded-lg shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <InfoRow label="Teléfono" value={client.phone} />
                  <InfoRow label="Email" value={client.email || 'No disponible'} />
                  <InfoRow label="Verificado">
                    <Badge variant={client.employment_verified ? "default" : "outline"}>{client.employment_verified ? 'Sí' : 'No'}</Badge>
                  </InfoRow>
                   <InfoRow label="Contacto">
                    <Badge>{client.preferred_contact_method || 'N/A'}</Badge>
                  </InfoRow>
                </CardContent>
              </Card>

              {/* Información Laboral */}
              <Card className="rounded-lg shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Información Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <InfoRow label="Empresa" value={client.employer || 'No disponible'} />
                  <InfoRow label="Cargo" value={client.position || 'No disponible'} />
                  <InfoRow label="Salario" value={`$${client.monthly_income?.toLocaleString() || 'N/A'}`} />
                  <InfoRow label="Industria" value="N/A" />
                </CardContent>
              </Card>

              {/* Estado de Completitud */}
              <Card className="rounded-lg shadow-none border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base font-semibold">
                    Completitud del Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-base font-bold">{getCompleteness()}%</p>
                    </div>
                    <Progress value={getCompleteness()} />
                     <InfoRow label="Riesgo">
                        <Badge variant={client.risk_category === 'bajo' ? 'default' : 'destructive'}>{client.risk_category}</Badge>
                    </InfoRow>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="financiero">
            <FinancialDetails client={client} />
        </TabsContent>
        <TabsContent value="pagos">
            <PaymentHistory client={client} />
        </TabsContent>
        <TabsContent value="ia">
            <AiAnalysis clientId={client.id} />
        </TabsContent>
        <TabsContent value="settings">
            <p>Configuración aquí.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailsPage;
