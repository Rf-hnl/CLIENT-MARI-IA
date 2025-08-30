'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLeads, ExtendedLead } from '@/modules/leads/context/LeadsContext';

interface LeadLayoutProps {
  leadId: string;
  children: React.ReactNode;
}

export function LeadLayout({ leadId, children }: LeadLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { leads, isLoading: contextLoading } = useLeads();
  const [lead, setLead] = useState<ExtendedLead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contextLoading) {
      setLoading(true);
      return;
    }

    try {
      const leadData = leads.find(l => l.id === leadId);
      setLead(leadData || null);
    } catch (error) {
      console.error('Error finding lead:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, leads, contextLoading]);

  const getActiveTab = () => {
    if (pathname.includes('/details')) return 'details';
    if (pathname.includes('/work')) return 'work';
    if (pathname.includes('/conversations')) return 'conversations';
    return 'work';
  };

  const navigateToTab = (tab: string) => {
    router.push(`/clients/leads/${leadId}/${tab}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-400 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-foreground">Cargando información del lead...</div>
            <div className="text-sm text-foreground opacity-70 mt-2">Por favor espera un momento</div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Lead no encontrado</h2>
            <p className="text-foreground opacity-70 mb-6 max-w-md">
              No se pudo encontrar el lead solicitado. Es posible que haya sido eliminado o que no tengas permisos para acceder a él.
            </p>
            <button
              onClick={() => router.push('/clients/leads')}
              className="inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a la lista de leads
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Principal - Información del Lead */}
      <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-border bg-card shadow-sm relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 sm:gap-6">
            {/* Lado Izquierdo: Botón + Info Principal */}
            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/clients/leads')}
                className="bg-background hover:bg-card/80 border-border transition-all duration-200 shadow-sm flex-shrink-0"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">Volver a Leads</span>
                <span className="text-xs font-medium sm:hidden">Volver</span>
              </Button>
              
              {/* Avatar */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-primary-foreground font-bold text-sm sm:text-base">
                  {(lead.name || 'L').charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Info Principal */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate leading-tight mb-1">
                  {lead.name || 'Lead sin nombre'}
                </h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  {lead.email && (
                    <span className="truncate max-w-[120px] sm:max-w-[200px] lg:max-w-none">{lead.email}</span>
                  )}
                  {lead.phone && (
                    <>
                      {lead.email && <span className="text-muted-foreground">•</span>}
                      <span className="flex-shrink-0">{lead.phone}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Lado Derecho: Badges */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></div>
                <span className="text-xs font-semibold text-primary capitalize whitespace-nowrap">
                  {lead.status === 'new' ? 'Nuevo' :
                   lead.status === 'interested' ? 'Interesado' :
                   lead.status === 'qualified' ? 'Calificado' :
                   lead.status === 'follow_up' ? 'Seguimiento' :
                   lead.status === 'proposal_current' ? 'Propuesta Actual' :
                   lead.status === 'proposal_previous' ? 'Propuesta Anterior' :
                   lead.status === 'negotiation' ? 'Negociación' :
                   lead.status === 'nurturing' ? 'En Pausa' :
                   lead.status === 'won' ? 'Ganado' :
                   lead.status === 'lost' ? 'Perdido' :
                   lead.status === 'cold' ? 'Frío' : lead.status}
                </span>
              </div>
              
              {/* Priority Badge */}
              <div className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${
                (lead.priority || 'medium') === 'high' 
                  ? 'bg-primary text-primary-foreground border-primary'
                  : (lead.priority || 'medium') === 'low'
                  ? 'bg-background text-foreground border-border'
                  : 'bg-primary/10 text-primary border-primary/20'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  (lead.priority || 'medium') === 'high' ? 'bg-primary-foreground' :
                  (lead.priority || 'medium') === 'low' ? 'bg-foreground' : 'bg-primary'
                }`}></div>
                <span className="text-xs font-semibold capitalize whitespace-nowrap">
                  {(lead.priority || 'medium') === 'high' ? 'Alta' :
                   (lead.priority || 'medium') === 'low' ? 'Baja' : 'Media'}
                </span>
              </div>
              
              {/* Qualified Badge */}
              {lead.is_qualified && (
                <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary text-primary-foreground border border-primary">
                  <span className="text-xs font-semibold whitespace-nowrap">✓ Calificado</span>
                </div>
              )}
              
              {/* Score Display */}
              {(lead.qualification_score || 0) > 0 && (
                <div className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <span className="text-xs font-semibold text-primary whitespace-nowrap">
                    {lead.qualification_score}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header de Navegación - Pestañas */}
      <div className="px-4 sm:px-6 bg-card border-b border-border overflow-x-auto relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/20 via-primary/40 to-transparent"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 min-w-max -mb-px">
            <button
              onClick={() => navigateToTab('details')}
              className={
                activeTab === 'details'
                  ? 'py-3 px-4 sm:px-6 border-b-2 border-primary bg-primary/5 text-primary font-semibold text-sm transition-all duration-300 whitespace-nowrap'
                  : 'py-3 px-4 sm:px-6 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border font-medium text-sm transition-all duration-300 whitespace-nowrap'
              }
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">📊</span>
                <span>Detalles</span>
              </span>
            </button>
            <button
              onClick={() => navigateToTab('work')}
              className={
                activeTab === 'work'
                  ? 'py-3 px-4 sm:px-6 border-b-2 border-primary bg-primary/5 text-primary font-semibold text-sm transition-all duration-300 whitespace-nowrap'
                  : 'py-3 px-4 sm:px-6 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border font-medium text-sm transition-all duration-300 whitespace-nowrap'
              }
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">🤖</span>
                <span>Acciones con IA</span>
              </span>
            </button>
            <button
              onClick={() => navigateToTab('conversations')}
              className={
                activeTab === 'conversations'
                  ? 'py-3 px-4 sm:px-6 border-b-2 border-primary bg-primary/5 text-primary font-semibold text-sm transition-all duration-300 whitespace-nowrap'
                  : 'py-3 px-4 sm:px-6 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-border font-medium text-sm transition-all duration-300 whitespace-nowrap'
              }
            >
              <span className="flex items-center gap-2">
                <span className="text-xs">💬</span>
                <span>Conversaciones</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
