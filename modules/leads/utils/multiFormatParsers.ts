/**
 * MULTI-FORMAT PARSERS
 * 
 * Unified parsing system for CSV, XML, XLSX, and JSON formats
 * Normalizes all formats to a common DTO structure for processing
 */

import * as XLSX from 'xlsx';
import { XMLParser } from 'fast-xml-parser';
import Papa from 'papaparse';
import { SupportedFormat } from './formatDetection';

// Progress callback interface for real-time updates
export interface ParseProgressCallback {
  (phase: 'uploading' | 'parsing' | 'normalizing', progress: number, details?: any): void;
}

// Common DTO structure that all parsers normalize to
export interface NormalizedRecord {
  [key: string]: string | number | boolean | null;
}

export interface ParseResult {
  records: NormalizedRecord[];
  totalRecords: number;
  skippedRecords: number;
  errors: string[];
  warnings: string[];
  metadata: {
    format: SupportedFormat;
    sheets?: string[]; // For XLSX
    selectedSheet?: string;
    detectedColumns?: string[];
    processingTimeMs: number;
  };
}

export interface ParseOptions {
  format: SupportedFormat;
  selectedSheet?: string; // For XLSX
  progressCallback?: ParseProgressCallback;
  maxRecords?: number;
  trimValues?: boolean;
  skipEmptyRows?: boolean;
}

/**
 * CSV Parser using PapaParse
 */
export class CSVParser {
  static async parse(
    content: string, 
    options: ParseOptions,
    progressCallback?: ParseProgressCallback
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    progressCallback?.('parsing', 0);

    try {
      // Use PapaParse for robust CSV parsing
      const parseErrors: string[] = [];
      
      const parseResult = Papa.parse(content, {
        header: true,
        skipEmptyLines: options.skipEmptyRows !== false,
        trimHeaders: true,
        transform: options.trimValues !== false ? (value: string) => value.trim() : undefined,
        error: (error: any) => {
          errors.push(`CSV parsing error: ${error.message}`);
        }
      });

      progressCallback?.('parsing', 50);

      if (parseResult.errors && parseResult.errors.length > 0) {
        parseResult.errors.forEach(error => {
          errors.push(`Row ${error.row}: ${error.message}`);
        });
      }

      // Normalize data
      const records: NormalizedRecord[] = parseResult.data
        .filter((row: any) => row && Object.keys(row).length > 0)
        .map((row: any, index: number) => {
          progressCallback?.('normalizing', (index / parseResult.data.length) * 100);
          
          const normalized: NormalizedRecord = {};
          Object.entries(row).forEach(([key, value]) => {
            normalized[key] = this.normalizeValue(value);
          });
          return normalized;
        });

      progressCallback?.('normalizing', 100);

      const result: ParseResult = {
        records,
        totalRecords: parseResult.data.length,
        skippedRecords: parseResult.data.length - records.length,
        errors,
        warnings,
        metadata: {
          format: 'csv',
          detectedColumns: parseResult.meta?.fields || [],
          processingTimeMs: Date.now() - startTime
        }
      };

      return result;

    } catch (error) {
      errors.push(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        records: [],
        totalRecords: 0,
        skippedRecords: 0,
        errors,
        warnings,
        metadata: {
          format: 'csv',
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  private static normalizeValue(value: any): string | number | boolean | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    if (typeof value === 'string') {
      return value.trim();
    }
    
    return value;
  }
}

/**
 * XLSX Parser using SheetJS
 */
export class XLSXParser {
  static async parse(
    arrayBuffer: ArrayBuffer,
    options: ParseOptions,
    progressCallback?: ParseProgressCallback
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    progressCallback?.('parsing', 0);

    try {
      // Parse workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.length === 0) {
        errors.push('No sheets found in the Excel file');
        throw new Error('No sheets found');
      }

      progressCallback?.('parsing', 25);

      // Select sheet (first by default or user-specified)
      const selectedSheet = options.selectedSheet || sheetNames[0];
      const worksheet = workbook.Sheets[selectedSheet];
      
      if (!worksheet) {
        errors.push(`Sheet "${selectedSheet}" not found. Available sheets: ${sheetNames.join(', ')}`);
        throw new Error('Sheet not found');
      }

      progressCallback?.('parsing', 50);

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });

      if (jsonData.length === 0) {
        warnings.push('Sheet appears to be empty');
        return {
          records: [],
          totalRecords: 0,
          skippedRecords: 0,
          errors,
          warnings,
          metadata: {
            format: 'xlsx',
            sheets: sheetNames,
            selectedSheet,
            processingTimeMs: Date.now() - startTime
          }
        };
      }

      progressCallback?.('parsing', 75);

      // Extract headers from first row
      const headers = (jsonData[0] as any[]).map(h => String(h).trim());
      const dataRows = jsonData.slice(1);

      // Normalize data
      const records: NormalizedRecord[] = dataRows.map((row: any, index: number) => {
        progressCallback?.('normalizing', (index / dataRows.length) * 100);
        
        const normalized: NormalizedRecord = {};
        headers.forEach((header, colIndex) => {
          const value = row[colIndex];
          normalized[header] = this.normalizeValue(value);
        });
        return normalized;
      }).filter(record => {
        // Filter empty rows
        const values = Object.values(record).filter(v => v !== null && v !== '');
        return values.length > 0;
      });

      progressCallback?.('normalizing', 100);

      return {
        records,
        totalRecords: dataRows.length,
        skippedRecords: dataRows.length - records.length,
        errors,
        warnings,
        metadata: {
          format: 'xlsx',
          sheets: sheetNames,
          selectedSheet,
          detectedColumns: headers,
          processingTimeMs: Date.now() - startTime
        }
      };

    } catch (error) {
      errors.push(`XLSX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        records: [],
        totalRecords: 0,
        skippedRecords: 0,
        errors,
        warnings,
        metadata: {
          format: 'xlsx',
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  private static normalizeValue(value: any): string | number | boolean | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // Handle Excel dates
    if (typeof value === 'number' && value > 25000 && value < 50000) {
      // Likely an Excel date serial number
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        return new Date(date.y, date.m - 1, date.d).toISOString().split('T')[0];
      }
    }
    
    if (typeof value === 'string') {
      return value.trim();
    }
    
    return value;
  }
}

/**
 * XML Parser using fast-xml-parser
 */
export class CustomXMLParser {
  static async parse(
    content: string,
    options: ParseOptions,
    progressCallback?: ParseProgressCallback
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    progressCallback?.('parsing', 0);

    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        textNodeName: '#text',
        parseAttributeValue: true,
        trimValues: options.trimValues !== false
      });

      const jsonObj = parser.parse(content);
      
      progressCallback?.('parsing', 50);

      // Find the data array - look for common root elements
      const records = this.extractRecordsFromXML(jsonObj);
      
      progressCallback?.('normalizing', 100);

      return {
        records,
        totalRecords: records.length,
        skippedRecords: 0,
        errors,
        warnings,
        metadata: {
          format: 'xml',
          detectedColumns: records.length > 0 ? Object.keys(records[0]) : [],
          processingTimeMs: Date.now() - startTime
        }
      };

    } catch (error) {
      errors.push(`XML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        records: [],
        totalRecords: 0,
        skippedRecords: 0,
        errors,
        warnings,
        metadata: {
          format: 'xml',
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  private static extractRecordsFromXML(obj: any, path: string = ''): NormalizedRecord[] {
    // Common XML patterns for data arrays
    const commonArrayNames = ['items', 'records', 'data', 'leads', 'contacts', 'customers', 'entries'];
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.flattenObject(item));
    }
    
    // Look for arrays in the object
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        return value.map(item => this.flattenObject(item));
      }
      
      if (typeof value === 'object' && value !== null) {
        const nested = this.extractRecordsFromXML(value, path ? `${path}.${key}` : key);
        if (nested.length > 0) {
          return nested;
        }
      }
    }
    
    // If no arrays found, treat the object itself as a single record
    return [this.flattenObject(obj)];
  }

