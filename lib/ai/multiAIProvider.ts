// Multi-AI Provider con fallback automático
// Soporta OpenAI, Google Gemini y Claude con fallback inteligente

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaces para normalizar respuestas de diferentes proveedores
interface AIResponse {
  content: string;
  provider: 'openai' | 'gemini' | 'claude';
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

interface AIProvider {
  name: string;
  model: string;
  maxTokens: number;
  available: boolean;
}

class MultiAIProvider {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private providers: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    this.providers = [];

    // OpenAI (Primary)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.providers.push({
          name: 'openai',
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1500'),
          available: true
        });
        console.log('✅ OpenAI provider initialized');
      } catch (error) {
        console.warn('⚠️ OpenAI provider failed to initialize:', error);
      }
    }

    // Google Gemini (Fallback)
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.providers.push({
          name: 'gemini',
          model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
          available: true
        });
        console.log('✅ Gemini provider initialized');
      } catch (error) {
        console.warn('⚠️ Gemini provider failed to initialize:', error);
      }
    }

    console.log(`🔧 MultiAI initialized with ${this.providers.length} providers:`, 
      this.providers.map(p => `${p.name}(${p.model})`).join(', '));
  }

  /**
   * Genera una respuesta usando el primer proveedor disponible con fallback automático
   */
  async generateCompletion(
    prompt: string, 
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {}
  ): Promise<AIResponse> {
    const { temperature = 0.7, maxTokens, systemPrompt } = options;

    let lastError: any = null;

    // Intentar con cada proveedor en orden
    for (const provider of this.providers) {
      try {
        console.log(`🔄 Intentando con ${provider.name} (${provider.model})`);

        const response = await this.callProvider(provider, prompt, {
          temperature,
          maxTokens: maxTokens || provider.maxTokens,
          systemPrompt
        });

        console.log(`✅ Éxito con ${provider.name}: ${response.content.length} caracteres`);
        return response;

      } catch (error: any) {
        console.warn(`❌ ${provider.name} falló:`, error.message);
        lastError = error;

        // Verificar si es error de cuota/rate limit para marcar provider como no disponible temporalmente
        if (this.isQuotaError(error)) {
          console.log(`⚠️ ${provider.name} sin cuota, marcando como no disponible temporalmente`);
          provider.available = false;
        }

        continue; // Intentar con siguiente proveedor
      }
    }

    // Si todos los proveedores fallaron
    throw new Error(
      `Todos los proveedores de IA fallaron. Último error: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Llama a un proveedor específico
   */
  private async callProvider(
    provider: AIProvider, 
    prompt: string, 
    options: {
      temperature: number;
      maxTokens: number;
      systemPrompt?: string;
    }
  ): Promise<AIResponse> {
    switch (provider.name) {
      case 'openai':
        return await this.callOpenAI(provider, prompt, options);
      case 'gemini':
        return await this.callGemini(provider, prompt, options);
      default:
        throw new Error(`Proveedor desconocido: ${provider.name}`);
    }
  }

  /**
   * Llama a OpenAI
   */
  private async callOpenAI(
    provider: AIProvider,
    prompt: string,
    options: { temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<AIResponse> {
    if (!this.openai) throw new Error('OpenAI no inicializado');

    const messages: any[] = [];
    
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: provider.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    
    return {
      content,
      provider: 'openai',
      model: provider.model,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens,
        completion_tokens: response.usage?.completion_tokens,
        total_tokens: response.usage?.total_tokens,
      }
    };
  }

  /**
   * Llama a Google Gemini
   */
  private async callGemini(
    provider: AIProvider,
    prompt: string,
    options: { temperature: number; maxTokens: number; systemPrompt?: string }
  ): Promise<AIResponse> {
    if (!this.gemini) throw new Error('Gemini no inicializado');

    const model = this.gemini.getGenerativeModel({ 
      model: provider.model,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      }
    });

    // Combinar system prompt con user prompt si existe
    const fullPrompt = options.systemPrompt 
      ? `${options.systemPrompt}\n\nUser: ${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    return {
      content,
      provider: 'gemini',
      model: provider.model,
      usage: {
        // Gemini no proporciona usage tokens en la respuesta
        total_tokens: Math.ceil(content.length / 4), // Estimación aproximada
      }
    };
  }

  /**
   * Verifica si un error es de cuota/rate limit
   */
  private isQuotaError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    
    return (
      errorMessage.includes('quota') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('insufficient_quota') ||
      errorCode === 'insufficient_quota' ||
      errorCode === 'rate_limit_exceeded' ||
      error?.status === 429
    );
  }

  /**
   * Obtiene el estado de todos los proveedores
   */
  getProviderStatus(): AIProvider[] {
    return [...this.providers];
  }

  /**
   * Reinicia la disponibilidad de todos los proveedores
   */
  resetProviders() {
    this.providers.forEach(provider => {
      provider.available = true;
    });
    console.log('🔄 Proveedores de IA reiniciados');
  }
}

// Instancia singleton
let multiAIInstance: MultiAIProvider | null = null;

export function getMultiAIProvider(): MultiAIProvider {
  if (!multiAIInstance) {
    multiAIInstance = new MultiAIProvider();
  }
  return multiAIInstance;
}

export type { AIResponse, AIProvider };
export { MultiAIProvider };