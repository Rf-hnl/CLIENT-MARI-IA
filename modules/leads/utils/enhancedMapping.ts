/**
 * ENHANCED MAPPING SYSTEM
 * 
 * Extended auto-mapping with Spanish/English synonyms and intelligent field detection
 * Supports hierarchical paths for JSON/XML and conflict resolution
 */

import { NormalizedRecord } from './multiFormatParsers';

export interface FieldSynonyms {
  primary: string;
  synonyms: string[];
  priority: number; // Higher number = higher priority
  examples: string[];
  validation?: (value: any) => boolean;
  normalization?: (value: any) => string | null;
}

export interface MappingConflict {
  systemField: string;
  candidates: Array<{
    csvColumn: string;
    confidence: number;
    matchType: 'exact' | 'synonym' | 'partial' | 'pattern';
    sample?: string;
  }>;
}

export interface MappingResult {
  mapping: Record<string, string>;
  conflicts: MappingConflict[];
  unmappedFields: string[];
  confidence: number; // 0-100 overall confidence
  suggestions: string[];
}

// Enhanced field definitions with Spanish/English synonyms
const ENHANCED_FIELD_DEFINITIONS: Record<string, FieldSynonyms> = {
  name: {
    primary: 'name',
    synonyms: [
      // Spanish
      'nombre', 'nombre_completo', 'nombre completo', 'cliente', 'prospecto',
      'razon_social', 'razón social', 'empresa', 'compañia', 'compañía',
      'denominacion', 'denominación', 'oportunidad', 'lead', 'contacto',
      
      // English
      'name', 'full_name', 'full name', 'client_name', 'contact_name',
      'customer_name', 'lead_name', 'prospect_name', 'company_name',
      'business_name', 'organization', 'organisation', 'entity',
      
      // Patterns
      'nombre_', '_nombre', 'name_', '_name', 'client', 'customer',
      'prospect', 'lead', 'opportunity'
    ],
    priority: 100,
    examples: ['Juan Pérez', 'Empresa ABC', 'Restaurant El Buen Sabor'],
    validation: (value) => value && String(value).trim().length >= 2,
    normalization: (value) => String(value).trim()
  },

  phone: {
    primary: 'phone',
    synonyms: [
      // Spanish
      'telefono', 'teléfono', 'tel', 'numero', 'número', 'numero_telefono',
      'número_teléfono', 'celular', 'movil', 'móvil', 'whatsapp', 'comercial',
      'contacto_telefono', 'telefono_contacto', 'fono',
      
      // English
      'phone', 'telephone', 'tel', 'phone_number', 'mobile', 'cell',
      'cellular', 'contact_phone', 'business_phone', 'work_phone',
      'primary_phone', 'main_phone',
      
      // Patterns
      'phone_', '_phone', 'tel_', '_tel', 'numero_', '_numero'
    ],
    priority: 95,
    examples: ['+507-6000-1234', '555-0123', '6000-1234'],
    validation: (value) => {
      const phone = String(value).replace(/[^\d+]/g, '');
      return phone.length >= 7 && phone.length <= 15;
    },
    normalization: (value) => {
      const cleaned = String(value).replace(/[^\d+\-\s()]/g, '').trim();
      return cleaned || null;
    }
  },

  email: {
    primary: 'email',
    synonyms: [
      // Spanish
      'email', 'correo', 'correo_electronico', 'correo electrónico',
      'mail', 'e-mail', 'correo_email', 'email_contacto',
      'correo_contacto', 'direccion_email', 'dirección_email',
      
      // English
      'email', 'e-mail', 'mail', 'email_address', 'contact_email',
      'business_email', 'work_email', 'primary_email', 'main_email',
      
      // Patterns
      'email_', '_email', 'mail_', '_mail', 'correo_', '_correo'
    ],
    priority: 90,
    examples: ['juan@email.com', 'contacto@empresa.com'],
    validation: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value));
    },
    normalization: (value) => String(value).toLowerCase().trim()
  },

  company: {
    primary: 'company',
    synonyms: [
      // Spanish
      'empresa', 'compañia', 'compañía', 'organizacion', 'organización',
      'razon_social', 'razón social', 'entidad', 'institucion', 'institución',
      'negocio', 'corporacion', 'corporación', 'firma',
      
      // English
      'company', 'organization', 'organisation', 'business', 'corporation',
      'corp', 'enterprise', 'firm', 'institution', 'entity',
      
      // Patterns
      'company_', '_company', 'org_', '_org', 'business_', '_business'
    ],
    priority: 70,
    examples: ['Tech Solutions Inc.', 'Marketing Digital SA'],
    validation: (value) => value && String(value).trim().length >= 2,
    normalization: (value) => String(value).trim()
  },

  status: {
    primary: 'status',
    synonyms: [
      // Spanish
      'estado', 'estatus', 'etapa', 'fase', 'situacion', 'situación',
      'condicion', 'condición', 'estado_lead', 'estado_contacto',
      'pipeline', 'proceso', 'nivel',
      
      // English
      'status', 'state', 'stage', 'phase', 'condition', 'situation',
      'lead_status', 'contact_status', 'pipeline_stage', 'process_stage',
      
      // Patterns
      'status_', '_status', 'state_', '_state', 'stage_', '_stage'
    ],
    priority: 60,
    examples: ['Nuevo', 'Calificado', 'En seguimiento', 'Cerrado'],
    validation: (value) => value && String(value).trim().length > 0,
    normalization: (value) => String(value).trim()
  },

  priority: {
    primary: 'priority',
    synonyms: [
      // Spanish
      'prioridad', 'importancia', 'urgencia', 'nivel_prioridad',
      'grado_importancia', 'criticidad', 'valor_prioridad',
      
      // English
      'priority', 'importance', 'urgency', 'priority_level',
      'importance_level', 'criticality', 'rank', 'ranking',
      
      // Patterns
      'priority_', '_priority', 'importance_', '_importance'
    ],
    priority: 50,
    examples: ['Alta', 'Media', 'Baja', 'Urgente'],
    validation: (value) => value && String(value).trim().length > 0,
    normalization: (value) => String(value).trim()
  },

  source: {
    primary: 'source',
    synonyms: [
      // Spanish
      'fuente', 'origen', 'canal', 'procedencia', 'medio', 'via',
      'vía', 'canal_origen', 'fuente_lead', 'origen_contacto',
      
      // English
      'source', 'origin', 'channel', 'medium', 'referral_source',
      'lead_source', 'traffic_source', 'acquisition_channel',
      
      // Patterns
      'source_', '_source', 'origin_', '_origin', 'channel_', '_channel'
    ],
    priority: 40,
    examples: ['Website', 'Redes Sociales', 'Referido', 'Email'],
    validation: (value) => value && String(value).trim().length > 0,
    normalization: (value) => String(value).trim()
  },

  position: {
    primary: 'position',
    synonyms: [
      // Spanish
      'cargo', 'puesto', 'posicion', 'posición', 'titulo', 'título',
      'funcion', 'función', 'rol', 'ocupacion', 'ocupación',
      
      // English
      'position', 'title', 'job_title', 'role', 'function',
      'occupation', 'designation', 'rank',
      
      // Patterns
      'position_', '_position', 'title_', '_title', 'role_', '_role'
    ],
    priority: 30,
    examples: ['Gerente', 'Director', 'Propietario', 'CEO'],
    validation: (value) => value && String(value).trim().length > 0,
    normalization: (value) => String(value).trim()
  },

  notes: {
    primary: 'notes',
    synonyms: [
      // Spanish
      'notas', 'observaciones', 'comentarios', 'descripcion', 'descripción',
      'detalles', 'informacion', 'información', 'rubro', 'sector',
      'industria', 'categoria', 'categoría', 'propiedades',
      
      // English
      'notes', 'comments', 'description', 'details', 'information',
      'remarks', 'observations', 'additional_info', 'properties',
      
      // Patterns
      'notes_', '_notes', 'comment_', '_comment', 'desc_', '_desc'
    ],
    priority: 20,
    examples: ['Interesado en servicios premium', 'Llamar después de las 2pm'],
    validation: (value) => value && String(value).trim().length > 0,
    normalization: (value) => String(value).trim()
  },

  qualification_score: {
    primary: 'qualification_score',
    synonyms: [
      // Spanish
      'score', 'puntaje', 'puntuacion', 'puntuación', 'calificacion',
      'calificación', 'rating', 'valor', 'probabilidad', 'porcentaje',
      
      // English
      'score', 'rating', 'qualification', 'probability', 'percentage',
      'lead_score', 'quality_score', 'rank_score',
      
      // Patterns
      'score_', '_score', 'rating_', '_rating', '%', 'percent'
    ],
    priority: 25,
    examples: ['75', '90', '45', '85%'],
    validation: (value) => {
      const num = parseFloat(String(value).replace('%', ''));
      return !isNaN(num) && num >= 0 && num <= 100;
    },
    normalization: (value) => {
      const cleaned = String(value).replace(/[^0-9.,]/g, '');
      const num = parseFloat(cleaned.replace(',', '.'));
      return !isNaN(num) ? String(Math.min(Math.max(num, 0), 100)) : null;
    }
  }
};

