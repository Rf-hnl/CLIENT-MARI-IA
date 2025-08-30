#!/usr/bin/env tsx

/**
 * SCRIPT DE REINICIO DE BASE DE DATOS
 * 
 * Reinicia completamente la base de datos PostgreSQL
 * y ejecuta las migraciones limpias
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import chalk from 'chalk';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log(chalk.blue('🚀 Iniciando reinicio de base de datos...'));
  console.log(chalk.yellow('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos'));
  
  try {
    // 1. Verificar conexión
    console.log(chalk.gray('📡 Verificando conexión a PostgreSQL...'));
    await prisma.$connect();
    console.log(chalk.green('✅ Conexión establecida'));

    // 2. Obtener estadísticas antes del reset
    console.log(chalk.gray('📊 Obteniendo estadísticas actuales...'));
    const stats = await getCurrentStats();
    console.log(chalk.gray(`   - Usuarios: ${stats.users}`));
    console.log(chalk.gray(`   - Tenants: ${stats.tenants}`));
    console.log(chalk.gray(`   - Organizaciones: ${stats.organizations}`));
    console.log(chalk.gray(`   - Agentes: ${stats.agents}`));
    console.log(chalk.gray(`   - Clientes: ${stats.clients}`));
    console.log(chalk.gray(`   - Leads: ${stats.leads}`));

    // 3. Pausar para confirmación
    console.log(chalk.red('\n⏳ Esperando 3 segundos antes del reset...'));
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Cerrar conexión antes del reset
    await prisma.$disconnect();
    console.log(chalk.gray('🔌 Conexión cerrada'));

    // 5. Ejecutar reset de Prisma
    console.log(chalk.blue('🗑️  Ejecutando Prisma DB Push --force-reset...'));
    execSync('npx prisma db push --force-reset', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // 6. Generar cliente de Prisma
    console.log(chalk.blue('⚙️  Generando cliente de Prisma...'));
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // 7. Verificar que el reset fue exitoso
    console.log(chalk.gray('🔍 Verificando reset...'));
    const newPrisma = new PrismaClient();
    await newPrisma.$connect();
    
    const newStats = await getCurrentStats(newPrisma);
    console.log(chalk.green('✅ Base de datos reseteada exitosamente'));
    console.log(chalk.gray(`   - Usuarios: ${newStats.users}`));
    console.log(chalk.gray(`   - Tenants: ${newStats.tenants}`));
    console.log(chalk.gray(`   - Organizaciones: ${newStats.organizations}`));
    console.log(chalk.gray(`   - Agentes: ${newStats.agents}`));
    console.log(chalk.gray(`   - Clientes: ${newStats.clients}`));
    console.log(chalk.gray(`   - Leads: ${newStats.leads}`));

    await newPrisma.$disconnect();

    console.log(chalk.green('\n🎉 ¡Reset completado con éxito!'));
    console.log(chalk.blue('💡 Puedes iniciar la aplicación y autenticarte para crear datos nuevos'));

  } catch (error) {
    console.error(chalk.red('💥 Error durante el reset:'), error);
    process.exit(1);
  }
}

async function getCurrentStats(client = prisma) {
  try {
    const [users, tenants, organizations, agents, clients, leads] = await Promise.all([
      client.user.count(),
      client.tenant.count(),
      client.organization.count(),
      client.unifiedAgent.count(),
      client.client.count(),
      client.lead.count()
    ]);

    return { users, tenants, organizations, agents, clients, leads };
  } catch (error) {
    return { users: 0, tenants: 0, organizations: 0, agents: 0, clients: 0, leads: 0 };
  }
}

// Verificar si se está ejecutando directamente
if (require.main === module) {
  resetDatabase()
    .catch((error) => {
      console.error(chalk.red('💥 Error fatal:'), error);
      process.exit(1);
    });
}

export { resetDatabase };