'use client';

import React, { useState, useEffect } from 'react';
import { LeadLayout } from '@/components/leads/LeadLayout';
import { WorkTab } from '@/components/leads/WorkTab';
import { useLeads, ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { LeadStatus } from '@/modules/leads/types/leads';

import { use } from 'react';

interface WorkPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WorkPage({ params }: WorkPageProps) {
  const { id } = use(params);
  const { leads, updateLeadStatus, qualifyLead, convertToClient, assignToAgent, scheduleFollowUp, updateLead } = useLeads();
  const [lead, setLead] = useState<ExtendedLead | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localQualificationScore, setLocalQualificationScore] = useState<number>(0);
  const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    let leadData: ExtendedLead | undefined;
    try {
      leadData = leads.find(l => l.id === id);
      setLead(leadData || null);
      setLocalQualificationScore(leadData?.qualification_score || 0);
      if (leadData?.next_follow_up_date) {
        const timestamp = leadData.next_follow_up_date;
        const date = typeof timestamp === 'object' && '_seconds' in timestamp 
          ? new Date(timestamp._seconds * 1000)
          : new Date(timestamp);
        setFollowUpDate(date.toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error('Error finding lead:', error);
    }
    // Fetch campaigns disponibles solo si leadData existe
    if (leadData?.tenantId && leadData?.organizationId) {
      const fetchCampaigns = async () => {
        try {
          const response = await fetch('/api/campaigns/internal?tenantId=' + leadData!.tenantId + '&organizationId=' + leadData!.organizationId);
          const data = await response.json();
          if (data.success) {
            setCampaigns(data.data.campaigns.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
          }
        } catch (error) {
          console.error('Error fetching campaigns:', error);
        }
      };
      fetchCampaigns();
    }
  }, [id, leads]);

  // Cleanup timeout cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (saveTimeoutId) {
        clearTimeout(saveTimeoutId);
      }
    };
  }, [saveTimeoutId]);

  // Handlers para las acciones
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;
    try {
      setIsLoading(true);
      await updateLeadStatus(lead.id, newStatus as LeadStatus);
      // El lead se actualizará automáticamente cuando el contexto se actualice
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
      
      // El lead se actualizará automáticamente cuando el contexto se actualice
    } catch (error) {
      console.error('Error asignando agente:', error);
      alert('Error al asignar agente');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQualificationChange = (score: number) => {
    if (!lead) return;
    
    // Actualizar inmediatamente el estado local para responsividad visual
    setLocalQualificationScore(score);
    console.log('🎯 Slider movido a:', score);
    
    // Cancelar timeout anterior si existe
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId);
      setIsSavingScore(false);
    }
    
    // Mostrar indicador de que va a guardar
    setIsSavingScore(true);
    
    // Crear nuevo timeout para guardar después de 1.5 segundos de inactividad
    const newTimeoutId = setTimeout(async () => {
      try {
        console.log('💾 Guardando qualification_score:', score);
        await updateLead(lead.id, { qualification_score: score });
        console.log('✅ Score guardado exitosamente');
        setIsSavingScore(false);
      } catch (error) {
        console.error('❌ Error guardando score:', error);
        // Revertir el estado local en caso de error
        setLocalQualificationScore(lead.qualification_score || 0);
        setIsSavingScore(false);
      }
    }, 1500); // Esperar 1.5 segundos después del último movimiento
    
    setSaveTimeoutId(newTimeoutId);
  };

  const handleQualifyLead = async (isQualified: boolean) => {
    if (!lead) return;
    
    try {
      setIsLoading(true);
      const score = isQualified ? Math.max(70, lead.qualification_score || 70) : 0;
      await qualifyLead(lead.id, isQualified, score);
      // El lead se actualizará automáticamente cuando el contexto se actualice
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
        notes: `Lead convertido desde página de trabajo`
      });
      // El lead se actualizará automáticamente cuando el contexto se actualice
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
      await scheduleFollowUp(lead.id, followUp, 'Seguimiento programado desde página de trabajo');
      // El lead se actualizará automáticamente cuando el contexto se actualice
      console.log('✅ Seguimiento programado');
      alert('Seguimiento programado exitosamente');
    } catch (error) {
      console.error('Error programando seguimiento:', error);
      alert('Error al programar seguimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = (lead: ExtendedLead) => {
    // Implementar lógica de llamada
    console.log('Iniciando llamada a:', lead.phone);
  };

  const handleEdit = (lead: ExtendedLead) => {
    // Implementar navegación a página de edición
    console.log('Editar lead:', lead.id);
  };

  const handleDelete = async (leadId: string) => {
    // Implementar lógica de eliminación
    console.log('Eliminar lead:', leadId);
  };

  if (!lead) {
    return (
      <LeadLayout leadId={id}>
        <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <div className="text-sm font-medium text-gray-700">Preparando workspace...</div>
            </div>
          </div>
        </div>
      </LeadLayout>
    );
  }

  // Crear lead con score local para responsividad inmediata
  const leadWithLocalScore = lead ? {
    ...lead,
    qualification_score: localQualificationScore
  } : null;

  return (
    <LeadLayout leadId={id}>
      <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] overflow-hidden">
        <WorkTab 
          lead={leadWithLocalScore!}
          isLoading={isLoading}
          followUpDate={followUpDate}
          setFollowUpDate={setFollowUpDate}
          onStatusChange={handleStatusChange}
          onAssignAgent={handleAssignAgent}
          onQualificationChange={handleQualificationChange}
          onQualifyLead={handleQualifyLead}
          onConvertToClient={handleConvertToClient}
          onScheduleFollowUp={handleScheduleFollowUp}
          campaigns={campaigns}
          updateLead={updateLead}
          onCall={handleCall}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isSavingScore={isSavingScore}
        />
      </div>
    </LeadLayout>
  );
}