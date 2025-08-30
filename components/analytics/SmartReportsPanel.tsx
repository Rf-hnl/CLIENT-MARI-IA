/**
 * SMART REPORTS PANEL
 * 
 * Panel para reportes inteligentes generados con IA
 * Muestra insights, anomalías, tendencias y recomendaciones automáticas
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain,
  FileText,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Clock,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Filter,
  ChevronDown,
  ChevronRight,
  Sparkles,
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  ArrowRight
} from 'lucide-react';

import {
  SmartReport,
  ReportFinding,
  ReportRecommendation
} from '@/types/analytics';

interface SmartReportsPanelProps {
  tenantId: string;
  organizationId: string;
  onReportGenerated?: (report: SmartReport) => void;
  className?: string;
}

export function SmartReportsPanel({
  tenantId,
  organizationId,
  onReportGenerated,
  className = ""
}: SmartReportsPanelProps) {
  // Estados principales
  const [reports, setReports] = useState<SmartReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados de vista
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  /**
   * Cargar reportes existentes
   */
  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📊 [SMART REPORTS] Loading reports...');

      const typeParam = selectedType !== 'all' ? `&type=${selectedType}` : '';
      const response = await fetch(
        `/api/analytics/smart-reports?tenantId=${tenantId}&organizationId=${organizationId}${typeParam}`
      );

      const data = await response.json();

      if (data.success) {
        setReports(data.data.reports);
        console.log('✅ [SMART REPORTS] Reports loaded:', data.data.reports.length);
      } else {
        throw new Error(data.error || 'Failed to load reports');
      }

    } catch (error) {
      console.error('❌ [SMART REPORTS] Error loading reports:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generar nuevo reporte
   */
  const generateReport = async (reportType: SmartReport['type']) => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log('🤖 [SMART REPORTS] Generating new report:', reportType);

      const response = await fetch('/api/analytics/smart-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId,
          organizationId,
          reportType
        })
      });

      const data = await response.json();

      if (data.success) {
        const newReport = data.data.report;
        setReports(prev => [newReport, ...prev]);
        onReportGenerated?.(newReport);
        
        console.log('✅ [SMART REPORTS] Report generated:', newReport.id);
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }

    } catch (error) {
      console.error('❌ [SMART REPORTS] Error generating report:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Toggle expansión de reporte
   */
  const toggleReportExpansion = (reportId: string) => {
    const newExpanded = new Set(expandedReports);
    if (newExpanded.has(reportId)) {
      newExpanded.delete(reportId);
    } else {
      newExpanded.add(reportId);
    }
    setExpandedReports(newExpanded);
  };

  /**
   * Obtener icono por tipo de reporte
   */
  const getReportIcon = (type: SmartReport['type']) => {
    switch (type) {
      case 'performance': return BarChart3;
      case 'insights': return Lightbulb;
      case 'forecast': return TrendingUp;
      case 'exception': return AlertTriangle;
      case 'opportunity': return Target;
      default: return FileText;
    }
  };

  /**
   * Obtener color de prioridad
   */
  const getPriorityColor = (priority: SmartReport['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  /**
   * Obtener icono por tipo de hallazgo
   */
  const getFindingIcon = (type: ReportFinding['type']) => {
    switch (type) {
      case 'insight': return Lightbulb;
      case 'anomaly': return AlertTriangle;
      case 'trend': return TrendingUp;
      case 'correlation': return Zap;
      case 'prediction': return Brain;
      default: return Eye;
    }
  };

  /**
   * Obtener color de severidad
   */
  const getSeverityColor = (severity: ReportFinding['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'info': return 'text-blue-600 bg-blue-50';
    }
  };

  /**
   * Cargar datos al montar y cuando cambia el filtro
   */
  useEffect(() => {
    loadReports();
  }, [tenantId, organizationId, selectedType]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <Brain className="w-12 h-12 text-purple-600 animate-pulse mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando Reportes Inteligentes
          </h3>
          <p className="text-gray-600">Obteniendo insights generados por IA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <span>🧠 Reportes Inteligentes</span>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Insights automáticos y recomendaciones generados con IA
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Filtros */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="performance">Performance</option>
              <option value="insights">Insights</option>
              <option value="forecast">Forecast</option>
              <option value="exception">Excepciones</option>
              <option value="opportunity">Oportunidades</option>
            </select>

            {/* Generar reportes */}
            <div className="relative">
              <button
                onClick={() => generateReport('insights')}
                disabled={isGenerating}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>{isGenerating ? 'Generando...' : 'Generar Reporte'}</span>
              </button>
            </div>

            {/* Actualizar */}
            <button
              onClick={loadReports}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="p-6">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay reportes disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              Genera tu primer reporte inteligente para obtener insights automáticos
            </p>
            <button
              onClick={() => generateReport('performance')}
              disabled={isGenerating}
              className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 mx-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generar Reporte de Performance</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => {
              const ReportIcon = getReportIcon(report.type);
              const isExpanded = expandedReports.has(report.id);

              return (
                <div key={report.id} className="border border-gray-200 rounded-lg">
                  {/* Header del reporte */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleReportExpansion(report.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${getPriorityColor(report.priority)}`}>
                          <ReportIcon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              report.priority === 'critical' ? 'bg-red-100 text-red-800' :
                              report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              report.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.priority.toUpperCase()}
                            </span>
                            {report.aiConfidence && (
                              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                {Math.round(report.aiConfidence * 100)}% Confianza IA
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-700 mb-3">
                            {report.summary}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{report.createdAt.toLocaleDateString('es-ES')}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{report.keyFindings.length} hallazgos</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{report.recommendations.length} recomendaciones</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implementar descarga de reporte
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenido expandido */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* Key Findings */}
                      <div className="p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                          <Lightbulb className="w-5 h-5 text-yellow-600" />
                          <span>Hallazgos Principales</span>
                        </h4>
                        
                        <div className="space-y-4">
                          {report.keyFindings.map((finding, index) => {
                            const FindingIcon = getFindingIcon(finding.type);
                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border ${getSeverityColor(finding.severity)}`}
                              >
                                <div className="flex items-start space-x-3">
                                  <FindingIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h5 className="font-medium">
                                        {finding.title}
                                      </h5>
                                      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                        {Math.round(finding.confidence * 100)}% confianza
                                      </span>
                                    </div>
                                    <p className="text-sm">
                                      {finding.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="px-6 pb-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                          <Target className="w-5 h-5 text-green-600" />
                          <span>Recomendaciones</span>
                        </h4>
                        
                        <div className="space-y-4">
                          {report.recommendations
                            .sort((a, b) => b.priority - a.priority)
                            .map((rec) => (
                              <div
                                key={rec.id}
                                className="p-4 bg-green-50 border border-green-200 rounded-lg"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h5 className="font-medium text-green-900">
                                        {rec.title}
                                      </h5>
                                      <span className="px-2 py-1 text-xs font-medium bg-green-200 text-green-800 rounded-full">
                                        Prioridad {rec.priority}
                                      </span>
                                    </div>
                                    
                                    <p className="text-sm text-green-800 mb-3">
                                      {rec.description}
                                    </p>
                                    
                                    <div className="flex items-center space-x-4 text-xs text-green-700">
                                      <span>
                                        <strong>Esfuerzo:</strong> {rec.effort}
                                      </span>
                                      <span>
                                        <strong>Impacto:</strong> {rec.impact}
                                      </span>
                                      <span>
                                        <strong>Tiempo:</strong> {rec.timeline}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <button className="ml-4 flex items-center space-x-2 text-green-600 hover:text-green-800">
                                    <span className="text-sm">Implementar</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}