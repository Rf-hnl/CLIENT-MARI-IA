/**
 * Test script to debug sentiment analysis values
 */

console.log('🔍 Testing sentiment analysis debug...');

// Mock data structure that mimics what's being saved
const mockSentimentData = {
  overall: 'positive',
  score: 0.75,  // This should be between -1.0 and 1.0
  confidence: 0.85, // This should be between 0.0 and 1.0
  reasoning: 'Cliente mostró interés y hizo preguntas específicas'
};

console.log('📊 Mock sentiment data structure:');
console.log('   overall:', mockSentimentData.overall);
console.log('   score (raw):', mockSentimentData.score);
console.log('   score (display):', Math.round(mockSentimentData.score * 100) + '%');
console.log('   confidence (raw):', mockSentimentData.confidence);
console.log('   confidence (display):', Math.round(mockSentimentData.confidence * 100) + '%');

console.log('\n🎯 Expected behavior:');
console.log('   Score should be between -100% to +100% (sentiment polarity)');
console.log('   Confidence should be 0% to 100% (analysis certainty)');

console.log('\n❌ User reported issue:');
console.log('   Seeing 70% score, 85% confidence');
console.log('   Values don\'t make sense for sentiment');
console.log('   Analysis not being saved properly');

console.log('\n🔧 Hypothesis:');
console.log('   1. AI might be returning values outside expected range');
console.log('   2. Parsing might be extracting wrong fields');
console.log('   3. Database save might be failing silently');