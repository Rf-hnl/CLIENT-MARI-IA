'use client';

import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, User, MapPin, Briefcase, Phone, FileText, Plus, Loader2, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClients } from '@/modules/clients/hooks/useClients';
import { IClient } from '@/modules/clients/types/clients';
import { FormField } from './FormField';

// Tipos para el formulario
interface NewClientFormData {
  // DEVELOPMENT ONLY
  customId?: string;
  
  // REQUIRED FIELDS
  name: string;
  national_id: string;
  phone: string;
  debt: string;
  status: string;
  loan_letter: string;
  
  // RECOMMENDED FIELDS
  email: string;
  address: string;
  city: string;
  province: string;
  employment_status: string;
  monthly_income: string;
  preferred_contact_method: string;
  
  // OPTIONAL FIELDS
  postal_code: string;
  country: string;
  employer: string;
  position: string;
  employment_verified: boolean;
  best_contact_time: string;
  response_score: string;
  collection_strategy: string;
  notes: string;
  internal_notes: string;
  tags: string[];
}

// Estado inicial del formulario
const initialFormData: NewClientFormData = {
  // Development
  customId: '',
  
  // Required
  name: '',
  national_id: '',
  phone: '',
  debt: '',
  status: 'current',
  loan_letter: '',
  
  // Recommended
  email: '',
  address: '',
  city: '',
  province: '',
  employment_status: '',
  monthly_income: '',
  preferred_contact_method: '',
  
  // Optional
  postal_code: '',
  country: 'Panamá',
  employer: '',
  position: '',
  employment_verified: false,
  best_contact_time: '',
  response_score: '',
  collection_strategy: '',
  notes: '',
  internal_notes: '',
  tags: [],
};

interface NewClientModalProps {
  trigger?: React.ReactNode;
}

