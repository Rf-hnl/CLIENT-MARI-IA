/**
 * VERIFICAR SALDO Y LÍMITES DE OPENAI
 */

require('dotenv').config();

async function checkBilling() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY no encontrada');
        return;
    }

    console.log('💳 Verificando billing de OpenAI...\n');

    try {
        // Intentar obtener información de suscripción
        const subscriptionResponse = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (subscriptionResponse.ok) {
            const subscription = await subscriptionResponse.json();
            console.log('📋 INFORMACIÓN DE PLAN:');
            console.log(`   Plan: ${subscription.plan?.title || 'No disponible'}`);
            console.log(`   Límite duro: $${subscription.hard_limit_usd || 'No disponible'}`);
            console.log(`   Límite suave: $${subscription.soft_limit_usd || 'No disponible'}`);
            console.log(`   Plan ID: ${subscription.plan?.id || 'No disponible'}\n`);
        } else {
            console.log('ℹ️  Información de suscripción no disponible\n');
        }

        // Intentar obtener uso actual
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1); // Primer día del mes
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último día del mes

        const usageResponse = await fetch(
            `https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );

        if (usageResponse.ok) {
            const usage = await usageResponse.json();
            console.log('📊 USO ACTUAL DEL MES:');
            console.log(`   Costo total: $${(usage.total_usage / 100).toFixed(4)}`);
            console.log(`   Período: ${startDate.toISOString().split('T')[0]} a ${endDate.toISOString().split('T')[0]}\n`);
            
            // Mostrar desglose por día si está disponible
            if (usage.daily_costs && usage.daily_costs.length > 0) {
                console.log('📅 ÚLTIMOS DÍAS:');
                usage.daily_costs.slice(-5).forEach(day => {
                    console.log(`   ${day.timestamp}: $${(day.line_items[0]?.cost / 100 || 0).toFixed(4)}`);
                });
            }
        } else {
            console.log('ℹ️  Información de uso no disponible');
            console.log(`   Status: ${usageResponse.status}`);
            console.log(`   Response: ${await usageResponse.text()}\n`);
        }

    } catch (error) {
        console.error('❌ Error verificando billing:', error.message);
    }

    // Mostrar URLs útiles
    console.log('\n🔗 ENLACES ÚTILES:');
    console.log('   Billing Dashboard: https://platform.openai.com/account/billing');
    console.log('   Usage Dashboard: https://platform.openai.com/account/usage');
    console.log('   Add Credits: https://platform.openai.com/account/billing/payment-methods');
}

checkBilling();