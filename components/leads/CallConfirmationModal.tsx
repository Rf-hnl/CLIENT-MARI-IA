'use client';

/**
 * MODAL DE CONFIRMACIÓN DE LLAMADA A LEAD
 * 
 * Modal que aparece al presionar "Llamar" en un lead
 * Permite seleccionar agente, confirmar datos y iniciar llamada
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Phone, 
  User, 
  Building, 
  Mail, 
  Clock,
  AlertCircle,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { ILead } from '@/modules/leads/types/leads';
// NOTE: UnifiedAgents removed - now using ENV configuration

interface CallConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  lead: ILead | null;
  onConfirmCall: (leadId: string, agentId: string, notes?: string) => Promise<void>;
}

export function CallConfirmationModal({
  open,
  onClose,
  lead,
  onConfirmCall
}: CallConfirmationModalProps) {
  const [callNotes, setCallNotes] = useState<string>('');
  const [isInitiatingCall, setIsInitiatingCall] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when modal opens
      setCallNotes('');
      setIsInitiatingCall(false);
    }
  }, [open]);

  if (!lead) return null;

  const handleConfirmCall = async () => {
    // Validar que el lead tenga campaña antes de iniciar la llamada
    if (!lead.campaignId) {
      alert('❌ Este lead no tiene campaña asignada. Debe asignar una campaña antes de realizar la llamada.');
      return;
    }

    setIsInitiatingCall(true);
    try {
      await onConfirmCall(lead.id, '', callNotes); // Empty agentId - using ENV config
      onClose();
    } catch (error) {
      console.error('Error initiating call:', error);
    } finally {
      setIsInitiatingCall(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const statusColors = {
      'new': 'bg-blue-100 text-blue-800',
      'interested': 'bg-green-100 text-green-800',
      'qualified': 'bg-purple-100 text-purple-800',
      'follow_up': 'bg-orange-100 text-orange-800',
      'cold': 'bg-gray-100 text-gray-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'urgent': 'text-red-600',
      'high': 'text-orange-600',
      'medium': 'text-yellow-600',
      'low': 'text-gray-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Confirmar Llamada a Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Lead */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {lead.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{lead.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {lead.company && `${lead.company} • `}
                      {lead.position || 'Lead'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={getStatusBadgeColor(lead.status)}>
                  {lead.status.replace('_', ' ')}
                </Badge>
                <span className={`text-sm font-medium ${getPriorityColor(lead.priority)}`}>
                  Prioridad: {lead.priority}
                </span>
              </div>
            </div>

            {/* Indicador de campaña */}
            <div className="flex items-center gap-2 p-3 rounded-lg border">
              {lead.campaignId ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Campaña asignada</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Lista para llamada
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Sin campaña asignada</span>
                  <Badge variant="destructive">
                    Falta Campaña
                  </Badge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{lead.phone}</span>
              </div>
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Fuente: {lead.source}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Intentos: {lead.contact_attempts || 0}</span>
              </div>
            </div>
          </div>

          {/* Configuración de Agente */}
          <div className="space-y-3">
            <Label>Agente de Voz</Label>
            <div className="flex items-center gap-2 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-blue-800">
                Se utilizará el agente configurado en el sistema para realizar la llamada.
              </span>
            </div>
          </div>

          {/* Notas de la llamada (opcional) */}
          <div className="space-y-3">
            <Label>Notas de la llamada (opcional)</Label>
            <Textarea
              placeholder="Agrega notas sobre el propósito de esta llamada, información relevante, etc."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Información adicional del lead */}
          {(lead.notes || lead.last_contact_date) && (
            <div className="space-y-2">
              <Label>Información adicional</Label>
              <div className="text-sm space-y-1 bg-blue-50 p-3 rounded-lg">
                {lead.last_contact_date && (
                  <p>
                    <span className="font-medium">Último contacto:</span>{' '}
                    {new Date(lead.last_contact_date._seconds * 1000).toLocaleDateString()}
                  </p>
                )}
                {lead.notes && (
                  <p>
                    <span className="font-medium">Notas:</span> {lead.notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isInitiatingCall}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmCall}
              disabled={isInitiatingCall || !lead.campaignId}
              className="flex items-center gap-2"
            >
              {isInitiatingCall ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando llamada...
                </>
              ) : !lead.campaignId ? (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Requiere Campaña
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Iniciar Llamada
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}