export function NewClientModal({ trigger }: NewClientModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<NewClientFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');
  
  const { addClient, refetch } = useClients();

  // Manejar cambios en campos de texto (optimizado con useCallback)
  const handleInputChange = useCallback((field: keyof NewClientFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Agregar tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remover tag
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Auto-rellenar formulario con datos de prueba (solo en desarrollo)
  const handleAutoFill = useCallback(() => {
    const sampleData: NewClientFormData = {
      // Development - ID personalizado aleatorio
      customId: `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      
      // Required fields
      name: 'Carlos Rodríguez González',
      national_id: '8-123-456',
      phone: '+507 6311-6918',
      debt: '8500.75',
      status: 'overdue', // Cliente con atraso real
      loan_letter: 'PREST-2024-0456',
      
      // Recommended fields
      email: 'carlos.rodriguez@ejemplo.com',
      address: 'Avenida Balboa, Torre Financial Center, Piso 15',
      city: 'Panamá',
      province: 'Panamá',
      employment_status: 'Empleado a tiempo completo',
      monthly_income: '3200.00',
      preferred_contact_method: 'whatsapp',
      
      // Optional fields
      postal_code: '0001',
      country: 'Panamá',
      employer: 'Copa Airlines',
      position: 'Desarrollador Senior',
      employment_verified: true,
      best_contact_time: '9:00 AM - 6:00 PM (L-V)',
      response_score: '3',
      collection_strategy: 'Seguimiento intensivo cada 3 días - promesas incumplidas',
      notes: 'Cliente con atraso en pagos. Prefiere comunicación por WhatsApp pero no responde consistentemente.',
      internal_notes: 'Cliente con 45 días de atraso. Historial de promesas incumplidas. Requiere seguimiento intensivo.',
      tags: ['atraso-45-dias', 'whatsapp-preferido', 'seguimiento-intensivo', 'promesas-incumplidas']
    };

    setFormData(sampleData);
    setErrors({}); // Limpiar errores
  }, []);

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos requeridos
    if (!formData.name.trim()) newErrors.name = 'Nombre es requerido';
    if (!formData.national_id.trim()) newErrors.national_id = 'Cédula es requerida';
    if (!formData.phone.trim()) newErrors.phone = 'Teléfono es requerido';
    if (!formData.debt.trim()) newErrors.debt = 'Monto de deuda es requerido';
    if (!formData.status) newErrors.status = 'Estado es requerido';
    if (!formData.loan_letter.trim()) newErrors.loan_letter = 'Número de préstamo es requerido';

    // Validaciones de formato
    if (formData.debt && isNaN(Number(formData.debt))) {
      newErrors.debt = 'Debe ser un número válido';
    }
    if (formData.monthly_income && isNaN(Number(formData.monthly_income))) {
      newErrors.monthly_income = 'Debe ser un número válido';
    }
    if (formData.response_score && (isNaN(Number(formData.response_score)) || Number(formData.response_score) < 0 || Number(formData.response_score) > 10)) {
      newErrors.response_score = 'Debe ser un número entre 0 y 10';
    }
    if (formData.email && formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }
    
    // Validación de ID personalizado (solo en desarrollo)
    if (process.env.NEXT_PUBLIC_DEVELOPMENT === 'true' && formData.customId?.trim()) {
      const customId = formData.customId.trim();
      // Validar que el ID solo contenga caracteres alfanuméricos, guiones y guiones bajos
      if (!/^[a-zA-Z0-9_-]+$/.test(customId)) {
        newErrors.customId = 'El ID solo puede contener letras, números, guiones (-) y guiones bajos (_)';
      }
      // Validar longitud mínima y máxima
      if (customId.length < 3) {
        newErrors.customId = 'El ID debe tener al menos 3 caracteres';
      }
      if (customId.length > 50) {
        newErrors.customId = 'El ID no puede exceder 50 caracteres';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Preparar datos para envío
      const clientData = {
        // Development field (if provided)
        ...(process.env.NEXT_PUBLIC_DEVELOPMENT === 'true' && formData.customId?.trim() && { customId: formData.customId.trim() }),
        
        // Required fields
        name: formData.name.trim(),
        national_id: formData.national_id.trim(),
        phone: formData.phone.trim(),
        debt: Number(formData.debt),
        status: formData.status,
        loan_letter: formData.loan_letter.trim(),
        
        // Optional fields (solo incluir si tienen valor)
        ...(formData.email.trim() && { email: formData.email.trim() }),
        ...(formData.address.trim() && { address: formData.address.trim() }),
        ...(formData.city.trim() && { city: formData.city.trim() }),
        ...(formData.province.trim() && { province: formData.province.trim() }),
        ...(formData.employment_status.trim() && { employment_status: formData.employment_status.trim() }),
        ...(formData.monthly_income.trim() && { monthly_income: Number(formData.monthly_income) }),
        ...(formData.preferred_contact_method && { preferred_contact_method: formData.preferred_contact_method as "whatsapp" | "phone" | "email" }),
        ...(formData.postal_code.trim() && { postal_code: formData.postal_code.trim() }),
        ...(formData.country.trim() && { country: formData.country.trim() }),
        ...(formData.employer.trim() && { employer: formData.employer.trim() }),
        ...(formData.position.trim() && { position: formData.position.trim() }),
        ...(formData.employment_verified !== false && { employment_verified: formData.employment_verified }),
        ...(formData.best_contact_time.trim() && { best_contact_time: formData.best_contact_time.trim() }),
        ...(formData.response_score.trim() && { response_score: Number(formData.response_score) }),
        ...(formData.collection_strategy.trim() && { collection_strategy: formData.collection_strategy.trim() }),
        ...(formData.notes.trim() && { notes: formData.notes.trim() }),
        ...(formData.internal_notes.trim() && { internal_notes: formData.internal_notes.trim() }),
        ...(formData.tags.length > 0 && { tags: formData.tags }),
      };

      await addClient(clientData as Omit<IClient, 'id' | 'created_at' | 'updated_at'>);
      
      // Resetear formulario y cerrar modal
      setFormData(initialFormData);
      setErrors({});
      setOpen(false);
      
      // Refrescar lista de clientes
      await refetch();
      
    } catch (error) {
      console.error('Error creating client:', error);
      setErrors({ submit: 'Error al crear el cliente. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Crear Nuevo Cliente
          </DialogTitle>
        </DialogHeader>

        {errors.submit && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errors.submit}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="required" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="required" className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Requeridos
            </TabsTrigger>
            <TabsTrigger value="recommended" className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Recomendados
            </TabsTrigger>
            <TabsTrigger value="optional" className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Opcionales
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CAMPOS REQUERIDOS */}
          <TabsContent value="required" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <User className="h-4 w-4" />
                  Información Básica Requerida
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nombre Completo" field="name" required errors={errors}>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ej: Carlos Rodríguez González"
                  />
                </FormField>

                <FormField label="Cédula de Identidad" field="national_id" required errors={errors}>
                  <Input
                    id="national_id"
                    value={formData.national_id}
                    onChange={(e) => handleInputChange('national_id', e.target.value)}
                    placeholder="Ej: 8-123-456"
                  />
                </FormField>

                <FormField label="Teléfono Principal" field="phone" required errors={errors}>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Ej: +507 6311-6918"
                  />
                </FormField>

                <FormField label="Monto de la Deuda" field="debt" required errors={errors}>
                  <Input
                    id="debt"
                    type="number"
                    step="0.01"
                    value={formData.debt}
                    onChange={(e) => handleInputChange('debt', e.target.value)}
                    placeholder="Ej: 8500.75"
                  />
                </FormField>

                <FormField label="Estado del Préstamo" field="status" required errors={errors}>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Al día</SelectItem>
                      <SelectItem value="overdue">Vencido</SelectItem>
                      <SelectItem value="paid">Pagado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Número de Préstamo" field="loan_letter" required errors={errors}>
                  <Input
                    id="loan_letter"
                    value={formData.loan_letter}
                    onChange={(e) => handleInputChange('loan_letter', e.target.value)}
                    placeholder="Ej: PREST-2024-0456"
                  />
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CAMPOS RECOMENDADOS */}
          <TabsContent value="recommended" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Phone className="h-4 w-4" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Correo Electrónico" field="email" description="Importante para opciones de contacto" errors={errors}>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Ej: cliente@ejemplo.com"
                  />
                </FormField>

                <FormField label="Método de Contacto Preferido" field="preferred_contact_method" errors={errors}>
                  <Select value={formData.preferred_contact_method} onValueChange={(value) => handleInputChange('preferred_contact_method', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Teléfono</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <MapPin className="h-4 w-4" />
                  Información de Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Dirección Completa" field="address" description="Necesaria para gestión de cobranza" errors={errors}>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Ej: Avenida Balboa, Torre Financial Center, Piso 15"
                  />
                </FormField>

                <FormField label="Ciudad" field="city" errors={errors}>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Ej: Panamá"
                  />
                </FormField>

                <FormField label="Provincia" field="province" errors={errors}>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    placeholder="Ej: Panamá"
                  />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Briefcase className="h-4 w-4" />
                  Información Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Estado Laboral" field="employment_status" description="Crítico para evaluación de riesgo" errors={errors}>
                  <Select value={formData.employment_status} onValueChange={(value) => handleInputChange('employment_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Empleado a tiempo completo">Empleado a tiempo completo</SelectItem>
                      <SelectItem value="Empleado a tiempo parcial">Empleado a tiempo parcial</SelectItem>
                      <SelectItem value="Autónomo">Autónomo</SelectItem>
                      <SelectItem value="Desempleado">Desempleado</SelectItem>
                      <SelectItem value="Jubilado">Jubilado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Ingresos Mensuales" field="monthly_income" description="Necesarios para calcular capacidad de pago" errors={errors}>
                  <Input
                    id="monthly_income"
                    type="number"
                    step="0.01"
                    value={formData.monthly_income}
                    onChange={(e) => handleInputChange('monthly_income', e.target.value)}
                    placeholder="Ej: 3200.00"
                  />
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: CAMPOS OPCIONALES */}
          <TabsContent value="optional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <MapPin className="h-4 w-4" />
                    Ubicación Adicional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Código Postal" field="postal_code" errors={errors}>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="Ej: 0001"
                    />
                  </FormField>

                  <FormField label="País" field="country" errors={errors}>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="Ej: Panamá"
                    />
                  </FormField>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Briefcase className="h-4 w-4" />
                    Empleo Detallado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Empleador" field="employer" errors={errors}>
                    <Input
                      id="employer"
                      value={formData.employer}
                      onChange={(e) => handleInputChange('employer', e.target.value)}
                      placeholder="Ej: Copa Airlines"
                    />
                  </FormField>

                  <FormField label="Cargo/Posición" field="position" errors={errors}>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Ej: Desarrollador Senior"
                    />
                  </FormField>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="employment_verified"
                      checked={formData.employment_verified}
                      onCheckedChange={(checked) => handleInputChange('employment_verified', checked)}
                    />
                    <Label htmlFor="employment_verified">Empleo verificado</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Phone className="h-4 w-4" />
                  Preferencias de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Mejor Horario de Contacto" field="best_contact_time" errors={errors}>
                  <Input
                    id="best_contact_time"
                    value={formData.best_contact_time}
                    onChange={(e) => handleInputChange('best_contact_time', e.target.value)}
                    placeholder="Ej: 9:00 AM - 6:00 PM (L-V)"
                  />
                </FormField>

                <FormField label="Puntuación de Respuesta (0-10)" field="response_score" errors={errors}>
                  <Input
                    id="response_score"
                    type="number"
                    min="0"
                    max="10"
                    value={formData.response_score}
                    onChange={(e) => handleInputChange('response_score', e.target.value)}
                    placeholder="Ej: 8"
                  />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <FileText className="h-4 w-4" />
                  Gestión y Notas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField label="Estrategia de Cobranza" field="collection_strategy" errors={errors}>
                  <Input
                    id="collection_strategy"
                    value={formData.collection_strategy}
                    onChange={(e) => handleInputChange('collection_strategy', e.target.value)}
                    placeholder="Ej: Contacto directo mensual"
                  />
                </FormField>

                <FormField label="Notas Generales" field="notes" errors={errors}>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Información adicional sobre el cliente..."
                    rows={3}
                  />
                </FormField>

                <FormField label="Notas Internas" field="internal_notes" description="Solo visibles para el equipo interno" errors={errors}>
                  <Textarea
                    id="internal_notes"
                    value={formData.internal_notes}
                    onChange={(e) => handleInputChange('internal_notes', e.target.value)}
                    placeholder="Notas confidenciales del equipo..."
                    rows={3}
                  />
                </FormField>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Etiquetas</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Agregar etiqueta..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button type="button" onClick={handleAddTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: CAMPOS DEL SISTEMA */}
          <TabsContent value="system" className="space-y-6">
            {/* Campo de ID personalizado solo en desarrollo */}
            {process.env.NEXT_PUBLIC_DEVELOPMENT === 'true' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <AlertCircle className="h-4 w-4" />
                    Configuración de Desarrollo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Alert className="border-orange-300 bg-orange-100 flex-1">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Modo desarrollo activo:</strong> Puedes especificar un ID personalizado para el cliente.
                      </AlertDescription>
                    </Alert>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoFill}
                      className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-rellenar
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <FormField 
                      label="ID Personalizado del Cliente (Desarrollo)" 
                      field="customId"
                      description="Solo disponible en modo desarrollo. Si se deja vacío, se generará automáticamente."
                      errors={errors}
                    >
                      <Input
                        id="customId"
                        value={formData.customId || ''}
                        onChange={(e) => handleInputChange('customId', e.target.value)}
                        placeholder="Ej: lcfmSHygTlxqzNxp7aBg"
                      />
                    </FormField>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <AlertCircle className="h-4 w-4" />
                  Campos Generados por el Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Los siguientes campos se generarán automáticamente al crear el cliente:
                  </AlertDescription>
                </Alert>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Campos Financieros:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Fecha de pago</li>
                      <li>Monto de cuota</li>
                      <li>Cuotas pendientes</li>
                      <li>Fecha de vencimiento</li>
                      <li>Fecha inicio préstamo</li>
                      <li>Días vencidos</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Campos de Análisis:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Puntuación crediticia</li>
                      <li>Categoría de riesgo</li>
                      <li>Límite de crédito</li>
                      <li>Crédito disponible</li>
                      <li>Probabilidad de recuperación</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Campos de Sistema:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>ID único del cliente</li>
                      <li>Fecha de creación</li>
                      <li>Fecha de actualización</li>
                      <li>Último pago (fecha y monto)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Botones de acción */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setFormData(initialFormData)}
              disabled={isSubmitting}
            >
              Limpiar Formulario
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando Cliente...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Cliente
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}