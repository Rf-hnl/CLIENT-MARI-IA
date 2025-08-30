/**
 * PRUEBA DE CUOTA DE OPENAI
 * Script para verificar si la API key y cuota están funcionando correctamente
 */

require('dotenv').config();

async function testOpenAIQuota() {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY no encontrada en .env');
        return;
    }

    console.log('🔍 Probando conexión a OpenAI...');
    console.log(`📋 Modelo: ${model}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 20)}...`);
    
    try {
        // Hacer una petición muy simple para probar cuota
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: 'Responde solo con: "Cuota OK"'
                    }
                ],
                max_tokens: 10,
                temperature: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de API:', response.status);
            console.error('📄 Respuesta:', errorText);
            
            // Analizar tipo de error
            if (errorText.includes('insufficient_quota')) {
                console.error('💳 PROBLEMA: Sin créditos/cuota insuficiente');
                console.error('🔗 Revisa tu billing: https://platform.openai.com/account/billing');
            } else if (response.status === 429) {
                console.error('⏳ PROBLEMA: Rate limit alcanzado');
            } else if (response.status === 401) {
                console.error('🔑 PROBLEMA: API key inválida');
            }
            return;
        }

        const data = await response.json();
        
        console.log('✅ Conexión exitosa!');
        console.log('💬 Respuesta:', data.choices[0].message.content);
        console.log('🏷️  Tokens usados:', data.usage?.total_tokens || 0);
        console.log('💰 Costo estimado: $', (data.usage?.total_tokens * 0.00003).toFixed(6));
        
        // Verificar límites
        console.log('\n📊 Verificando límites de uso...');
        await checkUsage(apiKey);
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
}

async function checkUsage(apiKey) {
    try {
        // Intentar obtener información de billing (puede no estar disponible)
        const billingResponse = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (billingResponse.ok) {
            const billingData = await billingResponse.json();
            console.log('📋 Plan:', billingData.plan?.title || 'No disponible');
            console.log('💳 Límite:', billingData.hard_limit_usd || 'No disponible');
        } else {
            console.log('ℹ️  Info de billing no disponible (normal para algunas cuentas)');
        }
        
    } catch (error) {
        console.log('ℹ️  No se pudo obtener info de billing:', error.message);
    }
}

// Ejecutar la prueba
console.log('🚀 Iniciando prueba de cuota de OpenAI...\n');
testOpenAIQuota();