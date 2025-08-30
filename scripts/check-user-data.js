const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log('🔍 Checking user and tenant data...');
    
    const tenantId = 'b17ca9ad-0666-4643-b5b0-60424db5747f';
    const userId = 'ef450138-b4ce-4dd6-aebd-80815a8446fd';
    
    // Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    console.log('Tenant exists:', !!tenant);
    if (tenant) {
      console.log('Tenant details:', {
        id: tenant.id,
        name: tenant.name,
        identifier: tenant.identifier,
        ownerId: tenant.ownerId
      });
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    console.log('User exists:', !!user);
    if (user) {
      console.log('User details:', {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        organizationId: user.organizationId
      });
    }
    
    // Check if organization exists
    const organizationId = '40e018a4-9716-41d0-806c-f7137152e00c';
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    console.log('Organization exists:', !!organization);
    if (organization) {
      console.log('Organization details:', {
        id: organization.id,
        name: organization.name,
        tenantId: organization.tenantId,
        ownerId: organization.ownerId
      });
    }
    
    console.log('✅ Data check complete!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();