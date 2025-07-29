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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Edit3, Save, X, Loader2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeleteClientModal } from '@/components/clients/DeleteClientModal';

const InfoRow = ({ label, value, children }: { label: string; value?: string | number; children?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-1.5 border-b last:border-b-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {value && <p className="text-sm font-semibold truncate">{value}</p>}
        {children && <div className="flex-shrink-0">{children}</div>}
    </div>
);

// Componente editable para campos de información
const EditableInfoRow = ({ 
  label, 
  value, 
  field, 
  isEditing, 
  editValue, 
  onEdit, 
  type = "text",
  options 
}: { 
  label: string; 
  value?: string | number | boolean; 
  field: keyof IClient;
  isEditing: boolean;
  editValue: string | number | boolean | undefined;
  onEdit: (field: keyof IClient, value: string | number | boolean) => void;
  type?: "text" | "email" | "number" | "select" | "boolean";
  options?: { value: string; label: string }[];
}) => (
  <div className="flex justify-between items-center py-1.5 border-b last:border-b-0">
    <p className="text-sm text-muted-foreground">{label}</p>
    {isEditing ? (
      <div className="flex-shrink-0 w-32">
        {type === "select" && options ? (
          <Select value={editValue?.toString() || ""} onValueChange={(val) => onEdit(field, val)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : type === "boolean" ? (
          <Switch 
            checked={!!editValue} 
            onCheckedChange={(checked) => onEdit(field, checked)}
          />
        ) : (
          <Input
            type={type}
            value={editValue?.toString() || ""}
            onChange={(e) => onEdit(field, type === "number" ? Number(e.target.value) : e.target.value)}
            className="h-8 text-sm"
          />
        )}
      </div>
    ) : (
      <p className="text-sm font-semibold truncate">
        {type === "boolean" ? (value ? "Sí" : "No") : (value?.toString() || "No disponible")}
      </p>
    )}
  </div>
);

const ClientDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ExtendedClient | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<IClient>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { clients, isLoading, updateClient } = useClients();

  useEffect(() => {
    if (params.id && clients.length > 0) {
      const foundClient = clients.find(c => c.id === params.id);
      setClient(foundClient || null);
      if (foundClient) {
        setEditFormData(foundClient);
      }
    }
  }, [params.id, clients]);

  // Funciones para manejar la edición
  const handleStartEdit = () => {
    if (client) {
      setEditFormData({ ...client });
      setIsEditing(true);
      setSaveError(null);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(client || {});
    setSaveError(null);
  };

  const handleInputChange = (field: keyof IClient, value: string | number | boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!client || !editFormData) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await updateClient(client.id, editFormData);
      setIsEditing(false);
      // El cliente se actualizará automáticamente a través del context
    } catch (error) {
      console.error('Error updating client:', error);
      setSaveError('Error al guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Detalles del Cliente</h1>
            {client && <ClientMigrationBadge client={client} variant="minimal" />}
          </div>
        </div>
        
        {/* Botones de edición */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button onClick={handleStartEdit} variant="outline">
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Cliente
              </Button>
              <DeleteClientModal 
                client={client}
                trigger={
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                }
                onDeleted={() => {
                  // Redirigir al admin después de eliminar
                  router.push('/clients/admin');
                }}
              />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleCancelEdit} 
                variant="outline"
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error de guardado */}
      {saveError && (
        <Alert className="mb-4 border-red-500 bg-red-50">
          <AlertDescription className="text-red-800">
            {saveError}
          </AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="personal">Resumen</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="ia">IA & Análisis</TabsTrigger>
          <TabsTrigger value="settings" className={isEditing ? "text-blue-600 font-semibold" : ""}>
            Edición
            {isEditing && <span className="ml-1 text-xs">●</span>}
          </TabsTrigger>
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
                  <EditableInfoRow 
                    label="Nacionalidad" 
                    value={client.country}
                    field="country"
                    isEditing={isEditing}
                    editValue={editFormData.country}
                    onEdit={handleInputChange}
                  />
                  <InfoRow label="Estado Civil" value="N/A" />
                  <EditableInfoRow 
                    label="Dirección" 
                    value={client.address}
                    field="address"
                    isEditing={isEditing}
                    editValue={editFormData.address}
                    onEdit={handleInputChange}
                  />
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
                  <EditableInfoRow 
                    label="Teléfono" 
                    value={client.phone}
                    field="phone"
                    isEditing={isEditing}
                    editValue={editFormData.phone}
                    onEdit={handleInputChange}
                  />
                  <EditableInfoRow 
                    label="Email" 
                    value={client.email}
                    field="email"
                    type="email"
                    isEditing={isEditing}
                    editValue={editFormData.email}
                    onEdit={handleInputChange}
                  />
                  <EditableInfoRow 
                    label="Verificado" 
                    value={client.employment_verified}
                    field="employment_verified"
                    type="boolean"
                    isEditing={isEditing}
                    editValue={editFormData.employment_verified}
                    onEdit={handleInputChange}
                  />
                  <EditableInfoRow 
                    label="Contacto" 
                    value={client.preferred_contact_method}
                    field="preferred_contact_method"
                    type="select"
                    options={[
                      { value: "whatsapp", label: "WhatsApp" },
                      { value: "phone", label: "Teléfono" },
                      { value: "email", label: "Email" }
                    ]}
                    isEditing={isEditing}
                    editValue={editFormData.preferred_contact_method}
                    onEdit={handleInputChange}
                  />
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
                  <EditableInfoRow 
                    label="Empresa" 
                    value={client.employer}
                    field="employer"
                    isEditing={isEditing}
                    editValue={editFormData.employer}
                    onEdit={handleInputChange}
                  />
                  <EditableInfoRow 
                    label="Cargo" 
                    value={client.position}
                    field="position"
                    isEditing={isEditing}
                    editValue={editFormData.position}
                    onEdit={handleInputChange}
                  />
                  <EditableInfoRow 
                    label="Salario" 
                    value={client.monthly_income}
                    field="monthly_income"
                    type="number"
                    isEditing={isEditing}
                    editValue={editFormData.monthly_income}
                    onEdit={handleInputChange}
                  />
                  <EditableInfoRow 
                    label="Estado Laboral" 
                    value={client.employment_status}
                    field="employment_status"
                    type="select"
                    options={[
                      { value: "Empleado a tiempo completo", label: "Empleado a tiempo completo" },
                      { value: "Empleado a tiempo parcial", label: "Empleado a tiempo parcial" },
                      { value: "Autónomo", label: "Autónomo" },
                      { value: "Desempleado", label: "Desempleado" },
                      { value: "Jubilado", label: "Jubilado" }
                    ]}
                    isEditing={isEditing}
                    editValue={editFormData.employment_status}
                    onEdit={handleInputChange}
                  />
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
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Edición de Cliente
                  {!isEditing && (
                    <Button onClick={handleStartEdit} variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nombre Completo</Label>
                    {isEditing ? (
                      <Input
                        id="edit-name"
                        value={editFormData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm border rounded px-3 py-2 bg-gray-50">{client.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-national-id">Cédula</Label>
                    {isEditing ? (
                      <Input
                        id="edit-national-id"
                        value={editFormData.national_id || ''}
                        onChange={(e) => handleInputChange('national_id', e.target.value)}
                      />
                    ) : (
                      <p className="text-sm border rounded px-3 py-2 bg-gray-50">{client.national_id}</p>
                    )}
                  </div>
                </div>

                {/* Información Financiera */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-debt">Deuda</Label>
                    {isEditing ? (
                      <Input
                        id="edit-debt"
                        type="number"
                        step="0.01"
                        value={editFormData.debt || ''}
                        onChange={(e) => handleInputChange('debt', Number(e.target.value))}
                      />
                    ) : (
                      <p className="text-sm border rounded px-3 py-2 bg-gray-50">
                        ${client.debt?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Estado</Label>
                    {isEditing ? (
                      <Select 
                        value={editFormData.status || ''} 
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="current">Al día</SelectItem>
                          <SelectItem value="overdue">Vencido</SelectItem>
                          <SelectItem value="paid">Pagado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm border rounded px-3 py-2 bg-gray-50">{client.status}</p>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notas Generales</Label>
                  {isEditing ? (
                    <Textarea
                      id="edit-notes"
                      value={editFormData.notes || ''}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      placeholder="Notas sobre el cliente..."
                    />
                  ) : (
                    <p className="text-sm border rounded px-3 py-2 bg-gray-50 min-h-[80px]">
                      {client.notes || "Sin notas"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-internal-notes">Notas Internas</Label>
                  {isEditing ? (
                    <Textarea
                      id="edit-internal-notes"
                      value={editFormData.internal_notes || ''}
                      onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                      rows={3}
                      placeholder="Notas internas del equipo..."
                    />
                  ) : (
                    <p className="text-sm border rounded px-3 py-2 bg-gray-50 min-h-[80px]">
                      {client.internal_notes || "Sin notas internas"}
                    </p>
                  )}
                </div>

                {/* Botones de acción para el tab de edición */}
                {isEditing && (
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button 
                      onClick={handleCancelEdit} 
                      variant="outline"
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetailsPage;
