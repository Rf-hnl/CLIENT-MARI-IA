/**
 * PRUEBA DETALLADA DE OPENAI PARA ANÁLISIS
 * Simula exactamente lo que hace la aplicación
 */

require('dotenv').config();

async function testDetailedAnalysis() {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '2000');
    
    console.log('🔍 Prueba detallada de OpenAI Analysis...');
    console.log(`📋 Modelo: ${model}`);
    console.log(`🎯 Max Tokens: ${maxTokens}`);
    console.log(`🔑 API Key: ${apiKey ? `${apiKey.substring(0, 20)}...` : 'NO ENCONTRADA'}`);
    
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY no encontrada');
        return;
    }

    // Simular el prompt exacto que usa la aplicación
    const simulatedPrompt = `
ANALIZA ESTA CONVERSACIÓN DE VENTAS Y PROPORCIONA UN ANÁLISIS DETALLADO EN JSON:

=== CONVERSACIÓN ===
AGENT: Hola, soy María de Antares Tech. ¿Cómo estás hoy?
LEAD: Hola, bien gracias. Me interesa conocer más sobre sus servicios.

=== DURACIÓN ===
2 minutos, 15 palabras

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.
`;

    try {
        console.log('\n🚀 Enviando petición con prompt de análisis...');
        
        const requestBody = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto analista de conversaciones de ventas. Analiza conversaciones y extrae insights precisos en formato JSON.'
                },
                {
                    role: 'user',
                    content: simulatedPrompt
                }
            ],
            temperature: 0.3,
            max_tokens: maxTokens
        };

        console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('\n📥 Respuesta de OpenAI:');
        console.log(`🔢 Status: ${response.status}`);
        console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error completo:', errorText);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.error('🔍 Error JSON:', JSON.stringify(errorJson, null, 2));
            } catch {
                console.error('🔍 Error como texto:', errorText);
            }
            
            // Verificar tipo específico de error
            if (errorText.includes('insufficient_quota')) {
                console.error('\n💳 DIAGNÓSTICO: Sin créditos/cuota insuficiente');
                console.error('🔧 SOLUCIÓN: Añade saldo en https://platform.openai.com/account/billing');
            } else if (response.status === 429) {
                console.error('\n⏳ DIAGNÓSTICO: Rate limit alcanzado');
            } else if (response.status === 401) {
                console.error('\n🔑 DIAGNÓSTICO: API key inválida o expirada');
            }
            return;
        }

        const data = await response.json();
        console.log('\n✅ ¡Análisis exitoso!');
        console.log('💬 Respuesta:', data.choices[0].message.content.substring(0, 200) + '...');
        console.log('🏷️ Tokens:', data.usage);
        console.log('💰 Costo estimado: $', (data.usage?.total_tokens * 0.00015).toFixed(6)); // gpt-4o-mini pricing
        
    } catch (error) {
        console.error('❌ Error de red o parsing:', error.message);
        console.error('📋 Stack:', error.stack);
    }
}

// Ejecutar
testDetailedAnalysis();