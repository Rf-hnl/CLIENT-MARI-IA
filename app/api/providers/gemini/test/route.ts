import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * ENDPOINT DE PRUEBA SIMPLE PARA GEMINI
 * 
 * POST /api/providers/gemini/test
 * Body: { apiKey: string }
 * 
 * Solo verifica que la conexión funciona
 */

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 [GEMINI_TEST] Iniciando test básico...');
    
    const body = await req.json();
    const { apiKey } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API Key requerida para test' },
        { status: 400 }
      );
    }

    console.log('🔑 [GEMINI_TEST] API Key recibida:', `${apiKey.substring(0, 5)}...`);

    // Test 1: Inicializar cliente
    console.log('📡 [GEMINI_TEST] Test 1 - Inicializando cliente...');
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ [GEMINI_TEST] Cliente inicializado correctamente');

    // Test 2: Obtener un modelo específico 
    console.log('📡 [GEMINI_TEST] Test 2 - Obteniendo modelo gemini-pro...');
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('✅ [GEMINI_TEST] Modelo obtenido correctamente');

    // Test 3: Generar contenido simple
    console.log('📡 [GEMINI_TEST] Test 3 - Generando contenido simple...');
    const prompt = "Di 'Hola' en una palabra.";
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log('✅ [GEMINI_TEST] Contenido generado:', text);

    // Test 4: Verificar disponibilidad de modelos conocidos
    console.log('📡 [GEMINI_TEST] Test 4 - Verificando modelos conocidos...');
    const knownModels = ['gemini-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    const availableModels = [];
    
    for (const modelName of knownModels) {
      try {
        const testModelInstance = genAI.getGenerativeModel({ model: modelName });
        // Intentar generar contenido muy corto para validar
        await testModelInstance.generateContent("Hi");
        availableModels.push(modelName);
        console.log(`✅ [GEMINI_TEST] Modelo ${modelName} disponible`);
      } catch (modelError) {
        console.log(`⚠️ [GEMINI_TEST] Modelo ${modelName} no disponible:`, modelError.message);
      }
    }
    
    console.log('✅ [GEMINI_TEST] Modelos disponibles:', availableModels.length);

    return NextResponse.json({
      success: true,
      message: 'Todos los tests pasaron correctamente',
      results: {
        clientInit: true,
        modelAccess: true,
        contentGeneration: true,
        generatedText: text,
        modelsList: true,
        modelsCount: availableModels.length,
        sampleModels: availableModels.slice(0, 3)
      }
    });

  } catch (error: any) {
    console.error('❌ [GEMINI_TEST] Error en test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error en test de Gemini',
      details: {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        name: error.name,
        cause: error.cause
      }
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de test de Gemini. Usa POST con { "apiKey": "tu_api_key" }'
  });
}