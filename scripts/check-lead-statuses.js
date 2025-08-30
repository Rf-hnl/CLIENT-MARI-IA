/**
 * SCRIPT PARA VERIFICAR Y CORREGIR ESTADOS DE LEADS EN LA BASE DE DATOS
 * 
 * Este script:
 * 1. Verifica qué estados de leads existen actualmente en la BD
 * 2. Lista los leads con estados no válidos o faltantes
 * 3. Ofrece opciones para corregir datos
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Todos los estados válidos según el CSV del CRM
const VALID_STATUSES = [
  'new',                    // Nuevos Leads / Pendientes
  'interested',             // Leads Potenciales / Prioritario
  'qualified',              // Calificado - En seguimiento
  'follow_up',              // En seguimiento / Sin respuesta
  'proposal_current',       // Cotizaciones / Campaña Actual Jun - Jul
  'proposal_previous',      // Cotización enviada / Campañas anteriores
  'negotiation',            // Negociación / En ajustes
  'nurturing',              // A futuro / En pausa
  'won',                    // Ganado / Cerrado
  'lost',                   // Propuesta declinada
  'cold'                    // Leads descartados / No calificados
];

// Mapeo de nombres descriptivos
const STATUS_LABELS = {
  'new': 'Nuevos Leads / Pendientes',
  'interested': 'Leads Potenciales / Prioritario',
  'qualified': 'Calificado - En seguimiento',
  'follow_up': 'En seguimiento / Sin respuesta',
  'proposal_current': 'Cotizaciones / Campaña Actual Jun - Jul',
  'proposal_previous': 'Cotización enviada / Campañas anteriores',
  'negotiation': 'Negociación / En ajustes',
  'nurturing': 'A futuro / En pausa',
  'won': 'Ganado / Cerrado',
  'lost': 'Propuesta declinada',
  'cold': 'Leads descartados / No calificados'
};

async function checkLeadStatuses() {
  try {
    console.log('🔍 VERIFICANDO ESTADOS DE LEADS EN LA BASE DE DATOS...\n');

    // 1. Contar total de leads
    const totalLeads = await prisma.lead.count();
    console.log(`📊 Total de leads en la base de datos: ${totalLeads}`);

    if (totalLeads === 0) {
      console.log('ℹ️  No hay leads en la base de datos aún.');
      return;
    }

    // 2. Obtener estadísticas por estado actual
    console.log('\n📈 DISTRIBUCIÓN ACTUAL POR ESTADOS:');
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    // Mostrar estados existentes
    const existingStatuses = new Set();
    statusCounts.forEach(({ status, _count }) => {
      existingStatuses.add(status);
      const label = STATUS_LABELS[status] || `⚠️  Estado desconocido: ${status}`;
      console.log(`  ${status.padEnd(20)} | ${_count.status.toString().padStart(3)} leads | ${label}`);
    });

    // 3. Verificar estados faltantes
    console.log('\n🔍 VERIFICANDO COBERTURA DE ESTADOS:');
    const missingStatuses = VALID_STATUSES.filter(status => !existingStatuses.has(status));
    
    if (missingStatuses.length > 0) {
      console.log('❌ Estados definidos pero sin leads:');
      missingStatuses.forEach(status => {
        console.log(`  - ${status}: ${STATUS_LABELS[status]}`);
      });
    } else {
      console.log('✅ Todos los estados válidos están representados en la BD');
    }

    // 4. Verificar estados inválidos
    const invalidStatuses = Array.from(existingStatuses).filter(status => !VALID_STATUSES.includes(status));
    if (invalidStatuses.length > 0) {
      console.log('\n⚠️  ESTADOS INVÁLIDOS DETECTADOS:');
      invalidStatuses.forEach(status => {
        const count = statusCounts.find(s => s.status === status)?._count.status || 0;
        console.log(`  - ${status}: ${count} leads (NECESITA CORRECCIÓN)`);
      });
    }

    // 5. Mostrar distribución detallada
    console.log('\n📋 RESUMEN DETALLADO:');
    console.log(`  Total de leads: ${totalLeads}`);
    console.log(`  Estados únicos: ${existingStatuses.size}`);
    console.log(`  Estados válidos: ${VALID_STATUSES.length}`);
    console.log(`  Estados sin representación: ${missingStatuses.length}`);
    console.log(`  Estados inválidos: ${invalidStatuses.length}`);

    // 6. Verificar otros campos importantes
    console.log('\n🔍 VERIFICANDO CALIDAD DE DATOS:');
    
    const leadsWithoutPhone = await prisma.lead.count({
      where: {
        phone: '+507-0000-0000'
      }
    });

    const qualifiedLeads = await prisma.lead.count({
      where: { isQualified: true }
    });

    const leadsWithAIScore = await prisma.lead.count({
      where: { 
        aiScore: { not: null }
      }
    });

    console.log(`  Leads sin teléfono válido: ${leadsWithoutPhone}`);
    console.log(`  Leads calificados: ${qualifiedLeads}`);
    console.log(`  Leads con puntuación AI: ${leadsWithAIScore}`);

    // 7. Mostrar sample de leads recientes
    const recentLeads = await prisma.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        qualificationScore: true,
        isQualified: true,
        createdAt: true
      }
    });

    if (recentLeads.length > 0) {
      console.log('\n📋 ÚLTIMOS 5 LEADS CREADOS:');
      recentLeads.forEach(lead => {
        const statusLabel = STATUS_LABELS[lead.status] || '❓ Desconocido';
        console.log(`  ${lead.name.padEnd(30)} | ${lead.status.padEnd(15)} | Score: ${lead.qualificationScore}/100 | ${lead.isQualified ? '✅' : '❌'}`);
      });
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error verificando estados de leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar verificación
checkLeadStatuses();