'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { useOrganizations, useCurrentSession } from '@/hooks/useGlobalState';
import { CreateOrganizationData } from '@/types/globalState';

// Validation schema
const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  description: z
    .string()
    .min(1, 'La descripción es requerida')
    .max(500, 'La descripción es demasiado larga')
    .trim(),
  tenantId: z.string().min(1, 'Debe seleccionar un tenant'),
  timezone: z.string().optional(),
  defaultLeadStage: z.string().optional(),
  allowMemberInvites: z.boolean().default(true),
  primaryColor: z.string().optional(),
});

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>;

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (organizationId: string) => void;
}

const timezones = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
  { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (GMT-8)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
];

const leadStages = [
  'Nuevo',
  'Contactado',
  'Calificado',
  'Propuesta',
  'Negociación',
  'Cerrado',
];

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateOrganizationModalProps) {
  const { availableTenants, createNewOrganization, isLoading } = useOrganizations();
  const { currentTenant } = useCurrentSession();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      description: '',
      tenantId: currentTenant?.id || '',
      timezone: 'America/Mexico_City',
      defaultLeadStage: 'Nuevo',
      allowMemberInvites: true,
      primaryColor: '#3B82F6',
    },
  });

  const onSubmit = async (data: CreateOrganizationFormData) => {
    try {
      setMessage(null);
      
      const organizationData: CreateOrganizationData = {
        name: data.name,
        description: data.description,
        tenantId: data.tenantId,
        settings: {
          allowMemberInvites: data.allowMemberInvites,
          defaultLeadStage: data.defaultLeadStage || 'Nuevo',
          timezone: data.timezone || 'America/Mexico_City',
        },
        branding: {
          primaryColor: data.primaryColor || '#3B82F6',
        },
      };

      const result = await createNewOrganization(organizationData);
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Organización creada exitosamente',
        });
        
        // Reset form
        form.reset();
        
        // Call success callback
        if (onSuccess && result.organization) {
          onSuccess(result.organization.id);
        }
        
        // Close modal after short delay
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setMessage({
          type: 'error',
          text: result.message || 'Error al crear la organización',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Error inesperado',
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      setMessage(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Crear Nueva Organización
          </DialogTitle>
          <DialogDescription>
            Crea una nueva organización para gestionar equipos y proyectos.
          </DialogDescription>
        </DialogHeader>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-500' : 'border-green-500'}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Información Básica</h4>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Organización</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Equipo de Ventas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el propósito de esta organización..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableTenants.map(tenant => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.companyInfo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Configuración</h4>
              </div>

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Horaria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultLeadStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa Inicial de Leads</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leadStages.map(stage => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Principal</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1 border rounded"
                          {...field}
                        />
                        <Input
                          type="text"
                          placeholder="#3B82F6"
                          className="flex-1"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Color que se utilizará en la interfaz de la organización
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Organización'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}