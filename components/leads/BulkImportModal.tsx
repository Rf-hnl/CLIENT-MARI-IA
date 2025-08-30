'use client';

/**
 * BULK IMPORT MODAL COMPONENT
 * 
 * Modal para importación masiva de leads desde múltiples formatos
 * Incluye preview, validación y estadísticas de importación
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CSVMappingModal, CSVColumn } from './CSVMappingModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Users,
  Target,
  Star,
  TrendingUp,
  RefreshCw,
  Eye,
  Database,
  Settings
} from 'lucide-react';
import { useLeads } from '@/modules/leads/context/LeadsContext';
import { ILead } from '@/modules/leads/types/leads';
import { useFeatureFlag } from '@/lib/feature-flags';
import { 
  getSupportedFormatsDisplay,
  getFileInputAccept,
  detectFileFormat,
  validateFileForImport 
} from '@/modules/leads/utils/formatDetection';
import { XLSXParser } from '@/modules/leads/utils/multiFormatParsers';

interface ImportStats {
  totalRows: number;
  validLeads: number;
  skippedRows: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const { currentOrganization, currentTenant, refetch } = useLeads();
  const isMultiFormatEnabled = useFeatureFlag('IMPORT_CSV_XML_JSON_XLSX');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [previewLeads, setPreviewLeads] = useState<ILead[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Nuevos estados para mapeo CSV
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('upload');
    setCsvContent('');
    setFileName('');
    setDetectedFormat(null);
    setFileSize(0);
    setPreviewLeads([]);
    setImportStats(null);
    setErrors([]);
    setWarnings([]);
    setIsProcessing(false);
    setImportProgress(0);
    setImportResult(null);
    setCsvColumns([]);
    setSampleData([]);
    setColumnMapping({});
    setShowMappingModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setWarnings([]);

    // Enhanced validation for multi-format support
    if (isMultiFormatEnabled) {
      const validation = validateFileForImport(file);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      
      // Read file content based on format
      const reader = new FileReader();
      
      // First detect format to determine how to read the file
      const formatDetection = detectFileFormat(file, '');
      const detectedFormat = formatDetection.format?.toLowerCase();
      
      if (detectedFormat === 'xlsx') {
        // XLSX files need to be read as ArrayBuffer
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          setDetectedFormat('XLSX');
          if (formatDetection.warnings.length > 0) {
            setWarnings(formatDetection.warnings);
          }
          
          // Convert XLSX to CSV-like structure for mapping
          await parseXLSXForMapping(arrayBuffer);
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Text-based formats (CSV, JSON, XML)
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          setCsvContent(content);
          
          // Detect file format
          const formatDetection = detectFileFormat(file, content);
          if (formatDetection.isValid && formatDetection.format) {
            setDetectedFormat(formatDetection.format.toUpperCase());
            if (formatDetection.warnings.length > 0) {
              setWarnings(formatDetection.warnings);
            }
          }
          
          // Continue with CSV parsing for mapping (works for all text formats)
          parseCSVForMapping(content);
        };
        reader.readAsText(file, 'UTF-8');
      }
    } else {
      // Original CSV-only logic
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setErrors(['Por favor selecciona un archivo CSV válido']);
        return;
      }

      setFileName(file.name);
      setFileSize(file.size);
      setDetectedFormat('CSV');
      setErrors([]);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvContent(content);
        parseCSVForMapping(content);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Parsear XLSX para extraer columnas y datos de muestra
  const parseXLSXForMapping = async (arrayBuffer: ArrayBuffer) => {
    try {
      const parseResult = await XLSXParser.parse(arrayBuffer, { format: 'xlsx' });
      
      if (parseResult.errors.length > 0) {
        setErrors(parseResult.errors);
        return;
      }
      
      if (parseResult.records.length === 0) {
        setErrors(['El archivo XLSX no contiene datos válidos']);
        return;
      }
      
      // Extract column names from first record
      const firstRecord = parseResult.records[0];
      const headers = Object.keys(firstRecord);
      
      // Create CSV-like columns structure for mapping
      const columns: CSVColumn[] = headers.map((header, index) => {
        // Get sample from first few records that have data for this column
        let sample = '';
        for (let i = 0; i < Math.min(parseResult.records.length, 3); i++) {
          const value = parseResult.records[i][header];
          if (value && value.toString().length > 0) {
            sample = value.toString().substring(0, 30); // Truncate sample
            break;
          }
        }
        
        return {
          name: header,
          sample: sample,
          index: index
        };
      });
      
      // Create sample data (first 5 records)
      const sampleData = parseResult.records.slice(0, 5).map(record => {
        const sample: Record<string, string> = {};
        headers.forEach(header => {
          sample[header] = (record[header] || '').toString();
        });
        return sample;
      });
      
      // Convert records to CSV-like content for later processing
      const csvHeaders = headers.join(',');
      const csvRows = parseResult.records.map(record => 
        headers.map(header => {
          const value = record[header] || '';
          // Properly escape CSV values that contain commas or quotes
          const stringValue = value.toString();
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      );
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      setCsvContent(csvContent);
      setCsvColumns(columns);
      setSampleData(sampleData);
      
      // Execute auto-mapping automatically
      autoMapColumns(columns);
      
      setCurrentStep('mapping');
      
    } catch (error) {
      console.error('Error parsing XLSX:', error);
      setErrors([`Error procesando archivo XLSX: ${error instanceof Error ? error.message : 'Error desconocido'}`]);
    }
  };

  // Parsear CSV para extraer columnas y datos de muestra
  const parseCSVForMapping = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors(['El archivo CSV debe tener al menos una fila de datos además del header']);
      return;
    }

    // Detectar separador
    const firstLine = lines[0];
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const separator = semicolonCount > commaCount ? ';' : ',';

    // Extraer headers
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    
    // Crear objetos de columnas con muestras
    const columns: CSVColumn[] = headers.map((header, index) => {
      // Obtener muestra del primer registro que tenga datos
      let sample = '';
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
        if (values[index] && values[index].length > 0) {
          sample = values[index].substring(0, 30); // Truncar muestra
          break;
        }
      }
      
      return {
        name: header,
        sample: sample,
        index: index
      };
    });

    // Extraer datos de muestra (primeras 5 filas)
    const sample: Record<string, string>[] = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      sample.push(row);
    }

    setCsvColumns(columns);
    setSampleData(sample);
    
    // Ejecutar auto-mapeo automáticamente
    autoMapColumns(columns);
    
    setCurrentStep('mapping');
  };

  // Process CSV preview
  const processPreview = async (content: string) => {
    // Verificar que tenemos contexto de usuario válido
    if (!currentTenant || !currentOrganization) {
      setErrors(['Error: No se pudo obtener la información del tenant/organización. Por favor, recarga la página.']);
      setIsProcessing(false);
      return;
    }

    console.log('🔍 Importación usando:', {
      tenantId: currentTenant.id,
      organizationId: currentOrganization.id
    });

    setIsProcessing(true);
    try {
      const response = await fetch('/api/leads/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          csvContent: content,
          columnMapping: columnMapping,
          dryRun: true
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        setErrors(result.data?.errors || [result.error || 'Error procesando CSV']);
        setIsProcessing(false);
        return;
      }

      setPreviewLeads(result.data.leads || []);
      setImportStats(result.data.stats);
      setCurrentStep('preview');
      
    } catch (error) {
      console.error('Error en preview:', error);
      setErrors(['Error procesando el archivo CSV']);
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute import
  const executeImport = async () => {
    // Verificar que tenemos contexto de usuario válido
    if (!currentTenant || !currentOrganization) {
      setErrors(['Error: No se pudo obtener la información del tenant/organización. Por favor, recarga la página.']);
      return;
    }

    setCurrentStep('importing');
    setImportProgress(0);
    
    try {
      // Simular progreso más realista basado en cantidad de leads
      const leadCount = previewLeads.length;
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          // Progreso más lento para importaciones grandes
          const increment = leadCount > 100 ? 5 : leadCount > 50 ? 8 : 12;
          return Math.min(prev + increment, 90);
        });
      }, leadCount > 100 ? 500 : 300); // Interval más largo para muchos leads

      const startTime = Date.now();
      console.log(`🚀 Iniciando importación de ${leadCount} leads...`);

      const response = await fetch('/api/leads/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          organizationId: currentOrganization.id,
          csvContent: csvContent,
          columnMapping: columnMapping,
          dryRun: false
        }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      console.log(`⏱️ Importación completada en ${duration.toFixed(2)} segundos`);

      const result = await response.json();
      
      if (!result.success) {
        setErrors([result.error || 'Error durante la importación']);
        setCurrentStep('preview');
        return;
      }

      setImportResult({
        imported: result.data.importedCount,
        skipped: result.data.skippedCount,
        errors: result.data.errors
      });
      
      setCurrentStep('complete');
      
      // Refrescar datos de leads
      setTimeout(() => {
        refetch();
        onImportComplete();
      }, 1000);
      
    } catch (error) {
      console.error('Error en importación:', error);
      setErrors(['Error ejecutando la importación']);
      setCurrentStep('preview');
    }
  };

  // Download template (supports multiple formats when enabled)
  const downloadTemplate = (format: string = 'csv') => {
    if (isMultiFormatEnabled) {
      window.open(`/api/leads/import/templates?format=${format}`, '_blank');
    } else {
      window.open('/api/leads/import/bulk', '_blank');
    }
  };

  // Manejar confirmación del mapeo
  const handleMappingConfirm = (mapping: Record<string, string>) => {
    setColumnMapping(mapping);
    setShowMappingModal(false);
    processPreview(csvContent);
  };

  // Auto-mapear columnas basado en nombres similares
  const autoMapColumns = (columns: CSVColumn[]) => {
    const mapping: Record<string, string> = {};
    
    // Mapeos específicos basados en nombres comunes
    const mappingRules = [
      {
        systemField: 'name',
        patterns: ['nombre', 'name', 'cliente', 'lead', 'prospecto', 'empresa', 'company']
      },
      {
        systemField: 'phone', 
        patterns: ['telefono', 'teléfono', 'phone', 'numero', 'número', 'movil', 'móvil', 'celular']
      },
      {
        systemField: 'email',
        patterns: ['email', 'correo', 'mail', 'electronico', 'electrónico']
      },
      {
        systemField: 'company',
        patterns: ['empresa', 'company', 'organizacion', 'organización', 'negocio']
      },
      {
        systemField: 'notes',
        patterns: ['rubro', 'sector', 'industria', 'categoria', 'categoría', 'notas', 'notes']
      }
    ];

    // Intentar mapear cada regla
    mappingRules.forEach(rule => {
      const matchedColumn = columns.find(col => {
        const colName = col.name.toLowerCase();
        return rule.patterns.some(pattern => 
          colName.includes(pattern.toLowerCase()) || 
          pattern.toLowerCase().includes(colName)
        );
      });

      if (matchedColumn && !Object.values(mapping).includes(matchedColumn.name)) {
        mapping[rule.systemField] = matchedColumn.name;
      }
    });

    console.log('🎯 Auto-mapeo realizado:', mapping);
    setColumnMapping(mapping);
  };

  // Abrir modal de mapeo
  const openMappingModal = () => {
    setShowMappingModal(true);
  };

  // Close and reset
  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            {isMultiFormatEnabled ? 'Importación Masiva de Leads' : 'Importación Masiva de Leads'}
            {isMultiFormatEnabled && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Multi-Formato
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isMultiFormatEnabled 
              ? `Importa leads desde archivos ${getSupportedFormatsDisplay()}. Detección automática de formato y mapeo inteligente.`
              : 'Importa leads desde un archivo CSV. Puedes descargar una plantilla como referencia.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Cargar Archivo', icon: Upload },
              { key: 'mapping', label: 'Mapear Columnas', icon: Settings },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'importing', label: 'Importando', icon: RefreshCw },
              { key: 'complete', label: 'Completado', icon: CheckCircle }
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = ['upload', 'mapping', 'preview', 'importing', 'complete'].indexOf(currentStep) > index;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2
                    ${isActive ? 'border-blue-500 bg-blue-50 text-blue-600' : 
                      isCompleted ? 'border-green-500 bg-green-50 text-green-600' : 
                      'border-gray-300 bg-gray-50 text-gray-400'}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-medium' : ''}`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Format Detection Display */}
          {isMultiFormatEnabled && detectedFormat && fileName && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-blue-900">
                        {fileName}
                      </div>
                      <div className="text-sm text-blue-700">
                        Formato: {detectedFormat} • Tamaño: {Math.round(fileSize / 1024)}KB
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {detectedFormat}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings Display */}
          {warnings.length > 0 && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <div className="space-y-1">
                  {warnings.map((warning, index) => (
                    <div key={index}>{warning}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Errors Display */}
          {errors.length > 0 && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {isMultiFormatEnabled ? 'Cargar Archivo' : 'Cargar Archivo CSV'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isMultiFormatEnabled ? 'Seleccionar Archivo' : 'Seleccionar CSV'}
                  </Button>
                  {isMultiFormatEnabled ? (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadTemplate('csv')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        CSV
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadTemplate('xlsx')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        XLSX
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadTemplate('json')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        JSON
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadTemplate('xml')}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        XML
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={downloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Descargar Plantilla
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={isMultiFormatEnabled ? getFileInputAccept() : ".csv"}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {fileName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{fileName}</span>
                    {isProcessing && (
                      <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                    )}
                  </div>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {isMultiFormatEnabled 
                      ? `Formatos soportados: ${getSupportedFormatsDisplay()}. El sistema detectará automáticamente el formato y realizará el mapeo inteligente de campos.`
                      : 'Asegúrate de que tu archivo CSV tenga las columnas requeridas. Puedes descargar la plantilla como referencia.'
                    }
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Mapping */}
          {currentStep === 'mapping' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Mapear Columnas del Archivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  Se detectaron {csvColumns.length} columnas en tu archivo. 
                  Haz clic en "Configurar Mapeo" para seleccionar qué campos corresponden a cada columna del sistema.
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {csvColumns.slice(0, 6).map((column) => (
                    <div key={column.name} className="p-2 border rounded text-xs">
                      <div className="font-medium truncate">{column.name}</div>
                      {column.sample && (
                        <div className="text-gray-500 truncate">
                          ej: {column.sample}
                        </div>
                      )}
                    </div>
                  ))}
                  {csvColumns.length > 6 && (
                    <div className="p-2 border rounded text-xs text-gray-500 flex items-center justify-center">
                      +{csvColumns.length - 6} más...
                    </div>
                  )}
                </div>

                {Object.keys(columnMapping).length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Settings className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-3">
                      Necesitas configurar el mapeo de columnas antes de continuar
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      El auto-mapeo no pudo detectar suficientes coincidencias
                    </p>
                    <Button onClick={openMappingModal} className="flex items-center gap-2 mx-auto">
                      <Settings className="h-4 w-4" />
                      ⚙️ Configurar Mapeo Manualmente
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 border border-green-300 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-sm text-green-700 mb-1 font-medium">
                        ✅ Mapeo automático detectado
                      </p>
                      <p className="text-xs text-green-600">
                        El sistema ha mapeado automáticamente {Object.keys(columnMapping).length} campos
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={openMappingModal}>
                        ⚙️ Editar Mapeo
                      </Button>
                      <Button onClick={() => processPreview(csvContent)} className="bg-green-600 hover:bg-green-700">
                        ✅ Usar Este Mapeo y Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {Object.keys(columnMapping).length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      Mapeo Configurado:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(columnMapping).map(([field, column]) => (
                        <div key={field} className="text-xs flex items-center gap-2">
                          <Badge variant="outline">{field}</Badge>
                          <span className="text-gray-500">→</span>
                          <span className="text-blue-700">{column}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Preview */}
          {currentStep === 'preview' && importStats && (
            <Tabs defaultValue="stats" className="space-y-4">
              <TabsList>
                <TabsTrigger value="stats">Estadísticas</TabsTrigger>
                <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Total a Importar
                          </p>
                          <p className="text-2xl font-bold">{importStats.validLeads}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Filas Omitidas
                          </p>
                          <p className="text-2xl font-bold">{importStats.skippedRows}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Leads Calificados
                          </p>
                          <p className="text-2xl font-bold">
                            {importStats.statusDistribution.qualified || 0}
                          </p>
                        </div>
                        <Star className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Distribución por Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(importStats.statusDistribution).map(([status, count]) => (
                        count > 0 && (
                          <div key={status} className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">
                              {status.replace('_', ' ')}
                            </Badge>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Distribución por Prioridad</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(importStats.priorityDistribution).map(([priority, count]) => (
                        count > 0 && (
                          <div key={priority} className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">
                              {priority}
                            </Badge>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Vista Previa (Primeros 10 registros)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead>Fuente</TableHead>
                            <TableHead>Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewLeads.map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell className="font-medium">{lead.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {lead.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {lead.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="capitalize">
                                  {lead.source.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{lead.qualification_score}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Step 4: Importing */}
          {currentStep === 'importing' && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-500" />
                <div>
                  <h3 className="text-lg font-medium">Importando Leads...</h3>
                  <p className="text-sm text-muted-foreground">
                    Por favor espera mientras procesamos tu archivo
                  </p>
                </div>
                <Progress value={importProgress} className="w-full max-w-sm mx-auto" />
                <p className="text-sm text-muted-foreground">{importProgress}% completado</p>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && importResult && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <div>
                  <h3 className="text-lg font-medium text-green-800">
                    ¡Importación Completada!
                  </h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {importResult.imported}
                        </p>
                        <p className="text-sm text-muted-foreground">Importados</p>
                      </div>
                      {importResult.skipped > 0 && (
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {importResult.skipped}
                          </p>
                          <p className="text-sm text-muted-foreground">Omitidos</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {importResult.errors.length > 0 && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {importResult.errors.length} errores durante la importación. 
                        Revisa los logs para más detalles.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          {currentStep === 'mapping' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              {Object.keys(columnMapping).length > 0 && (
                <Button onClick={() => processPreview(csvContent)} className="bg-green-600 hover:bg-green-700">
                  💾 Guardar y Continuar a Vista Previa
                </Button>
              )}
            </>
          )}

          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                ← Volver al Mapeo
              </Button>
              <Button onClick={executeImport} disabled={!importStats}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Importar {importStats?.validLeads || 0} Leads
              </Button>
            </>
          )}
          
          {currentStep === 'complete' && (
            <Button onClick={handleClose}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          )}
          
          {(currentStep === 'upload' || currentStep === 'importing') && (
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              {isProcessing ? 'Procesando...' : 'Cerrar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Modal de mapeo CSV */}
      <CSVMappingModal
        isOpen={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        onConfirm={handleMappingConfirm}
        csvColumns={csvColumns}
        sampleData={sampleData}
      />
    </Dialog>
  );
}