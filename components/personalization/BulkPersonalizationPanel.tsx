/**
 * BULK PERSONALIZATION PANEL
 * 
 * Panel para personalización masiva de múltiples leads
 * Se integra con el sistema de bulk calling existente
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Users, 
  Zap, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Eye
} from 'lucide-react';

import {
  CallObjective,
  PersonalizationStrategy,
  OBJECTIVE_DESCRIPTIONS,
  STRATEGY_DESCRIPTIONS
} from '@/types/personalization';

interface BulkPersonalizationPanelProps {
  selectedLeadIds: string[];
  tenantId: string;
  organizationId: string;
  onPersonalizationComplete?: (results: BulkPersonalizationResult) => void;
  className?: string;
}

interface BulkPersonalizationResult {
  success: boolean;
  totalProcessed: number;
  successfulPersonalizations: number;
  failedPersonalizations: number;
  results: {
    leadId: string;
    success: boolean;
    scriptId?: string;
    confidence?: number;
    error?: string;
    processingTime: number;
  }[];
  totalProcessingTime: number;
  averageConfidence: number;
}

export function BulkPersonalizationPanel({
  selectedLeadIds,
  tenantId,
  organizationId,
  onPersonalizationComplete,
  className = ""
}: BulkPersonalizationPanelProps) {
  // Estados principales
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<BulkPersonalizationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentLead, setCurrentLead] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Estados de configuración
  const [selectedObjective, setSelectedObjective] = useState<CallObjective>('prospecting');
  const [selectedStrategy, setSelectedStrategy] = useState<PersonalizationStrategy | ''>('');
  const [maxConcurrency, setMaxConcurrency] = useState(3);
  const [customInstructions, setCustomInstructions] = useState('');

  // Estado de filtros y vista
  const [showSuccessOnly, setShowSuccessOnly] = useState(false);
  const [showFailuresOnly, setShowFailuresOnly] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  /**
   * Iniciar personalización masiva
   */
  const startBulkPersonalization = async () => {
    if (selectedLeadIds.length === 0) {
      setError('No leads selected for personalization');
      return;
    }

    try {
      setIsProcessing(true);
      setIsPaused(false);
      setError(null);
      setProgress(0);
      setResults(null);

      console.log('🔄 [BULK PERSONALIZATION] Starting bulk personalization:', {
        totalLeads: selectedLeadIds.length,
        objective: selectedObjective,
        strategy: selectedStrategy || 'auto-select',
        concurrency: maxConcurrency
      });

      const response = await fetch('/api/calls/bulk-personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          organizationId,
          leadIds: selectedLeadIds,
          callObjective: selectedObjective,
          preferredStrategy: selectedStrategy || undefined,
          maxConcurrency,
          customInstructions: customInstructions || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setResults(data);
        setProgress(100);
        onPersonalizationComplete?.(data);

        console.log('✅ [BULK PERSONALIZATION] Bulk personalization completed:', {
          successful: data.successfulPersonalizations,
          failed: data.failedPersonalizations,
          successRate: Math.round((data.successfulPersonalizations / data.totalProcessed) * 100) + '%'
        });
      } else {
        throw new Error(data.error || 'Failed to process bulk personalization');
      }

    } catch (error) {
      console.error('❌ [BULK PERSONALIZATION] Error in bulk personalization:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsProcessing(false);
      setCurrentLead('');
    }
  };

  /**
   * Pausar/reanudar procesamiento
   */
  const togglePause = () => {
    setIsPaused(!isPaused);
    // TODO: Implementar pausa real en el backend
  };

  /**
   * Cancelar procesamiento
   */
  const cancelProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentLead('');
    // TODO: Implementar cancelación en el backend
  };

  /**
   * Toggle expandir resultado
   */
  const toggleExpandResult = (leadId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedResults(newExpanded);
  };

  /**
   * Filtrar resultados
   */
  const filteredResults = results?.results.filter(result => {
    if (showSuccessOnly && !result.success) return false;
    if (showFailuresOnly && result.success) return false;
    return true;
  }) || [];

  /**
   * Estadísticas de resultados
   */
  const getResultStats = () => {
    if (!results) return null;

    const successful = results.results.filter(r => r.success);
    const failed = results.results.filter(r => !r.success);
    
    return {
      successRate: Math.round((successful.length / results.totalProcessed) * 100),
      averageConfidence: results.averageConfidence,
      averageProcessingTime: results.results.reduce((acc, r) => acc + r.processingTime, 0) / results.results.length,
      totalTime: results.totalProcessingTime
    };
  };

  const stats = getResultStats();

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <span>🚀 Personalización Masiva</span>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Generar scripts personalizados para {selectedLeadIds.length} leads seleccionados
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {results && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {results.successfulPersonalizations}/{results.totalProcessed} exitosos
                </div>
                <div className="text-xs text-gray-500">
                  {stats?.successRate}% tasa de éxito
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuración */}
      {!isProcessing && !results && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Objetivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Objetivo de Llamadas
              </label>
              <select
                value={selectedObjective}
                onChange={(e) => setSelectedObjective(e.target.value as CallObjective)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              >
                {Object.entries(OBJECTIVE_DESCRIPTIONS).map(([key, description]) => (
                  <option key={key} value={key}>
                    {key.replace('_', ' ')} - {description.split(':')[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Estrategia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Estrategia
              </label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as PersonalizationStrategy | '')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">🤖 Auto-selección IA</option>
                {Object.entries(STRATEGY_DESCRIPTIONS).map(([key, description]) => (
                  <option key={key} value={key}>
                    {key.replace('_', ' ')} - {description.split(':')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Concurrencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concurrencia Máxima
              </label>
              <select
                value={maxConcurrency}
                onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              >
                <option value={1}>1 (Lento, menor uso API)</option>
                <option value={2}>2 (Balanceado)</option>
                <option value={3}>3 (Recomendado)</option>
                <option value={5}>5 (Rápido, mayor uso API)</option>
              </select>
            </div>

            {/* Espacio para futuras opciones */}
            <div className="flex items-end">
              <div className="bg-gray-50 rounded-lg p-3 w-full">
                <div className="text-sm text-gray-600">
                  <strong>Estimado:</strong> ~{Math.ceil(selectedLeadIds.length / maxConcurrency)} minutos
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Tiempo aproximado de procesamiento
                </div>
              </div>
            </div>
          </div>

          {/* Instrucciones personalizadas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instrucciones Personalizadas (Opcional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ej: Enfocar en ROI, mencionar caso de éxito específico, usar tono formal..."
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedLeadIds.length} leads seleccionados para personalizar
            </div>
            
            <button
              onClick={startBulkPersonalization}
              disabled={selectedLeadIds.length === 0}
              className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              <span>Iniciar Personalización</span>
            </button>
          </div>
        </div>
      )}

      {/* Procesando */}
      {isProcessing && (
        <div className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isPaused ? 'Pausado' : 'Generando Scripts Personalizados'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {currentLead ? `Procesando: ${currentLead.slice(0, 8)}...` : 'Inicializando...'}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={togglePause}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
              </button>
              
              <button
                onClick={cancelProcessing}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {results && !isProcessing && (
        <div className="p-6">
          {/* Estadísticas de resultados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {results.successfulPersonalizations}
              </div>
              <div className="text-sm text-green-800">Exitosos</div>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {results.failedPersonalizations}
              </div>
              <div className="text-sm text-red-800">Fallidos</div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.successRate}%
              </div>
              <div className="text-sm text-blue-800">Tasa Éxito</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(results.averageConfidence)}
              </div>
              <div className="text-sm text-purple-800">Confianza Prom.</div>
            </div>
          </div>

          {/* Filtros de resultados */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <button
              onClick={() => {
                setShowSuccessOnly(!showSuccessOnly);
                setShowFailuresOnly(false);
              }}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                showSuccessOnly 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Solo Exitosos
            </button>
            
            <button
              onClick={() => {
                setShowFailuresOnly(!showFailuresOnly);
                setShowSuccessOnly(false);
              }}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                showFailuresOnly 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Solo Fallidos
            </button>

            <div className="ml-auto text-sm text-gray-600">
              Mostrando {filteredResults.length} de {results.results.length} resultados
            </div>
          </div>

          {/* Lista de resultados */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredResults.map((result, index) => (
              <div
                key={result.leadId}
                className={`border rounded-lg p-4 ${
                  result.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          Lead {result.leadId.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-600">
                          {result.success 
                            ? `Script generado (Confianza: ${result.confidence}%)`
                            : `Error: ${result.error}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500">
                      {result.processingTime}ms
                    </div>
                    
                    {result.success && result.scriptId && (
                      <button
                        onClick={() => toggleExpandResult(result.leadId)}
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalles expandidos */}
                {expandedResults.has(result.leadId) && result.success && result.scriptId && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="text-sm text-gray-700">
                      <strong>Script ID:</strong> {result.scriptId}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      <strong>Confianza:</strong> {result.confidence}%
                    </div>
                    {/* TODO: Mostrar preview del script si es necesario */}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Acciones de resultados */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Personalización completada en {Math.round(results.totalProcessingTime / 1000)}s
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setResults(null);
                  setProgress(0);
                }}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Nueva Personalización</span>
              </button>
              
              {/* TODO: Exportar resultados */}
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}