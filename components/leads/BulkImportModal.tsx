'use client';

/**
 * BULK IMPORT MODAL COMPONENT
 * 
 * Modal para importación masiva de leads desde CSV
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
  Database
} from 'lucide-react';
import { useLeads } from '@/modules/leads/context/LeadsContext';
import { ILead } from '@/modules/leads/types/leads';

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

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function BulkImportModal({ isOpen, onClose, onImportComplete }: BulkImportModalProps) {
  const { currentOrganization, currentTenant, refetch } = useLeads();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [previewLeads, setPreviewLeads] = useState<ILead[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('upload');
    setCsvContent('');
    setFileName('');
    setPreviewLeads([]);
    setImportStats(null);
    setErrors([]);
    setIsProcessing(false);
    setImportProgress(0);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Por favor selecciona un archivo CSV válido']);
      return;
    }

    setFileName(file.name);
    setErrors([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      processPreview(content);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Process CSV preview
  const processPreview = async (content: string) => {
    // Usar valores de fallback si no están disponibles
    const finalTenant = currentTenant || { id: 'demo-tenant-001' };
    const finalOrganization = currentOrganization || { id: 'LvbFBJ82S5c8U9w8g6h5' };

    console.log('🔍 Importación usando:', {
      tenantId: finalTenant.id,
      organizationId: finalOrganization.id
    });

    setIsProcessing(true);
    try {
      const response = await fetch('/api/leads/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: finalTenant.id,
          organizationId: finalOrganization.id,
          csvContent: content,
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
    // Usar valores de fallback si no están disponibles
    const finalTenant = currentTenant || { id: 'demo-tenant-001' };
    const finalOrganization = currentOrganization || { id: 'LvbFBJ82S5c8U9w8g6h5' };

    setCurrentStep('importing');
    setImportProgress(0);
    
    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/leads/import/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: finalTenant.id,
          organizationId: finalOrganization.id,
          csvContent: csvContent,
          dryRun: false
        }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);

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

  // Download CSV template
  const downloadTemplate = () => {
    window.open('/api/leads/import/bulk', '_blank');
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
            Importación Masiva de Leads
          </DialogTitle>
          <DialogDescription>
            Importa leads desde un archivo CSV. Puedes descargar una plantilla como referencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Cargar CSV', icon: Upload },
              { key: 'preview', label: 'Vista Previa', icon: Eye },
              { key: 'importing', label: 'Importando', icon: RefreshCw },
              { key: 'complete', label: 'Completado', icon: CheckCircle }
            ].map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.key;
              const isCompleted = ['upload', 'preview', 'importing', 'complete'].indexOf(currentStep) > index;
              
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
                  {index < 3 && (
                    <div className={`w-12 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>

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
                  Cargar Archivo CSV
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
                    Seleccionar CSV
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar Plantilla
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
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
                    Asegúrate de que tu archivo CSV tenga las columnas requeridas. 
                    Puedes descargar la plantilla como referencia.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Preview */}
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

          {/* Step 3: Importing */}
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

          {/* Step 4: Complete */}
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
          {currentStep === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
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
    </Dialog>
  );
}