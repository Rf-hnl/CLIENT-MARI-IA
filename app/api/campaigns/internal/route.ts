import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener campañas (versión interna sin auth de API key)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    console.log('=== CAMPAIGNS API DEBUG ===');
    console.log('Received params:', { tenantId, organizationId, status, search });

    if (!tenantId || !organizationId) {
      console.log('Missing required params');
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {
      tenantId,
      organizationId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    console.log('Where clause:', JSON.stringify(where, null, 2));

    // First, let's check if there are any campaigns at all
    const totalCampaigns = await prisma.campaign.count();
    console.log('Total campaigns in database:', totalCampaigns);

    // Let's also check campaigns for this specific tenant/org
    const campaignsForThisTenant = await prisma.campaign.count({
      where: { tenantId }
    });
    console.log('Campaigns for this tenantId:', campaignsForThisTenant);

    const campaignsForThisOrg = await prisma.campaign.count({
      where: { organizationId }
    });
    console.log('Campaigns for this organizationId:', campaignsForThisOrg);

    // Get campaigns with products and leads count
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        products: {
          include: {
            product: true
          }
        },
        _count: {
          select: {
            leads: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Found campaigns:', campaigns.length);
    console.log('Campaign names:', campaigns.map(c => c.name));

    // If no campaigns found, let's debug further
    if (campaigns.length === 0) {
      console.log('No campaigns found, checking sample data...');
      
      // Get a sample campaign to see the data structure
      const sampleCampaigns = await prisma.campaign.findMany({
        take: 3,
        select: {
          id: true,
          name: true,
          tenantId: true,
          organizationId: true
        }
      });
      console.log('Sample campaigns in DB:', sampleCampaigns);
    }

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map(campaign => ({
          ...campaign,
          budget: campaign.budget ? parseFloat(campaign.budget.toString()) : null,
          startDate: campaign.startDate?.toISOString() || null,
          endDate: campaign.endDate?.toISOString() || null,
          products: campaign.products.map(cp => cp.product),
          createdAt: campaign.createdAt.toISOString(),
          updatedAt: campaign.updatedAt.toISOString(),
          _count: campaign._count
        })),
        total: campaigns.length
      }
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Crear campaña (versión interna)
export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const { tenantId, organizationId, ...campaignData } = body;
  // LOG para depuración
  console.log('[API Crear Campaña] Datos recibidos:', { tenantId, organizationId, ...campaignData });

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    if (!campaignData.name) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    // Create campaign (sin includes complejos)
    const newCampaign = await prisma.campaign.create({
      data: {
        tenantId,
        organizationId,
        name: campaignData.name,
        description: campaignData.description,
        budget: campaignData.budget,
        startDate: campaignData.startDate ? new Date(campaignData.startDate) : null,
        endDate: campaignData.endDate ? new Date(campaignData.endDate) : null,
        status: campaignData.status || 'draft',
      }
    });

    // LOG campaña creada
    console.log('[API Crear Campaña] Campaña creada:', newCampaign);

    // If productIds provided, create relationships
    if (campaignData.productIds && campaignData.productIds.length > 0) {
      const rels = campaignData.productIds.map((productId: string) => ({
        campaignId: newCampaign.id,
        productId,
      }));
      await prisma.campaignProduct.createMany({ data: rels });
      // LOG relaciones creadas
      console.log('[API Crear Campaña] Relaciones productos-campaña creadas:', rels);
    }

    // Get campaign with products for response
    const campaignWithProducts = await prisma.campaign.findUnique({
      where: { id: newCampaign.id },
      include: {
        products: {
          include: {
            product: true
          }
        },
        _count: {
          select: {
            leads: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          ...campaignWithProducts,
          budget: campaignWithProducts?.budget ? parseFloat(campaignWithProducts.budget.toString()) : null,
          startDate: campaignWithProducts?.startDate?.toISOString() || null,
          endDate: campaignWithProducts?.endDate?.toISOString() || null,
          products: campaignWithProducts?.products.map(cp => cp.product) || [],
          createdAt: campaignWithProducts?.createdAt.toISOString(),
          updatedAt: campaignWithProducts?.updatedAt.toISOString(),
          _count: campaignWithProducts?._count
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}