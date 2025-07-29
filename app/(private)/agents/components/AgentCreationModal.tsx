'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Bot, 
  Plus, 
  Link, 
  ArrowRight,
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { AgentInfoFormEditable } from './AgentInfoFormEditable';

interface AgentCreationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

type CreationMode = 'selection' | 'from-existing';

export function AgentCreationModal({ open, onClose, onSave }: AgentCreationModalProps) {
  const [mode, setMode] = useState<CreationMode>('selection');
  const [existingAgentId, setExistingAgentId] = useState('');

  const handleClose = () => {
    setMode('selection');
    setExistingAgentId('');
    onClose();
  };

  const handleSave = () => {
    setMode('selection');
    setExistingAgentId('');
    onSave();
  };

  // Mostrar formulario de información del agente si no estamos en modo selección
  if (mode === 'from-existing' && existingAgentId) {
    return (
      <AgentInfoFormEditable
        open={open}
        agentId={existingAgentId}
        onClose={handleClose}
        onSave={handleSave}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Crear Nuevo Agente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Conectar Agente Existente
            </h3>
            <p className="text-sm text-gray-600">
              Conecta un agente que ya creaste en ElevenLabs para usarlo en llamadas de cobranza
            </p>
          </div>

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentId" className="text-sm font-medium text-gray-700">
                    Agent ID de ElevenLabs
                  </Label>
                  <Input
                    id="agentId"
                    placeholder="agent_2901k10yc0g3fqwvjbaafzyc6q20"
                    value={existingAgentId}
                    onChange={(e) => setExistingAgentId(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Ingresa el ID completo de tu agente desde ElevenLabs
                  </p>
                </div>
                
                <Button 
                  className="w-full" 
                  disabled={!existingAgentId.trim()}
                  onClick={() => setMode('from-existing')}
                >
                  Conectar Agente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExternalLink className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  ¿Cómo encontrar el Agent ID?
                </p>
                <p className="text-xs text-gray-600">
                  Ve a tu dashboard de ElevenLabs → Conversational AI → Agents. 
                  El ID aparece en la URL o en los detalles del agente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}