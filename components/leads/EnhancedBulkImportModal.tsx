'use client';

/**
 * ENHANCED BULK IMPORT MODAL COMPONENT
 * 
 * Extended import modal supporting CSV, XML, XLSX, and JSON formats
 * with real-time progress tracking and intelligent mapping
 */

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Settings,
  FileSpreadsheet,
  FileJson,
  FileCode,
  Layers,
  Zap
} from 'lucide-react';
import { useLeads } from '@/modules/leads/context/LeadsContext';
import { ILead } from '@/modules/leads/types/leads';
import { useFeatureFlag } from '@/lib/feature-flags';
import { useAuthToken } from '@/hooks/useAuthToken';
import { 
  SupportedFormat, 
  detectFileFormat, 
  validateFileForImport,
  getSupportedFormatsDisplay,
  getFileInputAccept 
} from '@/modules/leads/utils/formatDetection';
import { 
  ProgressTracker, 
  ProgressUpdate, 
  ImportPhase 
} from '@/modules/leads/utils/progressTracking';

interface ImportStats {
  totalRows: number;
  validLeads: number;
  skippedRows: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
}

interface EnhancedBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type ImportStep = 'upload' | 'format_detection' | 'sheet_selection' | 'mapping' | 'preview' | 'importing' | 'complete';

interface FileInfo {
  file: File;
  format: SupportedFormat;
  content?: string | ArrayBuffer;
  availableSheets?: string[];
  selectedSheet?: string;
  detectedColumns?: string[];
  hierarchicalPaths?: string[];
}

