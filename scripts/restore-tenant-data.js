const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreTenantData() {
  try {
    console.log('🔄 Restoring tenant and organization data after database reset...');
    
    // Check if tenant exists
    const tenantId = 'b17ca9ad-0666-4643-b5b0-60424db5747f';
    const organizationId = '40e018a4-9716-41d0-806c-f7137152e00c';
    
    let tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    if (!tenant) {
      console.log('📝 Creating tenant...');
      tenant = await prisma.tenant.create({
        data: {
          id: tenantId,
          name: 'Fixed Tenant',
          identifier: 'fixed-tenant-restored',
          plan: 'basic'
        }
      });
      console.log('✅ Tenant created:', tenant.id);
    } else {
      console.log('✅ Tenant already exists:', tenant.id);
    }
    
    let organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    if (!organization) {
      console.log('📝 Creating organization...');
      organization = await prisma.organization.create({
        data: {
          id: organizationId,
          tenantId: tenantId,
          name: 'Fixed Organization'
        }
      });
      console.log('✅ Organization created:', organization.id);
    } else {
      console.log('✅ Organization already exists:', organization.id);
    }
    
    console.log('🎉 Tenant and organization data restored successfully!');
    
  } catch (error) {
    console.error('❌ Error restoring tenant data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreTenantData();