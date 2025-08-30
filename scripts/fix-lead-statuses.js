/**
 * SCRIPT PARA CORREGIR ESTADOS INVÁLIDOS DE LEADS
 * 
 * Este script corrige leads con estados no válidos según el modelo actual
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapeo de estados antiguos/inválidos a estados válidos
const STATUS_MIGRATION_MAP = {
  'contacted': 'qualified',        // "contacted" -> "qualified" (Calificado - En seguimiento)
  'pending': 'new',               // "pending" -> "new" (Nuevos Leads / Pendientes)
  'in_progress': 'follow_up',     // "in_progress" -> "follow_up" (En seguimiento / Sin respuesta)
  'closed': 'won',                // "closed" -> "won" (Ganado / Cerrado)
  'rejected': 'lost'              // "rejected" -> "lost" (Propuesta declinada)
};

async function fixLeadStatuses() {
  try {
    console.log('🔧 CORRIGIENDO ESTADOS INVÁLIDOS DE LEADS...\n');

    // 1. Identificar leads con estados inválidos
    const invalidLeads = await prisma.lead.findMany({
      where: {
        status: {
          notIn: [
            'new', 'interested', 'qualified', 'follow_up',
            'proposal_current', 'proposal_previous', 'negotiation',
            'nurturing', 'won', 'lost', 'cold'
          ]
        }
      },
      select: {
        id: true,
        name: true,
        status: true,
        qualificationScore: true,
        isQualified: true
      }
    });

    if (invalidLeads.length === 0) {
      console.log('✅ No se encontraron leads con estados inválidos');
      return;
    }

    console.log(`⚠️  Encontrados ${invalidLeads.length} leads con estados inválidos:`);
    
    // 2. Mostrar los leads a corregir
    const corrections = [];
    invalidLeads.forEach(lead => {
      const newStatus = STATUS_MIGRATION_MAP[lead.status] || 'new';
      corrections.push({
        id: lead.id,
        name: lead.name,
        oldStatus: lead.status,
        newStatus: newStatus
      });
      
      console.log(`  📋 ${lead.name.padEnd(30)} | ${lead.status.padEnd(15)} → ${newStatus}`);
    });

    console.log('\n🔄 APLICANDO CORRECCIONES...');

    // 3. Aplicar las correcciones
    let correctedCount = 0;
    for (const correction of corrections) {
      try {
        await prisma.lead.update({
          where: { id: correction.id },
          data: { 
            status: correction.newStatus,
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ ${correction.name}: ${correction.oldStatus} → ${correction.newStatus}`);
        correctedCount++;
        
      } catch (error) {
        console.error(`❌ Error corrigiendo ${correction.name}:`, error.message);
      }
    }

    console.log(`\n📊 RESUMEN DE CORRECCIONES:`);
    console.log(`  Leads procesados: ${invalidLeads.length}`);
    console.log(`  Correcciones exitosas: ${correctedCount}`);
    console.log(`  Errores: ${invalidLeads.length - correctedCount}`);

    // 4. Verificar el resultado
    console.log('\n🔍 VERIFICANDO RESULTADO...');
    const remainingInvalidLeads = await prisma.lead.count({
      where: {
        status: {
          notIn: [
            'new', 'interested', 'qualified', 'follow_up',
            'proposal_current', 'proposal_previous', 'negotiation',
            'nurturing', 'won', 'lost', 'cold'
          ]
        }
      }
    });

    if (remainingInvalidLeads === 0) {
      console.log('✅ Todos los estados han sido corregidos exitosamente');
    } else {
      console.log(`⚠️  Aún quedan ${remainingInvalidLeads} leads con estados inválidos`);
    }

    // 5. Mostrar distribución final
    console.log('\n📈 NUEVA DISTRIBUCIÓN POR ESTADOS:');
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    statusCounts.forEach(({ status, _count }) => {
      console.log(`  ${status.padEnd(20)} | ${_count.status.toString().padStart(3)} leads`);
    });

  } catch (error) {
    console.error('❌ Error corrigiendo estados de leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar corrección
fixLeadStatuses();