export function EnhancedBulkImportModal({ isOpen, onClose, onImportComplete }: EnhancedBulkImportModalProps) {
  const { currentOrganization, currentTenant, refetch } = useLeads();
  const isMultiFormatEnabled = useFeatureFlag('IMPORT_CSV_XML_JSON_XLSX');
  const { token } = useAuthToken();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [previewLeads, setPreviewLeads] = useState<ILead[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Progress tracking
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [progressPhase, setProgressPhase] = useState<ImportPhase>('uploading');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [phaseProgress, setPhaseProgress] = useState(0);
  
  // Mapping states
  const [csvColumns, setCsvColumns] = useState<CSVColumn[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [autoMappingResult, setAutoMappingResult] = useState<any>(null);
  
  // Import results
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Progress tracking via SSE
  useEffect(() => {
    if (!currentJobId) return;

    const eventSource = new EventSource(`/api/leads/import/progress?jobId=${currentJobId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setProgressPhase(data.currentPhase);
          setProgressPercent(data.totalProgress);
          setPhaseProgress(data.phaseProgress || 0);
          
          // Update UI based on phase
          if (data.currentPhase === 'completed') {
            setCurrentStep('complete');
            setImportResult({
              imported: data.metrics.recordsInserted || 0,
              skipped: data.metrics.recordsSkipped || 0,
              errors: data.metrics.topErrors || []
            });
            setTimeout(() => {
              refetch();
              onImportComplete();
            }, 1000);
          } else if (data.currentPhase === 'failed') {
            setErrors([data.error || 'Import failed']);
            setCurrentStep('preview'); // Go back to allow retry
          } else if (data.currentPhase === 'preview_ready') {
            setCurrentStep('preview');
          }
          
          setProgressMessage(data.message || getPhaseMessage(data.currentPhase));
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    eventSource.onerror = () => {
      console.error('Progress tracking connection failed');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [currentJobId, refetch, onImportComplete]);

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('upload');
    setFileInfo(null);
    setPreviewLeads([]);
    setImportStats(null);
    setErrors([]);
    setWarnings([]);
    setIsProcessing(false);
    setProgressPercent(0);
    setProgressMessage('');
    setPhaseProgress(0);
    setCurrentJobId(null);
    setCsvColumns([]);
    setSampleData([]);
    setColumnMapping({});
    setShowMappingModal(false);
    setAutoMappingResult(null);
    setImportResult(null);
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

    // Basic file validation
    const validation = validateFileForImport(file);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsProcessing(true);
    setCurrentStep('format_detection');

    try {
      // Read file content for format detection
      let content: string | ArrayBuffer;
      
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        content = await readFileAsArrayBuffer(file);
      } else {
        content = await readFileAsText(file);
      }

      // Detect format
      const formatDetection = detectFileFormat(file, typeof content === 'string' ? content : undefined);
      
      if (!formatDetection.isValid || !formatDetection.format) {
        setErrors(formatDetection.errors);
        setIsProcessing(false);
        return;
      }

      if (formatDetection.warnings.length > 0) {
        setWarnings(formatDetection.warnings);
      }

      // Store file info
      const newFileInfo: FileInfo = {
        file,
        format: formatDetection.format,
        content
      };

      setFileInfo(newFileInfo);

      // For XLSX, we might need sheet selection
      if (formatDetection.format === 'xlsx') {
        await handleXLSXSheetDetection(newFileInfo);
      } else {
        await proceedToMapping(newFileInfo);
      }

    } catch (error) {
      setErrors([`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setIsProcessing(false);
    }
  };

  // Handle XLSX sheet detection
  const handleXLSXSheetDetection = async (fileInfo: FileInfo) => {
    try {
      // Parse XLSX to get sheet names
      const formData = new FormData();
      formData.append('file', fileInfo.file);
      formData.append('format', 'xlsx');
      formData.append('detectOnly', 'true');

      // This would call a helper endpoint to get sheet info
      // For now, proceed directly to mapping
      await proceedToMapping(fileInfo);
      
    } catch (error) {
      setErrors([`Failed to detect sheets: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      setIsProcessing(false);
    }
  };

  // Proceed to mapping step
  const proceedToMapping = async (fileInfo: FileInfo) => {
    setCurrentStep('mapping');
    setIsProcessing(false);
    
    // TODO: Parse file to extract columns/paths for mapping
    // This would be done via the API endpoint
  };

  // Execute preview
  const executePreview = async () => {
    if (!fileInfo || !currentTenant || !currentOrganization) {
      setErrors(['Missing file or organization information']);
      return;
    }

    setIsProcessing(true);
    setCurrentStep('importing');
    setProgressPercent(0);

    try {
      const formData = new FormData();
      formData.append('tenantId', currentTenant.id);
      formData.append('organizationId', currentOrganization.id);
      
      // Convert file content to base64 for JSON transmission
      let fileContent: string;
      if (fileInfo.content instanceof ArrayBuffer) {
        const bytes = new Uint8Array(fileInfo.content);
        fileContent = btoa(String.fromCharCode(...bytes));
      } else {
        fileContent = btoa(fileInfo.content);
      }

      const requestBody = {
        tenantId: currentTenant.id,
        organizationId: currentOrganization.id,
        fileContent,
        fileName: fileInfo.file.name,
        format: fileInfo.format,
        selectedSheet: fileInfo.selectedSheet,
        columnMapping,
        dryRun: true
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/leads/import/multi-format', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (!result.success) {
        setErrors(result.data?.errors || [result.error || 'Preview failed']);
        setCurrentStep('mapping');
        setIsProcessing(false);
        return;
      }

      // Set up progress tracking
      if (result.jobId) {
        setCurrentJobId(result.jobId);
      }

      // Handle preview data
      if (result.data?.leads) {
        setPreviewLeads(result.data.leads);
        setImportStats(result.data.stats);
        setAutoMappingResult(result.data.autoMapping);
        setCurrentStep('preview');
      }

    } catch (error) {
      console.error('Preview error:', error);
      setErrors(['Failed to generate preview']);
      setCurrentStep('mapping');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute actual import
  const executeImport = async () => {
    if (!fileInfo || !currentTenant || !currentOrganization) {
      setErrors(['Missing file or organization information']);
      return;
    }

    setCurrentStep('importing');
    setProgressPercent(0);

    try {
      // Convert file content to base64
      let fileContent: string;
      if (fileInfo.content instanceof ArrayBuffer) {
        const bytes = new Uint8Array(fileInfo.content);
        fileContent = btoa(String.fromCharCode(...bytes));
      } else {
        fileContent = btoa(fileInfo.content);
      }

      const requestBody = {
        tenantId: currentTenant.id,
        organizationId: currentOrganization.id,
        fileContent,
        fileName: fileInfo.file.name,
        format: fileInfo.format,
        selectedSheet: fileInfo.selectedSheet,
        columnMapping,
        dryRun: false
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/leads/import/multi-format', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (!result.success) {
        setErrors(result.data?.errors || [result.error || 'Import failed']);
        setCurrentStep('preview');
        return;
      }

      // Set up progress tracking
      if (result.jobId) {
        setCurrentJobId(result.jobId);
      }

    } catch (error) {
      console.error('Import error:', error);
      setErrors(['Failed to start import']);
      setCurrentStep('preview');
    }
  };

  // File reading helpers
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  // Helper to get phase message
  const getPhaseMessage = (phase: ImportPhase): string => {
    const messages = {
      uploading: 'Uploading file...',
      parsing: 'Parsing file content...',
      mapping_validating: 'Validating field mapping...',
      preview_ready: 'Preview ready',
      importing_batches: 'Importing records...',
      finalizing: 'Finalizing import...',
      completed: 'Import completed successfully',
      failed: 'Import failed',
      canceled: 'Import canceled'
    };
    return messages[phase] || 'Processing...';
  };

  // Get format icon
  const getFormatIcon = (format: SupportedFormat) => {
    const icons = {
      csv: FileText,
      xlsx: FileSpreadsheet,
      json: FileJson,
      xml: FileCode
    };
    return icons[format] || FileText;
  };

  // Close and reset
  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Fallback to original import modal if feature not enabled
  if (!isMultiFormatEnabled) {
    // Return original BulkImportModal here
    return null; // Temporary - would import and return original component
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Enhanced Bulk Import
            <Badge variant="secondary" className="ml-2">
              Multi-Format
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Import leads from CSV, Excel (XLSX), JSON, or XML files with intelligent mapping and real-time progress.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload File', icon: Upload },
              { key: 'mapping', label: 'Field Mapping', icon: Settings },
              { key: 'preview', label: 'Preview', icon: Eye },
              { key: 'importing', label: 'Importing', icon: RefreshCw },
              { key: 'complete', label: 'Complete', icon: CheckCircle }
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
          {fileInfo && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {React.createElement(getFormatIcon(fileInfo.format), { className: "h-5 w-5 text-blue-600" })}
                  <div>
                    <div className="font-medium text-blue-900">
                      {fileInfo.file.name}
                    </div>
                    <div className="text-sm text-blue-700">
                      Format: {fileInfo.format.toUpperCase()} • Size: {Math.round(fileInfo.file.size / 1024)}KB
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors and Warnings */}
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

          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload File
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
                    Select File
                  </Button>
                  <Badge variant="secondary">
                    Supported: {getSupportedFormatsDisplay()}
                  </Badge>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getFileInputAccept()}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    Enhanced import supports CSV, Excel (XLSX), JSON, and XML files with automatic format detection and intelligent field mapping.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Real-time Progress Display */}
          {(currentStep === 'importing' || isProcessing) && (
            <Card>
              <CardContent className="p-6 text-center space-y-4">
                <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-500" />
                <div>
                  <h3 className="text-lg font-medium">{progressMessage}</h3>
                  <p className="text-sm text-muted-foreground">
                    Phase: {progressPhase.replace('_', ' ')} • {progressPercent.toFixed(1)}% overall
                  </p>
                </div>
                <Progress value={progressPercent} className="w-full max-w-sm mx-auto" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Current phase: {phaseProgress.toFixed(1)}%</div>
                  {currentJobId && (
                    <div className="font-mono">Job ID: {currentJobId}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other steps would be similar to original but with enhanced features */}
          {/* ... (mapping, preview, complete steps) */}

        </div>

        <DialogFooter>
          {currentStep === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          
          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
                ← Back to Mapping
              </Button>
              <Button onClick={executeImport} disabled={!importStats}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Import {importStats?.validLeads || 0} Leads
              </Button>
            </>
          )}
          
          {currentStep === 'complete' && (
            <Button onClick={handleClose}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finish
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}