/**
 * COMPONENTE PARA MOSTRAR RESULTADOS DE ANÁLISIS
 * 
 * Muestra resultados con tooltips informativos y formato visual
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnalysisHelpTooltip } from './analysis-help-tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star,
  Target,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface AnalysisResultProps {
  label: string;
  value: string | number;
  type: 'sentiment' | 'quality' | 'engagement' | 'prediction' | 'metrics' | 'insights';
  subtype?: string;
  format?: 'text' | 'percentage' | 'score' | 'badge' | 'progress';
  variant?: 'positive' | 'negative' | 'neutral' | 'warning';
  className?: string;
}

function getSentimentIcon(sentiment: string) {
  switch (sentiment.toLowerCase()) {
    case 'positive':
    case 'positivo':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'negative':
    case 'negativo':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    case 'neutral':
      return <Minus className="w-4 h-4 text-gray-500" />;
    case 'mixed':
    case 'mixto':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-500" />;
  }
}

function getVariantColor(variant: string, format: string) {
  if (format === 'progress') {
    switch (variant) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  }

  // Para badges y texto
  switch (variant) {
    case 'positive': return 'text-green-600 bg-green-50 border-green-200';
    case 'negative': return 'text-red-600 bg-red-50 border-red-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function formatValue(value: string | number, format: string) {
  if (typeof value === 'number') {
    switch (format) {
      case 'percentage':
        return `${Math.round(value * 100)}%`;
      case 'score':
        return `${Math.round(value)}/100`;
      default:
        return value.toString();
    }
  }
  return value;
}

function getUrgencyIcon(urgency: string) {
  switch (urgency.toLowerCase()) {
    case 'critical':
    case 'crítico':
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case 'high':
    case 'alto':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'medium':
    case 'medio':
      return <Target className="w-4 h-4 text-yellow-500" />;
    case 'low':
    case 'bajo':
      return <Star className="w-4 h-4 text-green-500" />;
    default:
      return <Clock className="w-4 h-4 text-gray-500" />;
  }
}

export function AnalysisResultDisplay({
  label,
  value,
  type,
  subtype,
  format = 'text',
  variant = 'neutral',
  className = ''
}: AnalysisResultProps) {
  const formattedValue = formatValue(value, format);
  const colorClasses = getVariantColor(variant, format);

  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
        <AnalysisHelpTooltip type={type} subtype={subtype} />
      </div>

      <div className="flex items-center space-x-2">
        {/* Iconos especiales para sentiment y urgency */}
        {type === 'sentiment' && typeof value === 'string' && getSentimentIcon(value)}
        {subtype === 'urgency' && typeof value === 'string' && getUrgencyIcon(value)}

        {format === 'badge' ? (
          <Badge className={colorClasses}>
            {formattedValue}
          </Badge>
        ) : format === 'progress' && typeof value === 'number' ? (
          <div className="flex items-center space-x-2 min-w-[120px]">
            <Progress 
              value={value * 100} 
              className="w-16 h-2"
            />
            <span className="text-sm font-medium text-gray-600 min-w-[3ch]">
              {Math.round(value * 100)}%
            </span>
          </div>
        ) : (
          <span className={`text-sm font-semibold px-2 py-1 rounded-md ${colorClasses}`}>
            {formattedValue}
          </span>
        )}
      </div>
    </div>
  );
}

// Componente específico para mostrar análisis de sentiment completo
export function SentimentAnalysisDisplay({ 
  sentiment, 
  score, 
  confidence,
  className = '' 
}: {
  sentiment: string;
  score: number;
  confidence: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 p-4 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold text-gray-800">Análisis de Sentiment</h3>
        <AnalysisHelpTooltip type="sentiment" />
      </div>

      <div className="space-y-2">
        <AnalysisResultDisplay
          label="Sentiment General"
          value={sentiment}
          type="sentiment"
          format="badge"
          variant={
            sentiment.toLowerCase().includes('positiv') ? 'positive' :
            sentiment.toLowerCase().includes('negativ') ? 'negative' :
            sentiment.toLowerCase().includes('mix') ? 'warning' : 'neutral'
          }
        />

        <AnalysisResultDisplay
          label="Score de Sentiment"
          value={score}
          type="sentiment"
          subtype="score"
          format="progress"
          variant={score > 0.3 ? 'positive' : score < -0.3 ? 'negative' : 'neutral'}
        />

        <AnalysisResultDisplay
          label="Confianza del Análisis"
          value={confidence}
          type="sentiment"
          subtype="confidence"
          format="percentage"
          variant={confidence > 0.8 ? 'positive' : confidence > 0.6 ? 'neutral' : 'warning'}
        />
      </div>

      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>🤖 Analizado con MAR-IA</span>
          <span>•</span>
          <span>Análisis completado</span>
        </div>
      </div>
    </div>
  );
}