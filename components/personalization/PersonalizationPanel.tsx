/**
 * PERSONALIZATION PANEL COMPONENT
 * 
 * Panel principal para generar y gestionar scripts personalizados
 * Incluye análisis de contexto y preview del script generado
 */

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Wand2, 
  User, 
  MessageSquare, 
  Clock, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Copy,
  Edit,
  Download,
  Play,
  Lightbulb,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

import {
  PersonalizedScript,
  ContextAnalysis,
  CallObjective,
  PersonalizationStrategy,
  PersonalityProfile,
  OBJECTIVE_DESCRIPTIONS,
  STRATEGY_DESCRIPTIONS
} from '@/types/personalization';

interface PersonalizationPanelProps {
  leadId: string;
  leadName: string;
  tenantId: string;
  organizationId: string;
  onScriptGenerated?: (script: PersonalizedScript) => void;
  onScriptUsed?: (scriptId: string) => void;
  className?: string;
}

export default function PersonalizationPanel({
  leadId,
  leadName,
  tenantId,
  organizationId,
  onScriptGenerated,
  onScriptUsed,
  className = ""
}: PersonalizationPanelProps) {
  // Estados principales
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [contextAnalysis, setContextAnalysis] = useState<ContextAnalysis | null>(null);
  const [generatedScript, setGeneratedScript] = useState<PersonalizedScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de configuración
  const [selectedObjective, setSelectedObjective] = useState<CallObjective>('prospecting');
  const [selectedStrategy, setSelectedStrategy] = useState<PersonalizationStrategy | ''>('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Estados UI
  const [activeTab, setActiveTab] = useState<'config' | 'context' | 'script'>('config');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  /**
   * Cargar análisis de contexto al montar el componente
   */
  useEffect(() => {
    if (leadId) {
      analyzeContext();
    }
  }, [leadId]);

  /**
   * Analizar contexto del lead
   */
  const analyzeContext = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);

      console.log('🔍 [PERSONALIZATION PANEL] Analyzing context for lead:', leadId.slice(0, 8) + '...');

      const response = await fetch('/api/calls/analyze-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          tenantId,
          organizationId
        })
      });

      const data = await response.json();

      if (data.success) {
        setContextAnalysis(data.contextAnalysis);
        console.log('✅ [PERSONALIZATION PANEL] Context analysis completed');
      } else {
        throw new Error(data.error || 'Failed to analyze context');
      }

    } catch (error) {
      console.error('❌ [PERSONALIZATION PANEL] Error analyzing context:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Generar script personalizado
   */
  const generateScript = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log('🎯 [PERSONALIZATION PANEL] Generating script with config:', {
        objective: selectedObjective,
        strategy: selectedStrategy || 'auto-select'
      });

      const response = await fetch('/api/calls/personalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          leadId,
          tenantId,
          organizationId,
          callObjective: selectedObjective,
          preferredStrategy: selectedStrategy || undefined,
          customInstructions: customInstructions || undefined,
          includeObjectionHandling: true,
          includeValueProps: true,
          includeSocialProof: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedScript(data.script);
        setActiveTab('script');
        onScriptGenerated?.(data.script);
        
        console.log('✅ [PERSONALIZATION PANEL] Script generated:', {
          scriptId: data.script.id,
          confidence: data.metadata.confidence
        });
      } else {
        throw new Error(data.error || 'Failed to generate script');
      }

    } catch (error) {
      console.error('❌ [PERSONALIZATION PANEL] Error generating script:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copiar contenido al clipboard
   */
  const copyToClipboard = async (content: string, sectionName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionName);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Marcar script como usado
   */
  const handleUseScript = () => {
    if (generatedScript) {
      onScriptUsed?.(generatedScript.id);
    }
  };

  /**
   * Obtener color del badge de personalidad
   */
  const getPersonalityColor = (personality: PersonalityProfile): string => {
    const colors = {
      analytical: 'bg-blue-100 text-blue-800',
      driver: 'bg-red-100 text-red-800',
      expressive: 'bg-yellow-100 text-yellow-800',
      amiable: 'bg-green-100 text-green-800'
    };
    return colors[personality];
  };

  /**
   * Obtener icono de estrategia
   */
  const getStrategyIcon = (strategy: PersonalizationStrategy) => {
    const icons = {
      consultative: MessageSquare,
      direct: Target,
      educational: Lightbulb,
      relationship: Users,
      urgency: Clock,
      social_proof: TrendingUp
    };
    const IconComponent = icons[strategy] || MessageSquare;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Brain className="w-6 h-6 text-purple-600" />
              <span>🤖 Personalización Inteligente</span>
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Script personalizado para <strong>{leadName}</strong>
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {contextAnalysis && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPersonalityColor(contextAnalysis.personalityProfile)}`}>
                <User className="w-4 h-4 mr-1" />
                {contextAnalysis.personalityProfile}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <nav className="flex space-x-8">
            {[
              { key: 'config', label: 'Configuración', icon: Target },
              { key: 'context', label: 'Contexto IA', icon: Brain },
              { key: 'script', label: 'Script Generado', icon: MessageSquare }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Tab: Configuración */}
        {activeTab === 'config' && (
          <div className="space-y-6">
            {/* Objetivo de llamada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Objetivo de la Llamada
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(OBJECTIVE_DESCRIPTIONS).map(([key, description]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedObjective(key as CallObjective)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      selectedObjective === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm capitalize mb-1">
                      {key.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Estrategia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Estrategia de Personalización
                <span className="ml-2 text-xs text-gray-500">(Opcional - IA seleccionará automáticamente)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedStrategy('')}
                  className={`p-3 text-left rounded-lg border-2 transition-all ${
                    selectedStrategy === ''
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Auto-selección IA</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    La IA elegirá la mejor estrategia basada en el contexto del lead
                  </div>
                </button>
                
                {Object.entries(STRATEGY_DESCRIPTIONS).map(([key, description]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStrategy(key as PersonalizationStrategy)}
                    className={`p-3 text-left rounded-lg border-2 transition-all ${
                      selectedStrategy === key
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {getStrategyIcon(key as PersonalizationStrategy)}
                      <span className="font-medium text-sm capitalize">
                        {key.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 line-clamp-2">
                      {description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opciones avanzadas */}
            <div>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                <span>Opciones Avanzadas</span>
                <RefreshCw className={`w-4 h-4 transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />
              </button>

              {showAdvancedOptions && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones Personalizadas
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: Enfocar en ROI, mencionar competencia específica, usar tono formal..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={generateScript}
                disabled={isGenerating || !selectedObjective}
                className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-md font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generar Script IA</span>
                  </>
                )}
              </button>

              <button
                onClick={analyzeContext}
                disabled={isAnalyzing}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-md font-medium hover:bg-gray-700 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span>Re-analizar</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab: Contexto IA */}
        {activeTab === 'context' && (
          <div className="space-y-6">
            {isAnalyzing ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Analizando contexto del lead...</p>
              </div>
            ) : contextAnalysis ? (
              <>
                {/* Profile Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Perfil del Lead</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPersonalityColor(contextAnalysis.personalityProfile)}`}>
                        <User className="w-4 h-4 mr-1" />
                        {contextAnalysis.personalityProfile}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Personalidad</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {contextAnalysis.communicationStyle}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Estilo Comunicación</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        {getStrategyIcon(contextAnalysis.recommendedStrategy)}
                        <span className="ml-1">{contextAnalysis.recommendedStrategy}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Estrategia Recomendada</p>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">✅ Puntos Clave</h4>
                    <ul className="space-y-2">
                      {contextAnalysis.keyTalkingPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">⚠️ Evitar</h4>
                    <ul className="space-y-2">
                      {contextAnalysis.avoidanceTopics.map((topic, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Confidence Scores */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Confianza del Análisis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Perfil</span>
                        <span>{contextAnalysis.profileConfidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${contextAnalysis.profileConfidence}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Recomendaciones</span>
                        <span>{contextAnalysis.recommendationConfidence}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${contextAnalysis.recommendationConfidence}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay análisis disponible</h3>
                <p className="text-gray-600 mb-4">Analiza el contexto del lead para obtener insights de IA</p>
                <button
                  onClick={analyzeContext}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Analizar Contexto
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Script Generado */}
        {activeTab === 'script' && (
          <div className="space-y-6">
            {generatedScript ? (
              <>
                {/* Script Header */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Script Personalizado</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{generatedScript.objective}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          {getStrategyIcon(generatedScript.strategy)}
                          <span>{generatedScript.strategy}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>~{generatedScript.estimatedDuration} min</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Confianza: {generatedScript.confidence}%
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${generatedScript.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Script Sections */}
                <div className="space-y-4">
                  {[
                    { section: generatedScript.opening, key: 'opening' },
                    { section: generatedScript.discovery, key: 'discovery' },
                    { section: generatedScript.presentation, key: 'presentation' },
                    ...(generatedScript.objectionHandling ? [{ section: generatedScript.objectionHandling, key: 'objection' }] : []),
                    { section: generatedScript.closing, key: 'closing' }
                  ].map(({ section, key }) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                          <span>{section.title}</span>
                          <span className="text-xs text-gray-500">
                            (~{Math.round(section.estimatedDuration / 60)} min)
                          </span>
                        </h4>
                        
                        <button
                          onClick={() => copyToClipboard(section.content, key)}
                          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          {copiedSection === key ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                        {section.content}
                      </div>
                      
                      {section.keyPoints.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-gray-600 mb-2">Puntos clave:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {section.keyPoints.map((point, idx) => (
                              <li key={idx} className="flex items-start space-x-1">
                                <span>•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Script Actions */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleUseScript}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                      <span>Usar Script</span>
                    </button>
                    
                    <button
                      onClick={() => copyToClipboard(
                        `${generatedScript.opening.content}\n\n${generatedScript.discovery.content}\n\n${generatedScript.presentation.content}\n\n${generatedScript.objectionHandling?.content || ''}\n\n${generatedScript.closing.content}`,
                        'full-script'
                      )}
                      className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copiar Todo</span>
                    </button>
                  </div>

                  <div className="text-sm text-gray-500">
                    Generado con {generatedScript.generatedByModel} • {new Date(generatedScript.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay script generado</h3>
                <p className="text-gray-600 mb-4">Configura los parámetros y genera tu script personalizado</p>
                <button
                  onClick={() => setActiveTab('config')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Ir a Configuración
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
    </div>
  );
}