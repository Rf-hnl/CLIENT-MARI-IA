import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG CAMPAIGNS ENDPOINT ===');

    // 1. Contar total de campañas
    const totalCampaigns = await prisma.campaign.count();
    console.log('1. Total campaigns in database:', totalCampaigns);

    // 2. Obtener todas las campañas (primeras 10)
    const allCampaigns = await prisma.campaign.findMany({
      take: 10,
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
    
    console.log('2. Sample campaigns found:', allCampaigns.length);

    // 3. Verificar tenants y organizations
    const totalTenants = await prisma.tenant.count();
    const totalOrganizations = await prisma.organization.count();
    console.log('3. Total tenants:', totalTenants);
    console.log('   Total organizations:', totalOrganizations);

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

    // 5. Si hay campañas, probar consulta específica
    let testQueryResult = null;
    if (allCampaigns.length > 0) {
      const firstCampaign = allCampaigns[0];
      console.log('5. Testing specific query with first campaign tenant/org...');
      
      testQueryResult = await prisma.campaign.findMany({
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
    }

    return NextResponse.json({
      success: true,
      debug: {
        totalCampaigns,
        foundCampaigns: allCampaigns.length,
        totalTenants,
        totalOrganizations,
        sampleCampaigns: allCampaigns,
        sampleTenants,
        sampleOrganizations: sampleOrgs,
        testQueryResult
      }
    });

  } catch (error) {
    console.error('Error in debug campaigns endpoint:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      stack: error.stack
    }, { status: 500 });
  }
}