'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { IntelligentAction } from '@/lib/ai/intelligentActions';
import { Lead } from '@/types/lead'; // Asumiendo que tienes un tipo Lead
import { authFetch } from '@/lib/auth-interceptor';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  action: IntelligentAction | null;
}

export function ScheduleMeetingModal({ isOpen, onClose, lead, action }: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && lead && action) {
      // Pre-llenar el formulario
      setTitle(action.title || `Reunión con ${lead.name}`);
      setDescription(action.description || `Discutir próximos pasos con ${lead.name}.\nRazón de la IA: ${action.reasoning}`);
      
      // Lógica para sugerir fecha y hora
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0); // Sugerir para dentro de 1 hora
      const suggestedStartTime = now.toISOString().slice(0, 16);
      now.setHours(now.getHours() + 1); // Duración de 1 hora
      const suggestedEndTime = now.toISOString().slice(0, 16);

      setStartTime(suggestedStartTime);
      setEndTime(suggestedEndTime);
    }
  }, [isOpen, lead, action]);

  const handleSubmit = async () => {
    if (!lead) return;

    setLoading(true);
    try {
      const response = await authFetch(`/api/leads/${lead.id}/schedule-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          automated: true, // Marcado como automatizado por sugerencia de IA
          sentimentTrigger: (lead.conversationAnalysis && lead.conversationAnalysis.length > 0) ? lead.conversationAnalysis[0].sentimentScore : null,
          followUpType: action?.type === 'schedule_technical_call' ? 'technical_call' : 'meeting'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agendar la reunión');
      }

      toast.success('¡Reunión agendada con éxito!', {
        description: `Se ha creado un evento en el calendario para ${lead.name}`,
      });
      onClose();

    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      toast.error('Error al agendar la reunión', {
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Reunión para {lead?.name}</DialogTitle>
          <DialogDescription>
            Confirma los detalles para crear el evento en el calendario.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Título</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Descripción</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start-time" className="text-right">Inicio</Label>
            <Input id="start-time" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end-time" className="text-right">Fin</Label>
            <Input id="end-time" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            Confirmar y Agendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
