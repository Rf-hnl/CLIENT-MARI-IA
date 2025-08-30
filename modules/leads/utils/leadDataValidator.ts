/**
 * LEAD DATA VALIDATOR
 * 
 * Utilidad para validar y detectar datos faltantes en leads
 * Identifica campos importantes que no han sido completados
 */

import { ILead, LeadPriority, LeadSource } from '../types/leads';

export interface MissingFieldInfo {
  field: keyof ILead;
  label: string;
  category: 'contact' | 'personal' | 'business' | 'system';
  importance: 'critical' | 'important' | 'optional';
  placeholder?: string;
  description: string;
}

// Configuración de campos importantes
export const IMPORTANT_FIELDS: MissingFieldInfo[] = [
  // Campos de contacto críticos
  {
    field: 'phone',
    label: 'Teléfono',
    category: 'contact',
    importance: 'critical',
    placeholder: '+507 0000-0000',
    description: 'Teléfono principal para contacto'
  },
  {
    field: 'email',
    label: 'Email',
    category: 'contact',
    importance: 'important',
    placeholder: 'correo@ejemplo.com',
    description: 'Correo electrónico para seguimiento'
  },
  
  // Campos personales importantes
  {
    field: 'national_id',
    label: 'Cédula',
    category: 'personal',
    importance: 'important',
    placeholder: '8-123-456',
    description: 'Cédula de identidad'
  },
  {
    field: 'address',
    label: 'Dirección',
    category: 'personal',
    importance: 'optional',
    placeholder: 'Calle 50, Ciudad de Panamá',
    description: 'Dirección física completa'
  },
  {
    field: 'city',
    label: 'Ciudad',
    category: 'personal',
    importance: 'optional',
    placeholder: 'Ciudad de Panamá',
    description: 'Ciudad de residencia'
  },
  {
    field: 'province',
    label: 'Provincia',
    category: 'personal',
    importance: 'optional',
    placeholder: 'Panamá',
    description: 'Provincia de residencia'
  },
  
  // Campos de negocio
  {
    field: 'company',
    label: 'Empresa',
    category: 'business',
    importance: 'important',
    placeholder: 'Empresa S.A.',
    description: 'Empresa donde trabaja'
  },
  {
    field: 'position',
    label: 'Posición',
    category: 'business',
    importance: 'important',
    placeholder: 'Gerente General',
    description: 'Cargo o posición en la empresa'
  },
  {
    field: 'budget_range',
    label: 'Rango de Presupuesto',
    category: 'business',
    importance: 'optional',
    placeholder: '$1,000 - $5,000',
    description: 'Rango de presupuesto disponible'
  },
  {
    field: 'decision_timeline',
    label: 'Timeline de Decisión',
    category: 'business',
    importance: 'optional',
    placeholder: '1-3 meses',
    description: 'Tiempo estimado para tomar decisión'
  },
  {
    field: 'best_contact_time',
    label: 'Mejor Hora de Contacto',
    category: 'contact',
    importance: 'optional',
    placeholder: 'Mañanas (9AM-12PM)',
    description: 'Horario preferido para contacto'
  }
];

// Detectar si un valor es un placeholder o está vacío
export const isPlaceholderValue = (field: keyof ILead, value: any): boolean => {
  if (!value || value === '') return true;
  
  // Placeholders específicos que usamos
  const placeholders = {
    phone: ['+507 6000-0000', '+507 0000-0000', 'Sin teléfono'],
    email: ['contacto@ejemplo.com', 'Sin email'],
    name: ['Lead sin nombre', 'Sin nombre'],
    company: ['Empresa sin nombre'],
    position: ['Propietario'] // Este podría ser válido, pero lo marcamos como posible placeholder
  };
  
  const fieldPlaceholders = placeholders[field as keyof typeof placeholders];
  if (fieldPlaceholders && fieldPlaceholders.includes(value)) {
    return true;
  }
  
  return false;
};

// Detectar datos faltantes en un lead
export const getMissingFields = (lead: ILead): MissingFieldInfo[] => {
  const missing: MissingFieldInfo[] = [];
  
  IMPORTANT_FIELDS.forEach(fieldInfo => {
    const value = lead[fieldInfo.field];
    
    // Campo está vacío o es un placeholder
    if (!value || isPlaceholderValue(fieldInfo.field, value)) {
      missing.push(fieldInfo);
    }
  });
  
  return missing;
};

// Categorizar datos faltantes por importancia
export const categorizeMissingFields = (missingFields: MissingFieldInfo[]) => {
  return {
    critical: missingFields.filter(f => f.importance === 'critical'),
    important: missingFields.filter(f => f.importance === 'important'),
    optional: missingFields.filter(f => f.importance === 'optional')
  };
};

// Calcular porcentaje de completitud
export const calculateCompleteness = (lead: ILead): number => {
  const totalFields = IMPORTANT_FIELDS.length;
  const missingFields = getMissingFields(lead);
  const completedFields = totalFields - missingFields.length;
  
  return Math.round((completedFields / totalFields) * 100);
};

// Obtener siguiente campo más importante para completar
export const getNextFieldToComplete = (lead: ILead): MissingFieldInfo | null => {
  const missing = getMissingFields(lead);
  
  // Priorizar por importancia
  const critical = missing.filter(f => f.importance === 'critical');
  if (critical.length > 0) return critical[0];
  
  const important = missing.filter(f => f.importance === 'important');
  if (important.length > 0) return important[0];
  
  const optional = missing.filter(f => f.importance === 'optional');
  if (optional.length > 0) return optional[0];
  
  return null;
};

// Obtener el estado de los datos del lead
export const getLeadDataStatus = (lead: ILead) => {
  const missingFields = getMissingFields(lead);
  const categorized = categorizeMissingFields(missingFields);
  const completeness = calculateCompleteness(lead);
  
  let status: 'complete' | 'mostly_complete' | 'incomplete' | 'critical_missing' = 'complete';
  let statusColor = 'text-green-600';
  let statusBg = 'bg-green-50';
  let statusIcon = '✅';
  
  if (categorized.critical.length > 0) {
    status = 'critical_missing';
    statusColor = 'text-red-600';
    statusBg = 'bg-red-50';
    statusIcon = '🚨';
  } else if (categorized.important.length > 0) {
    status = 'incomplete';
    statusColor = 'text-orange-600';
    statusBg = 'bg-orange-50';
    statusIcon = '⚠️';
  } else if (categorized.optional.length > 0) {
    status = 'mostly_complete';
    statusColor = 'text-blue-600';
    statusBg = 'bg-blue-50';
    statusIcon = '📝';
  }
  
  return {
    status,
    statusColor,
    statusBg,
    statusIcon,
    completeness,
    missingCount: missingFields.length,
    categorized,
    nextField: getNextFieldToComplete(lead)
  };
};