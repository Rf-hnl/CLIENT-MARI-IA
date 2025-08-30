'use client';

/**
 * NEW LEAD FORM COMPONENT
 * 
 * Formulario para crear nuevos leads
 * Basado en el modelo de datos del CSV del CRM
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Building, 
  Phone, 
  Mail, 
  Star, 
  AlertTriangle,
  Save,
  X,
  Info,
  Target
} from 'lucide-react';
import { useLeads } from '@/modules/leads/context/LeadsContext';
import { LeadStatus, LeadSource, LeadPriority } from '@/modules/leads/types/leads';
import { useAuth } from '@/modules/auth';
import { useTenant } from '@/contexts/TenantContext';
import { Campaign } from '@/types/campaign';

interface NewLeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: () => void;
  initialStatus?: LeadStatus;
}

// Opciones basadas en el CSV real del CRM
const STATUS_OPTIONS: Array<{ value: LeadStatus; label: string; description: string }> = [
  { value: 'new', label: 'Nuevos Leads', description: 'Pendientes de contacto inicial' },
  { value: 'interested', label: 'Leads Potenciales', description: 'Prioritarios para seguimiento' },
  { value: 'qualified', label: 'Calificado', description: 'En seguimiento activo' },
  { value: 'follow_up', label: 'En Seguimiento', description: 'Sin respuesta del cliente' },
  { value: 'proposal_current', label: 'Cotizaciones Actuales', description: 'Campaña actual Jun-Jul' },
  { value: 'proposal_previous', label: 'Cotizaciones Anteriores', description: 'Campañas previas' },
  { value: 'negotiation', label: 'Negociación', description: 'En proceso de ajustes' },
  { value: 'nurturing', label: 'A Futuro', description: 'En pausa temporal' },
  { value: 'won', label: 'Ganado', description: 'Cerrado exitosamente' },
  { value: 'lost', label: 'Propuesta Declinada', description: 'No convertido' },
  { value: 'cold', label: 'Descartados', description: 'No calificados' },
];

const PRIORITY_OPTIONS: Array<{ value: LeadPriority; label: string }> = [
  { value: 'urgent', label: 'Muy alta' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
];

const SOURCE_OPTIONS: Array<{ value: LeadSource; label: string }> = [
  { value: 'website', label: 'Sitio Web' },
  { value: 'social_media', label: 'Redes Sociales' },
  { value: 'referral', label: 'Referido' },
  { value: 'cold_call', label: 'Llamada en frío' },
  { value: 'advertisement', label: 'Publicidad' },
  { value: 'email', label: 'Email Marketing' },
  { value: 'event', label: 'Evento' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'other', label: 'Otro' },
];

export function NewLeadForm({ isOpen, onClose, onLeadCreated, initialStatus = 'new' }: NewLeadFormProps) {
  const { addLead, isLoading } = useLeads();
  const { currentTenant, currentOrganization } = useTenant();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    position: '',
    status: initialStatus,
    source: 'website' as LeadSource,
    priority: 'medium' as LeadPriority,
    notes: '',
    qualification_notes: '',
    tags: '',
    expectedRevenue: '',
    assignedAgent: '',
    campaignId: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Load campaigns when dialog opens
  useEffect(() => {
    if (isOpen && currentTenant && currentOrganization) {
      loadCampaigns();
    }
  }, [isOpen, currentTenant, currentOrganization]);

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const queryParams = new URLSearchParams({
        tenantId: currentTenant!.id,
        organizationId: currentOrganization!.id,
        status: 'active'
      });

      const response = await fetch(`/api/campaigns?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data.campaigns);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      company: '',
      position: '',
      status: initialStatus,
      source: 'website',
      priority: 'medium',
      notes: '',
      qualification_notes: '',
      tags: '',
      expectedRevenue: '',
      assignedAgent: '',
      campaignId: ''
    });
    setErrors({});
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^[+]?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    if (formData.expectedRevenue && isNaN(parseFloat(formData.expectedRevenue))) {
      newErrors.expectedRevenue = 'Los ingresos esperados deben ser un número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const leadData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        company: formData.company.trim() || undefined,
        position: formData.position.trim() || undefined,
        status: formData.status,
        source: formData.source,
        priority: formData.priority,
        notes: formData.notes.trim() || undefined,
        qualification_notes: formData.qualification_notes.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        conversion_value: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : undefined,
        assigned_agent_name: formData.assignedAgent.trim() || undefined,
        preferred_contact_method: 'phone' as const,
        campaignId: formData.campaignId || undefined,
      };

      await addLead(leadData);
      
      resetForm();
      onClose();
      onLeadCreated?.();
      
    } catch (error) {
      console.error('Error creando lead:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Error creando el lead' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Nuevo Lead
          </DialogTitle>
          <DialogDescription>
            Crea un nuevo lead en el sistema. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error general */}
          {errors.submit && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    Nombre / Oportunidad *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Juan Pérez o Restaurante Los Arcos"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+507 6000-0000"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Nombre de la empresa"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Posición / Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Ej: Propietario, Gerente General, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Clasificación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-4 w-4" />
                Clasificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: LeadStatus) => 
                      setFormData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: LeadPriority) => 
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Fuente *</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value: LeadSource) => 
                      setFormData(prev => ({ ...prev, source: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign">Campaña</Label>
                  <Select
                    value={formData.campaignId}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, campaignId: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCampaigns ? "Cargando..." : "Seleccionar campaña"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin campaña</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            {campaign.description && (
                              <div className="text-xs text-muted-foreground">{campaign.description}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedRevenue">Ingresos Esperados (USD)</Label>
                  <Input
                    id="expectedRevenue"
                    type="number"
                    step="0.01"
                    value={formData.expectedRevenue}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedRevenue: e.target.value }))}
                    placeholder="0.00"
                    className={errors.expectedRevenue ? 'border-red-500' : ''}
                  />
                  {errors.expectedRevenue && (
                    <p className="text-sm text-red-600">{errors.expectedRevenue}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedAgent">Agente Asignado</Label>
                  <Input
                    id="assignedAgent"
                    value={formData.assignedAgent}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedAgent: e.target.value }))}
                    placeholder="Nombre del agente de ventas"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="etiqueta1, etiqueta2, etiqueta3"
                />
                <p className="text-xs text-muted-foreground">
                  Separa las etiquetas con comas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualification_notes">Notas de Calificación</Label>
                <Textarea
                  id="qualification_notes"
                  value={formData.qualification_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualification_notes: e.target.value }))}
                  placeholder="Actividades realizadas, nivel de interés, etc."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Generales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Propiedades adicionales, observaciones, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : 'Crear Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
