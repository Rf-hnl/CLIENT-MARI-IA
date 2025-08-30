const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCampaignsQuery() {
  try {
    console.log('=== TESTING CAMPAIGNS DATABASE QUERIES ===\n');

    // 1. Contar total de campañas
    const totalCampaigns = await prisma.campaign.count();
    console.log('1. Total campaigns in database:', totalCampaigns);

    // 2. Obtener todas las campañas (primeras 5)
    const allCampaigns = await prisma.campaign.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        tenantId: true,
        organizationId: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n2. Sample campaigns:');
    allCampaigns.forEach((campaign, index) => {
      console.log(`   ${index + 1}. ${campaign.name}`);
      console.log(`      ID: ${campaign.id}`);
      console.log(`      TenantId: ${campaign.tenantId}`);
      console.log(`      OrganizationId: ${campaign.organizationId}`);
      console.log(`      Status: ${campaign.status}`);
      console.log('');
    });

    // 3. Verificar si hay tenants/organizations
    const totalTenants = await prisma.tenant.count();
    const totalOrganizations = await prisma.organization.count();
    console.log(`3. Total tenants: ${totalTenants}`);
    console.log(`   Total organizations: ${totalOrganizations}\n`);

    // 4. Obtener muestra de tenants y organizaciones
    const sampleTenants = await prisma.tenant.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    const sampleOrgs = await prisma.organization.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        tenantId: true
      }
    });

    console.log('4. Sample tenants:');
    sampleTenants.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.id})`);
    });

    console.log('\n   Sample organizations:');
    sampleOrgs.forEach(org => {
      console.log(`   - ${org.name} (${org.id}) - Tenant: ${org.tenantId}`);
    });

    // 5. Si hay campañas, probar consulta específica
    if (allCampaigns.length > 0) {
      const firstCampaign = allCampaigns[0];
      console.log(`\n5. Testing query with specific tenant/org from campaign "${firstCampaign.name}":`);
      console.log(`   Using tenantId: ${firstCampaign.tenantId}`);
      console.log(`   Using organizationId: ${firstCampaign.organizationId}`);

      const queriedCampaigns = await prisma.campaign.findMany({
        where: {
          tenantId: firstCampaign.tenantId,
          organizationId: firstCampaign.organizationId
        },
        select: {
          id: true,
          name: true,
          status: true
        }
      });

      console.log(`   Found ${queriedCampaigns.length} campaigns for this tenant/org:`);
      queriedCampaigns.forEach(campaign => {
        console.log(`   - ${campaign.name} (${campaign.status})`);
      });
    }

  } catch (error) {
    console.error('Error testing campaigns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCampaignsQuery();