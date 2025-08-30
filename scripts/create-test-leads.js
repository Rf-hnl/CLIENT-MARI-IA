/**
 * SCRIPT PARA CREAR 10 LEADS DE PRUEBA
 * 
 * Este script utiliza la API para crear 10 leads realistas
 */

const API_KEY = 'sk_736748c4a8e37bd957c1d39c9aeffa74806db32277a8d19d72df81bbae0c1ec6';
const BASE_URL = 'http://localhost:3000'; // Cambiar por tu URL de producción

// Datos de prueba realistas
const testLeads = [
  {
    name: 'María González',
    phone: '+507-6234-5678',
    email: 'maria.gonzalez@techcorp.com',
    company: 'TechCorp Solutions',
    position: 'Gerente de IT',
    source: 'website',
    status: 'new',
    priority: 'high',
    notes: 'Interesada en automatización de procesos empresariales'
  },
  {
    name: 'Carlos Rodríguez',
    phone: '+507-6345-6789',
    email: 'carlos.rodriguez@restaurantepanama.com',
    company: 'Restaurante El Sabor Panameño',
    position: 'Propietario',
    source: 'referral',
    status: 'new',
    priority: 'medium',
    notes: 'Necesita sistema de punto de venta para su restaurante'
  },
  {
    name: 'Ana Patricia Vega',
    phone: '+507-6456-7890',
    email: 'ana.vega@clinicasalud.com',
    company: 'Clínica de Salud Integral',
    position: 'Administradora',
    source: 'social_media',
    status: 'interested',
    priority: 'high',
    notes: 'Busca software para gestión de pacientes y citas médicas'
  },
  {
    name: 'Roberto Silva',
    phone: '+507-6567-8901',
    email: 'roberto.silva@consultoreslegal.com',
    company: 'Silva & Asociados Consultores Legales',
    position: 'Socio Fundador',
    source: 'cold_call',
    status: 'qualified',
    priority: 'high',
    notes: 'Requiere CRM para gestión de casos legales y clientes'
  },
  {
    name: 'Isabella Morales',
    phone: '+507-6678-9012',
    email: 'isabella.morales@tiendamoda.com',
    company: 'Boutique Isabella Fashion',
    position: 'Propietaria',
    source: 'advertisement',
    status: 'new',
    priority: 'medium',
    notes: 'Interesada en e-commerce y gestión de inventario'
  },
  {
    name: 'Luis Fernando Castillo',
    phone: '+507-6789-0123',
    email: 'luis.castillo@constructorapanama.com',
    company: 'Constructora Castillo & Hijos',
    position: 'Gerente General',
    source: 'event',
    status: 'follow_up',
    priority: 'medium',
    notes: 'Necesita software para gestión de proyectos de construcción'
  },
  {
    name: 'Sofía Hernández',
    phone: '+507-6890-1234',
    email: 'sofia.hernandez@agenciamarketing.com',
    company: 'Agencia de Marketing Digital Panamá',
    position: 'Directora Creativa',
    source: 'website',
    status: 'interested',
    priority: 'high',
    notes: 'Busca herramientas para automatización de marketing digital'
  },
  {
    name: 'Miguel Ángel Torres',
    phone: '+507-6901-2345',
    email: 'miguel.torres@transporteslogistica.com',
    company: 'Torres Transportes y Logística',
    position: 'CEO',
    source: 'referral',
    status: 'qualified',
    priority: 'high',
    notes: 'Requiere sistema de gestión de flotas y logística'
  },
  {
    name: 'Carmen Elena Jiménez',
    phone: '+507-6012-3456',
    email: 'carmen.jimenez@escuelaprivada.edu',
    company: 'Colegio Bilingüe Internacional',
    position: 'Directora Académica',
    source: 'email',
    status: 'new',
    priority: 'medium',
    notes: 'Interesada en plataforma educativa y gestión escolar'
  },
  {
    name: 'Alejandro Mendoza',
    phone: '+507-6123-4567',
    email: 'alejandro.mendoza@hotelpanama.com',
    company: 'Hotel Panamá Plaza',
    position: 'Gerente de Operaciones',
    source: 'whatsapp',
    status: 'follow_up',
    priority: 'medium',
    notes: 'Necesita sistema de reservas y gestión hotelera'
  }
];

async function createLead(leadData, tenantId, organizationId) {
  try {
    const response = await fetch(`${BASE_URL}/api/leads/admin/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenantId,
        organizationId,
        leadData
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Lead creado: ${leadData.name} - ${leadData.company}`);
      return { success: true, data: result.data };
    } else {
      console.error(`❌ Error creando lead ${leadData.name}:`, result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Error de red creando lead ${leadData.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function createAllLeads() {
  console.log('🚀 Iniciando creación de 10 leads de prueba...\n');
  
  // Obtener información del tenant (estos valores deberían venir de tu usuario actual)
  // Por ahora los hardcodearé basado en los logs que vimos anteriormente
  const TENANT_ID = '22dca077-3730-4f69-8fc9-e9007d6e4d88';
  const ORGANIZATION_ID = '6a47f84b-6a09-427d-b7d1-557339b18502';
  
  console.log(`📋 Usando Tenant ID: ${TENANT_ID}`);
  console.log(`🏢 Usando Organization ID: ${ORGANIZATION_ID}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (let i = 0; i < testLeads.length; i++) {
    const lead = testLeads[i];
    console.log(`[${i + 1}/10] Creando lead: ${lead.name}...`);
    
    const result = await createLead(lead, TENANT_ID, ORGANIZATION_ID);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pequeña pausa entre requests para no sobrecargar la API
    if (i < testLeads.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE CREACIÓN DE LEADS:');
  console.log('='.repeat(50));
  console.log(`✅ Leads creados exitosamente: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📈 Tasa de éxito: ${((successCount / testLeads.length) * 100).toFixed(1)}%`);
  
  if (errorCount > 0) {
    console.log('\n❌ ERRORES ENCONTRADOS:');
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`- ${testLeads[index].name}: ${result.error}`);
      }
    });
  }
  
  console.log('\n🎉 ¡Proceso completado!');
}

// Ejecutar el script
if (require.main === module) {
  createAllLeads().catch(console.error);
}

module.exports = { createAllLeads, testLeads };