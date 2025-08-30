'use client';

/**
 * MODAL DE ACCIONES PARA LEADS - DISEÑO MINIMALISTA
 * 
 * Modal compacto y elegante para todas las acciones de gestión de leads
 * Evita prompts básicos y mantiene consistencia visual
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target,
  CheckCircle,
  Users,
  User,
  Clock,
  Edit3,
  X
} from 'lucide-react';

import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { LeadStatus } from '@/modules/leads/types/leads';


export type ActionType = 'changeStatus' | 'qualify' | 'convertToClient' | 'assignAgent' | 'scheduleFollowUp' | 'edit';

export type ChangeStatusData = { status: LeadStatus; notes: string };
export type QualifyData = { isQualified: boolean; score: number; notes: string };
export type ConvertToClientData = { notes: string; createClient: boolean };
export type AssignAgentData = { agentId: string; agentName: string };
export type ScheduleFollowUpData = { followUpDate: string; notes: string };
export type EditData = { name: string; email: string; phone: string; company: string; position: string };

export type ActionData = ChangeStatusData | QualifyData | ConvertToClientData | AssignAgentData | ScheduleFollowUpData | EditData;

interface LeadActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ExtendedLead;
  actionType: ActionType | null;
  onSubmit: (actionType: ActionType, data: ActionData) => Promise<void>;
}

interface ActionConfig {
  title: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const actionConfigs: Record<ActionType, ActionConfig> = {
  changeStatus: {
    title: 'Cambiar Estado',
    icon: Target,
    description: 'Actualizar el estado actual del lead',
    color: 'text-blue-600'
  },
  qualify: {
    title: 'Calificar Lead',
    icon: CheckCircle,
    description: 'Establecer puntuación y calificación',
    color: 'text-green-600'
  },
  convertToClient: {
    title: 'Convertir a Cliente',
    icon: Users,
    description: 'Promocionar este lead a cliente',
    color: 'text-purple-600'
  },
  assignAgent: {
    title: 'Asignar Agente',
    icon: User,
    description: 'Designar responsable del lead',
    color: 'text-orange-600'
  },
  scheduleFollowUp: {
    title: 'Programar Seguimiento',
    icon: Clock,
    description: 'Establecer próxima fecha de contacto',
    color: 'text-indigo-600'
  },
  edit: {
    title: 'Editar Lead',
    icon: Edit3,
    description: 'Modificar información del prospecto',
    color: 'text-gray-600'
  }
};

export function LeadActionsModal({ 
  isOpen, 
  onClose, 
  lead, 
  actionType, 
  onSubmit 
}: LeadActionsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ActionData>>({});

  // Reset form data when modal opens with new action
  useEffect(() => {
    if (isOpen && actionType && lead) {
      const initialData = getInitialFormData(actionType, lead);
      setFormData(initialData);
    }
  }, [isOpen, actionType, lead]);

  const getInitialFormData = (action: ActionType, leadData: any) => {
    switch (action) {
      case 'changeStatus':
        return { status: leadData.status, notes: '' };
      case 'qualify':
        return { 
          isQualified: !leadData.isQualified, 
          score: leadData.isQualified ? 0 : 70,
          notes: ''
        };
      case 'convertToClient':
        return { notes: '', createClient: true };
      case 'assignAgent':
        return { 
          agentId: leadData.assignedAgentId || '',
          agentName: leadData.assignedAgentName || ''
        };
      case 'scheduleFollowUp':
        return { 
          followUpDate: '',
          notes: ''
        };
      case 'edit':
        return {
          name: leadData.name || '',
          email: leadData.email || '',
          phone: leadData.phone || '',
          company: leadData.company || '',
          position: leadData.position || ''
        };
      default:
        return {};
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionType) return;

    setIsLoading(true);
    try {
      await onSubmit(actionType, formData);
      onClose();
    } catch (error) {
      console.error('Error in action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ActionData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!actionType) return null;

  const config = actionConfigs[actionType];
  const IconComponent = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gray-100 ${config.color}`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {config.title}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                {config.description}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {renderFormFields(actionType, formData, handleInputChange, lead)}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? 'Procesando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function renderFormFields(
  actionType: ActionType, 
  formData: Partial<ActionData>, 
  onChange: (field: keyof ActionData, value: any) => void,
  lead: ExtendedLead
) {
  switch (actionType) {
    case 'changeStatus':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="status">Nuevo Estado</Label>
            <Select value={formData.status} onValueChange={(value) => onChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">🆕 Nuevo</SelectItem>
                <SelectItem value="interested">💚 Interesado</SelectItem>
                <SelectItem value="qualified">⭐ Calificado</SelectItem>
                <SelectItem value="follow_up">📞 Seguimiento</SelectItem>
                <SelectItem value="proposal_current">📋 Propuesta Actual</SelectItem>
                <SelectItem value="proposal_previous">📄 Propuesta Anterior</SelectItem>
                <SelectItem value="negotiation">🤝 Negociación</SelectItem>
                <SelectItem value="nurturing">⏸️ En Pausa</SelectItem>
                <SelectItem value="won">🎉 Ganado</SelectItem>
                <SelectItem value="lost">❌ Perdido</SelectItem>
                <SelectItem value="cold">🧊 Frío</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Motivo del cambio de estado..."
              rows={3}
            />
          </div>
        </div>
      );

    case 'qualify':
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">
              {formData.isQualified ? 'Calificar lead' : 'Descalificar lead'}
            </span>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              formData.isQualified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {formData.isQualified ? 'Calificado' : 'No calificado'}
            </div>
          </div>
          
          {formData.isQualified && (
            <div>
              <Label htmlFor="score">Puntuación (0-100)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => onChange('score', parseInt(e.target.value))}
                  className="w-20"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.score}
                  onChange={(e) => onChange('score', parseInt(e.target.value))}
                  className="flex-1"
                />
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Criterios de calificación, observaciones..."
              rows={3}
            />
          </div>
        </div>
      );

    case 'convertToClient':
      return (
        <div className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>{lead.name}</strong> será convertido a cliente. Esta acción no se puede deshacer.
            </p>
          </div>
          
          <div>
            <Label htmlFor="notes">Notas de conversión</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Detalles sobre la conversión, valor del contrato..."
              rows={3}
            />
          </div>
        </div>
      );

    case 'assignAgent':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="agentName">Nombre del Agente</Label>
            <Input
              id="agentName"
              value={formData.agentName}
              onChange={(e) => onChange('agentName', e.target.value)}
              placeholder="Nombre completo del responsable"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            El agente será responsable del seguimiento y gestión de este lead.
          </div>
        </div>
      );

    case 'scheduleFollowUp':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="followUpDate">Fecha y Hora</Label>
            <Input
              id="followUpDate"
              type="datetime-local"
              value={formData.followUpDate}
              onChange={(e) => onChange('followUpDate', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          
          <div>
            <Label htmlFor="notes">Objetivo del seguimiento</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => onChange('notes', e.target.value)}
              placeholder="Qué se planea lograr en este seguimiento..."
              rows={3}
            />
          </div>
        </div>
      );

    case 'edit':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onChange('name', e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => onChange('company', e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => onChange('position', e.target.value)}
              placeholder="Cargo o posición"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}