/**
 * Enhanced Auto-Mapping Class
 */
export class EnhancedAutoMapper {
  /**
   * Perform intelligent auto-mapping with conflict detection
   */
  static performMapping(
    availableFields: string[],
    sampleData?: NormalizedRecord[]
  ): MappingResult {
    const mapping: Record<string, string> = {};
    const conflicts: MappingConflict[] = [];
    const unmappedFields: string[] = [...availableFields];
    const suggestions: string[] = [];

    // Track used fields to prevent double-mapping
    const usedFields = new Set<string>();

    // Process each system field by priority
    const sortedSystemFields = Object.entries(ENHANCED_FIELD_DEFINITIONS)
      .sort(([, a], [, b]) => b.priority - a.priority);

    for (const [systemField, definition] of sortedSystemFields) {
      const candidates = this.findCandidates(systemField, definition, availableFields, sampleData);
      
      if (candidates.length === 0) {
        suggestions.push(`⚠️ No matches found for "${systemField}". Consider manual mapping.`);
        continue;
      }

      if (candidates.length === 1) {
        const candidate = candidates[0];
        if (!usedFields.has(candidate.csvColumn)) {
          mapping[systemField] = candidate.csvColumn;
          usedFields.add(candidate.csvColumn);
          unmappedFields.splice(unmappedFields.indexOf(candidate.csvColumn), 1);
          suggestions.push(`✅ "${systemField}" mapped to "${candidate.csvColumn}" (${candidate.matchType}, ${candidate.confidence}%)`);
        }
      } else {
        // Multiple candidates - check if any are clearly better
        const bestCandidate = candidates
          .filter(c => !usedFields.has(c.csvColumn))
          .sort((a, b) => b.confidence - a.confidence)[0];

        if (bestCandidate && bestCandidate.confidence >= 80) {
          mapping[systemField] = bestCandidate.csvColumn;
          usedFields.add(bestCandidate.csvColumn);
          unmappedFields.splice(unmappedFields.indexOf(bestCandidate.csvColumn), 1);
          suggestions.push(`✅ "${systemField}" mapped to "${bestCandidate.csvColumn}" (${bestCandidate.matchType}, ${bestCandidate.confidence}%)`);
        } else {
          // Store conflict for manual resolution
          conflicts.push({
            systemField,
            candidates: candidates.filter(c => !usedFields.has(c.csvColumn))
          });
          suggestions.push(`🔧 Multiple matches for "${systemField}". Manual selection needed.`);
        }
      }
    }

    // Calculate overall confidence
    const totalSystemFields = Object.keys(ENHANCED_FIELD_DEFINITIONS).length;
    const mappedFields = Object.keys(mapping).length;
    const confidence = Math.round((mappedFields / totalSystemFields) * 100);

    return {
      mapping,
      conflicts,
      unmappedFields,
      confidence,
      suggestions
    };
  }

