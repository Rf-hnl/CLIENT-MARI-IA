/**
 * SCRIPT DE PRUEBA PARA ALERTAS DE CREDITOS
 * Simula diferentes tipos de errores de OpenAI para probar las alertas
 */

import { showOpenAIErrorToast } from '../lib/utils/openai-toast';

// Función para testear diferentes tipos de errores
function testOpenAIAlerts() {
  console.log('🧪 Testing OpenAI alert system...');

  // Test 1: Error de créditos agotados (402)
  setTimeout(() => {
    console.log('Testing insufficient quota error...');
    showOpenAIErrorToast({
      status: 402,
      message: 'insufficient_quota: You have run out of credits',
      error: 'insufficient_quota'
    });
  }, 1000);

  // Test 2: Error de rate limiting (429)
  setTimeout(() => {
    console.log('Testing rate limit error...');
    showOpenAIErrorToast({
      status: 429,
      message: 'Too Many Requests: Rate limit exceeded',
      error: 'rate_limit_exceeded'
    });
  }, 3000);

  // Test 3: Error de API key inválida (401)
  setTimeout(() => {
    console.log('Testing invalid API key error...');
    showOpenAIErrorToast({
      status: 401,
      message: 'Incorrect API key provided',
      error: 'invalid_api_key'
    });
  }, 5000);

  // Test 4: Error de servidor (500)
  setTimeout(() => {
    console.log('Testing server error...');
    showOpenAIErrorToast({
      status: 500,
      message: 'Internal server error',
      error: 'server_error'
    });
  }, 7000);

  // Test 5: Error desconocido
  setTimeout(() => {
    console.log('Testing unknown error...');
    showOpenAIErrorToast({
      status: 400,
      message: 'Some unknown error occurred',
      error: 'unknown_error'
    });
  }, 9000);
}

// Función para testear alertas de éxito
function testSuccessAlerts() {
  const { showAnalysisSuccessToast } = require('../lib/utils/openai-toast');
  
  console.log('🧪 Testing success alerts...');
  
  setTimeout(() => {
    showAnalysisSuccessToast({
      processingTime: 15500,
      tokensUsed: 2341,
      cost: 0.0234
    });
  }, 11000);
}

// Ejecutar tests en el contexto del navegador
if (typeof window !== 'undefined') {
  console.log('Running OpenAI alerts tests in browser context...');
  testOpenAIAlerts();
  testSuccessAlerts();
} else {
  console.log('This script should be run in a browser context with the Sonner toast system loaded.');
}

export { testOpenAIAlerts, testSuccessAlerts };