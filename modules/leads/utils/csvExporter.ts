/**
 * CSV EXPORTER FOR LEADS
 * 
 * Utilidad para exportar leads a formato CSV
 * Compatible con la estructura del CRM original
 */

import { ExtendedLead } from '../context/LeadsContext';
import { LeadStatus, LeadSource, LeadPriority } from '../types/leads';

// Mapeo inverso de estados - del sistema interno al CRM externo (exacto al CSV)
const STATUS_REVERSE_MAPPING: Record<LeadStatus, string> = {
  'new': 'Nuevos Leads / Pendientes',
  'interested': 'Leads Potenciales / Prioritario',
  'qualified': 'Calificado - En seguimiento',
  'follow_up': 'En seguimiento / Sin respuesta',
  'proposal_current': 'Cotizaciones / Campaña Actual Jun - Jul',
  'proposal_previous': 'Cotización enviada / Campañas anteriores',
  'negotiation': 'Negociación / En ajustes',
  'nurturing': 'A futuro / En pausa',
  'won': 'Ganado / Cerrado',
  'lost': 'Propuesta declinada',
  'cold': 'Leads descartados / No calificados'
};

// Mapeo inverso de prioridades
const PRIORITY_REVERSE_MAPPING: Record<LeadPriority, string> = {
  'urgent': 'Muy alta',
  'high': 'Alta',
  'medium': 'Medio',
  'low': 'Baja'
};

// Función para calcular probabilidad basada en el estado
const calculateProbability = (status: LeadStatus, qualificationScore?: number): string => {
  const probabilities: Record<LeadStatus, number> = {
    'new': 10,
    'interested': 35,
    'qualified': 50,
    'follow_up': 30,
    'proposal_current': 65,
    'proposal_previous': 45,
    'negotiation': 80,
    'nurturing': 20,
    'won': 100,
    'lost': 0,
    'cold': 5
  };

  let probability = probabilities[status] || 10;
  
  // Ajustar basado en qualification score si está disponible
  if (qualificationScore && qualificationScore > 0) {
    probability = Math.max(probability, qualificationScore);
  }
  
  return probability.toString().replace('.', ',');
};

// Función para determinar si está ganado/perdido
const getWonLostStatus = (status: LeadStatus): string => {
  if (status === 'won') return 'Ganado';
  if (status === 'lost' || status === 'cold') return 'Perdido';
  return 'Pendiente';
};

// Función para convertir timestamp de Firebase a fecha legible
const formatFirebaseDate = (timestamp?: { _seconds: number }): string => {
  if (!timestamp) return '';
  return new Date(timestamp._seconds * 1000).toLocaleDateString('es-ES');
};

// Función para convertir un lead a fila CSV
export const convertLeadToCSVRow = (lead: ExtendedLead): Record<string, string> => {
  const probability = calculateProbability(lead.status, lead.qualification_score);
  const wonLostStatus = getWonLostStatus(lead.status);
  const expectedRevenue = lead.conversion_value?.toString().replace('.', ',') || '0,00';
  
  return {
    'Etapa': STATUS_REVERSE_MAPPING[lead.status] || lead.status,
    'Probabilidad': probability,
    'Activo': 'VERDADERO',
    'Moneda': 'USD',
    'MMR esperado': '0,00',
    'Equipo de ventas': lead.assigned_agent_name || 'Ventas',
    'Ganado/Perdido': wonLostStatus,
    'Índice de Colores': '0',
    'Oportunidad': lead.name,
    'Ingresos esperados': expectedRevenue,
    'Cliente': lead.company || lead.name,
    'Etiquetas': Array.isArray(lead.tags) ? lead.tags.join(',') : '',
    'Propiedades': lead.notes || '',
    'Prioridad': PRIORITY_REVERSE_MAPPING[lead.priority] || lead.priority,
    'Actividades': lead.qualification_notes || '',
    'Decoración de Actividad de Excepción': '',
    'Icono': '',
    'Estado de la actividad': lead.status === 'follow_up' ? 'Planificado' : 'Completado',
    'Resumen de la siguiente actividad': lead.next_follow_up_date ? 'Seguimiento programado' : '',
    'Icono de tipo de actvidad': lead.status === 'follow_up' ? 'fa-calendar' : 'fa-check',
    'Tipo de la siguiente actividad': lead.next_follow_up_date ? 'Seguimiento' : '',
    'Comercial': lead.email || `${lead.phone}@contacto.com`,
    'Propiedad 1': ''
  };
};

