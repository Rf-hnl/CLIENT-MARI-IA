'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Loader2, CheckCircle } from 'lucide-react';
import { useClients } from '@/modules/clients/hooks/useClients';
import { useLeadCalls } from '@/modules/leads/hooks/useLeadCalls';
import { ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { toast } from 'sonner';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ExtendedLead;
}

export function CallModal({ isOpen, onClose, lead }: CallModalProps) {
  // Solo renderizar los hooks cuando el modal está abierto
  if (!isOpen) {
    return null;
  }

  return <CallModalContent isOpen={isOpen} onClose={onClose} lead={lead} />;
}

function CallModalContent({ isOpen, onClose, lead }: CallModalProps) {
  const { currentTenant, currentOrganization } = useClients();
  const { initiateCall } = useLeadCalls();
  
  const [selectedCallType, setSelectedCallType] = useState<string>('');
  const [isInitiating, setIsInitiating] = useState(false);
  const [callSuccess, setCallSuccess] = useState(false);

  // Función para determinar el tipo de llamada basado en el status del lead
  const getRecommendedCallType = (leadStatus: string) => {
    const statusToCallType: Record<string, string> = {
      'new': 'prospecting',           // Lead nuevo → Prospección
      'contacted': 'qualification',   // Ya contactado → Calificación  
      'interested': 'follow_up',      // Interesado → Seguimiento
      'qualified': 'follow_up',       // Calificado → Seguimiento
      'proposal_sent': 'closing',     // Propuesta enviada → Cierre
      'negotiating': 'closing',       // Negociando → Cierre
      'follow_up': 'follow_up',       // Seguimiento → Seguimiento
      'not_interested': 'recovery',   // No interesado → Recuperación
      'converted': 'follow_up',       // Convertido → Seguimiento post-venta
      'cold': 'recovery'              // Lead frío → Recuperación
    };
    
    return statusToCallType[leadStatus] || 'prospecting';
  };

  // Auto-seleccionar tipo de llamada basado en el status del lead
  React.useEffect(() => {
    if (lead?.status && !selectedCallType) {
      const recommendedType = getRecommendedCallType(lead.status);
      setSelectedCallType(recommendedType);
    }
  }, [lead?.status, selectedCallType]);

  const callTypes = [
    { 
      value: 'prospecting', 
      label: 'Llamada de Prospección',
      description: 'Primer contacto para presentar servicios y generar interés'
    },
    { 
      value: 'qualification', 
      label: 'Llamada de Calificación',
      description: 'Evaluar el interés del lead y entender sus necesidades específicas'
    },
    { 
      value: 'follow_up', 
      label: 'Llamada de Seguimiento',
      description: 'Dar continuidad a conversaciones anteriores y mantener el interés'
    },
    { 
      value: 'closing', 
      label: 'Llamada de Cierre',
      description: 'Finalizar la propuesta comercial y cerrar la venta'
    },
    { 
      value: 'recovery', 
      label: 'Llamada de Recuperación',
      description: 'Reconectar con clientes que mostraron interés pero quedaron indecisos'
    }
  ];

  const handleInitiateCall = async () => {
    if (!selectedCallType) {
      toast.error('Por favor selecciona el tipo de llamada');
      return;
    }

    if (!currentTenant?.id || !currentOrganization?.id) {
      toast.error('Error de configuración del tenant');
      return;
    }

    setIsInitiating(true);
    
    try {
      const result = await initiateCall(
        lead.id,
        '', // agentId not needed - using ENV configuration
        selectedCallType as any,
        `Llamada iniciada desde modal - Lead: ${lead.name}`
      );
      
      const selectedCallTypeData = callTypes.find(t => t.value === selectedCallType);
      
      toast.success(
        `🎉 ¡Llamada iniciada exitosamente!\n\n` +
        `📋 Tipo: ${selectedCallTypeData?.label}\n` +
        `🔄 Estado: Procesando llamada...\n` +
        `📱 Teléfono: ${lead.phone}\n\n` +
        `ID de seguimiento: ${result.callLogId.slice(-8)}`,
        {
          duration: 6000,
          style: {
            maxWidth: '400px',
            fontSize: '14px',
            lineHeight: '1.4'
          }
        }
      );
      
      // Mostrar estado de éxito por 2 segundos antes de cerrar
      setCallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error iniciando llamada:', error);
      toast.error(error instanceof Error ? error.message : 'Error al iniciar llamada');
    } finally {
      setIsInitiating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Llamar a {lead.name}
          </DialogTitle>
        </DialogHeader>
        
        {callSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                ¡Llamada Iniciada Exitosamente!
              </h3>
              <p className="text-sm text-gray-600">
                El agente está procesando la llamada a {lead.phone}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Este modal se cerrará automáticamente...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-900">{lead.name}</div>
            <div className="text-sm text-gray-600">{lead.phone}</div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <div className="text-sm text-blue-800">
              <span className="font-medium">ℹ️ Agente único configurado</span>
              <br />
              Se utilizará el agente configurado en el sistema para realizar la llamada.
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Tipo de Llamada
                <span className="text-xs text-gray-500 font-normal ml-2">
                  (Sugerido para status: {lead.status})
                </span>
              </label>
              <Select 
                value={selectedCallType} 
                onValueChange={setSelectedCallType}
                disabled={isInitiating}
              >
                <SelectTrigger className="h-auto min-h-[2.5rem]">
                  <SelectValue placeholder="Selecciona el tipo de llamada...">
                    {selectedCallType && callTypes.find(t => t.value === selectedCallType) && (
                      <div className="flex flex-col items-start gap-1 py-1">
                        <span className="font-medium text-sm">
                          {callTypes.find(t => t.value === selectedCallType)?.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {callTypes.find(t => t.value === selectedCallType)?.description}
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {callTypes.map((type) => {
                    const isRecommended = getRecommendedCallType(lead.status) === type.value;
                    return (
                      <SelectItem key={type.value} value={type.value} className="py-3">
                        <div className="flex flex-col items-start gap-1 w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{type.label}</span>
                            {isRecommended && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{type.description}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isInitiating} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleInitiateCall} 
              disabled={!selectedCallType || isInitiating}
              className="flex-1"
            >
              {isInitiating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Iniciar Llamada
                </>
              )}
            </Button>
          </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}