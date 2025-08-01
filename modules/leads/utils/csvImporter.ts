/**
 * CSV IMPORTER FOR LEADS
 * 
 * Utilidad para importar leads masivamente desde archivos CSV
 * Mapea datos de CRM existente al modelo de leads interno
 */

import { ILead, LeadStatus, LeadSource, LeadPriority, IFirebaseTimestamp } from '../types/leads';

// Mapeo de estados del CRM externo a nuestro sistema (exacto del CSV real)
const STATUS_MAPPING: Record<string, LeadStatus> = {
  'Nuevos Leads / Pendientes': 'new',
  'Leads Potenciales / Prioritario': 'interested',
  'Calificado - En seguimiento': 'qualified',
  'En seguimiento / Sin respuesta': 'follow_up',
  'Cotizaciones / Campaña Actual Jun - Jul': 'proposal_current',
  'Cotización enviada / Campañas anteriores': 'proposal_previous',
  'Negociación / En ajustes': 'negotiation',
  'A futuro / En pausa': 'nurturing',
  'Ganado / Cerrado': 'won',
  'Propuesta declinada': 'lost',
  'Leads descartados / No calificados': 'cold'
};

// Mapeo de prioridades
const PRIORITY_MAPPING: Record<string, LeadPriority> = {
  'Muy alta': 'urgent',
  'Alta': 'high',
  'Medio': 'medium',
  'Baja': 'low'
};

// Mapeo automático de fuentes basado en el contexto
const SOURCE_MAPPING: Record<string, LeadSource> = {
  'website': 'website',
  'social': 'social_media',
  'referral': 'referral',
  'cold': 'cold_call',
  'ad': 'advertisement',
  'email': 'email',
  'event': 'event',
  'whatsapp': 'whatsapp',
  'other': 'other'
};

// Interfaz para datos del CSV
export interface CSVLeadData {
  Etapa: string;
  Probabilidad: string;
  Activo: string;
  Moneda: string;
  'MMR esperado': string;
  'Equipo de ventas': string;
  'Ganado/Perdido': string;
  'Índice de Colores': string;
  Oportunidad: string;
  'Ingresos esperados': string;
  Cliente: string;
  Etiquetas: string;
  Propiedades: string;
  Prioridad: string;
  Actividades: string;
  'Decoración de Actividad de Excepción': string;
  Icono: string;
  'Estado de la actividad': string;
  'Resumen de la siguiente actividad': string;
  'Icono de tipo de actvidad': string;
  'Tipo de la siguiente actividad': string;
  Comercial: string;
  'Propiedad 1': string;
}

// Función para determinar si es un nombre de empresa o persona
const isCompanyName = (name: string): boolean => {
  const companyKeywords = [
    'restaurant', 'center', 'market', 'store', 'shop', 'salon', 
    'clinic', 'hotel', 'bar', 'grill', 'food', 'coffee', 'truck',
    'auto', 'mart', 'plaza', 'group', 'company', 'corp', 'ltd',
    'sa', 'pty', 'inc', 'llc', 'services', 'studio', 'academy',
    'university', 'hospital', 'pharmacy', 'laboratory', 'warehouse'
  ];
  
  const lowerName = name.toLowerCase();
  return companyKeywords.some(keyword => lowerName.includes(keyword)) ||
         /\b(s\.a\.|pty|inc|llc|corp|ltd)\b/i.test(name) ||
         lowerName.includes('municipio') ||
         lowerName.includes('universidad') ||
         lowerName.includes('servicio');
};

// Función para extraer teléfono del comercial
const extractPhoneFromEmail = (email: string): string | undefined => {
  // Si no hay información real de teléfono, retornar undefined
  // para que se detecte como dato faltante
  return undefined;
};

