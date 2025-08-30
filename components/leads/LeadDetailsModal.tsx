'use client';

/**
 * LEAD DETAILS MODAL - DISEÑO MINIMALISTA
 * 
 * Modal rediseñado con enfoque minimalista y monocromático
 * Centraliza todas las acciones en un flujo simplificado
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { 
  Phone,
  Mail,
  Building2,
  Calendar,
  Star,
  CheckCircle,
  Edit,
  Trash2,
  MessageCircle,
  Clock,
  X
} from 'lucide-react';

import { LeadCallHistory } from './LeadCallHistory';
import LeadConversationsTab from './LeadConversationsTab';
import { WorkTab } from './WorkTab';
import { DetailsTab } from './DetailsTab';
import { ILeadCallLog, IFirebaseTimestamp, LeadStatus } from '@/modules/leads/types/leads';
import { useLeads, ExtendedLead } from '@/modules/leads/context/LeadsContext';

interface LeadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: ExtendedLead | null; // Tipo del lead
  onEdit?: (lead: ExtendedLead) => void;
  onDelete?: (leadId: string) => void;
  onCall?: (lead: ExtendedLead) => void;
  callLogs?: ILeadCallLog[];
  onViewTranscription?: (callLog: ILeadCallLog) => void;
}

export function LeadDetailsModal({ 
  isOpen, 
  onClose, 
  lead, 
  onEdit, 
  onDelete, 
  onCall,
  callLogs = [],
  onViewTranscription 
}: LeadDetailsModalProps) {
  
  const { updateLeadStatus, qualifyLead, convertToClient, assignToAgent, scheduleFollowUp, updateLead } = useLeads();
  const [followUpDate, setFollowUpDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'work' | 'conversations'>('work'); // Abre directamente en modo trabajo
  
  useEffect(() => {
    if (lead?.next_follow_up_date) {
      // Handle Firebase timestamp
      const timestamp = lead.next_follow_up_date;
      const date = typeof timestamp === 'object' && '_seconds' in timestamp 
        ? new Date(timestamp._seconds * 1000)
        : new Date(timestamp);
      setFollowUpDate(date.toISOString().slice(0, 16));
    }
  }, [lead]);
  
  if (!lead) return null;

  // Handlers para las acciones
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      setIsLoading(true);
      await updateLeadStatus(lead.id, newStatus as LeadStatus);
      console.log(`✅ Estado actualizado a: ${newStatus}`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error al actualizar el estado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!lead) return;
    
    try {
      setIsLoading(true);
      const agentNames: Record<string, string> = {
        'agent-1': 'Juan Pérez',
        'agent-2': 'María García', 
        'agent-3': 'Carlos López'
      };
      
      if (agentId && agentId !== 'none') {
        await assignToAgent(lead.id, agentId, agentNames[agentId]);
        console.log(`✅ Agente asignado: ${agentNames[agentId]}`);
      } else {
        await updateLead(lead.id, { assigned_agent_id: undefined, assigned_agent_name: undefined });
        console.log('✅ Agente desasignado');
      }
    } catch (error) {
      console.error('Error asignando agente:', error);
      alert('Error al asignar agente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQualificationChange = async (score: number) => {
    if (!lead) return;
    
    try {
      await updateLead(lead.id, { qualification_score: score });
    } catch (error) {
      console.error('Error actualizando score:', error);
    }
  };

  const handleQualifyLead = async (isQualified: boolean) => {
    if (!lead) return;
    
    try {
      setIsLoading(true);
      const score = isQualified ? Math.max(70, lead.qualification_score || 70) : 0;
      await qualifyLead(lead.id, isQualified, score);
      console.log(`✅ Lead ${isQualified ? 'calificado' : 'descalificado'}`);
    } catch (error) {
      console.error('Error calificando lead:', error);
      alert('Error al calificar el lead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!lead || !confirm('¿Estás seguro de convertir este lead a cliente?')) return;
    
    try {
      setIsLoading(true);
      await convertToClient(lead.id, {
        value: lead.conversion_value || 0,
        createClient: true,
        notes: `Lead convertido desde el modal de detalles`
      });
      console.log('✅ Lead convertido a cliente');
      alert('¡Lead convertido exitosamente a cliente!');
    } catch (error) {
      console.error('Error convirtiendo lead:', error);
      alert('Error al convertir el lead');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!lead || !followUpDate) {
      alert('Por favor selecciona una fecha de seguimiento');
      return;
    }
    
    try {
      setIsLoading(true);
      const followUp = new Date(followUpDate);
      await scheduleFollowUp(lead.id, followUp, 'Seguimiento programado desde modal de detalles');
      console.log('✅ Seguimiento programado');
      alert('Seguimiento programado exitosamente');
    } catch (error) {
      console.error('Error programando seguimiento:', error);
      alert('Error al programar seguimiento');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose} >  
      <DialogContent className="max-w-screen max-h-screen w-screen h-screen overflow-hidden p-0 m-0 rounded-none border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{lead.name || 'Lead sin nombre'} - Detalles</DialogTitle>
        </DialogHeader>
        {/* Header Principal - Información del Lead */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-light text-black mb-2">
                {lead.name || 'Lead sin nombre'}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium bg-gray-100 px-3 py-1">{lead.status}</span>
                <span className="font-medium bg-gray-100 px-3 py-1">{lead.priority || 'medium'}</span>
                {lead.is_qualified && (
                  <span className="font-medium bg-green-100 text-green-800 px-3 py-1">Calificado</span>
                )}
                {lead.converted_to_client && (
                  <span className="font-medium bg-blue-100 text-blue-800 px-3 py-1">Cliente</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                onClick={onClose}
                className="h-10 px-4 border-gray-300 hover:bg-gray-50"
              >
                <X className="h-5 w-5" />
                <span className="ml-2">Cerrar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Header de Navegación - Pestañas */}
        <div className="px-6 bg-white border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={
                activeTab === 'details'
                  ? 'py-4 px-2 border-b-2 border-black text-black font-medium text-sm transition-colors duration-200'
                  : 'py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors duration-200'
              }
            >
              Detalles
            </button>
            <button
              onClick={() => setActiveTab('work')}
              className={
                activeTab === 'work'
                  ? 'py-4 px-2 border-b-2 border-black text-black font-medium text-sm transition-colors duration-200'
                  : 'py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors duration-200'
              }
            >
              Trabajar
            </button>
            <button
              onClick={() => setActiveTab('conversations')}
              className={
                activeTab === 'conversations'
                  ? 'py-4 px-2 border-b-2 border-black text-black font-medium text-sm transition-colors duration-200'
                  : 'py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm transition-colors duration-200'
              }
            >
              Conversaciones
            </button>
          </div>
        </div>

        {/* Contenido Principal - Pantalla Completa */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          {activeTab === 'details' ? (
            <DetailsTab 
              lead={lead}
              callLogs={callLogs}
              onViewTranscription={onViewTranscription}
            />
          ) : activeTab === 'work' ? (
            <WorkTab 
              lead={lead}
              isLoading={isLoading}
              followUpDate={followUpDate}
              setFollowUpDate={setFollowUpDate}
              onStatusChange={handleStatusChange}
              onAssignAgent={handleAssignAgent}
              onQualificationChange={handleQualificationChange}
              onQualifyLead={handleQualifyLead}
              onConvertToClient={handleConvertToClient}
              onScheduleFollowUp={handleScheduleFollowUp}
              onCall={onCall}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ) : (
            /* Panel de Conversaciones */
            <div className="h-full overflow-hidden">
              <div className="h-full px-6 py-4">
                <LeadConversationsTab leadId={lead.id} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}