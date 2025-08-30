/**
 * SCRIPT DE PRUEBA PARA CONVERSATION ANALYZER
 * Prueba el análisis de conversaciones con OpenAI directo
 */

import { ConversationAnalyzer } from '../lib/ai/conversationAnalyzer';
import { ConversationTranscript, CreateConversationAnalysisData } from '../types/conversationAnalysis';

// Cargar variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// Datos de prueba
const testTranscript: ConversationTranscript = {
  messages: [
    {
      role: 'agent',
      content: '¡Hola! Soy María de TechSolutions. Te llamo porque vi tu interés en nuestro software de gestión empresarial.',
      timestamp: 0,
      confidence: 0.95
    },
    {
      role: 'lead',
      content: 'Hola María, sí recuerdo haber llenado el formulario. Estoy buscando algo que me ayude con la contabilidad de mi empresa.',
      timestamp: 5,
      confidence: 0.92
    },
    {
      role: 'agent',
      content: 'Perfecto. ¿Me podrías contar un poco más sobre tu empresa? ¿Cuántos empleados tienen?',
      timestamp: 12,
      confidence: 0.94
    },
    {
      role: 'lead',
      content: 'Somos una empresa mediana, unos 50 empleados. El problema es que llevamos todo manual y se nos complica mucho.',
      timestamp: 18,
      confidence: 0.89
    },
    {
      role: 'agent',
      content: 'Entiendo perfectamente. Nuestro software está diseñado específicamente para empresas como la tuya. Te puede automatizar toda la contabilidad.',
      timestamp: 28,
      confidence: 0.96
    },
    {
      role: 'lead',
      content: 'Suena interesante. ¿Qué precio maneja? Porque hemos visto otras opciones y están muy caras.',
      timestamp: 35,
      confidence: 0.91
    },
    {
      role: 'agent',
      content: 'Te entiendo, el precio siempre es importante. Tenemos planes desde $299 mensuales. Considerando el ahorro en tiempo que tendrás, se paga solo.',
      timestamp: 45,
      confidence: 0.93
    },
    {
      role: 'lead',
      content: 'Hmm, es un poco más de lo que esperaba. ¿Podrían hacer una demostración primero?',
      timestamp: 52,
      confidence: 0.88
    }
  ],
  duration: 60,
  totalWords: 180,
  participantCount: 2
};

const testAnalysisData: CreateConversationAnalysisData = {
  leadId: 'test-lead-123',
  conversationId: 'test-conv-456',
  callLogId: 'test-call-789',
  transcript: testTranscript
};

async function testAnalyzer() {
  console.log('🧪 [TEST] Iniciando prueba del Conversation Analyzer');
  
  try {
    // Verificar variables de entorno
    console.log('🔍 [TEST] Verificando configuración...');
    console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Configurada ✅' : 'No encontrada ❌');
    console.log('- OPENAI_MODEL:', process.env.OPENAI_MODEL || 'gpt-4o-mini (default)');
    console.log('- OPENAI_MAX_TOKENS:', process.env.OPENAI_MAX_TOKENS || '2000 (default)');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY no configurada en .env');
    }

    // Crear instancia del analizador
    const analyzer = new ConversationAnalyzer();
    
    console.log('\n🤖 [TEST] Ejecutando análisis...');
    const startTime = Date.now();
    
    // Ejecutar análisis
    const result = await analyzer.analyzeConversation(
      testAnalysisData,
      'test-tenant-id',
      'test-org-id'
    );
    
    const endTime = Date.now();
    
    console.log('\n📊 [TEST] Resultado del análisis:');
    console.log('- Success:', result.success ? '✅' : '❌');
    console.log('- Processing time:', endTime - startTime, 'ms');
    
    if (result.success && result.analysis) {
      console.log('\n✅ [TEST] Análisis completado exitosamente');
      console.log('- Sentiment overall:', result.analysis.overallSentiment);
      console.log('- Sentiment score:', result.analysis.sentimentScore);
      console.log('- Quality score:', result.analysis.callQualityScore);
      console.log('- Conversion likelihood:', result.analysis.conversionLikelihood);
      console.log('- Recommended action:', result.analysis.recommendedAction);
      console.log('- Key topics:', result.analysis.keyTopics?.join(', '));
      console.log('- Tokens used:', result.tokensUsed);
      console.log('- Cost:', `$${result.cost?.toFixed(4) || '0.0000'}`);
      
      // Verificar estructura del JSON
      console.log('\n🔍 [TEST] Verificando estructura del análisis...');
      const requiredFields = [
        'overallSentiment', 'sentimentScore', 'callQualityScore',
        'keyTopics', 'conversionLikelihood', 'recommendedAction'
      ];
      
      let structureOK = true;
      requiredFields.forEach(field => {
        if (result.analysis![field] === undefined) {
          console.log(`❌ Campo faltante: ${field}`);
          structureOK = false;
        } else {
          console.log(`✅ Campo presente: ${field}`);
        }
      });
      
      if (structureOK) {
        console.log('\n🎉 [TEST] ¡Estructura correcta! El analizador funciona perfectamente.');
        
        // Mostrar análisis completo para debug
        console.log('\n📋 [DEBUG] Full Analysis:');
        console.log(JSON.stringify(result.analysis.fullAnalysis, null, 2));
        
      } else {
        console.log('\n⚠️ [TEST] Hay campos faltantes en la estructura.');
      }
      
    } else {
      console.log('\n❌ [TEST] Error en el análisis:');
      console.log('- Error:', result.error);
    }
    
  } catch (error: any) {
    console.error('\n💥 [TEST] Error durante la prueba:');
    console.error('- Message:', error.message);
    if (error.stack) {
      console.error('- Stack:', error.stack);
    }
  }
}

// Ejecutar prueba
testAnalyzer();