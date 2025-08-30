'use client';

/**
 * CSV MAPPING MODAL COMPONENT
 * 
 * Modal para mapear columnas CSV con campos del sistema
 * Permite al usuario seleccionar qué columnas van con qué valores
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Settings,
  FileSpreadsheet,
  Target
} from 'lucide-react';

export interface CSVColumn {
  name: string;
  sample: string;
  index: number;
}

export interface FieldMapping {
  csvColumn: string;
  systemField: string;
  required: boolean;
}

interface CSVMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mapping: Record<string, string>) => void;
  csvColumns: CSVColumn[];
  sampleData: Record<string, string>[];
}

// Campos del sistema disponibles para mapear
const SYSTEM_FIELDS = [
  { 
    key: 'name', 
    label: 'Nombre del Lead', 
    required: true, 
    description: 'Nombre de la persona o empresa',
    examples: ['Juan Pérez', 'Empresa ABC', 'Restaurant El Buen Sabor']
  },
  { 
    key: 'phone', 
    label: 'Teléfono', 
    required: true, 
    description: 'Número de contacto',
    examples: ['+1234567890', '555-0123']
  },
  { 
    key: 'email', 
    label: 'Correo Electrónico', 
    required: false, 
    description: 'Email del contacto',
    examples: ['juan@email.com', 'contacto@empresa.com']
  },
  { 
    key: 'company', 
    label: 'Empresa', 
    required: false, 
    description: 'Nombre de la empresa',
    examples: ['Tech Solutions Inc.', 'Marketing Digital SA']
  },
  { 
    key: 'status', 
    label: 'Estado del Lead', 
    required: false, 
    description: 'Estado actual en el pipeline',
    examples: ['Nuevo', 'Calificado', 'En seguimiento']
  },
  { 
    key: 'priority', 
    label: 'Prioridad', 
    required: false, 
    description: 'Nivel de prioridad',
    examples: ['Alta', 'Media', 'Baja']
  },
  { 
    key: 'source', 
    label: 'Fuente', 
    required: false, 
    description: 'De dónde proviene el lead',
    examples: ['Website', 'Redes Sociales', 'Referido']
  },
  { 
    key: 'position', 
    label: 'Cargo/Posición', 
    required: false, 
    description: 'Puesto en la empresa',
    examples: ['Gerente', 'Director', 'Propietario']
  },
  { 
    key: 'notes', 
    label: 'Notas', 
    required: false, 
    description: 'Información adicional',
    examples: ['Interesado en servicios premium', 'Llamar después de las 2pm']
  },
  { 
    key: 'qualification_score', 
    label: 'Score de Calificación', 
    required: false, 
    description: 'Puntaje de calificación (0-100)',
    examples: ['75', '90', '45']
  }
];

export function CSVMappingModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  csvColumns, 
  sampleData 
}: CSVMappingModalProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Función para auto-mapear campos basado en similitud de nombres
  const autoMapFields = () => {
    const newMapping: Record<string, string> = {};
    
    SYSTEM_FIELDS.forEach(field => {
      const csvColumn = csvColumns.find(col => {
        const colName = col.name.toLowerCase();
        const fieldKey = field.key.toLowerCase();
        const fieldLabel = field.label.toLowerCase();
        
        // Mapeos específicos
        if (field.key === 'name') {
          return colName.includes('nombre') || 
                 colName.includes('oportunidad') || 
                 colName.includes('cliente') || 
                 colName.includes('empresa') ||
                 colName.includes('name');
        }
        
        if (field.key === 'phone') {
          return colName.includes('telefono') || 
                 colName.includes('teléfono') || 
                 colName.includes('phone') || 
                 colName.includes('numero') ||
                 colName.includes('número') ||
                 colName.includes('comercial');
        }
        
        if (field.key === 'email') {
          return colName.includes('email') || 
                 colName.includes('correo') || 
                 colName.includes('mail');
        }
        
        if (field.key === 'status') {
          return colName.includes('estado') || 
                 colName.includes('etapa') || 
                 colName.includes('status') ||
                 colName.includes('stage');
        }
        
        if (field.key === 'priority') {
          return colName.includes('prioridad') || 
                 colName.includes('priority') ||
                 colName.includes('importancia');
        }
        
        // Mapeo genérico
        return colName.includes(fieldKey) || 
               colName.includes(fieldLabel.replace(' ', '')) ||
               fieldLabel.includes(colName);
      });
      
      if (csvColumn) {
        newMapping[field.key] = csvColumn.name;
      }
    });
    
    setMapping(newMapping);
  };

  // Validar el mapeo actual
  const validateMapping = (): string[] => {
    const errors: string[] = [];
    
    // Verificar campos requeridos
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    requiredFields.forEach(field => {
      if (!mapping[field.key]) {
        errors.push(`El campo "${field.label}" es requerido`);
      }
    });
    
    // Verificar que no se mapee la misma columna CSV a múltiples campos
    const usedColumns = Object.values(mapping).filter(Boolean);
    const duplicates = usedColumns.filter((col, index) => usedColumns.indexOf(col) !== index);
    
    duplicates.forEach(col => {
      errors.push(`La columna "${col}" está asignada a múltiples campos`);
    });
    
    return errors;
  };

  // Efecto para auto-mapear cuando se abra el modal
  useEffect(() => {
    if (isOpen && csvColumns.length > 0 && Object.keys(mapping).length === 0) {
      autoMapFields();
    }
  }, [isOpen, csvColumns]);

  // Efecto para validar cuando cambie el mapeo
  useEffect(() => {
    const validationErrors = validateMapping();
    setErrors(validationErrors);
  }, [mapping]);

  const handleMappingChange = (systemField: string, csvColumn: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      if (csvColumn === "__NONE__") {
        delete newMapping[systemField];
      } else {
        newMapping[systemField] = csvColumn;
      }
      return newMapping;
    });
  };

  const handleConfirm = () => {
    const validationErrors = validateMapping();
    if (validationErrors.length === 0) {
      onConfirm(mapping);
    } else {
      setErrors(validationErrors);
    }
  };

  const resetMapping = () => {
    setMapping({});
    setErrors([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mapear Columnas del CSV
          </DialogTitle>
          <DialogDescription>
            Selecciona qué columna de tu CSV corresponde a cada campo del sistema. 
            Los campos marcados con "Requerido" son obligatorios para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Botones de acción */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={autoMapFields}>
                <Target className="h-4 w-4 mr-2" />
                Auto-mapear
              </Button>
              <Button variant="ghost" onClick={resetMapping}>
                Limpiar Todo
              </Button>
            </div>
            <Badge variant="secondary">
              {csvColumns.length} columnas detectadas
            </Badge>
          </div>

          {/* Errores de validación */}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de mapeo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ArrowRight className="h-5 w-5" />
                  Mapeo de Campos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {SYSTEM_FIELDS.map(field => (
                  <div key={field.key} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {field.label}
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">
                          Requerido
                        </Badge>
                      )}
                    </Label>
                    
                    <Select 
                      value={mapping[field.key] || '__NONE__'} 
                      onValueChange={(value) => handleMappingChange(field.key, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar columna CSV..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__NONE__">
                          <span className="text-gray-400">No mapear</span>
                        </SelectItem>
                        {csvColumns.map(col => (
                          <SelectItem key={col.name} value={col.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{col.name}</span>
                              {col.sample && (
                                <span className="text-xs text-gray-500 ml-2 truncate max-w-24">
                                  ej: {col.sample}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <p className="text-xs text-gray-600">{field.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Panel de vista previa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5" />
                  Vista Previa de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mostrar las primeras filas como ejemplo */}
                  {sampleData.slice(0, 3).map((row, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <Badge variant="outline" className="text-xs">
                        Fila {index + 1}
                      </Badge>
                      
                      <div className="space-y-1">
                        {SYSTEM_FIELDS
                          .filter(field => mapping[field.key])
                          .map(field => (
                            <div key={field.key} className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700">
                                {field.label}:
                              </span>
                              <span className="text-gray-900 truncate max-w-32">
                                {row[mapping[field.key]] || 'N/A'}
                              </span>
                            </div>
                          ))}
                        
                        {Object.keys(mapping).length === 0 && (
                          <p className="text-xs text-gray-500 italic">
                            Selecciona los mapeos para ver la vista previa
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del mapeo */}
          {Object.keys(mapping).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen del Mapeo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(mapping)
                    .filter(([_, csvColumn]) => csvColumn)
                    .map(([systemField, csvColumn]) => {
                      const field = SYSTEM_FIELDS.find(f => f.key === systemField);
                      return (
                        <div key={systemField} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {field?.label}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          <Badge variant="secondary" className="text-xs">
                            {csvColumn}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={errors.length > 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" />
            💾 Guardar Mapeo y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}