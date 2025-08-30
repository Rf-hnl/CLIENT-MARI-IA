/**
 * UTILIDADES PARA ALERTAS DE IA
 * Maneja alertas específicas para errores de IA con Sonner
 */

import { toast } from 'sonner';

export interface IAError {
  status?: number;
  message: string;
  type?: 'rate_limit' | 'insufficient_quota' | 'invalid_api_key' | 'server_error' | 'unknown';
}

/**
 * Analizar error de IA y determinar tipo
 */
export function parseIAError(error: any): IAError {
  const message = error?.message || error?.error || error?.details || 'Error desconocido';
  const status = error?.status || 0;

  // Determinar tipo de error
  let type: IAError['type'] = 'unknown';
  
  if (status === 429 || message.includes('Too Many Requests') || message.includes('rate limit')) {
    type = 'rate_limit';
  } else if (status === 402 || message.includes('insufficient_quota') || message.includes('billing') || message.includes('credits')) {
    type = 'insufficient_quota';
  } else if (status === 401 || message.includes('invalid_api_key') || message.includes('Incorrect API key')) {
    type = 'invalid_api_key';
  } else if (status >= 500) {
    type = 'server_error';
  }

  return { status, message, type };
}

/**
 * Mostrar alerta específica para cada tipo de error de IA
 */
export function showIAErrorToast(error: any): void {
  const parsedError = parseIAError(error);

  switch (parsedError.type) {
    case 'rate_limit':
      toast.error('🚫 Límite de consultas alcanzado', {
        description: 'IA ha limitado las consultas. El sistema reintentará automáticamente en unos minutos.',
        duration: 10000,
        action: {
          label: 'Entendido',
          onClick: () => {}
        }
      });
      break;

    case 'insufficient_quota':
      toast.error('💳 Sin créditos disponibles', {
        description: 'Tu cuenta de IA se ha quedado sin créditos. Agrega saldo para continuar usando el análisis.',
        duration: 15000,
        action: {
          label: 'Contactar Soporte',
          onClick: () => {}
        }
      });
      break;

    case 'invalid_api_key':
      toast.error('🔑 Clave API inválida', {
        description: 'La clave de API de IA es inválida o ha expirado. Contacta al administrador.',
        duration: 12000,
        action: {
          label: 'Contactar Soporte',
          onClick: () => {}
        }
      });
      break;

    case 'server_error':
      toast.error('⚠️ Error del servidor de IA', {
        description: 'Hay un problema temporal con IA. El servicio se restablecerá automáticamente.',
        duration: 8000,
        action: {
          label: 'Reintentar',
          onClick: () => window.location.reload()
        }
      });
      break;

    default:
      toast.error('❌ Error en el análisis', {
        description: parsedError.message.length > 100 
          ? 'Ha ocurrido un error inesperado durante el análisis.' 
          : parsedError.message,
        duration: 6000,
      });
      break;
  }
}

/**
 * Mostrar alerta de éxito para análisis completado
 */
export function showAnalysisSuccessToast(data: {
  processingTime?: number;
  tokensUsed?: number;
  cost?: number;
}): void {
  const timeSeconds = data.processingTime ? Math.round(data.processingTime / 1000) : 0;
  const costFormatted = data.cost ? `$${data.cost.toFixed(4)}` : '$0.0000';
  
  toast.success('🧠 Análisis completado exitosamente', {
    description: `Tiempo: ${timeSeconds}s • Tokens: ${data.tokensUsed || 0} • Costo: ${costFormatted}`,
    duration: 5000,
    action: {
      label: 'Ver Resultados',
      onClick: () => {
        // Scroll hacia los resultados del análisis
        const element = document.getElementById('analysis-results');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });
}

/**
 * Mostrar alerta de progreso para análisis en curso
 */
export function showAnalysisProgressToast(): string | number {
  return toast.loading('🧠 Analizando conversación con IA...', {
    description: 'Extrayendo insights de sentiment, calidad y predicciones. Esto puede tomar 15-30 segundos.',
    duration: 45000,
  });
}

/**
 * Mostrar alerta de información sobre créditos
 */
export function showCreditsInfoToast(remainingCredits?: number): void {
  if (remainingCredits !== undefined) {
    toast.info('💰 Información de créditos', {
      description: `Créditos restantes: $${remainingCredits.toFixed(2)}`,
      duration: 4000,
    });
  } else {
    toast.info('💡 Consejo sobre créditos', {
      description: 'Mantente informado sobre el estado del sistema de análisis.',
      duration: 4000
    });
  }
}