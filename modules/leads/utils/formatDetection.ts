/**
 * FORMAT DETECTION AND VALIDATION
 * 
 * Handles file format detection, MIME validation, and content sniffing
 * for multi-format import support (CSV, XML, XLSX, JSON)
 */

export type SupportedFormat = 'csv' | 'xml' | 'xlsx' | 'json';

export interface FormatDetectionResult {
  format: SupportedFormat | null;
  isValid: boolean;
  detectionMethod: 'extension' | 'mime' | 'content' | 'hybrid';
  confidence: number; // 0-100
  errors: string[];
  warnings: string[];
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  strictMimeValidation?: boolean;
  allowContentSniffing?: boolean;
}

// MIME type allowlist for security
const ALLOWED_MIME_TYPES: Record<SupportedFormat, string[]> = {
  csv: [
    'text/csv',
    'text/plain',
    'application/csv',
    'text/comma-separated-values'
  ],
  xml: [
    'text/xml',
    'application/xml',
    'application/xml-dtd'
  ],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  json: [
    'application/json',
    'text/json',
    'text/plain'
  ]
};

// File extension mapping
const EXTENSION_MAP: Record<string, SupportedFormat> = {
  'csv': 'csv',
  'xml': 'xml',
  'xlsx': 'xlsx',
  'xls': 'xlsx', // Treat XLS as XLSX for now
  'json': 'json'
};

// Content signature patterns for sniffing
const CONTENT_SIGNATURES: Record<SupportedFormat, RegExp[]> = {
  csv: [
    /^[^,\n]*,[^,\n]*(?:,[^,\n]*)*\r?\n/,  // CSV with commas
    /^[^;\n]*;[^;\n]*(?:;[^;\n]*)*\r?\n/   // CSV with semicolons
  ],
  xml: [
    /^\s*<\?xml\s+version/i,
    /^\s*<[a-zA-Z][^>]*>/
  ],
  xlsx: [
    /^PK\x03\x04/,  // ZIP signature (XLSX is a ZIP file)
    /^\x50\x4B\x03\x04/
  ],
  json: [
    /^\s*[\{\[]/,  // Starts with { or [
    /^\s*\{.*\}\s*$/s  // Basic JSON object structure
  ]
};

/**
 * Detect file format from filename extension
 */
export function detectFormatFromExtension(filename: string): SupportedFormat | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? EXTENSION_MAP[extension] || null : null;
}

/**
 * Validate MIME type against allowlist
 */
export function validateMimeType(mimeType: string): SupportedFormat | null {
  for (const [format, mimeTypes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimeTypes.includes(mimeType.toLowerCase())) {
      return format as SupportedFormat;
    }
  }
  return null;
}

/**
 * Detect format from file content using signatures
 */
export function detectFormatFromContent(content: string): SupportedFormat | null {
  const contentStart = content.substring(0, 1000); // Check first 1KB
  
  for (const [format, patterns] of Object.entries(CONTENT_SIGNATURES)) {
    for (const pattern of patterns) {
      if (pattern.test(contentStart)) {
        return format as SupportedFormat;
      }
    }
  }
  
  return null;
}

/**
 * Comprehensive format detection with validation
 */
export function detectFileFormat(
  file: File,
  content?: string,
  options: FileValidationOptions = {}
): FormatDetectionResult {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    strictMimeValidation = false,
    allowContentSniffing = true
  } = options;

  const result: FormatDetectionResult = {
    format: null,
    isValid: false,
    detectionMethod: 'extension',
    confidence: 0,
    errors: [],
    warnings: []
  };

  // 1. Size validation
  if (file.size > maxSizeBytes) {
    result.errors.push(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
    return result;
  }

  // 2. Extension-based detection
  const extensionFormat = detectFormatFromExtension(file.name);
  if (!extensionFormat) {
    result.errors.push(`Unsupported file extension. Supported: .csv, .xml, .xlsx, .json`);
    return result;
  }

  // 3. MIME type validation
  const mimeFormat = validateMimeType(file.type);
  if (strictMimeValidation && !mimeFormat) {
    result.errors.push(`Invalid MIME type: ${file.type}. Expected types for ${extensionFormat}: ${ALLOWED_MIME_TYPES[extensionFormat].join(', ')}`);
    return result;
  }

  // 4. Content sniffing (if content provided and enabled)
  let contentFormat: SupportedFormat | null = null;
  if (content && allowContentSniffing) {
    contentFormat = detectFormatFromContent(content);
  }

  // 5. Consensus logic
  const detections = [extensionFormat, mimeFormat, contentFormat].filter(Boolean);
  const uniqueDetections = [...new Set(detections)];

  if (uniqueDetections.length === 0) {
    result.errors.push('Unable to determine file format');
    return result;
  }

  if (uniqueDetections.length === 1) {
    // All methods agree or only one method available
    result.format = uniqueDetections[0] as SupportedFormat;
    result.confidence = 95;
    result.detectionMethod = content ? 'hybrid' : mimeFormat ? 'mime' : 'extension';
  } else {
    // Conflict resolution: prioritize extension, then content, then MIME
    if (extensionFormat) {
      result.format = extensionFormat;
      result.confidence = 75;
      result.detectionMethod = 'extension';
      
      if (contentFormat && contentFormat !== extensionFormat) {
        result.warnings.push(`File extension suggests ${extensionFormat} but content appears to be ${contentFormat}`);
      }
      
      if (mimeFormat && mimeFormat !== extensionFormat) {
        result.warnings.push(`File extension suggests ${extensionFormat} but MIME type suggests ${mimeFormat}`);
      }
    } else {
      result.format = contentFormat || mimeFormat;
      result.confidence = 60;
      result.detectionMethod = contentFormat ? 'content' : 'mime';
    }
  }

  result.isValid = !!result.format && result.errors.length === 0;
  
  return result;
}

/**
 * Quick format check for UI file input validation
 */
export function isFormatSupported(filename: string): boolean {
  return !!detectFormatFromExtension(filename);
}

/**
 * Get human-readable format list for UI
 */
export function getSupportedFormatsDisplay(): string {
  return 'CSV, XML, XLSX, JSON';
}

/**
 * Get file input accept attribute value
 */
export function getFileInputAccept(): string {
  return '.csv,.xml,.xlsx,.xls,.json,text/csv,application/xml,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json';
}

/**
 * Validate file before processing
 */
export function validateFileForImport(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validations
  if (!file) {
    errors.push('No file selected');
    return { isValid: false, errors };
  }
  
  if (!file.name) {
    errors.push('File has no name');
    return { isValid: false, errors };
  }
  
  if (file.size === 0) {
    errors.push('File is empty');
    return { isValid: false, errors };
  }
  
  // Format validation
  if (!isFormatSupported(file.name)) {
    errors.push(`Unsupported file format. Supported formats: ${getSupportedFormatsDisplay()}`);
    return { isValid: false, errors };
  }
  
  return { isValid: errors.length === 0, errors };
}