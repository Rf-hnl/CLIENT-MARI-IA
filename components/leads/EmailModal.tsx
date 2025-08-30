'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Copy, ExternalLink } from 'lucide-react';
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { toast } from 'sonner';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ExtendedLead;
}

export function EmailModal({ isOpen, onClose, lead }: EmailModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);

  const emailTemplates = [
    {
      name: 'Presentación inicial',
      subject: `Saludos de [Tu Empresa] - ${lead.name}`,
      message: `Estimado/a ${lead.name || 'cliente'},

Espero que este mensaje le encuentre bien. Mi nombre es [Tu Nombre] y me pongo en contacto desde [Tu Empresa].

[Motivo del contacto y propuesta de valor]

Quedo a su disposición para cualquier consulta.

Saludos cordiales,
[Tu Nombre]
[Tu Empresa]
[Datos de contacto]`
    },
    {
      name: 'Seguimiento',
      subject: `Seguimiento - ${lead.name}`,
      message: `Estimado/a ${lead.name || 'cliente'},

Espero que esté bien. Le escribo para dar seguimiento a nuestra conversación anterior.

[Resumen de la conversación anterior y próximos pasos]

Quedo atento/a a su respuesta.

Saludos cordiales,
[Tu Nombre]`
    },
    {
      name: 'Propuesta comercial',
      subject: `Propuesta exclusiva para ${lead.name}`,
      message: `Estimado/a ${lead.name || 'cliente'},

Tengo el gusto de presentarle una propuesta que podría ser de su interés.

[Detalles de la propuesta]

Me gustaría programar una reunión para explicarle los detalles.

Saludos cordiales,
[Tu Nombre]`
    }
  ];

  const handleSendEmail = () => {
    if (!lead.email) {
      toast.error('No hay dirección de email disponible');
      return;
    }

    const encodedSubject = encodeURIComponent(subject);
    const encodedMessage = encodeURIComponent(message);
    const mailtoUrl = `mailto:${lead.email}?subject=${encodedSubject}&body=${encodedMessage}`;
    
    window.open(mailtoUrl);
    onClose();
  };

  const handleCopyEmail = () => {
    const emailContent = `Para: ${lead.email}\nAsunto: ${subject}\n\n${message}`;
    navigator.clipboard.writeText(emailContent);
    toast.success('Email copiado al portapapeles');
  };

  const handleUseTemplate = (template: typeof emailTemplates[0]) => {
    setSubject(template.subject);
    setMessage(template.message);
    setUseTemplate(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Email
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
            <div className="text-sm text-gray-600">{lead.email}</div>
          </div>

          {/* Templates toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plantillas de email</span>
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
            <div className="space-y-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
              {emailTemplates.map((template, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors" 
                  onClick={() => handleUseTemplate(template)}
                >
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{template.subject}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {template.message.substring(0, 80)}...
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Email form */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Asunto</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Mensaje</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={8}
                className="resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {message.length} caracteres
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            {(subject || message) && (
              <Button variant="outline" onClick={handleCopyEmail}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            )}
            <Button 
              onClick={handleSendEmail} 
              disabled={!subject && !message}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Cliente de Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}