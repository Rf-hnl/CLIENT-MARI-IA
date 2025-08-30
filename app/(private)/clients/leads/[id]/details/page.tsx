'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { LeadLayout } from '@/components/leads/LeadLayout';
import { DetailsTab } from '@/components/leads/DetailsTab';
import { useLeads, ExtendedLead } from '@/modules/leads/context/LeadsContext';
import { ILeadCallLog } from '@/modules/leads/types/leads';

interface DetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DetailsPage({ params }: DetailsPageProps) {
  const { id } = use(params);
  const { leads } = useLeads();
  const [lead, setLead] = useState<ExtendedLead | null>(null);
  const [callLogs, ] = useState<ILeadCallLog[]>([]);

  useEffect(() => {
    try {
      const leadData = leads.find(l => l.id === id);
      setLead(leadData || null);
      
      // TODO: Implementar obtención de call logs
      // const logs = await getCallLogsForLead(id);
      // setCallLogs(logs);
    } catch (error) {
      console.error('Error finding lead:', error);
    }
  }, [id, leads]);

  const handleViewTranscription = (callLog: ILeadCallLog) => {
    // Implementar visualización de transcripción
    console.log('Ver transcripción:', callLog);
  };

  if (!lead) {
    return (
      <LeadLayout leadId={id}>
        <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <div className="text-sm font-medium text-gray-700">Cargando detalles del lead...</div>
            </div>
          </div>
        </div>
      </LeadLayout>
    );
  }

  return (
    <LeadLayout leadId={id}>
      <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] overflow-hidden">
        <DetailsTab 
          lead={lead}
          callLogs={callLogs}
          onViewTranscription={handleViewTranscription}
        />
      </div>
    </LeadLayout>
  );
}