#!/usr/bin/env node

/**
 * SCRIPT PARA CREAR LEADS DE EJEMPLO
 * 
 * Este script crea leads de muestra en Firebase para probar el sistema
 * Uso: node scripts/create-sample-leads.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  try {
    // Intentar cargar desde variables de entorno o archivo de servicio
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : require('../firebase-service-account.json'); // Archivo local (no commiteado)
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('🔥 Firebase Admin inicializado correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Firebase Admin:', error.message);
    console.log('💡 Asegúrate de tener configurado FIREBASE_SERVICE_ACCOUNT_KEY o firebase-service-account.json');
    process.exit(1);
  }
}

const db = admin.firestore();

// Datos de ejemplo para leads
const SAMPLE_LEADS = [
  {
    name: 'María García Rodríguez',
    phone: '+507 6234-5678',
    email: 'maria.garcia@empresa.com',
    company: 'Inversiones García S.A.',
    position: 'Gerente General',
    status: 'new',
    source: 'website',
    priority: 'medium',
    interest_level: 4,
    budget_range: '$10,000-25,000',
    decision_timeline: '1-3 months',
    notes: 'Interesada en servicios de consultoría financiera. Empresa en crecimiento.',
    city: 'Ciudad de Panamá',
    province: 'Panamá',
    country: 'Panamá',
    preferred_contact_method: 'email',
    best_contact_time: '9:00 AM - 5:00 PM',
    tags: ['consultoría', 'finanzas', 'crecimiento']
  },
  {
    name: 'Carlos Alberto Mendoza',
    phone: '+507 6987-6543',
    email: 'carlos.mendoza@techsolutions.com',
    company: 'Tech Solutions Panama',
    position: 'CTO',
    status: 'contacted',
    source: 'referral',
    priority: 'high',
    interest_level: 5,
    budget_range: '$25,000+',
    decision_timeline: '2-4 weeks',
    notes: 'Necesita implementar sistema CRM. Presupuesto aprobado. Muy interesado.',
    city: 'Ciudad de Panamá',
    province: 'Panamá',
    country: 'Panamá',
    preferred_contact_method: 'phone',
    best_contact_time: '10:00 AM - 6:00 PM',
    tags: ['tecnología', 'crm', 'implementación']
  },
  {
    name: 'Ana Isabel Morales',
    phone: '+507 6345-7890',
    email: 'ana.morales@retail.com',
    company: 'Retail Express',
    position: 'Directora de Operaciones',
    status: 'interested',
    source: 'social_media',
    priority: 'medium',
    interest_level: 3,
    budget_range: '$5,000-15,000',
    decision_timeline: '3-6 months',
    notes: 'Busca automatizar procesos de inventario. Comparando opciones.',
    city: 'Colón',
    province: 'Colón',
    country: 'Panamá',
    preferred_contact_method: 'whatsapp',
    best_contact_time: '2:00 PM - 8:00 PM',
    tags: ['retail', 'inventario', 'automatización']
  },
  {
    name: 'Roberto Jiménez Castro',
    phone: '+507 6456-7891',
    email: 'roberto.jimenez@logistica.com',
    company: 'Logística Internacional',
    position: 'Gerente de IT',
    status: 'qualified',
    source: 'cold_call',
    priority: 'high',
    interest_level: 4,
    budget_range: '$15,000-30,000',
    decision_timeline: '1-2 months',
    notes: 'Sistema actual obsoleto. Urgente modernización. Reunión programada.',
    city: 'Chitré',
    province: 'Herrera',
    country: 'Panamá',
    preferred_contact_method: 'phone',
    best_contact_time: '8:00 AM - 4:00 PM',
    tags: ['logística', 'modernización', 'urgente']
  },
  {
    name: 'Patricia Vega Sánchez',
    phone: '+507 6567-8901',
    email: 'patricia.vega@salud.com',
    company: 'Centro Médico Especializado',
    position: 'Administradora',
    status: 'proposal',
    source: 'advertisement',
    priority: 'medium',
    interest_level: 4,
    budget_range: '$8,000-20,000',
    decision_timeline: '4-8 weeks',
    notes: 'Propuesta enviada para sistema de gestión de pacientes. Esperando respuesta.',
    city: 'David',
    province: 'Chiriquí',
    country: 'Panamá',
    preferred_contact_method: 'email',
    best_contact_time: '7:00 AM - 3:00 PM',
    tags: ['salud', 'gestión-pacientes', 'propuesta-enviada']
  },
  {
    name: 'Eduardo Pérez Luna',
    phone: '+507 6678-9012',
    email: 'eduardo.perez@construccion.com',
    company: 'Constructora Pérez & Asociados',
    position: 'Director de Proyectos',
    status: 'negotiation',
    source: 'event',
    priority: 'urgent',
    interest_level: 5,
    budget_range: '$30,000+',
    decision_timeline: '1-2 weeks',
    notes: 'En negociación final. Contrato por 3 años. Decisión inminente.',
    city: 'Santiago',
    province: 'Veraguas',
    country: 'Panamá',
    preferred_contact_method: 'phone',
    best_contact_time: '6:00 AM - 2:00 PM',
    tags: ['construcción', 'contrato-largo', 'negociación-final'],
    conversion_value: 45000
  },
  {
    name: 'Sofía Hernández Torres',
    phone: '+507 6789-0123',
    email: 'sofia.hernandez@educacion.edu',
    company: 'Instituto Educativo Superior',
    position: 'Coordinadora de Sistemas',
    status: 'won',
    source: 'referral',
    priority: 'high',
    interest_level: 5,
    budget_range: '$12,000-25,000',
    decision_timeline: 'Decidido',
    notes: '¡Contrato firmado! Sistema académico implementado exitosamente.',
    city: 'Penonomé',
    province: 'Coclé',
    country: 'Panamá',
    preferred_contact_method: 'email',
    best_contact_time: '8:00 AM - 4:00 PM',
    tags: ['educación', 'sistema-académico', 'cliente-ganado'],
    converted_to_client: true,
    conversion_value: 18500
  },
  {
    name: 'Miguel Ángel Rojas',
    phone: '+507 6890-1234',
    email: 'miguel.rojas@agricultura.com',
    company: 'AgroTech Innovación',
    position: 'Gerente de Tecnología',
    status: 'lost',
    source: 'cold_call',
    priority: 'low',
    interest_level: 2,
    budget_range: '$3,000-8,000',
    decision_timeline: 'Indefinido',
    notes: 'Decidió por la competencia. Precio fue factor decisivo. Mantener contacto.',
    city: 'Aguadulce',
    province: 'Coclé',
    country: 'Panamá',
    preferred_contact_method: 'phone',
    best_contact_time: '5:00 AM - 1:00 PM',
    tags: ['agricultura', 'competencia', 'precio-sensible']
  },
  {
    name: 'Lucía Fernández Gómez',
    phone: '+507 6901-2345',
    email: 'lucia.fernandez@turismo.com',
    company: 'Turismo y Aventura S.A.',
    position: 'Directora de Marketing',
    status: 'nurturing',
    source: 'whatsapp',
    priority: 'low',
    interest_level: 3,
    budget_range: '$5,000-12,000',
    decision_timeline: '6+ months',
    notes: 'Interés a largo plazo. Empresa en temporada baja. Seguimiento trimestral.',
    city: 'Bocas del Toro',
    province: 'Bocas del Toro',
    country: 'Panamá',
    preferred_contact_method: 'whatsapp',
    best_contact_time: '10:00 AM - 6:00 PM',
    tags: ['turismo', 'marketing', 'largo-plazo']
  },
  {
    name: 'Daniel Castillo Vargas',
    phone: '+507 6012-3456',
    email: 'daniel.castillo@banca.com',
    company: 'Servicios Financieros Plus',
    position: 'Vicepresidente de Operaciones',
    status: 'follow_up',
    source: 'email',
    priority: 'urgent',
    interest_level: 4,
    budget_range: '$20,000-40,000',
    decision_timeline: '2-3 weeks',
    notes: 'Seguimiento urgente requerido. Reunión pospuesta. Muy interesado pero ocupado.',
    city: 'Ciudad de Panamá',
    province: 'Panamá',
    country: 'Panamá',
    preferred_contact_method: 'email',
    best_contact_time: '2:00 PM - 6:00 PM',
    tags: ['finanzas', 'seguimiento-urgente', 'reunión-pospuesta']
  }
];

// Función para crear un lead con campos calculados
function createLeadData(leadBase, index) {
  const now = admin.firestore.Timestamp.now();
  const daysAgo = Math.floor(Math.random() * 30) + 1; // 1-30 días atrás
  const createdAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000))
  );
  
  // Calcular score de calificación basado en interés y prioridad
  let qualificationScore = (leadBase.interest_level || 1) * 20;
  if (leadBase.priority === 'urgent') qualificationScore += 20;
  else if (leadBase.priority === 'high') qualificationScore += 15;
  else if (leadBase.priority === 'medium') qualificationScore += 10;
  
  // Ajustar score por status
  if (['qualified', 'proposal', 'negotiation'].includes(leadBase.status)) {
    qualificationScore += 10;
  }
  
  qualificationScore = Math.min(100, qualificationScore);
  
  // Determinar si está calificado
  const isQualified = qualificationScore >= 60 || 
                     ['qualified', 'proposal', 'negotiation', 'won'].includes(leadBase.status);
  
  // Calcular último contacto (algunos leads)
  let lastContactDate = null;
  if (['contacted', 'interested', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].includes(leadBase.status)) {
    const contactDaysAgo = Math.floor(Math.random() * 14) + 1; // 1-14 días atrás
    lastContactDate = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - (contactDaysAgo * 24 * 60 * 60 * 1000))
    );
  }
  
  // Calcular próximo seguimiento
  let nextFollowUpDate = null;
  if (['follow_up', 'nurturing', 'interested'].includes(leadBase.status)) {
    const followUpDays = leadBase.status === 'follow_up' ? Math.floor(Math.random() * 3) + 1 : // 1-3 días
                        leadBase.status === 'nurturing' ? Math.floor(Math.random() * 30) + 30 : // 30-60 días
                        Math.floor(Math.random() * 7) + 3; // 3-10 días
    
    nextFollowUpDate = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + (followUpDays * 24 * 60 * 60 * 1000))
    );
  }
  
  return {
    // Campos base del lead
    ...leadBase,
    
    // Campos calculados/automáticos
    qualification_score: qualificationScore,
    is_qualified: isQualified,
    contact_attempts: Math.floor(Math.random() * 5) + 1,
    response_rate: Math.floor(Math.random() * 100),
    converted_to_client: leadBase.converted_to_client || false,
    
    // Timestamps
    created_at: createdAt,
    updated_at: now,
    last_contact_date: lastContactDate,
    next_follow_up_date: nextFollowUpDate,
    
    // Campos opcionales con valores por defecto
    national_id: leadBase.national_id || null,
    address: leadBase.address || null,
    postal_code: leadBase.postal_code || null,
    budget_range: leadBase.budget_range || null,
    decision_timeline: leadBase.decision_timeline || null,
    assigned_agent_id: leadBase.assigned_agent_id || null,
    assigned_agent_name: leadBase.assigned_agent_name || null,
    client_id: leadBase.client_id || null,
    conversion_date: leadBase.converted_to_client ? now : null,
    conversion_value: leadBase.conversion_value || null,
    qualification_notes: leadBase.qualification_notes || null,
    internal_notes: leadBase.internal_notes || null
  };
}

// Función principal
async function createSampleLeads() {
  try {
    console.log('🚀 Iniciando creación de leads de ejemplo...');
    
    // Obtener parámetros de línea de comandos
    const args = process.argv.slice(2);
    const tenantId = args[0] || process.env.DEFAULT_TENANT_ID;
    const organizationId = args[1] || process.env.DEFAULT_ORGANIZATION_ID;
    
    if (!tenantId || !organizationId) {
      console.log(`
📋 Uso del script:
   node scripts/create-sample-leads.js <tenantId> <organizationId>

   O configurar variables de entorno:
   export DEFAULT_TENANT_ID="tu-tenant-id"
   export DEFAULT_ORGANIZATION_ID="tu-organization-id"

📝 Ejemplo:
   node scripts/create-sample-leads.js abc123 org456
      `);
      process.exit(1);
    }
    
    console.log(`📍 Tenant ID: ${tenantId}`);
    console.log(`🏢 Organization ID: ${organizationId}`);
    
    // Ruta de la colección de leads
    const leadsPath = `tenants/${tenantId}/organizations/${organizationId}/leads`;
    const leadsCollection = db.collection(leadsPath);
    
    console.log(`📁 Ruta: ${leadsPath}`);
    console.log(`📊 Creando ${SAMPLE_LEADS.length} leads de ejemplo...`);
    
    // Batch para crear todos los leads de una vez
    const batch = db.batch();
    const createdLeads = [];
    
    for (let i = 0; i < SAMPLE_LEADS.length; i++) {
      const leadData = createLeadData(SAMPLE_LEADS[i], i);
      const leadRef = leadsCollection.doc(); // Auto-generar ID
      
      // Estructura de documento compatible con el sistema
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
      createdLeads.push({
        id: leadRef.id,
        name: leadData.name,
        status: leadData.status,
        company: leadData.company
      });
    }
    
    // Ejecutar batch
    await batch.commit();
    
    console.log('\n✅ Leads creados exitosamente:');
    console.log('═'.repeat(80));
    
    // Agrupar por status para mostrar resumen
    const byStatus = {};
    createdLeads.forEach(lead => {
      if (!byStatus[lead.status]) byStatus[lead.status] = [];
      byStatus[lead.status].push(lead);
    });
    
    Object.entries(byStatus).forEach(([status, leads]) => {
      console.log(`\n🏷️  ${status.toUpperCase()} (${leads.length})`);
      leads.forEach(lead => {
        console.log(`   • ${lead.name} - ${lead.company}`);
      });
    });
    
    console.log('\n📈 Resumen:');
    console.log(`   Total leads creados: ${createdLeads.length}`);
    console.log(`   Ruta en Firebase: ${leadsPath}`);
    console.log(`   Ganados: ${byStatus['won']?.length || 0}`);
    console.log(`   En negociación: ${byStatus['negotiation']?.length || 0}`);
    console.log(`   Calificados: ${byStatus['qualified']?.length || 0}`);
    console.log(`   Nuevos: ${byStatus['new']?.length || 0}`);
    
    console.log('\n🎉 ¡Script completado exitosamente!');
    console.log('   Ahora puedes ver los leads en tu aplicación.');
    
  } catch (error) {
    console.error('❌ Error creando leads:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createSampleLeads().then(() => {
    console.log('\n👋 Cerrando conexión...');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { createSampleLeads, SAMPLE_LEADS };