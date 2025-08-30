require('dotenv').config();

async function testRealPrompt() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // PROMPT REAL COMPLETO DE LA APLICACIÓN
    const realPrompt = `ANALIZA ESTA CONVERSACIÓN DE VENTAS Y PROPORCIONA UN ANÁLISIS DETALLADO EN JSON:

=== CONVERSACIÓN ===
AGENT: ¡Hola! Soy María de TechSolutions. Te llamo porque vi tu interés en nuestro software de gestión empresarial.
LEAD: Hola María, sí recuerdo haber llenado el formulario. Estoy buscando algo que me ayude con la contabilidad de mi empresa.
AGENT: Perfecto. ¿Me podrías contar un poco más sobre tu empresa? ¿Cuántos empleados tienen?
LEAD: Somos una empresa mediana, unos 50 empleados. El problema es que llevamos todo manual y se nos complica mucho.
AGENT: Entiendo perfectamente. Nuestro software está diseñado específicamente para empresas como la tuya. Te puede automatizar toda la contabilidad.
LEAD: Suena interesante. ¿Qué precio maneja? Porque hemos visto otras opciones y están muy caras.
AGENT: Te entiendo, el precio siempre es importante. Tenemos planes desde 299 mensuales. Considerando el ahorro en tiempo que tendrás, se paga solo.
LEAD: Hmm, es un poco más de lo que esperada. ¿Podrían hacer una demostración primero?

=== DURACIÓN ===
1 minutos, 180 palabras

=== INSTRUCCIONES ===
Analiza esta conversación entre un agente de ventas y un prospecto (lead). 
Proporciona un análisis completo en formato JSON con la siguiente estructura EXACTA:

{
  "sentiment": {
    "overall": "positive|negative|neutral|mixed",
    "score": "número entre -1.0 y 1.0",
    "confidence": "número entre 0.0 y 1.0",
    "reasoning": "explicación del sentiment detectado"
  },
  "quality": {
    "overall": "número entre 0 y 100",
    "agentPerformance": "número entre 0 y 100",
    "flow": "excellent|good|fair|poor",
    "reasoning": "análisis de la calidad de la conversación"
  },
  "insights": {
    "keyTopics": ["tema1", "tema2"],
    "painPoints": ["dolor1", "dolor2"],
    "buyingSignals": ["señal1", "señal2"],
    "objections": ["objeción1", "objeción2"],
    "competitors": ["competidor1", "competidor2"]
  },
  "engagement": {
    "interestLevel": "número entre 1 y 10",
    "score": "número entre 0 y 100",
    "responseQuality": "excellent|good|fair|poor",
    "reasoning": "análisis del nivel de engagement"
  },
  "predictions": {
    "conversionLikelihood": "número entre 0 y 100",
    "recommendedAction": "immediate_follow_up|send_proposal|schedule_meeting|nurture_lead|qualify_further|close_deal|archive_lead",
    "urgency": "low|medium|high|critical",
    "followUpTimeline": "immediate|1_day|3_days|1_week|2_weeks|1_month",
    "reasoning": "justificación de las predicciones"
  },
  "metrics": {
    "questionsAsked": "número de preguntas del agente",
    "questionsAnswered": "número de preguntas respondidas por el lead",
    "interruptions": "número de interrupciones",
    "talkTimeRatio": "ratio de tiempo hablado agente/lead (0.0 a 1.0)"
  },
  "confidence": "número entre 0 y 100",
  "fullAnalysis": {
    "summary": "resumen ejecutivo de la conversación",
    "strengths": ["fortaleza1", "fortaleza2"],
    "improvements": ["mejora1", "mejora2"],
    "nextSteps": ["paso1", "paso2"]
  }
}

RESPONDE ÚNICAMENTE CON EL JSON. NO AGREGUES TEXTO ADICIONAL.`;

    const tokenLimits = [1000, 2500];
    
    for (const maxTokens of tokenLimits) {
        console.log(`\n🎯 === PRUEBA CON ${maxTokens} TOKENS ===`);
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un experto analista de conversaciones de ventas. Analiza conversaciones y extrae insights precisos en formato JSON.'
                        },
                        {
                            role: 'user',
                            content: realPrompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: maxTokens
                })
            });
            
            const data = await response.json();
            const content = data.choices[0].message.content;
            
            console.log(`📊 Tokens: prompt=${data.usage.prompt_tokens}, completion=${data.usage.completion_tokens}, total=${data.usage.total_tokens}`);
            console.log(`📏 Respuesta length: ${content.length} chars`);
            
            // Intentar parsear
            try {
                let cleanJson = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                
                const requiredFields = ['sentiment', 'quality', 'insights', 'engagement', 'predictions', 'metrics', 'confidence', 'fullAnalysis'];
                const missingFields = requiredFields.filter(field => !parsed[field]);
                
                if (missingFields.length === 0) {
                    console.log('✅ ESTRUCTURA COMPLETA! Todos los campos presentes.');
                    console.log(`📋 Sentiment: ${parsed.sentiment?.overall} (score: ${parsed.sentiment?.score})`);
                    console.log(`📋 Quality: ${parsed.quality?.overall}`);
                    console.log(`📋 Conversion: ${parsed.predictions?.conversionLikelihood}%`);
                    return; // Éxito, no necesitamos probar más
                } else {
                    console.log(`⚠️ Campos faltantes (${missingFields.length}): ${missingFields.join(', ')}`);
                }
                
            } catch (parseError) {
                console.log(`❌ Error parseando JSON: ${parseError.message}`);
                console.log(`📄 Últimos 300 chars: ...${content.slice(-300)}`);
            }
            
        } catch (error) {
            console.error(`💥 Error: ${error.message}`);
        }
    }
}

testRealPrompt();