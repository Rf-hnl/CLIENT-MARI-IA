'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Phone,
  PhoneOff,
  Building,
  Clock,
  Loader2,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

import { ExtendedLead } from '@/modules/leads/context/LeadsContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

interface LeadsTableAdvancedProps {
  leads: ExtendedLead[];
  isLoading: boolean;
  selectedLeads: Set<string>;
  onSelectLead: (leadId: string) => void;
  onSelectAll: (leads: ExtendedLead[]) => void;
  onShowNewLeadForm: () => void;
  sortedLeads: ExtendedLead[];
  conversationAnalyses: Map<string, any>;
  pagination?: PaginationProps;
}

const ConversationAnalysisCell = ({ analysis }: { analysis: any }) => {
  if (!analysis) {
    return (
      <div className="text-xs text-gray-400 italic">
        Sin análisis
      </div>
    );
  }

  const sentiment = analysis.sentiment?.overall?.sentiment || 
                   analysis.sentiment?.sentiment || 
                   analysis.overallSentiment || 
                   'neutral';
  
  const leadInterest = Math.round((analysis.sentiment?.overall?.score || 0) * 5 + 5);
  const conversionProb = Math.round((analysis.conversionProbability || 0) * 100);
  const qualityScore = analysis.qualityScore || analysis.callQualityScore || 0;

  const getSentimentColor = (sentiment: string | undefined) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      case 'mixed': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Badge className={`${getSentimentColor(sentiment)} text-xs px-2 py-0.5`}>
          {sentiment}
        </Badge>
      </div>
      <div className="text-xs text-gray-600 space-y-0.5">
        <div>Interés: {leadInterest}/10</div>
        <div>Conversión: {conversionProb}%</div>
        <div>Calidad: {qualityScore}/100</div>
      </div>
    </div>
  );
};

const getStatusDisplay = (status: string) => {
  const statusMap: Record<string, { variant: 'default' | 'outline', label: string }> = {
    'new': { variant: 'default', label: 'Nuevo' },
    'interested': { variant: 'default', label: 'Interesado' },
    'qualified': { variant: 'default', label: 'Calificado' },
    'follow_up': { variant: 'outline', label: 'Sin Respuesta' },
    'proposal_current': { variant: 'default', label: 'Cotización Actual' },
    'proposal_previous': { variant: 'outline', label: 'Campañas Anteriores' },
    'negotiation': { variant: 'default', label: 'Negociación' },
    'nurturing': { variant: 'outline', label: 'En Pausa' },
    'won': { variant: 'default', label: 'Ganado' },
    'lost': { variant: 'outline', label: 'Perdido' },
    'cold': { variant: 'outline', label: 'Frío' }
  };
  
  return statusMap[status] || { variant: 'outline', label: status };
};

const formatDate = (timestamp?: { _seconds: number } | string): string => {
  if (!timestamp) return '-';
  
  let date: Date;
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else {
    return '-';
  }
  
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
};

