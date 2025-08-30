/**
 * SCRIPT DE PRUEBA PARA VERIFICAR QUE FUNCIONA LA API DE GEMINI
 * 
 * Usage: node scripts/test-gemini-models.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiModels() {
  console.log('🔍 Probando conexión con Google Gemini...');
  
  // Nota: En producción esto vendría del input del usuario
  const apiKey = process.env.GEMINI_API_KEY || 'AI...'; // Placeholder
  
  if (!apiKey || apiKey === 'AI...') {
    console.log('⚠️ No se encontró GEMINI_API_KEY en el environment');
    console.log('💡 Para probar, ejecuta: GEMINI_API_KEY=tu_api_key node scripts/test-gemini-models.js');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    console.log('📡 Obteniendo lista de modelos...');
    const { models } = await genAI.listModels();
    
    console.log(`✅ Encontrados ${models.length} modelos:`);
    
    models
      .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
      .forEach((model, index) => {
        const modelName = model.name.replace('models/', '');
        const isVision = modelName.includes('vision');
        const isFlash = modelName.includes('flash');
        const isPro = modelName.includes('pro');
        
        console.log(`  ${index + 1}. ${modelName} ${isVision ? '👁️' : ''} ${isFlash ? '⚡' : ''} ${isPro ? '🧠' : ''}`);
      });
      
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 La API Key parece ser inválida');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 La API Key no tiene permisos para Gemini');
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testGeminiModels().catch(console.error);
}

module.exports = { testGeminiModels };