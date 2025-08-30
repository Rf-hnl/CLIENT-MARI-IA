#!/usr/bin/env node

/**
 * SCRIPT SIMPLE DE REINICIO DE BASE DE DATOS
 * 
 * Reinicia completamente la base de datos PostgreSQL
 */

const { execSync } = require('child_process');

console.log('🚀 Iniciando reinicio de base de datos...');
console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos');
console.log('⏳ Esperando 3 segundos...');

// Pausa de 3 segundos
setTimeout(() => {
  try {
    console.log('🗑️  Reseteando base de datos...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('⚙️  Generando cliente Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🎉 ¡Reset completado con éxito!');
    console.log('💡 Puedes iniciar la aplicación y autenticarte para crear datos nuevos');
    
  } catch (error) {
    console.error('💥 Error durante el reset:', error.message);
    process.exit(1);
  }
}, 3000);