  private static flattenObject(obj: any, prefix: string = ''): NormalizedRecord {
    const flattened: NormalizedRecord = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        flattened[newKey] = null;
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join(', ');
      } else if (typeof value === 'object') {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    }
    
    return flattened;
  }
}

/**
 * JSON Parser
 */
export class JSONParser {
  static async parse(
    content: string,
    options: ParseOptions,
    progressCallback?: ParseProgressCallback
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    
    progressCallback?.('parsing', 0);

    try {
      const jsonData = JSON.parse(content);
      
      progressCallback?.('parsing', 50);

      // Extract records from JSON structure
      const records = this.extractRecordsFromJSON(jsonData);
      
      progressCallback?.('normalizing', 100);

      return {
        records,
        totalRecords: records.length,
        skippedRecords: 0,
        errors,
        warnings,
        metadata: {
          format: 'json',
          detectedColumns: records.length > 0 ? Object.keys(records[0]) : [],
          processingTimeMs: Date.now() - startTime
        }
      };

    } catch (error) {
      errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        records: [],
        totalRecords: 0,
        skippedRecords: 0,
        errors,
        warnings,
        metadata: {
          format: 'json',
          processingTimeMs: Date.now() - startTime
        }
      };
    }
  }

  private static extractRecordsFromJSON(data: any): NormalizedRecord[] {
    if (Array.isArray(data)) {
      return data.map(item => this.flattenObject(item));
    }
    
    // Look for arrays in the object
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        return value.map(item => this.flattenObject(item));
      }
    }
    
    // If no arrays found, treat the object itself as a single record
    return [this.flattenObject(data)];
  }

  private static flattenObject(obj: any, prefix: string = ''): NormalizedRecord {
    const flattened: NormalizedRecord = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        flattened[newKey] = null;
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join(', ');
      } else if (typeof value === 'object') {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    }
    
    return flattened;
  }
}

/**
 * Unified Parser Factory
 */
export class MultiFormatParser {
  static async parse(
    data: string | ArrayBuffer,
    format: SupportedFormat,
    options: ParseOptions = {},
    progressCallback?: ParseProgressCallback
  ): Promise<ParseResult> {
    const parseOptions = {
      ...options,
      format
    };

    switch (format) {
      case 'csv':
        if (typeof data !== 'string') {
          throw new Error('CSV parser requires string data');
        }
        return CSVParser.parse(data, parseOptions, progressCallback);
        
      case 'xlsx':
        if (!(data instanceof ArrayBuffer)) {
          throw new Error('XLSX parser requires ArrayBuffer data');
        }
        return XLSXParser.parse(data, parseOptions, progressCallback);
        
      case 'xml':
        if (typeof data !== 'string') {
          throw new Error('XML parser requires string data');
        }
        return CustomXMLParser.parse(data as string, parseOptions, progressCallback);
        
      case 'json':
        if (typeof data !== 'string') {
          throw new Error('JSON parser requires string data');
        }
        return JSONParser.parse(data, parseOptions, progressCallback);
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}