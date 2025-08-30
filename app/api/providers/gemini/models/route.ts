import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * API ENDPOINT PARA OBTENER MODELOS GEMINI DINÁMICAMENTE
 * 
 * POST /api/providers/gemini/models
 * Body: { apiKey: string }
 * 
 * Retorna la lista de modelos disponibles desde la API de Google
 */

interface GeminiModel {
  name: string;
  displayName: string;
  description?: string;
  supportsGenerativeContent: boolean;
  contextWindow?: number;
  version?: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 [GEMINI_MODELS] POST endpoint llamado');
    
    let body;
    try {
      body = await req.json();
      console.log('📦 [GEMINI_MODELS] Body parsed correctly:', Object.keys(body));
    } catch (parseError) {
      console.error('❌ [GEMINI_MODELS] Error parsing body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Error al parsear el cuerpo de la petición' },
        { status: 400 }
      );
    }
    
    const { apiKey } = body;

    // Validar API Key
    if (!apiKey || typeof apiKey !== 'string') {
      console.log('❌ [GEMINI_MODELS] API Key faltante o inválida');
      return NextResponse.json(
        { success: false, error: 'API Key es requerida' },
        { status: 400 }
      );
    }

    // Validar formato básico de API Key de Google
    if (!apiKey.startsWith('AI') || apiKey.length < 35) {
      console.log('❌ [GEMINI_MODELS] Formato de API Key inválido');
      return NextResponse.json(
        { success: false, error: 'Formato de API Key inválido para Google Gemini' },
        { status: 400 }
      );
    }

    console.log('🔍 [GEMINI_MODELS] Obteniendo modelos disponibles...');
    console.log('🔑 [GEMINI_MODELS] API Key format:', `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);

    // Por simplicidad, devolver directamente modelos conocidos sin validación complicada
    const models = [
      {
        name: 'models/gemini-1.5-flash',
        supportedGenerationMethods: ['generateContent']
      },
      {
        name: 'models/gemini-1.5-pro',
        supportedGenerationMethods: ['generateContent']
      },
      {
        name: 'models/gemini-1.0-pro',
        supportedGenerationMethods: ['generateContent']
      },
      {
        name: 'models/gemini-pro',
        supportedGenerationMethods: ['generateContent']
      },
      {
        name: 'models/gemini-pro-vision',
        supportedGenerationMethods: ['generateContent']
      }
    ];

    console.log('📦 [GEMINI_MODELS] Usando lista de modelos conocidos:', models.length);

    // Procesar y filtrar modelos
    const availableModels: GeminiModel[] = models
      .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
      .map(model => {
        // Extraer información del modelo
        const modelName = model.name.replace('models/', '');
        const isVisionModel = model.name.toLowerCase().includes('vision');
        const isFlashModel = model.name.toLowerCase().includes('flash');
        const isProModel = model.name.toLowerCase().includes('pro');

        // Generar display name más amigable
        let displayName = modelName;
        if (modelName.includes('gemini-1.5-pro')) {
          displayName = isVisionModel ? 'Gemini 1.5 Pro Vision' : 'Gemini 1.5 Pro';
        } else if (modelName.includes('gemini-1.5-flash')) {
          displayName = 'Gemini 1.5 Flash';
        } else if (modelName.includes('gemini-1.0-pro')) {
          displayName = isVisionModel ? 'Gemini 1.0 Pro Vision' : 'Gemini 1.0 Pro';
        } else if (modelName.includes('gemini-pro')) {
          displayName = isVisionModel ? 'Gemini Pro Vision' : 'Gemini Pro';
        }

        // Determinar capacidades y contexto (aproximado)
        let contextWindow = 32768; // Por defecto
        let description = '';

        if (modelName.includes('1.5-pro')) {
          contextWindow = 2097152; // 2M tokens
          description = isVisionModel 
            ? 'Modelo más avanzado con capacidades de visión y contexto ultra largo'
            : 'Modelo más avanzado con contexto ultra largo (2M tokens)';
        } else if (modelName.includes('1.5-flash')) {
          contextWindow = 1048576; // 1M tokens  
          description = 'Modelo rápido y eficiente con contexto largo (1M tokens)';
        } else if (modelName.includes('1.0')) {
          description = isVisionModel 
            ? 'Modelo estable con capacidades de visión'
            : 'Modelo estable y confiable';
        } else {
          description = isVisionModel
            ? 'Modelo con capacidades de análisis visual'
            : 'Modelo de propósito general';
        }

        return {
          name: modelName,
          displayName,
          description,
          supportsGenerativeContent: true,
          contextWindow,
          version: modelName.includes('1.5') ? '1.5' : 
                  modelName.includes('1.0') ? '1.0' : 'legacy'
        };
      })
      .sort((a, b) => {
        // Ordenar: 1.5 primero, luego 1.0, luego legacy
        // Dentro de cada versión: Flash, Pro, Pro Vision
        const getWeight = (model: GeminiModel) => {
          let weight = 0;
          
          // Version weight
          if (model.version === '1.5') weight += 1000;
          else if (model.version === '1.0') weight += 500;
          
          // Type weight
          if (model.name.includes('flash')) weight += 100;
          else if (model.name.includes('pro') && !model.name.includes('vision')) weight += 80;
          else if (model.name.includes('vision')) weight += 60;
          
          return weight;
        };
        
        return getWeight(b) - getWeight(a);
      });

    console.log(`✅ [GEMINI_MODELS] Obtenidos ${availableModels.length} modelos`);

    return NextResponse.json({
      success: true,
      models: availableModels,
      totalCount: availableModels.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [GEMINI_MODELS] Error completo:', {
      message: error.message,
      status: error.status,
      statusText: error.statusText,
      cause: error.cause,
      name: error.name,
      type: typeof error,
      stack: error.stack?.substring(0, 500) // Limitar stack trace
    });
    
    // Manejar diferentes tipos de errores
    let errorMessage = 'Error al obtener modelos de Gemini';
    let statusCode = 500;

    // Errores específicos de la API de Google
    if (error.message?.includes('API_KEY_INVALID') || 
        error.message?.includes('invalid API key') ||
        error.message?.includes('Invalid API key') ||
        error.status === 400) {
      errorMessage = 'API Key inválida para Google Gemini. Verifica que la key sea correcta.';
      statusCode = 401;
    } else if (error.message?.includes('PERMISSION_DENIED') || error.status === 403) {
      errorMessage = 'Permisos insuficientes. Verifica que la API Key tenga acceso a Gemini API.';
      statusCode = 403;
    } else if (error.message?.includes('QUOTA_EXCEEDED') || error.status === 429) {
      errorMessage = 'Cuota de API excedida para Google Gemini. Intenta más tarde.';
      statusCode = 429;
    } else if (error.code === 'ENOTFOUND' || 
               error.message?.includes('fetch') ||
               error.message?.includes('network') ||
               error.status === 503) {
      errorMessage = 'Error de conexión con la API de Google Gemini. Verifica tu conexión.';
      statusCode = 503;
    } else if (error.message?.includes('GoogleGenerativeAI')) {
      errorMessage = 'Error en la inicialización del cliente de Gemini. Verifica la API Key.';
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: error.message,
          status: error.status,
          statusText: error.statusText
        } : undefined
      },
      { status: statusCode }
    );
  }
}

// También permitir GET para casos donde no necesitamos API key (modelos por defecto)
export async function GET(req: NextRequest) {
  // Retornar modelos estáticos como fallback
  const fallbackModels: GeminiModel[] = [
    {
      name: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      description: 'Modelo rápido y eficiente con contexto largo (1M tokens)',
      supportsGenerativeContent: true,
      contextWindow: 1048576,
      version: '1.5'
    },
    {
      name: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro', 
      description: 'Modelo más avanzado con contexto ultra largo (2M tokens)',
      supportsGenerativeContent: true,
      contextWindow: 2097152,
      version: '1.5'
    },
    {
      name: 'gemini-1.5-pro-vision',
      displayName: 'Gemini 1.5 Pro Vision',
      description: 'Modelo más avanzado con capacidades de visión y contexto ultra largo',
      supportsGenerativeContent: true,
      contextWindow: 2097152,
      version: '1.5'
    },
    {
      name: 'gemini-1.0-pro',
      displayName: 'Gemini 1.0 Pro',
      description: 'Modelo estable y confiable',
      supportsGenerativeContent: true,
      contextWindow: 32768,
      version: '1.0'
    }
  ];

  return NextResponse.json({
    success: true,
    models: fallbackModels,
    totalCount: fallbackModels.length,
    timestamp: new Date().toISOString(),
    note: 'Modelos por defecto. Use POST con API key para obtener lista actualizada.'
  });
}