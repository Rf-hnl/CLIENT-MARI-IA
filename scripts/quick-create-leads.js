#!/usr/bin/env node

/**
 * SCRIPT RÁPIDO PARA CREAR LEADS DE PRUEBA
 * 
 * Versión simplificada para desarrollo - crea algunos leads básicos
 * Uso: node scripts/quick-create-leads.js
 */

const admin = require('firebase-admin');

// Configuración rápida para desarrollo
const QUICK_CONFIG = {
  tenantId: 'dev-tenant',
  organizationId: 'dev-org'
};

// Leads básicos para prueba rápida
const QUICK_LEADS = [
  {
    name: 'Juan Pérez',
    phone: '+507 6111-1111',
    email: 'juan@test.com',
    company: 'Test Company A',
    status: 'new',
    source: 'website',
    priority: 'medium'
  },
  {
    name: 'María González',
    phone: '+507 6222-2222',
    email: 'maria@test.com',
    company: 'Test Company B',
    status: 'contacted',
    source: 'referral',
    priority: 'high'
  },
  {
    name: 'Carlos Rodríguez',
    phone: '+507 6333-3333',
    email: 'carlos@test.com',
    company: 'Test Company C',
    status: 'qualified',
    source: 'cold_call',
    priority: 'urgent'
  },
  {
    name: 'Ana López',
    phone: '+507 6444-4444',
    email: 'ana@test.com',
    company: 'Test Company D',
    status: 'proposal',
    source: 'social_media',
    priority: 'high'
  },
  {
    name: 'Luis Martínez',
    phone: '+507 6555-5555',
    email: 'luis@test.com',
    company: 'Test Company E',
    status: 'won',
    source: 'referral',
    priority: 'medium',
    converted_to_client: true,
    conversion_value: 15000
  }
];

async function quickCreateLeads() {
  try {
    console.log('⚡ Creación rápida de leads de prueba...');
    
    // Inicializar Firebase (simplificado para desarrollo)
    if (!admin.apps.length) {
      // Para desarrollo, usa emuladores o configuración simple
      admin.initializeApp({
        projectId: 'demo-project',
        // Agregar más configuración según sea necesario
      });
    }
    
    const db = admin.firestore();
    const { tenantId, organizationId } = QUICK_CONFIG;
    
    console.log(`📍 Usando configuración de desarrollo:`);
    console.log(`   Tenant: ${tenantId}`);
    console.log(`   Organization: ${organizationId}`);
    
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadsCollection = db.collection(leadsPath);
    
    console.log(`📊 Creando ${QUICK_LEADS.length} leads rápidos...`);
    
    const batch = db.batch();
    const now = admin.firestore.Timestamp.now();
    
    for (const leadBase of QUICK_LEADS) {
      const leadRef = leadsCollection.doc();
      
      const leadData = {
        ...leadBase,
        qualification_score: Math.floor(Math.random() * 100),
        is_qualified: ['qualified', 'proposal', 'negotiation', 'won'].includes(leadBase.status),
        contact_attempts: Math.floor(Math.random() * 3) + 1,
        response_rate: Math.floor(Math.random() * 100),
        converted_to_client: leadBase.converted_to_client || false,
        created_at: now,
        updated_at: now,
        tags: ['test', 'desarrollo']
      };
      
      const leadDocument = {
        _data: leadData,
        leadInteractions: {
          callLogs: [],
          emailRecords: [],
          whatsappRecords: [],
          meetingRecords: []
        }
      };
      
      batch.set(leadRef, leadDocument);
    }
    
    await batch.commit();
    
    console.log('✅ Leads de prueba creados:');
    QUICK_LEADS.forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.name} (${lead.status}) - ${lead.company}`);
    });
    
    console.log(`\n🎯 Pipeline de prueba listo con ${QUICK_LEADS.length} leads`);
    console.log('   Puedes verlos en /clients/leads');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Para desarrollo rápido, considera usar:');
    console.log('   - Firebase Emulators');
    console.log('   - Variables de entorno simplificadas');
    console.log('   - Configuración de desarrollo local');
  }
}

// Ejecutar
if (require.main === module) {
  quickCreateLeads().then(() => {
    console.log('\n🚀 ¡Listo para probar el pipeline!');
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

module.exports = { quickCreateLeads };