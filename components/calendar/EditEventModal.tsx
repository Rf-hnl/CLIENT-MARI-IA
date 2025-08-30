/**
 * EDIT EVENT MODAL
 * 
 * Modal para editar eventos de calendario existentes
 */

"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Phone, Video, MapPin, User, AlertCircle } from 'lucide-react';
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
  DialogDescription,
} from '@/components/ui/dialog';
import { CalendarEvent, FollowUpType, CalendarEventPriority, MeetingPlatform } from '@/types/calendar';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateEvent: (eventId: string, eventData: Partial<CalendarEvent>) => Promise<void>;
  event: CalendarEvent | null;
}

const FOLLOW_UP_TYPES: { value: FollowUpType; label: string; duration: number }[] = [
  { value: 'demo', label: 'Demo del Producto', duration: 45 },
  { value: 'proposal', label: 'Presentación de Propuesta', duration: 60 },
  { value: 'closing', label: 'Reunión de Cierre', duration: 30 },
  { value: 'follow_up', label: 'Seguimiento General', duration: 30 },
  { value: 'nurturing', label: 'Llamada de Nurturing', duration: 20 },
  { value: 'technical_call', label: 'Consulta Técnica', duration: 45 },
  { value: 'discovery', label: 'Llamada de Descubrimiento', duration: 30 },
  { value: 'onboarding', label: 'Onboarding del Cliente', duration: 60 }
];

const MEETING_PLATFORMS: { value: MeetingPlatform; label: string; icon: React.ReactNode }[] = [
  { value: 'zoom', label: 'Zoom', icon: <Video className="w-4 h-4" /> },
  { value: 'teams', label: 'Microsoft Teams', icon: <Video className="w-4 h-4" /> },
  { value: 'meet', label: 'Google Meet', icon: <Video className="w-4 h-4" /> },
  { value: 'phone', label: 'Llamada Telefónica', icon: <Phone className="w-4 h-4" /> },
  { value: 'in_person', label: 'Presencial', icon: <MapPin className="w-4 h-4" /> },
  { value: 'internal', label: 'Sistema Interno', icon: <Users className="w-4 h-4" /> }
];

const PRIORITIES: { value: CalendarEventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Media', color: 'bg-orange-100 text-orange-700' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-100 text-red-700' }
];

export default function EditEventModal({
  isOpen,
  onClose,
  onUpdateEvent,
  event
}: EditEventModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del evento cuando se abre el modal
  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay,
        followUpType: event.followUpType,
        priority: event.priority,
        meetingPlatform: event.meetingPlatform,
        meetingLink: event.meetingLink,
        location: event.location,
        reminderMinutes: event.reminderMinutes
      });
      setErrors({});
    }
  }, [isOpen, event]);

  // Actualizar duración cuando cambia el tipo de seguimiento
  useEffect(() => {
    if (formData.followUpType && formData.startTime) {
      const followUpType = FOLLOW_UP_TYPES.find(t => t.value === formData.followUpType);
      if (followUpType) {
        const endTime = new Date(formData.startTime);
        endTime.setMinutes(endTime.getMinutes() + followUpType.duration);
        
        setFormData(prev => ({
          ...prev,
          endTime,
          reminderMinutes: followUpType.duration >= 60 ? 60 : 30
        }));
      }
    }
  }, [formData.followUpType, formData.startTime]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La fecha de inicio es obligatoria';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'La fecha de fin es obligatoria';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event || !validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      await onUpdateEvent(event.id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      setErrors({ submit: 'Error al actualizar el evento. Intenta nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTimeLocal = (date: Date) => {
    return new Date(date).toISOString().slice(0, 16);
  };

  const handleDateTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const date = new Date(value);
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Editar Evento de Calendario
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del evento: {event.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título del Evento */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título del Evento <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Título del evento"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalles adicionales sobre la reunión..."
              rows={3}
            />
          </div>

          {/* Tipo de Seguimiento */}
          <div className="space-y-2">
            <Label>Tipo de Reunión</Label>
            <Select
              value={formData.followUpType}
              onValueChange={(value: FollowUpType) => 
                setFormData(prev => ({ ...prev, followUpType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FOLLOW_UP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{type.label}</span>
                      <span className="text-sm text-gray-500 ml-2">{type.duration}min</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Plataforma de Reunión */}
          <div className="space-y-2">
            <Label>Plataforma</Label>
            <Select
              value={formData.meetingPlatform}
              onValueChange={(value: MeetingPlatform) => 
                setFormData(prev => ({ ...prev, meetingPlatform: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEETING_PLATFORMS.map((platform) => (
                  <SelectItem key={platform.value} value={platform.value}>
                    <div className="flex items-center gap-2">
                      {platform.icon}
                      {platform.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prioridad */}
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: CalendarEventPriority) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                        {priority.label}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Fecha y Hora de Inicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime ? formatDateTimeLocal(formData.startTime) : ''}
                onChange={(e) => handleDateTimeChange('startTime', e.target.value)}
                className={errors.startTime ? 'border-red-500' : ''}
              />
              {errors.startTime && (
                <p className="text-sm text-red-500">{errors.startTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                Fecha y Hora de Fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={formData.endTime ? formatDateTimeLocal(formData.endTime) : ''}
                onChange={(e) => handleDateTimeChange('endTime', e.target.value)}
                className={errors.endTime ? 'border-red-500' : ''}
              />
              {errors.endTime && (
                <p className="text-sm text-red-500">{errors.endTime}</p>
              )}
            </div>
          </div>

          {/* Link de la Reunión */}
          <div className="space-y-2">
            <Label htmlFor="meetingLink">
              Link de la Reunión <span className="text-gray-500">(Opcional)</span>
            </Label>
            <Input
              id="meetingLink"
              type="url"
              value={formData.meetingLink || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
              placeholder="https://zoom.us/j/123456789 o https://meet.google.com/abc-def-ghi"
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Dirección física o lugar de reunión"
            />
          </div>

          {/* Recordatorio */}
          <div className="space-y-2">
            <Label htmlFor="reminder">Recordatorio (minutos antes)</Label>
            <Select
              value={formData.reminderMinutes?.toString() || '30'}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, reminderMinutes: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="1440">1 día</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error de envío */}
          {errors.submit && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
              {isLoading ? 'Actualizando...' : 'Actualizar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}