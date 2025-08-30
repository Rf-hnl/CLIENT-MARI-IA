'use client';

/**
 * LEADS STATS CARDS COMPONENT
 * 
 * Componente reutilizable para mostrar estadísticas del pipeline de leads
 * Diseño moderno basado en cards con iconos y métricas
 */

import React from 'react';
import { AlertCircle, Target, Users, UserPlus, UserCheck, Clock, DollarSign, Star, Building } from 'lucide-react';
import { useLeads } from '@/modules/leads/hooks/useLeads';

// Tipos para el componente
export interface StatCard {
  id: string;
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  tooltip?: string;
}

export interface LeadsStatsCardsProps {
  /** Stats cards personalizadas para mostrar */
  customCards?: StatCard[];
  /** Callback cuando se hace click en una card */
  onCardClick?: (cardId: string, value: number | string) => void;
  /** Clase CSS adicional */
  className?: string;
}

export function LeadsStatsCards({
  customCards,
  onCardClick,
  className = ''
}: LeadsStatsCardsProps) {
  const { leads } = useLeads();

  // Calcular estadísticas por estado basado en los datos reales
  const statsByStatus = React.useMemo(() => {
    if (!leads || leads.length === 0) {
      return {
        total: 0,
        new: 0,
        interested: 0,
        qualified: 0,
        follow_up: 0,
        proposal_current: 0,
        proposal_previous: 0,
        negotiation: 0,
        nurturing: 0,
        won: 0,
        lost: 0,
        cold: 0,
        cotizaciones: 0,
        descartados: 0
      };
    }

    const statusCounts = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      interested: leads.filter(l => l.status === 'interested' || (l.status as any) === 'contacted').length,
      qualified: leads.filter(l => l.status === 'qualified').length,
      follow_up: leads.filter(l => l.status === 'follow_up').length,
      proposal_current: leads.filter(l => l.status === 'proposal_current').length,
      proposal_previous: leads.filter(l => l.status === 'proposal_previous').length,
      negotiation: leads.filter(l => l.status === 'negotiation').length,
      nurturing: leads.filter(l => l.status === 'nurturing').length,
      won: leads.filter(l => l.status === 'won').length,
      lost: leads.filter(l => l.status === 'lost').length,
      cold: leads.filter(l => l.status === 'cold').length,
    };
    
    return {
      ...statusCounts,
      cotizaciones: statusCounts.proposal_current + statusCounts.proposal_previous + statusCounts.negotiation,
      descartados: statusCounts.cold + statusCounts.lost,
    };
  }, [leads]);

  // Calcular tendencias (simuladas por ahora)
  const getTrend = (id: string) => {
    // Simulamos tendencias basadas en lógica de negocio
    const trends: Record<string, { value: number; isPositive: boolean; label: string }> = {
      total: { value: 12.5, isPositive: true, label: "vs mes anterior" },
      new: { value: 8.3, isPositive: true, label: "esta semana" },
      interested: { value: 15.2, isPositive: true, label: "vs promedio" },
      qualified: { value: 3.1, isPositive: false, label: "vs meta" },
      follow_up: { value: 5.7, isPositive: false, label: "pendientes" },
      cotizaciones: { value: 22.1, isPositive: true, label: "en proceso" },
      won: { value: 18.4, isPositive: true, label: "vs objetivo" },
      descartados: { value: 4.2, isPositive: false, label: "tasa descarte" }
    };
    return trends[id];
  };

  // Cards por defecto basadas en las estadísticas reales
  const defaultCards: StatCard[] = [
    {
      id: 'total',
      label: 'Total Leads',
      value: statsByStatus.total.toLocaleString(),
      icon: Users,
      trend: getTrend('total'),
      tooltip: 'Total de leads en el sistema'
    },
    {
      id: 'new',
      label: 'Nuevos',
      value: statsByStatus.new,
      icon: UserPlus,
      trend: getTrend('new'),
      tooltip: 'Leads recién ingresados'
    },
    {
      id: 'interested',
      label: 'Potenciales',
      value: statsByStatus.interested,
      icon: Star,
      trend: getTrend('interested'),
      tooltip: 'Leads con interés confirmado'
    },
    {
      id: 'qualified',
      label: 'Calificados',
      value: statsByStatus.qualified,
      icon: Target,
      trend: getTrend('qualified'),
      tooltip: 'Leads que cumplen criterios'
    },
    {
      id: 'follow_up',
      label: 'Seguimiento',
      value: statsByStatus.follow_up,
      icon: Clock,
      trend: getTrend('follow_up'),
      tooltip: 'Leads pendientes de contacto'
    },
    {
      id: 'cotizaciones',
      label: 'Cotizaciones',
      value: statsByStatus.cotizaciones,
      icon: Building,
      trend: getTrend('cotizaciones'),
      tooltip: 'Leads en proceso de cotización'
    },
    {
      id: 'won',
      label: 'Ganados',
      value: statsByStatus.won,
      icon: UserCheck,
      trend: getTrend('won'),
      tooltip: 'Leads convertidos exitosamente'
    },
    {
      id: 'descartados',
      label: 'Descartados',
      value: statsByStatus.descartados,
      icon: AlertCircle,
      trend: getTrend('descartados'),
      tooltip: 'Leads no viables o perdidos'
    }
  ];

  const cardsToShow = customCards || defaultCards;


  const handleCardClick = (card: StatCard) => {
    if (onCardClick) {
      onCardClick(card.id, card.value);
    }
  };

  return (
    <div className={`max-w-[85rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14 mx-auto ${className}`}>
      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cardsToShow.map((card) => {
          const trend = card.trend;
          
          return (
            <div
              key={card.id}
              className={`
                flex flex-col bg-white border border-gray-200 shadow-2xs rounded-xl 
                dark:bg-neutral-900 dark:border-neutral-800 transition-all duration-200
                ${onCardClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
              `}
              onClick={() => handleCardClick(card)}
            >
              <div className="p-4 md:p-5 flex gap-x-4">
                <div className="shrink-0 flex justify-center items-center size-11 bg-gray-100 rounded-lg dark:bg-neutral-800">
                  <card.icon className="shrink-0 size-5 text-gray-600 dark:text-neutral-400" />
                </div>

                <div className="grow">
                  <div className="flex items-center gap-x-2">
                    <p className="text-xs uppercase text-gray-500 dark:text-neutral-500">
                      {card.label}
                    </p>
                    {card.tooltip && (
                      <div className="hs-tooltip">
                        <div className="hs-tooltip-toggle">
                          <AlertCircle className="shrink-0 size-4 text-gray-500 dark:text-neutral-500" />
                          <span className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-neutral-700" role="tooltip">
                            {card.tooltip}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-x-2">
                    <h3 className="text-xl sm:text-2xl font-medium text-gray-800 dark:text-neutral-200">
                      {card.value}
                    </h3>
                    {trend && (
                      <span className={`
                        inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-xs font-medium
                        ${trend.isPositive 
                          ? 'bg-green-100 text-green-900 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-900 dark:bg-red-800 dark:text-red-100'
                        }
                      `}>
                        {trend.isPositive ? (
                          <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                            <polyline points="16 7 22 7 22 13"/>
                          </svg>
                        ) : (
                          <svg className="inline-block size-4 self-center" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
                            <polyline points="16 17 22 17 22 11"/>
                          </svg>
                        )}
                        <span className="inline-block text-xs font-medium">
                          {trend.value}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* End Grid */}
    </div>
  );
}

// Hook personalizado para usar con el componente (opcional)
export function useLeadsStatsCards() {
  const { leads } = useLeads();
  
  return {
    totalLeads: leads?.length || 0,
    leads,
    hasData: (leads?.length || 0) > 0
  };
}