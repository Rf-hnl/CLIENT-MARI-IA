/**
 * Test script to verify sentiment reasoning is working correctly
 */

console.log('🧪 Testing sentiment reasoning display and storage...');

// Mock the expected data structure
const mockAnalysisFromDB = {
  id: '65abc870-2425-4e23-85ec-2391129038d9',
  overallSentiment: 'positive',
  sentimentScore: 0.6,
  sentimentConfidence: 0.85,
  notes: 'La conversación muestra un interés creciente por parte del lead, quien finalmente acepta agendar una demo, lo que indica una actitud positiva hacia la oferta del agente.',
  rawInsights: {
    sentiment: {
      overall: 'positive',
      score: 0.6,
      confidence: 0.85,
      reasoning: 'La conversación muestra un interés creciente por parte del lead, quien finalmente acepta agendar una demo, lo que indica una actitud positiva hacia la oferta del agente.',
      emotions: ['interested', 'neutral', 'happy'],
      sentimentProgression: 'El sentiment comenzó neutral, con el lead mostrando desinterés inicial, pero se volvió más positivo hacia el final cuando aceptó agendar la demo.'
    }
  }
};

// Test the reasoning extraction logic
const getReasoning = (analysis) => {
  return analysis.rawInsights?.sentiment?.reasoning || analysis.notes || `Sentiment ${analysis.overallSentiment} detectado con ${Math.round((analysis.sentimentConfidence || 0) * 100)}% de confianza`;
};

const reasoning = getReasoning(mockAnalysisFromDB);

console.log('📊 Expected values in modal:');
console.log('  Sentiment General:', mockAnalysisFromDB.overallSentiment);
console.log('  Score:', `${Math.round(mockAnalysisFromDB.sentimentScore * 100)}%`);
console.log('  Confidence:', `${Math.round(mockAnalysisFromDB.sentimentConfidence * 100)}%`);
console.log('  Reasoning:', reasoning);

console.log('\n🎯 Value interpretations:');
console.log('  Sentiment General: El cliente mostró actitud positiva e interés');
console.log('  Score (60%): Positivo - cliente moderadamente interesado');
console.log('  Confidence (85%): Muy alta - análisis muy confiable');

console.log('\n✅ Expected result:');
console.log('  - Modal should show detailed reasoning from AI');
console.log('  - Each value should have contextual explanations');
console.log('  - Data should be saved in both notes and rawInsights fields');

console.log('\n🔍 What to verify:');
console.log('  1. Run a new sentiment analysis');
console.log('  2. Check console logs for reasoning extraction');
console.log('  3. Verify modal shows AI reasoning instead of generic text');
console.log('  4. Confirm database has both notes and rawInsights populated');