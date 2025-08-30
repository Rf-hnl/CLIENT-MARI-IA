'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Copy, ExternalLink } from 'lucide-react';
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { toast } from 'sonner';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ExtendedLead;
}

export function WhatsAppModal({ isOpen, onClose, lead }: WhatsAppModalProps) {
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);

  const defaultTemplates = [
    {
      name: 'Saludo inicial',
      message: `Hola ${lead.name || 'estimado/a'}, soy [Tu nombre] de [Empresa]. Me pongo en contacto contigo para...`
    },
    {
      name: 'Seguimiento',
      message: `Hola ${lead.name || 'estimado/a'}, espero que estés bien. Te escribo para dar seguimiento a...`
    },
    {
      name: 'Propuesta',
      message: `Hola ${lead.name || 'estimado/a'}, tengo una propuesta que podría interesarte...`
    }
  ];

  const handleSendWhatsApp = () => {
    if (!lead.phone) {
      toast.error('No hay número de teléfono disponible');
      return;
    }

    const cleanPhone = lead.phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
    
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  const handleUseTemplate = (template: string) => {
    setMessage(template);
    setUseTemplate(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            WhatsApp
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
            <div className="text-sm text-gray-600">{lead.phone}</div>
          </div>

          {/* Templates toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plantillas de mensaje</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseTemplate(!useTemplate)}
            >
              {useTemplate ? 'Ocultar' : 'Mostrar'} plantillas
            </Button>
          </div>

          {/* Templates */}
          {useTemplate && (
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
              {defaultTemplates.map((template, index) => (
                <div key={index} className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50" 
                     onClick={() => handleUseTemplate(template.message)}>
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-gray-600 truncate">{template.message.substring(0, 60)}...</div>
                </div>
              ))}
            </div>
          )}

          {/* Message input */}
          <div>
            <label className="text-sm font-medium mb-1 block">Mensaje (opcional)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje aquí o déjalo vacío para abrir WhatsApp sin mensaje..."
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}/1000 caracteres
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            {message && (
              <Button variant="outline" onClick={handleCopyMessage}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            )}
            <Button onClick={handleSendWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}