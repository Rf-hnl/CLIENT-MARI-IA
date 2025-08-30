const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createJWTTenant() {
  try {
    console.log('🔑 Creating tenant and organization from JWT...');
    
    // IDs from the JWT token
    const jwtTenantId = '62454186-ee40-47b3-8811-3d06cd64e049';
    const jwtOrganizationId = '3fbec5ca-b0cd-4abe-925a-d567141e3963';
    const userId = 'ef450138-b4ce-4dd6-aebd-80815a8446fd';
    
    // Check if JWT tenant exists
    let tenant = await prisma.tenant.findUnique({
      where: { id: jwtTenantId }
    });
    
    if (!tenant) {
      console.log('📝 Creating JWT tenant...');
      tenant = await prisma.tenant.create({
        data: {
          id: jwtTenantId,
          name: 'ANTRES',
          identifier: 'antres-tenant',
          plan: 'basic'
        }
      });
      console.log('✅ JWT Tenant created:', tenant.id);
    } else {
      console.log('✅ JWT Tenant already exists:', tenant.id);
    }
    
    // Check if JWT organization exists
    let organization = await prisma.organization.findUnique({
      where: { id: jwtOrganizationId }
    });
    
    if (!organization) {
      console.log('📝 Creating JWT organization...');
      organization = await prisma.organization.create({
        data: {
          id: jwtOrganizationId,
          tenantId: jwtTenantId,
          name: 'ANTRES Organization'
        }
      });
      console.log('✅ JWT Organization created:', organization.id);
    } else {
      console.log('✅ JWT Organization already exists:', organization.id);
    }
    
    // Update user to use the JWT organization
    console.log('📝 Updating user organization...');
    await prisma.user.update({
      where: { id: userId },
      data: {
        organizationId: jwtOrganizationId
      }
    });
    console.log('✅ User updated with JWT organization');
    
    console.log('🎉 JWT tenant/organization setup complete!');
    
  } catch (error) {
    console.error('❌ Error creating JWT tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createJWTTenant();