// Función para generar un ID único
const generateLeadId = (): string => {
  return `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Función para crear timestamp de Firebase
const createFirebaseTimestamp = (date?: Date): IFirebaseTimestamp => {
  const timestamp = date || new Date();
  return {
    _seconds: Math.floor(timestamp.getTime() / 1000),
    _nanoseconds: 0
  };
};

// Función para determinar la fuente del lead basado en el contexto
const inferLeadSource = (leadData: CSVLeadData): LeadSource => {
  const { Oportunidad, Actividades, Cliente } = leadData;
  
  // Analizar el nombre de la oportunidad para inferir la fuente
  const opportunity = Oportunidad.toLowerCase();
  
  if (opportunity.includes('web') || opportunity.includes('site')) {
    return 'website';
  } else if (opportunity.includes('social') || opportunity.includes('facebook') || opportunity.includes('instagram')) {
    return 'social_media';
  } else if (opportunity.includes('referido') || opportunity.includes('referral')) {
    return 'referral';
  } else if (opportunity.includes('email') || opportunity.includes('mail')) {
    return 'email';
  } else if (opportunity.includes('event') || opportunity.includes('evento')) {
    return 'event';
  } else if (opportunity.includes('whatsapp') || opportunity.includes('wa')) {
    return 'whatsapp';
  } else if (Actividades.toLowerCase().includes('llamada')) {
    return 'cold_call';
  } else {
    return 'other';
  }
};

// Función principal para convertir datos CSV a modelo de Lead
export const convertCSVToLead = (csvData: CSVLeadData): Omit<ILead, 'id'> | null => {
  // Filtrar filas que no son leads válidos (headers de sección, etc.)
  if (!csvData.Oportunidad || 
      typeof csvData.Oportunidad !== 'string' ||
      csvData.Oportunidad.trim().length === 0 ||
      csvData.Oportunidad.includes('(') && csvData.Oportunidad.includes(')') ||
      !csvData.Probabilidad ||
      parseFloat(csvData.Probabilidad.replace(',', '.')) === 0) {
    return null;
  }

  const name = csvData.Oportunidad.trim();
  const isCompany = isCompanyName(name);
  
  // Mapear estado
  const status = STATUS_MAPPING[csvData.Etapa] || 'new';
  
  // Mapear prioridad
  const priority = PRIORITY_MAPPING[csvData.Prioridad] || 'medium';
  
  // Inferir fuente
  const source = inferLeadSource(csvData);
  
  // Calcular score de calificación basado en probabilidad
  const probability = parseFloat(csvData.Probabilidad.replace(',', '.')) || 0;
  const qualification_score = Math.min(Math.round(probability), 100);
  
  // Determinar si está calificado
  const is_qualified = qualification_score > 50;
  
  // Procesar valor de conversión
  const expectedRevenue = parseFloat(csvData['Ingresos esperados'].replace(',', '.')) || 0;
  
  // Extraer información del comercial
  const commercialEmail = csvData.Comercial || '';
  const phone = extractPhoneFromEmail(commercialEmail);
  
  const now = createFirebaseTimestamp();
  
  const leadData: Omit<ILead, 'id'> = {
    // Campos requeridos
    name: name,
    phone: phone || 'REQUIRED', // Marcado para validación
    status: status,
    source: source,
    
    // Información de contacto
    ...(commercialEmail.includes('@') && { email: commercialEmail }),
    preferred_contact_method: 'phone' as const,
    
    // Información de negocio
    ...(isCompany && { company: name }),
    ...(!isCompany && { position: 'Propietario' }),
    priority: priority,
    
    // Calificación
    qualification_score: qualification_score,
    is_qualified: is_qualified,
    ...(csvData.Actividades && { qualification_notes: csvData.Actividades }),
    
    // Seguimiento
    contact_attempts: 0,
    response_rate: 0,
    
    // Conversión
    converted_to_client: status === 'won',
    ...(status === 'won' && expectedRevenue > 0 && { conversion_value: expectedRevenue }),
    ...(status === 'won' && { conversion_date: now }),
    
    // Notas y tags
    ...(csvData.Propiedades && { notes: csvData.Propiedades }),
    internal_notes: `Importado de CRM. Etapa original: ${csvData.Etapa}. Probabilidad: ${csvData.Probabilidad}%`,
    tags: csvData.Etiquetas ? csvData.Etiquetas.split(',').map(t => t.trim()) : [],
    
    // Agente asignado
    ...(csvData['Equipo de ventas'] && { assigned_agent_name: csvData['Equipo de ventas'] }),
    
    // Timestamps del sistema
    created_at: now,
    updated_at: now
  };

  return leadData;
};

// Función para procesar archivo CSV completo
export const processCSVFile = (csvContent: string): (Omit<ILead, 'id'>)[] => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(';').map(h => h.trim());
  const leads: (Omit<ILead, 'id'>)[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    const csvData: any = {};
    
    headers.forEach((header, index) => {
      csvData[header] = values[index] || '';
    });
    
    const lead = convertCSVToLead(csvData as CSVLeadData);
    if (lead) {
      leads.push(lead);
    }
  }
  
  return leads;
};

// Función para validar estructura del CSV
export const validateCSVStructure = (csvContent: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    errors.push('El archivo CSV debe tener al menos una fila de datos además del header');
  }
  
  const headers = lines[0].split(';').map(h => h.trim());
  const requiredHeaders = ['Etapa', 'Oportunidad', 'Probabilidad', 'Prioridad'];
  
  requiredHeaders.forEach(required => {
    if (!headers.includes(required)) {
      errors.push(`Header requerido faltante: ${required}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Estadísticas de importación
export interface ImportStats {
  totalRows: number;
  validLeads: number;
  skippedRows: number;
  statusDistribution: Record<LeadStatus, number>;
  priorityDistribution: Record<LeadPriority, number>;
  sourceDistribution: Record<LeadSource, number>;
}

// Función para generar estadísticas de importación
export const generateImportStats = (leads: (Omit<ILead, 'id'>)[]): ImportStats => {
  const stats: ImportStats = {
    totalRows: 0,
    validLeads: leads.length,
    skippedRows: 0,
    statusDistribution: {
      new: 0, contacted: 0, interested: 0, qualified: 0, proposal: 0,
      negotiation: 0, won: 0, lost: 0, nurturing: 0, follow_up: 0, cold: 0
    },
    priorityDistribution: { low: 0, medium: 0, high: 0, urgent: 0 },
    sourceDistribution: {
      website: 0, social_media: 0, referral: 0, cold_call: 0,
      advertisement: 0, email: 0, event: 0, whatsapp: 0, other: 0
    }
  };
  
  leads.forEach(lead => {
    stats.statusDistribution[lead.status]++;
    stats.priorityDistribution[lead.priority]++;
    stats.sourceDistribution[lead.source]++;
  });
  
  return stats;
};