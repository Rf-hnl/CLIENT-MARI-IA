'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Phone, Zap, Settings, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BulkCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Set<string>;
  leads: any[];
  onConfirm: (config: BulkCallConfig) => void;
}

export interface BulkCallConfig {
  mode: 'automatic' | 'manual';
  callType?: string;
  notes?: string;
}

export function BulkCallModal({ isOpen, onClose, selectedLeads, leads, onConfirm }: BulkCallModalProps) {
  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');
  const [selectedCallType, setSelectedCallType] = useState<string>('prospecting');
  const [notes, setNotes] = useState('');

  const callTypes = [
    { 
      value: 'prospecting', 
      label: 'Prospección',
      description: 'Primer contacto para generar interés'
    },
    { 
      value: 'qualification', 
      label: 'Calificación',
      description: 'Evaluar interés y necesidades'
    },
    { 
      value: 'follow_up', 
      label: 'Seguimiento',
      description: 'Continuidad a conversaciones anteriores'
    },
    { 
      value: 'closing', 
      label: 'Cierre',
      description: 'Finalizar propuesta comercial'
    },
    { 
      value: 'recovery', 
      label: 'Recuperación',
      description: 'Reconectar con clientes indecisos'
    }
  ];

  // Función para determinar tipos automáticos
  const getAutomaticCallTypes = () => {
    const selectedLeadsData = leads.filter(lead => selectedLeads.has(lead.id));
    const typeDistribution: Record<string, number> = {};

    selectedLeadsData.forEach(lead => {
      const recommendedType = getRecommendedCallType(lead.status);
      typeDistribution[recommendedType] = (typeDistribution[recommendedType] || 0) + 1;
    });

    return typeDistribution;
  };

  const getRecommendedCallType = (leadStatus: string) => {
    const statusToCallType: Record<string, string> = {
      'new': 'prospecting',
      'contacted': 'qualification',
      'interested': 'follow_up',
      'qualified': 'follow_up',
      'proposal_sent': 'closing',
      'negotiating': 'closing',
      'follow_up': 'follow_up',
      'not_interested': 'recovery',
      'converted': 'follow_up',
      'cold': 'recovery'
    };
    
    return statusToCallType[leadStatus] || 'prospecting';
  };

  const handleConfirm = () => {
    const config: BulkCallConfig = {
      mode,
      callType: mode === 'manual' ? selectedCallType : undefined,
      notes: notes.trim() || undefined
    };

    onConfirm(config);
    onClose();
  };

  const automaticTypes = getAutomaticCallTypes();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-0 shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-light text-gray-800">
            <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Phone className="h-4 w-4 text-orange-600" />
            </div>
            Configurar Llamadas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de leads seleccionados */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {selectedLeads.size}
              </div>
              <h3 className="font-medium text-gray-900">Leads Seleccionados</h3>
            </div>
            {mode === 'automatic' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Distribución automática:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(automaticTypes).map(([type, count]) => {
                    const typeLabel = callTypes.find(ct => ct.value === type)?.label || type;
                    return (
                      <Badge key={type} variant="secondary" className="text-xs bg-white border-gray-200">
                        {typeLabel}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selector de modo */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Modo Automático */}
              <div 
                className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                  mode === 'automatic' 
                    ? 'bg-orange-50 border-orange-200 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                }`}
                onClick={() => setMode('automatic')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${mode === 'automatic' ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${mode === 'automatic' ? 'text-orange-900' : 'text-gray-700'}`}>
                      Automático
                    </span>
                  </div>
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    mode === 'automatic' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                  }`} />
                </div>
                <p className="text-xs text-gray-600">
                  Tipo según estado del lead
                </p>
                {mode === 'automatic' && (
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Recomendado
                  </div>
                )}
              </div>

              {/* Modo Manual */}
              <div 
                className={`relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                  mode === 'manual' 
                    ? 'bg-gray-50 border-gray-300 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-orange-200 hover:shadow-sm'
                }`}
                onClick={() => setMode('manual')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Settings className={`h-4 w-4 ${mode === 'manual' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${mode === 'manual' ? 'text-gray-900' : 'text-gray-700'}`}>
                      Manual
                    </span>
                  </div>
                  <div className={`h-3 w-3 rounded-full border-2 ${
                    mode === 'manual' ? 'border-gray-500 bg-gray-500' : 'border-gray-300'
                  }`} />
                </div>
                <p className="text-xs text-gray-600">
                  Mismo tipo para todos
                </p>
              </div>
            </div>
          </div>

          {/* Selector de tipo de llamada (solo modo manual) */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Tipo de Llamada</Label>
              <Select value={selectedCallType} onValueChange={setSelectedCallType}>
                <SelectTrigger className="border-gray-200 focus:border-orange-300 focus:ring-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {callTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="py-1">
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notas adicionales */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Notas (Opcional)</Label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexto adicional..."
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-orange-300 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
          </div>

          {/* Información adicional */}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <div className="space-y-1">
                  <div>• Procesamiento en lotes de 5</div>
                  <div>• Requiere teléfono y campaña</div>
                  <div>• Duración: varios minutos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Phone className="h-4 w-4 mr-2" />
            Iniciar ({selectedLeads.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}