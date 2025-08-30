/**
 * COMPONENTE DE AYUDA PARA ANÁLISIS IA
 * 
 * Tooltips informativos para explicar resultados de análisis
 * de conversaciones, sentiment, calidad, etc.
 */

import React from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AnalysisHelpTooltipProps {
  type: 'sentiment' | 'quality' | 'engagement' | 'prediction' | 'metrics' | 'insights';
  subtype?: string;
  className?: string;
}

const HELP_CONTENT = {
  sentiment: {
    default: {
      title: "Análisis de Sentiment",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué es?</strong> Analiza las emociones y actitud del cliente durante la conversación.</p>
          <div class="space-y-1">
            <p><strong>Tipos de sentiment:</strong></p>
            <ul class="list-disc list-inside space-y-1 text-sm">
              <li><span class="text-green-600">Positivo:</span> Cliente contento, interesado, satisfecho</li>
              <li><span class="text-red-600">Negativo:</span> Cliente molesto, frustrado, descontento</li>
              <li><span class="text-gray-600">Neutral:</span> Cliente ni positivo ni negativo, informativo</li>
              <li><span class="text-yellow-600">Mixto:</span> Cambios de emoción durante la llamada</li>
            </ul>
          </div>
          <p class="text-xs text-gray-500">🤖 Analizado con MAR-IA</p>
        </div>
      `
    },
    score: {
      title: "Score de Sentiment",
      description: `
        <div class="space-y-2">
          <p><strong>Escala:</strong> De -1.0 (muy negativo) a +1.0 (muy positivo)</p>
          <div class="space-y-1 text-sm">
            <p>📊 <strong>Interpretación:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><span class="text-green-600">0.3 a 1.0:</span> Sentiment positivo</li>
              <li><span class="text-gray-600">-0.3 a 0.3:</span> Sentiment neutral</li>
              <li><span class="text-red-600">-1.0 a -0.3:</span> Sentiment negativo</li>
            </ul>
          </div>
          <p class="text-xs text-gray-500">Mientras más cerca de los extremos, más fuerte es la emoción</p>
        </div>
      `
    },
    confidence: {
      title: "Confianza del Análisis",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué es?</strong> Indica qué tan segura está la IA de su análisis.</p>
          <div class="space-y-1 text-sm">
            <p>📈 <strong>Niveles:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><span class="text-green-600">80-100%:</span> Muy confiable</li>
              <li><span class="text-yellow-600">60-80%:</span> Confiable</li>
              <li><span class="text-orange-600">40-60%:</span> Moderada</li>
              <li><span class="text-red-600">0-40%:</span> Baja confianza</li>
            </ul>
          </div>
          <p class="text-xs text-gray-500">Mayor confianza = análisis más preciso</p>
        </div>
      `
    }
  },
  
  quality: {
    default: {
      title: "Análisis de Calidad",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué evalúa?</strong> La calidad general de la llamada y performance del agente.</p>
          <div class="space-y-1 text-sm">
            <p>📊 <strong>Factores evaluados:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li>Profesionalismo del agente</li>
              <li>Claridad en la comunicación</li>
              <li>Manejo de objeciones</li>
              <li>Seguimiento del script</li>
              <li>Cierre efectivo</li>
            </ul>
          </div>
          <p class="text-xs text-gray-500">Score: 0-100 puntos</p>
        </div>
      `
    },
    flow: {
      title: "Flujo de Conversación",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué es?</strong> Evalúa qué tan natural y fluida fue la conversación.</p>
          <div class="space-y-1 text-sm">
            <p>⭐ <strong>Calificaciones:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><span class="text-green-600">Excelente:</span> Conversación muy fluida</li>
              <li><span class="text-blue-600">Bueno:</span> Conversación natural</li>
              <li><span class="text-yellow-600">Regular:</span> Algunos problemas menores</li>
              <li><span class="text-red-600">Pobre:</span> Conversación forzada o confusa</li>
            </ul>
          </div>
        </div>
      `
    }
  },

  engagement: {
    default: {
      title: "Nivel de Engagement",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué mide?</strong> Qué tan interesado y participativo estuvo el cliente.</p>
          <div class="space-y-1 text-sm">
            <p>🎯 <strong>Indicadores:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li>Participación activa del cliente</li>
              <li>Preguntas realizadas</li>
              <li>Respuestas detalladas</li>
              <li>Tiempo de conversación</li>
              <li>Interés mostrado</li>
            </ul>
          </div>
          <p class="text-xs text-gray-500">Scale: 1-10 (mayor = más interesado)</p>
        </div>
      `
    },
    score: {
      title: "Score de Engagement",
      description: `
        <div class="space-y-2">
          <p><strong>Escala:</strong> 0-100 puntos de engagement</p>
          <div class="space-y-1 text-sm">
            <p>📈 <strong>Interpretación:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><span class="text-green-600">80-100:</span> Muy engaged</li>
              <li><span class="text-blue-600">60-79:</span> Bien engaged</li>
              <li><span class="text-yellow-600">40-59:</span> Moderadamente engaged</li>
              <li><span class="text-red-600">0-39:</span> Poco engaged</li>
            </ul>
          </div>
        </div>
      `
    }
  },

  prediction: {
    default: {
      title: "Predicciones IA",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué predice?</strong> Usa IA para predecir el comportamiento futuro del cliente.</p>
          <div class="space-y-1 text-sm">
            <p>🔮 <strong>Predicciones incluyen:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li>Probabilidad de conversión</li>
              <li>Acción recomendada</li>
              <li>Urgencia de seguimiento</li>
              <li>Timeline sugerido</li>
            </ul>
          </div>
          <p class="text-xs text-gray-500">Basado en patrones de miles de conversaciones</p>
        </div>
      `
    },
    conversion: {
      title: "Probabilidad de Conversión",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué es?</strong> La probabilidad de que este cliente termine comprando.</p>
          <div class="space-y-1 text-sm">
            <p>🎯 <strong>Rangos:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><span class="text-green-600">80-100%:</span> Muy probable (Hot Lead)</li>
              <li><span class="text-blue-600">60-79%:</span> Probable (Warm Lead)</li>
              <li><span class="text-yellow-600">40-59%:</span> Posible (Qualified Lead)</li>
              <li><span class="text-gray-600">20-39%:</span> Baja probabilidad</li>
              <li><span class="text-red-600">0-19%:</span> Muy improbable</li>
            </ul>
          </div>
        </div>
      `
    },
    urgency: {
      title: "Nivel de Urgencia",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué indica?</strong> Qué tan rápido debes hacer seguimiento.</p>
          <div class="space-y-1 text-sm">
            <p>⚡ <strong>Niveles:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><span class="text-red-600">Crítico:</span> Contactar inmediatamente</li>
              <li><span class="text-orange-600">Alto:</span> Contactar hoy mismo</li>
              <li><span class="text-yellow-600">Medio:</span> Contactar en 1-3 días</li>
              <li><span class="text-green-600">Bajo:</span> Contactar cuando sea posible</li>
            </ul>
          </div>
        </div>
      `
    }
  },

  insights: {
    default: {
      title: "Insights Clave",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué son?</strong> Información valiosa extraída automáticamente de la conversación.</p>
          <div class="space-y-1 text-sm">
            <p>💡 <strong>Incluye:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><strong>Temas clave:</strong> De qué se habló</li>
              <li><strong>Pain points:</strong> Problemas del cliente</li>
              <li><strong>Señales de compra:</strong> Interés mostrado</li>
              <li><strong>Objeciones:</strong> Preocupaciones expresadas</li>
              <li><strong>Competidores:</strong> Menciones de otros proveedores</li>
            </ul>
          </div>
        </div>
      `
    }
  },

  metrics: {
    default: {
      title: "Métricas de Conversación",
      description: `
        <div class="space-y-2">
          <p><strong>¿Qué mide?</strong> Estadísticas objetivas de la conversación.</p>
          <div class="space-y-1 text-sm">
            <p>📊 <strong>Métricas:</strong></p>
            <ul class="list-disc list-inside space-y-1">
              <li><strong>Preguntas:</strong> Hechas por agente y respondidas por cliente</li>
              <li><strong>Interrupciones:</strong> Cuántas veces se cortaron</li>
              <li><strong>Talk time ratio:</strong> Quién habló más</li>
              <li><strong>Duración:</strong> Tiempo total de llamada</li>
            </ul>
          </div>
        </div>
      `
    }
  }
};

export function AnalysisHelpTooltip({ type, subtype = 'default', className = '' }: AnalysisHelpTooltipProps) {
  const helpContent = HELP_CONTENT[type]?.[subtype] || HELP_CONTENT[type]?.default;

  if (!helpContent) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors ${className}`}
            type="button"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="sr-only">Ayuda</span>
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          className="max-w-sm bg-white border shadow-lg rounded-lg p-4 z-50"
          sideOffset={8}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">
              {helpContent.title}
            </h4>
            <div 
              className="text-xs text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: helpContent.description }}
            />
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}