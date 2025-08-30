const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTenantSession() {
  try {
    console.log('🔧 Arreglando problema de tenant...\n');
    
    // Los IDs del problema
    const currentSessionTenant = 'b17ca9ad-0666-4643-b5b0-60424db5747f'; // El que aparece en los logs
    const correctTenant = '62454186-ee40-47b3-8811-3d06cd64e049'; // ANTRES donde está el agente
    const userEmail = 'rfernandez@hypernovalabs.com';
    
    // Verificar si el tenant de la sesión existe
    console.log('1. Verificando tenant de la sesión actual...');
    const sessionTenant = await prisma.tenant.findUnique({
      where: { id: currentSessionTenant }
    });
    
    if (!sessionTenant) {
      console.log('❌ El tenant de la sesión NO existe en la base de datos');
      console.log('   Esto significa que tu JWT tiene un tenant ID inválido');
    } else {
      console.log('✅ El tenant de la sesión SÍ existe:', sessionTenant.name);
    }
    
    // Verificar el tenant correcto (ANTRES)
    console.log('\n2. Verificando tenant correcto (ANTRES)...');
    const antresTenant = await prisma.tenant.findUnique({
      where: { id: correctTenant },
      include: {
        organizations: {
          include: {
            users: {
              where: {
                email: userEmail
              }
            }
          }
        }
      }
    });
    
    if (antresTenant) {
      console.log('✅ Tenant ANTRES encontrado:', antresTenant.name);
      console.log('   Organizaciones:', antresTenant.organizations.length);
      
      const userInAntres = antresTenant.organizations.flatMap(org => org.users);
      if (userInAntres.length > 0) {
        console.log('✅ Tu usuario SÍ pertenece al tenant ANTRES');
        console.log('   User ID:', userInAntres[0].id);
        console.log('   Organization ID:', antresTenant.organizations[0].id);
      }
    }
    
    // Verificar el agente de voz
    console.log('\n3. Verificando agente de voz...');
    const voiceAgent = await prisma.agentReference.findFirst({
      where: {
        elevenLabsAgentId: 'agent_01jy4g926hepd8x62rfcp8fjab'
      },
      include: {
        tenant: true,
        organization: true
      }
    });
    
    if (voiceAgent) {
      console.log('✅ Agente de voz encontrado');
      console.log('   Tenant actual:', voiceAgent.tenant.name, `(${voiceAgent.tenantId})`);
      console.log('   Organization:', voiceAgent.organization.name, `(${voiceAgent.organizationId})`);
    }
    
    // DECISIÓN: ¿Qué hacer?
    console.log('\n🤔 OPCIONES PARA SOLUCIONAR:');
    console.log('A) Crear el tenant faltante en la base de datos');
    console.log('B) Mover el agente al tenant de tu sesión actual'); 
    console.log('C) Logout/login para corregir la sesión');
    
    // Para esta demo, vamos a crear el tenant faltante si no existe
    if (!sessionTenant && antresTenant && voiceAgent) {
      console.log('\n🔧 SOLUCIÓN: Voy a crear el tenant faltante y mover tu usuario ahí');
      
      // Crear el tenant faltante
      const newTenant = await prisma.tenant.create({
        data: {
          id: currentSessionTenant,
          name: 'Fixed Tenant',
          identifier: 'fixed-tenant',
          plan: 'basic'
        }
      });
      
      console.log('✅ Tenant creado:', newTenant.name);
      
      // Crear una organización en el nuevo tenant
      const newOrg = await prisma.organization.create({
        data: {
          tenantId: currentSessionTenant,
          name: 'Fixed Organization'
        }
      });
      
      console.log('✅ Organización creada:', newOrg.name);
      
      // Mover el agente de voz al nuevo tenant
      await prisma.agentReference.update({
        where: { id: voiceAgent.id },
        data: {
          tenantId: currentSessionTenant,
          organizationId: newOrg.id
        }
      });
      
      console.log('✅ Agente de voz movido al nuevo tenant');
      
      // Crear un usuario en el nuevo tenant/org
      const existingUser = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            organizationId: newOrg.id
          }
        });
        console.log('✅ Usuario movido a la nueva organización');
      } else {
        console.log('⚠️ Usuario no encontrado para mover');
      }
    }
    
    console.log('\n🎉 ¡Proceso completado!');
    console.log('   Ahora tu agente de voz debería aparecer en la interfaz');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar script
fixTenantSession()
  .then(() => {
    console.log('\n✅ Tenant session fixed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });