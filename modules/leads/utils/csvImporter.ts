/**
 * CSV IMPORTER FOR LEADS
 * 
 * Utilidad para importar leads masivamente desde archivos CSV
 * Mapea datos de CRM existente al modelo de leads interno
 */

import { ILead, LeadStatus, LeadSource, LeadPriority } from '../types/leads';

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

// Función para extraer teléfono del comercial o buscar en otros campos
const extractPhoneFromEmail = (email: string): string | undefined => {
  // Intentar extraer teléfono del email o nombre de usuario
  const phonePattern = /(\+?[0-9]{1,4}[-.\s]?)?[0-9]{4}[-.\s]?[0-9]{4}/;
  const match = email.match(phonePattern);
  
  if (match) {
    return match[0];
  }
  
  // Si no hay información real de teléfono, retornar undefined
  // para que se detecte como dato faltante
  return undefined;
};

// Función para generar un ID único
const generateLeadId = (): string => {
  return `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Función para crear Date para PostgreSQL (reemplaza Firebase timestamps)
const createPostgreSQLDate = (date?: Date): Date => {
  return date || new Date();
};

// Función para determinar la fuente del lead basado en el contexto
const inferLeadSource = (leadData: any): LeadSource => {
  const { Oportunidad, Actividades, Cliente } = leadData;
  
  // Analizar el nombre de la oportunidad para inferir la fuente
  const opportunity = (Oportunidad || '').toLowerCase();
  
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
  } else if ((Actividades || '').toLowerCase().includes('llamada')) {
    return 'cold_call';
  } else {
    return 'other';
  }
};

// Interfaz para Lead adaptada a PostgreSQL (sin Firebase timestamps)
interface IPostgreSQLLead {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  position?: string;
  qualification_score: number;
  is_qualified: boolean;
  qualification_notes?: string;
  contact_attempts: number;
  response_rate: number;
  converted_to_client: boolean;
  conversion_value?: number;
  conversion_date?: Date;
  notes?: string;
  internal_notes?: string;
  // tags field removed - not supported in current schema
  assigned_agent_name?: string;
  preferred_contact_method?: 'whatsapp' | 'phone' | 'email';
  last_contact_date?: Date;
  next_follow_up_date?: Date;
  created_at: Date;
  updated_at: Date;
}

// Función para mapear datos CSV usando headers inteligentes
const mapCSVData = (csvData: any): CSVLeadData => {
  const mapped: any = {};
  
  console.log('🔄 Mapeando datos CSV:', Object.keys(csvData));
  
  // Mapeo inteligente de cada campo
  Object.keys(HEADER_MAPPING).forEach(targetField => {
    const variations = [targetField, ...HEADER_MAPPING[targetField]];
    
    for (const variation of variations) {
      const found = Object.keys(csvData).find(key => 
        key.toLowerCase().includes(variation.toLowerCase()) || 
        variation.toLowerCase().includes(key.toLowerCase())
      );
      
      if (found && csvData[found]) {
        mapped[targetField] = csvData[found];
        console.log(`✅ Mapeado: "${found}" → "${targetField}" = "${csvData[found]}"`);
        break;
      }
    }
  });
  
  // Si no se encontró Oportunidad pero hay NOMBRE COMPLETO o NOMBRE DE LA EMPRESA, usar eso
  if (!mapped.Oportunidad) {
    const nameFields = Object.keys(csvData).find(key => 
      key.toLowerCase().includes('nombre') || 
      key.toLowerCase().includes('empresa')
    );
    if (nameFields && csvData[nameFields]) {
      mapped.Oportunidad = csvData[nameFields];
      console.log(`✅ Mapeado automático: "${nameFields}" → "Oportunidad" = "${csvData[nameFields]}"`);
    }
  }
  
  // Mantener otros campos tal como están
  Object.keys(csvData).forEach(key => {
    if (!Object.keys(HEADER_MAPPING).some(target => 
      HEADER_MAPPING[target].some(variation => 
        key.toLowerCase().includes(variation.toLowerCase())
      )
    )) {
      mapped[key] = csvData[key];
    }
  });
  
  console.log('🎯 Resultado del mapeo:', mapped);
  
  return mapped as CSVLeadData;
};

// Función principal para convertir datos CSV a modelo de Lead
export const convertCSVToLead = (csvData: any): Omit<IPostgreSQLLead, 'id'> | null => {
  // Mapear datos usando headers inteligentes
  console.log('🔄 Datos originales CSV:', csvData);
  const mappedData = mapCSVData(csvData);
  console.log('🎯 Datos mapeados:', mappedData);
  // Filtrar filas vacías o inválidas (más flexible)
  const hasName = mappedData.Oportunidad && 
                  typeof mappedData.Oportunidad === 'string' &&
                  mappedData.Oportunidad.trim().length > 0;
  
  // Si no hay nombre válido, saltar esta fila
  if (!hasName) {
    console.warn(`⚠️ Fila omitida: sin nombre válido`);
    return null;
  }

  // VALIDACIÓN DE DATOS CRÍTICOS REQUERIDOS
  const name = mappedData.Oportunidad?.trim() || '';
  
  // Buscar teléfono en todos los campos posibles
  let phone = '';
  
  // 1. Buscar en campo Comercial
  if (mappedData.Comercial) {
    phone = extractPhoneFromEmail(mappedData.Comercial) || mappedData.Comercial;
  }
  
  // 2. Buscar en campo Cliente
  if (!phone && mappedData.Cliente) {
    phone = extractPhoneFromEmail(mappedData.Cliente) || '';
  }
  
  // 3. Buscar en cualquier campo que contenga NUMERO
  if (!phone) {
    Object.keys(mappedData).forEach(key => {
      if (key.toLowerCase().includes('numero') && mappedData[key]) {
        phone = mappedData[key];
      }
    });
  }
  
  // 4. Si aún no hay teléfono, buscar en otros campos
  if (!phone) {
    const allText = `${mappedData.Propiedades || ''} ${mappedData.Actividades || ''}`;
    phone = extractPhoneFromEmail(allText) || '';
  }
  
  // Validar que al menos tengamos un nombre
  if (!name) {
    console.warn(`⚠️ Lead omitido: sin nombre válido`);
    return null;
  }
  
  // Si no hay teléfono, usar un placeholder pero no omitir el lead
  if (!phone) {
    console.warn(`⚠️ Lead sin teléfono: ${name} - se usará placeholder`);
    phone = 'Sin teléfono';
  }
  
  console.log(`✅ Procesando lead: ${name} - Teléfono: ${phone}`);

  const isCompany = isCompanyName(name);
  
  // Mapear estado usando datos mapeados o fallback inteligente
  const status = STATUS_MAPPING[mappedData.Etapa] || 'new';
  
  // Mapear prioridad usando datos mapeados o fallback
  const priority = PRIORITY_MAPPING[mappedData.Prioridad] || 'medium';
  
  // Inferir fuente
  const source = inferLeadSource(mappedData);
  
  // Calcular score de calificación basado en probabilidad
  const probability = parseFloat((mappedData.Probabilidad || '0').replace(',', '.')) || 0;
  const qualification_score = Math.min(Math.round(probability), 100);
  
  // Determinar si está calificado
  const is_qualified = qualification_score > 50;
  
  // Procesar valor de conversión
  const expectedRevenue = parseFloat((mappedData['Ingresos esperados'] || '0').replace(',', '.')) || 0;
  
  // Usar el teléfono ya validado anteriormente
  const now = createPostgreSQLDate();
  
  const leadData: Omit<IPostgreSQLLead, 'id'> = {
    // Campos requeridos (ya validados arriba)
    name: name,
    phone: phone, // Usar el teléfono (puede ser placeholder si no se encontró)
    status: status,
    source: source,
    
    // Información de contacto
    ...(mappedData.Cliente && mappedData.Cliente.includes('@') && { email: mappedData.Cliente }),
    preferred_contact_method: 'phone' as const,
    
    // Información de negocio
    ...(isCompany && { company: name }),
    ...(!isCompany && { position: 'Propietario' }),
    priority: priority,
    
    // Calificación
    qualification_score: qualification_score,
    is_qualified: is_qualified,
    ...(mappedData.Actividades && { qualification_notes: mappedData.Actividades }),
    
    // Seguimiento
    contact_attempts: 0,
    response_rate: 0,
    
    // Conversión
    converted_to_client: status === 'won',
    ...(status === 'won' && expectedRevenue > 0 && { conversion_value: expectedRevenue }),
    ...(status === 'won' && { conversion_date: now }),
    
    // Notas y tags
    ...(mappedData.Propiedades && { notes: mappedData.Propiedades }),
    internal_notes: `Importado de CRM. Etapa original: ${mappedData.Etapa || 'No especificada'}. Probabilidad: ${mappedData.Probabilidad || '0'}%`,
    // tags field removed - not supported in current schema
    
    // Agente asignado
    ...(mappedData['Equipo de ventas'] && { assigned_agent_name: mappedData['Equipo de ventas'] }),
    
    // Timestamps del sistema
    created_at: now,
    updated_at: now
  };

  return leadData;
};

// Función para detectar el separador CSV
const detectCSVSeparator = (csvContent: string): string => {
  const firstLine = csvContent.split('\n')[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  
  // Si hay más punto y comas que comas, usar punto y coma
  if (semicolonCount > commaCount) {
    console.log('🔍 Detectado separador: punto y coma (;)');
    return ';';
  } else {
    console.log('🔍 Detectado separador: coma (,)');
    return ',';
  }
};

// Función para convertir datos usando mapeo personalizado
export const convertCSVToLeadWithMapping = (
  csvData: Record<string, string>, 
  mapping: Record<string, string>
): Omit<IPostgreSQLLead, 'id'> | null => {
  // Aplicar mapeo personalizado
  const mappedData: Record<string, string> = {};
  
  // Mapear campos según el mapeo proporcionado
  Object.entries(mapping).forEach(([systemField, csvColumn]) => {
    if (csvData[csvColumn]) {
      mappedData[systemField] = csvData[csvColumn];
    }
  });

  console.log('🔄 Datos mapeados personalizadamente:', mappedData);

  // Validar datos críticos
  const name = mappedData.name || mappedData.company || '';
  if (!name.trim()) {
    console.warn('⚠️ Lead omitido: sin nombre válido');
    return null;
  }

  const phone = mappedData.phone || 'Sin teléfono';
  const email = mappedData.email;
  const company = mappedData.company;
  
  // Mapear estado con fallback
  const status = STATUS_MAPPING[mappedData.status] || 'new';
  const priority = PRIORITY_MAPPING[mappedData.priority] || 'medium';
  const source = SOURCE_MAPPING[mappedData.source] || 'other';
  
  // Calcular score de calificación
  const qualificationScore = parseInt(mappedData.qualification_score) || 50;
  const isQualified = qualificationScore > 50;

  const now = createPostgreSQLDate();

  return {
    name: name.trim(),
    phone: phone,
    email: email || undefined,
    company: company || undefined,
    source: source,
    status: status,
    priority: priority,
    position: mappedData.position || undefined,
    qualification_score: qualificationScore,
    is_qualified: isQualified,
    qualification_notes: mappedData.notes || undefined,
    contact_attempts: 0,
    response_rate: 0,
    converted_to_client: status === 'won',
    conversion_value: mappedData.conversion_value ? parseFloat(mappedData.conversion_value) : undefined,
    notes: mappedData.notes || undefined,
    internal_notes: `Importado con mapeo personalizado. Campos originales disponibles.`,
    // tags field removed - not supported in current schema
    assigned_agent_name: mappedData.assigned_agent_name || undefined,
    preferred_contact_method: 'phone' as const,
    last_contact_date: undefined,
    next_follow_up_date: undefined,
    created_at: now,
    updated_at: now
  };
};

// Función para procesar CSV con mapeo personalizado
export const processCSVFileWithMapping = (
  csvContent: string, 
  mapping: Record<string, string>
): { 
  leads: (Omit<IPostgreSQLLead, 'id'>)[], 
  totalRows: number, 
  skippedRows: number 
} => {
  const lines = csvContent.split('\n');
  const separator = detectCSVSeparator(csvContent);
  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  const leads: (Omit<IPostgreSQLLead, 'id'>)[] = [];
  let totalRows = 0;
  let skippedRows = 0;
  
  console.log('📋 Headers detectados:', headers);
  console.log('🗺️ Mapeo aplicado:', mapping);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    totalRows++;
    const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
    const csvData: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      csvData[header] = values[index] || '';
    });
    
    const lead = convertCSVToLeadWithMapping(csvData, mapping);
    if (lead) {
      leads.push(lead);
    } else {
      skippedRows++;
    }
  }
  
  console.log(`📊 Procesamiento CSV con mapeo completado: ${leads.length} leads válidos, ${skippedRows} filas omitidas de ${totalRows} total`);
  
  return { leads, totalRows, skippedRows };
};

// Función para procesar archivo CSV completo
export const processCSVFile = (csvContent: string): { 
  leads: (Omit<IPostgreSQLLead, 'id'>)[], 
  totalRows: number, 
  skippedRows: number 
} => {
  const lines = csvContent.split('\n');
  const separator = detectCSVSeparator(csvContent);
  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  const leads: (Omit<IPostgreSQLLead, 'id'>)[] = [];
  let totalRows = 0;
  let skippedRows = 0;
  
  console.log('📋 Headers detectados:', headers);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    totalRows++;
    const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
    const csvData: any = {};
    
    headers.forEach((header, index) => {
      csvData[header] = values[index] || '';
    });
    
    const lead = convertCSVToLead(csvData);
    if (lead) {
      leads.push(lead);
    } else {
      skippedRows++;
    }
  }
  
  console.log(`📊 Procesamiento CSV completado: ${leads.length} leads válidos, ${skippedRows} filas omitidas de ${totalRows} total`);
  
  return { leads, totalRows, skippedRows };
};

// Mapeo inteligente de headers - reconoce variaciones comunes
const HEADER_MAPPING: Record<string, string[]> = {
  'Etapa': ['etapa', 'estado', 'status', 'stage', 'fase'],
  'Oportunidad': ['oportunidad', 'nombre', 'name', 'lead', 'prospecto', 'cliente', 'empresa', 'nombre completo', 'nombre de la empresa'],
  'Probabilidad': ['probabilidad', 'probability', 'score', 'puntaje', 'porcentaje', '%'],
  'Prioridad': ['prioridad', 'priority', 'importancia', 'urgencia'],
  'Comercial': ['comercial', 'telefono', 'teléfono', 'phone', 'numero', 'número', 'contacto'],
  'Cliente': ['cliente', 'correo', 'email', 'correo electronico', 'correo electrónico'],
  'Propiedades': ['propiedades', 'rubro', 'sector', 'industria', 'categoria', 'categoría']
};

// Función para encontrar header similar
const findSimilarHeader = (targetHeader: string, availableHeaders: string[]): string | null => {
  const variations = HEADER_MAPPING[targetHeader] || [];
  const allVariations = [targetHeader.toLowerCase(), ...variations];
  
  for (const variation of allVariations) {
    const found = availableHeaders.find(h => 
      h.toLowerCase().includes(variation) || 
      variation.includes(h.toLowerCase())
    );
    if (found) return found;
  }
  
  return null;
};

// Función para validar estructura del CSV de manera inteligente
export const validateCSVStructure = (csvContent: string): { isValid: boolean; errors: string[]; suggestions?: string[] } => {
  const errors: string[] = [];
  const suggestions: string[] = [];
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    errors.push('El archivo CSV debe tener al menos una fila de datos además del header');
  }
  
  const separator = detectCSVSeparator(csvContent);
  const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
  const requiredHeaders = ['Etapa', 'Oportunidad', 'Probabilidad', 'Prioridad'];
  
  console.log('🔍 Headers disponibles en CSV:', headers);
  
  const criticalMissing: string[] = [];
  const headerMap: Record<string, string> = {};
  
  requiredHeaders.forEach(required => {
    const exactMatch = headers.find(h => h === required);
    if (exactMatch) {
      headerMap[required] = exactMatch;
      return;
    }
    
    const similarHeader = findSimilarHeader(required, headers);
    if (similarHeader) {
      headerMap[required] = similarHeader;
      suggestions.push(`✓ "${required}" mapeado a "${similarHeader}"`);
    } else {
      // Para Oportunidad, buscar cualquier campo que contenga "nombre"
      if (required === 'Oportunidad') {
        const nameField = headers.find(h => 
          h.toLowerCase().includes('nombre') || 
          h.toLowerCase().includes('empresa') ||
          h.toLowerCase().includes('client')
        );
        if (nameField) {
          headerMap[required] = nameField;
          suggestions.push(`✓ "${required}" mapeado automáticamente a "${nameField}"`);
        } else {
          criticalMissing.push(required);
          errors.push(`❌ Header crítico faltante: ${required} (nombre del lead/prospecto)`);
        }
      } else {
        suggestions.push(`⚠️ Header "${required}" no encontrado, se usarán valores por defecto`);
      }
    }
  });
  
  if (suggestions.length > 0) {
    console.log('📋 Mapeo inteligente de headers:', suggestions);
  }
  
  return {
    isValid: criticalMissing.length === 0,
    errors,
    suggestions
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
export const generateImportStats = (
  leads: (Omit<IPostgreSQLLead, 'id'>)[], 
  totalRows: number, 
  skippedRows: number
): ImportStats => {
  const stats: ImportStats = {
    totalRows: totalRows,
    validLeads: leads.length,
    skippedRows: skippedRows,
    statusDistribution: {
      new: 0, interested: 0, qualified: 0, follow_up: 0,
      proposal_current: 0, proposal_previous: 0, negotiation: 0,
      won: 0, lost: 0, nurturing: 0, cold: 0
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
  
  console.log(`📈 Estadísticas generadas: ${stats.validLeads} leads válidos de ${stats.totalRows} filas procesadas`);
  
  return stats;
};