/**
 * EJEMPLOS DE USO - SENTIMENT ANALYSIS IA FASE 2
 * 
 * Componente que demuestra las diferentes variantes y configuraciones
 * del sistema de análisis de sentiment avanzado
 */

"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SentimentAnalysisAdvanced } from '@/components/ui/sentiment-analysis-advanced';
import { ConversationAnalysisPanelPhase2 } from '@/components/leads/ConversationAnalysisPanelPhase2';
import { AnalysisResultDisplay, SentimentAnalysisDisplay } from '@/components/ui/analysis-result-display';
import { 
  Palette, 
  Settings, 
  Eye, 
  Code, 
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';

export function SentimentAnalysisExamples() {
  const [activeExample, setActiveExample] = useState('variants');
  const [currentVariant, setCurrentVariant] = useState<'positive' | 'negative' | 'neutral' | 'warning'>('positive');
  const [currentFormat, setCurrentFormat] = useState<'text' | 'percentage' | 'score' | 'badge' | 'progress'>('badge');
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Mock data para ejemplos
  const mockSentimentData = {
    overall: {
      sentiment: "Muy Positivo",
      score: 0.85,
      confidence: 0.92
    },
    temporal: {
      timeline: Array.from({ length: 10 }, (_, i) => ({
        timestamp: i * 30,
        sentiment: 0.2 + (Math.sin(i * 0.6) * 0.6) + (Math.random() * 0.1),
        confidence: 0.8 + (Math.random() * 0.15),
        emotion: ['positive', 'positive', 'neutral', 'positive', 'positive', 'negative', 'neutral', 'positive', 'positive', 'positive'][i]
      })),
      averageSentiment: 0.78,
      sentimentTrend: 'improving' as const
    },
    insights: {
      keyMoments: [
        { time: 30, type: 'peak' as const, description: 'Entusiasmo inicial sobre la propuesta', impact: 'high' as const },
        { time: 150, type: 'valley' as const, description: 'Dudas sobre la implementación', impact: 'medium' as const },
        { time: 240, type: 'shift' as const, description: 'Aceptación y compromiso final', impact: 'high' as const }
      ],
      emotionBreakdown: { positive: 7, neutral: 2, negative: 1 },
      riskFactors: ['Timeline ajustado', 'Recursos limitados'],
      opportunities: ['Expansión futura', 'Referencias potenciales', 'Upselling']
    },
    metadata: {
      processingTime: 3.1,
      tokensUsed: 1582,
      model: 'gpt-4o-mini',
      cost: 0.018
    }
  };

  const getDeviceClasses = () => {
    switch (deviceView) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg text-white">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Análisis de Sentiment IA - Fase 2
            </h1>
            <p className="text-gray-600 mt-1">
              Interfaz unificada minimalista, adaptada a diseño gráfico y responsiva
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-purple-100 text-purple-800">Unificada</Badge>
          <Badge className="bg-blue-100 text-blue-800">Minimalista</Badge>
          <Badge className="bg-green-100 text-green-800">Responsiva</Badge>
          <Badge className="bg-amber-100 text-amber-800">Adaptable</Badge>
        </div>
      </div>

      {/* Selector de vista de dispositivo */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vista de Dispositivo</CardTitle>
            <div className="flex gap-2">
              {[
                { key: 'desktop', icon: Monitor, label: 'Desktop' },
                { key: 'tablet', icon: Tablet, label: 'Tablet' },
                { key: 'mobile', icon: Smartphone, label: 'Móvil' }
              ].map(({ key, icon: Icon, label }) => (
                <Button
                  key={key}
                  variant={deviceView === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeviceView(key as any)}
                  className="text-xs"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de ejemplos */}
      <Tabs value={activeExample} onValueChange={setActiveExample}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="variants" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Variantes
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Personalización
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Integración
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Código
          </TabsTrigger>
        </TabsList>

        {/* Tab: Variantes */}
        <TabsContent value="variants" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Vista Compacta</CardTitle>
                <p className="text-sm text-gray-600">
                  Ideal para dashboards, widgets laterales o vistas de resumen
                </p>
              </CardHeader>
              <CardContent>
                <div className={getDeviceClasses()}>
                  <SentimentAnalysisAdvanced
                    sentimentData={mockSentimentData}
                    variant="compact"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Vista Detallada</CardTitle>
                <p className="text-sm text-gray-600">
                  Vista completa con todas las funcionalidades y análisis profundo
                </p>
              </CardHeader>
              <CardContent>
                <div className={getDeviceClasses()}>
                  <SentimentAnalysisAdvanced
                    sentimentData={mockSentimentData}
                    variant="detailed"
                    conversationId="conv_123"
                    leadId="lead_456"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Panel Integrado Fase 2</CardTitle>
                <p className="text-sm text-gray-600">
                  Combina análisis de sentiment con análisis tradicional
                </p>
              </CardHeader>
              <CardContent>
                <div className={getDeviceClasses()}>
                  <ConversationAnalysisPanelPhase2
                    leadId="lead_456"
                    conversationId="conv_123"
                    callLogId="call_789"
                    variant="compact"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Personalización */}
        <TabsContent value="customization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Componentes Básicos</CardTitle>
              <p className="text-sm text-gray-600">
                Personaliza los componentes AnalysisResultDisplay
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Controles */}
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Variant:</label>
                    <select 
                      value={currentVariant}
                      onChange={(e) => setCurrentVariant(e.target.value as any)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="positive">Positive</option>
                      <option value="negative">Negative</option>
                      <option value="neutral">Neutral</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Format:</label>
                    <select 
                      value={currentFormat}
                      onChange={(e) => setCurrentFormat(e.target.value as any)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="text">Text</option>
                      <option value="percentage">Percentage</option>
                      <option value="score">Score</option>
                      <option value="badge">Badge</option>
                      <option value="progress">Progress</option>
                    </select>
                  </div>
                </div>

                {/* Ejemplos */}
                <div className="grid gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Ejemplo con configuración actual:</h4>
                    <AnalysisResultDisplay
                      label="Sentiment Score"
                      value={currentFormat === 'percentage' || currentFormat === 'progress' ? 0.75 : 
                             currentFormat === 'score' ? 75 : 'Positivo'}
                      type="sentiment"
                      format={currentFormat}
                      variant={currentVariant}
                    />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Componente SentimentAnalysisDisplay:</h4>
                    <SentimentAnalysisDisplay
                      sentiment="Positivo"
                      score={0.75}
                      confidence={0.89}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Integración */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Guía de Integración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">1. Importaciones necesarias:</h4>
                <div className="p-3 bg-gray-100 rounded font-mono text-sm">
{`import { SentimentAnalysisAdvanced } from '@/components/ui/sentiment-analysis-advanced';
import { ConversationAnalysisPanelPhase2 } from '@/components/leads/ConversationAnalysisPanelPhase2';
import { AnalysisResultDisplay } from '@/components/ui/analysis-result-display';`}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">2. Uso básico - Vista compacta:</h4>
                <div className="p-3 bg-gray-100 rounded font-mono text-sm">
{`<SentimentAnalysisAdvanced
  variant="compact"
  sentimentData={data}
  className="my-custom-class"
/>`}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">3. Uso avanzado - Vista completa:</h4>
                <div className="p-3 bg-gray-100 rounded font-mono text-sm">
{`<SentimentAnalysisAdvanced
  variant="detailed"
  conversationId="conv_123"
  leadId="lead_456"
  sentimentData={data}
  onRefresh={handleRefresh}
  isLoading={isLoading}
/>`}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">4. Panel integrado Fase 2:</h4>
                <div className="p-3 bg-gray-100 rounded font-mono text-sm">
{`<ConversationAnalysisPanelPhase2
  leadId="lead_456"
  conversationId="conv_123"
  callLogId="call_789"
  variant="full"
/>`}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Código */}
        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estructura de Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium">Interfaz SentimentData:</h4>
                <div className="p-4 bg-gray-100 rounded font-mono text-xs overflow-auto">
{`interface SentimentData {
  overall: {
    sentiment: string;
    score: number;
    confidence: number;
  };
  temporal: {
    timeline: Array<{
      timestamp: number;
      sentiment: number;
      confidence: number;
      emotion: string;
    }>;
    averageSentiment: number;
    sentimentTrend: 'improving' | 'declining' | 'stable';
  };
  insights: {
    keyMoments: Array<{
      time: number;
      type: 'peak' | 'valley' | 'shift';
      description: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    emotionBreakdown: Record<string, number>;
    riskFactors: string[];
    opportunities: string[];
  };
  metadata: {
    processingTime: number;
    tokensUsed: number;
    model: string;
    cost: number;
  };
}`}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Ejemplo de datos mock:</h4>
                <div className="p-4 bg-gray-100 rounded font-mono text-xs overflow-auto max-h-64">
{JSON.stringify(mockSentimentData, null, 2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer con información técnica */}
      <Card className="border-0 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="font-semibold mb-2">✨ Características Técnicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">🎨 Personalizable</div>
                <div className="text-gray-600">variants, formats, className</div>
              </div>
              <div>
                <div className="font-medium">📱 Responsivo</div>
                <div className="text-gray-600">Desktop, tablet, móvil</div>
              </div>
              <div>
                <div className="font-medium">🧠 IA Avanzada</div>
                <div className="text-gray-600">GPT-4o-mini, análisis temporal</div>
              </div>
              <div>
                <div className="font-medium">⚡ Performance</div>
                <div className="text-gray-600">Componentes optimizados</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}