  /**
   * Find candidate fields for a system field
   */
  private static findCandidates(
    systemField: string,
    definition: FieldSynonyms,
    availableFields: string[],
    sampleData?: NormalizedRecord[]
  ): Array<{
    csvColumn: string;
    confidence: number;
    matchType: 'exact' | 'synonym' | 'partial' | 'pattern';
    sample?: string;
  }> {
    const candidates: Array<{
      csvColumn: string;
      confidence: number;
      matchType: 'exact' | 'synonym' | 'partial' | 'pattern';
      sample?: string;
    }> = [];

    for (const field of availableFields) {
      const match = this.calculateFieldMatch(field, definition, sampleData);
      if (match.confidence > 0) {
        candidates.push({
          csvColumn: field,
          ...match,
          sample: this.getSampleValue(field, sampleData)
        });
      }
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate match confidence between a CSV field and system field definition
   */
  private static calculateFieldMatch(
    csvField: string,
    definition: FieldSynonyms,
    sampleData?: NormalizedRecord[]
  ): {
    confidence: number;
    matchType: 'exact' | 'synonym' | 'partial' | 'pattern';
  } {
    const normalizedField = csvField.toLowerCase().trim();
    const primary = definition.primary.toLowerCase();

    // Exact match with primary field
    if (normalizedField === primary) {
      return { confidence: 100, matchType: 'exact' };
    }

    // Check synonyms
    for (const synonym of definition.synonyms) {
      const normalizedSynonym = synonym.toLowerCase();
      
      // Exact synonym match
      if (normalizedField === normalizedSynonym) {
        return { confidence: 95, matchType: 'synonym' };
      }
      
      // Partial synonym match
      if (normalizedField.includes(normalizedSynonym) || normalizedSynonym.includes(normalizedField)) {
        const lengthRatio = Math.min(normalizedField.length, normalizedSynonym.length) / 
                           Math.max(normalizedField.length, normalizedSynonym.length);
        const confidence = Math.round(75 * lengthRatio);
        return { confidence, matchType: 'partial' };
      }
    }

    // Pattern matching (underscore/camelCase variations)
    const patterns = [
      primary + '_',
      '_' + primary,
      primary.replace('_', ''),
      primary.replace('_', ' '),
      primary.charAt(0).toUpperCase() + primary.slice(1) // camelCase
    ];

    for (const pattern of patterns) {
      if (normalizedField.includes(pattern.toLowerCase())) {
        return { confidence: 60, matchType: 'pattern' };
      }
    }

    // Content-based validation if sample data available
    if (sampleData && definition.validation) {
      const validSamples = this.countValidSamples(csvField, definition.validation, sampleData);
      if (validSamples.total > 0) {
        const validationScore = (validSamples.valid / validSamples.total) * 100;
        if (validationScore >= 70) {
          return { confidence: Math.round(validationScore * 0.5), matchType: 'pattern' };
        }
      }
    }

    return { confidence: 0, matchType: 'exact' };
  }

  /**
   * Count valid samples for validation function
   */
  private static countValidSamples(
    field: string,
    validation: (value: any) => boolean,
    sampleData: NormalizedRecord[]
  ): { valid: number; total: number } {
    let valid = 0;
    let total = 0;

    for (const record of sampleData.slice(0, 10)) { // Check first 10 samples
      if (record[field] !== null && record[field] !== undefined && record[field] !== '') {
        total++;
        if (validation(record[field])) {
          valid++;
        }
      }
    }

    return { valid, total };
  }

  /**
   * Get sample value for preview
   */
  private static getSampleValue(field: string, sampleData?: NormalizedRecord[]): string | undefined {
    if (!sampleData || sampleData.length === 0) return undefined;

    for (const record of sampleData.slice(0, 5)) {
      const value = record[field];
      if (value && String(value).trim().length > 0) {
        return String(value).substring(0, 50); // Truncate for display
      }
    }

    return undefined;
  }

  /**
   * Resolve mapping conflicts by user selection
   */
  static resolveConflicts(
    currentMapping: Record<string, string>,
    resolutions: Record<string, string> // systemField -> csvColumn
  ): Record<string, string> {
    return {
      ...currentMapping,
      ...resolutions
    };
  }

  /**
   * Validate final mapping before processing
   */
  static validateMapping(mapping: Record<string, string>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    const requiredFields = ['name']; // Name is absolutely required
    for (const required of requiredFields) {
      if (!mapping[required]) {
        errors.push(`Required field "${required}" is not mapped`);
      }
    }

    // Check that at least phone or email is mapped
    if (!mapping.phone && !mapping.email) {
      errors.push('Either "phone" or "email" must be mapped for contact information');
    }

    // Check for duplicate mappings
    const usedColumns = Object.values(mapping).filter(Boolean);
    const duplicates = usedColumns.filter((col, index) => usedColumns.indexOf(col) !== index);
    
    duplicates.forEach(col => {
      errors.push(`Column "${col}" is mapped to multiple system fields`);
    });

    // Warnings for missing optional but important fields
    const importantFields = ['status', 'priority', 'source'];
    for (const field of importantFields) {
      if (!mapping[field]) {
        warnings.push(`Optional field "${field}" is not mapped - will use default values`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Helper for hierarchical path selection (JSON/XML)
 */
export class HierarchicalPathHelper {
  /**
   * Extract all possible paths from a hierarchical object
   */
  static extractPaths(obj: any, prefix = '', maxDepth = 5): string[] {
    if (maxDepth <= 0) return [];
    
    const paths: string[] = [];
    
    if (Array.isArray(obj)) {
      // For arrays, use first element to get structure
      if (obj.length > 0) {
        return this.extractPaths(obj[0], prefix, maxDepth - 1);
      }
    } else if (obj && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);
        
        if (value && typeof value === 'object') {
          paths.push(...this.extractPaths(value, currentPath, maxDepth - 1));
        }
      }
    }
    
    return paths;
  }

  /**
   * Get value from object using dot notation path
   */
  static getValueByPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return null;
      }
      
      if (Array.isArray(current)) {
        // For arrays, take first element
        current = current[0];
      }
      
      current = current[part];
    }
    
    return current;
  }

  /**
   * Generate sample values for each path
   */
  static generatePathSamples(data: any[], paths: string[]): Record<string, string[]> {
    const samples: Record<string, string[]> = {};
    
    for (const path of paths) {
      samples[path] = [];
      
      for (const item of data.slice(0, 5)) { // Get samples from first 5 items
        const value = this.getValueByPath(item, path);
        if (value !== null && value !== undefined) {
          const stringValue = String(value).substring(0, 50);
          if (stringValue && !samples[path].includes(stringValue)) {
            samples[path].push(stringValue);
          }
        }
      }
    }
    
    return samples;
  }
}