const PaginationControls = ({ pagination }: { pagination: PaginationProps }) => {
  const { currentPage, totalPages, itemsPerPage, totalItems, onPageChange, onItemsPerPageChange } = pagination;

  const generatePageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-black border-t border-gray-200 dark:border-white">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Mostrando {startItem} a {endItem} de {totalItems} leads
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="ml-2 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-black"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-3 w-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        {generatePageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 py-1 text-gray-500">...</span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            )}
          </React.Fragment>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export function LeadsTableAdvanced({
  leads,
  isLoading,
  selectedLeads,
  onSelectLead,
  onSelectAll,
  onShowNewLeadForm,
  sortedLeads,
  conversationAnalyses,
  pagination
}: LeadsTableAdvancedProps) {

  if (isLoading) {
    return (
      <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white dark:bg-black border-b border-gray-200 dark:border-white">
              <tr>
                <th className="text-left p-3 w-12 text-black dark:text-white">✓</th>
                <th className="text-left p-3 w-12 text-black dark:text-white">#</th>
                <th className="text-left p-3 text-black dark:text-white">Lead</th>
                <th className="text-left p-3 text-black dark:text-white">Contacto</th>
                <th className="text-left p-3 text-black dark:text-white">Campaña</th>
                <th className="text-left p-3 text-black dark:text-white">Estado</th>
                <th className="text-left p-3 text-black dark:text-white">Llamadas</th>
                <th className="text-left p-3 text-black dark:text-white">Análisis IA</th>
                <th className="text-left p-3 text-black dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-white">
                  <td className="p-3">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-14 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="p-3">
                    <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-white dark:bg-black px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-white">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
            <span className="text-sm text-black dark:text-white">Cargando leads...</span>
          </div>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black">
        <div className="p-6 text-center">
          <Users className="h-8 w-8 mx-auto text-black dark:text-white mb-3" />
          <p className="text-sm text-black dark:text-white mb-3">No hay leads para mostrar</p>
          <Button size="sm" onClick={onShowNewLeadForm}>
            <Plus className="h-3 w-3 mr-1" />
            Agregar primer lead
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-white rounded-lg bg-white dark:bg-black overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white dark:bg-black border-b border-gray-200 dark:border-white">
            <tr>
              <th className="text-left p-3 w-12 text-black dark:text-white">
                <Checkbox
                  checked={selectedLeads.size > 0 && selectedLeads.size === sortedLeads.length}
                  onCheckedChange={() => onSelectAll(sortedLeads)}
                  indeterminate={selectedLeads.size > 0 && selectedLeads.size < sortedLeads.length}
                />
              </th>
              <th className="text-left p-3 text-black dark:text-white">#</th>
              <th className="text-left p-3 text-black dark:text-white">Lead</th>
              <th className="text-left p-3 text-black dark:text-white">Contacto</th>
              <th className="text-left p-3 text-black dark:text-white">Campaña</th>
              <th className="text-left p-3 text-black dark:text-white">Estado</th>
              <th className="text-left p-3 text-black dark:text-white">Llamadas</th>
              <th className="text-left p-3 text-black dark:text-white">Análisis IA</th>
              <th className="text-left p-3 text-black dark:text-white">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead, index) => {
              const statusDisplay = getStatusDisplay(lead.status);
              return (
                <tr key={lead.id} className="border-b border-gray-200 dark:border-white hover:bg-orange-500 hover:text-white dark:hover:bg-orange-500 dark:hover:text-black transition-all duration-200 hover:scale-[1.02] hover:shadow-sm">
                  <td className="p-3">
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => onSelectLead(lead.id)}
                    />
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-mono text-gray-500">
                      {index + 1}
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-white">
                        {lead.name || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-black dark:text-white">
                        {lead.company ? `${lead.company}` : 'Sin empresa'}
                        {lead.position ? ` • ${lead.position}` : ''}
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      {lead.email && (
                        <p className="text-xs text-black dark:text-white">{lead.email}</p>
                      )}
                      {lead.phone && (
                        <p className="text-xs text-black dark:text-white">{lead.phone}</p>
                      )}
                      {!lead.email && !lead.phone && (
                        <p className="text-xs text-black dark:text-white">Sin contacto</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {lead.campaign ? (
                      <span className="text-xs text-black dark:text-white">
                        {typeof lead.campaign === 'string' ? lead.campaign : lead.campaign.name || 'Sin nombre'}
                      </span>
                    ) : (
                      <span className="text-xs text-red-500">Falta Campaña</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant={statusDisplay.variant} className="text-xs">
                      {statusDisplay.label}
                    </Badge>
                    {lead.is_qualified && (
                      <Badge variant="outline" className="text-xs ml-1">
                        ✓
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {(lead.contactAttempts || 0) > 0 ? (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                        <Phone className="h-3 w-3 mr-1" />
                        {lead.contactAttempts === 1 ? '1 llamada' : `${lead.contactAttempts} llamadas`}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                        <PhoneOff className="h-3 w-3 mr-1" />
                        Sin llamadas
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <ConversationAnalysisCell analysis={conversationAnalyses.get(lead.id)} />
                  </td>
                  <td className="p-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-xs border-gray-300"
                      onClick={() => {
                        window.location.href = `/clients/leads/${lead.id}/work`;
                      }}
                    >
                      Trabajar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {pagination && <PaginationControls pagination={pagination} />}
    </div>
  );
}