// Función para exportar leads a CSV
export const exportLeadsToCSV = (leads: ExtendedLead[], filename: string = 'leads_export'): void => {
  if (leads.length === 0) {
    console.warn('No hay leads para exportar');
    return;
  }

  // Headers del CSV (orden específico del CRM)
  const headers = [
    'Etapa',
    'Probabilidad',
    'Activo',
    'Moneda',
    'MMR esperado',
    'Equipo de ventas',
    'Ganado/Perdido',
    'Índice de Colores',
    'Oportunidad',
    'Ingresos esperados',
    'Cliente',
    'Etiquetas',
    'Propiedades',
    'Prioridad',
    'Actividades',
    'Decoración de Actividad de Excepción',
    'Icono',
    'Estado de la actividad',
    'Resumen de la siguiente actividad',
    'Icono de tipo de actvidad',
    'Tipo de la siguiente actividad',
    'Comercial',
    'Propiedad 1'
  ];

  // Convertir leads a filas CSV
  const csvRows = leads.map(lead => convertLeadToCSVRow(lead));

  // Crear contenido CSV
  const csvContent = [
    headers.join(';'), // Header row
    ...csvRows.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escapar valores que contengan punto y coma o comillas
        if (value.includes(';') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(';')
    )
  ].join('\n');

  // Crear y descargar archivo
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log(`✅ Exportados ${leads.length} leads a CSV: ${filename}`);
};

// Función para generar estadísticas de exportación
export interface ExportStats {
  totalLeads: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  averageProbability: number;
  totalExpectedRevenue: number;
  wonLeads: number;
  lostLeads: number;
  pendingLeads: number;
}

export const generateExportStats = (leads: ExtendedLead[]): ExportStats => {
  const stats: ExportStats = {
    totalLeads: leads.length,
    statusDistribution: {},
    priorityDistribution: {},
    averageProbability: 0,
    totalExpectedRevenue: 0,
    wonLeads: 0,
    lostLeads: 0,
    pendingLeads: 0
  };

  let totalProbability = 0;

  leads.forEach(lead => {
    // Distribución por estado
    const statusLabel = STATUS_REVERSE_MAPPING[lead.status] || lead.status;
    stats.statusDistribution[statusLabel] = (stats.statusDistribution[statusLabel] || 0) + 1;

    // Distribución por prioridad
    const priorityLabel = PRIORITY_REVERSE_MAPPING[lead.priority] || lead.priority;
    stats.priorityDistribution[priorityLabel] = (stats.priorityDistribution[priorityLabel] || 0) + 1;

    // Calcular probabilidad promedio
    const probability = parseFloat(calculateProbability(lead.status, lead.qualification_score).replace(',', '.'));
    totalProbability += probability;

    // Ingresos esperados totales
    if (lead.conversion_value) {
      stats.totalExpectedRevenue += lead.conversion_value;
    }

    // Contadores por resultado
    if (lead.status === 'won') {
      stats.wonLeads++;
    } else if (lead.status === 'lost' || lead.status === 'cold') {
      stats.lostLeads++;
    } else {
      stats.pendingLeads++;
    }
  });

  stats.averageProbability = leads.length > 0 ? totalProbability / leads.length : 0;

  return stats;
};

// Función para exportar solo un subset de leads filtrado
export const exportFilteredLeads = (
  allLeads: ExtendedLead[],
  filters: {
    status?: LeadStatus[];
    priority?: LeadPriority[];
    source?: LeadSource[];
    dateRange?: { from: Date; to: Date };
    hasEmail?: boolean;
    isQualified?: boolean;
  },
  filename: string = 'leads_filtered_export'
): void => {
  let filteredLeads = [...allLeads];

  // Aplicar filtros
  if (filters.status?.length) {
    filteredLeads = filteredLeads.filter(lead => filters.status!.includes(lead.status));
  }

  if (filters.priority?.length) {
    filteredLeads = filteredLeads.filter(lead => filters.priority!.includes(lead.priority));
  }

  if (filters.source?.length) {
    filteredLeads = filteredLeads.filter(lead => filters.source!.includes(lead.source));
  }

  if (filters.dateRange) {
    const { from, to } = filters.dateRange;
    filteredLeads = filteredLeads.filter(lead => {
      if (!lead.created_at) return false;
      const leadDate = new Date(lead.created_at._seconds * 1000);
      return leadDate >= from && leadDate <= to;
    });
  }

  if (filters.hasEmail !== undefined) {
    filteredLeads = filteredLeads.filter(lead => 
      filters.hasEmail ? !!lead.email : !lead.email
    );
  }

  if (filters.isQualified !== undefined) {
    filteredLeads = filteredLeads.filter(lead => 
      lead.is_qualified === filters.isQualified
    );
  }

  exportLeadsToCSV(filteredLeads, filename);
};