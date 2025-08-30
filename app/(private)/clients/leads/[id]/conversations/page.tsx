'use client';

import React, { useState, useEffect } from 'react';
import { use } from 'react';
import { LeadLayout } from '@/components/leads/LeadLayout';
import LeadConversationsTab from '@/components/leads/LeadConversationsTab';
import { useLeads, ExtendedLead } from '@/modules/leads/context/LeadsContext';

interface ConversationsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ConversationsPage({ params }: ConversationsPageProps) {
  const { id } = use(params);
  const { leads } = useLeads();
  const [lead, setLead] = useState<ExtendedLead | null>(null);

  useEffect(() => {
    try {
      const leadData = leads.find(l => l.id === id);
      setLead(leadData || null);
    } catch (error) {
      console.error('Error finding lead:', error);
    }
  }, [id, leads]);

  if (!lead) {
    return (
      <LeadLayout leadId={id}>
        <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] overflow-hidden">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 dark:border-orange-400 mx-auto mb-3"></div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Cargando conversaciones...</div>
            </div>
          </div>
        </div>
      </LeadLayout>
    );
  }

  return (
    <LeadLayout leadId={id}>
      <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] overflow-hidden">
        <div className="h-full px-3 sm:px-6 py-3 sm:py-4">
          <LeadConversationsTab leadId={id} />
        </div>
      </div>
    </LeadLayout>
  );
}