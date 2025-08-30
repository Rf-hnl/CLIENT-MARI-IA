import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';
import { CreateCampaignData, CampaignListResponse } from '@/types/campaign';

// GET - Obtener todas las campañas
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Route: /api/campaigns - GET request');
    
    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['campaigns:read'],
      rateLimitConfig: {
        maxRequests: 100,
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response;
    }

    const apiKey = authResult.apiKey!;

    // Validate tenant access
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json(
        { success: false, error: tenantValidation.error },
        { status: 403 }
      );
    }

    // Build where clause
    const where: any = {
      tenantId,
      organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get campaigns with products and lead count
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where })
    ]);

    const response: CampaignListResponse = {
      campaigns: campaigns.map(campaign => ({
        ...campaign,
        budget: campaign.budget ? parseFloat(campaign.budget.toString()) : null,
        startDate: campaign.startDate?.toISOString() || null,
        endDate: campaign.endDate?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
    };

    console.log(`✅ Found ${campaigns.length} campaigns`);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva campaña
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Route: /api/campaigns - POST request');

    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['campaigns:write'],
      rateLimitConfig: {
        maxRequests: 50,
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response;
    }

    const apiKey = authResult.apiKey!;
    const body = await request.json();
    console.log('📥 Request body received:', body);

    const { tenantId, organizationId, ...campaignData }: CreateCampaignData & {
      tenantId: string;
      organizationId: string;
    } = body;

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

    // Validate tenant access
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json(
        { success: false, error: tenantValidation.error },
        { status: 403 }
      );
    }

    // Create campaign
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
      },
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

    // If productIds provided, create relationships
    if (campaignData.productIds && campaignData.productIds.length > 0) {
      await prisma.campaignProduct.createMany({
        data: campaignData.productIds.map(productId => ({
          campaignId: newCampaign.id,
          productId,
        }))
      });
    }

    const response = {
      ...newCampaign,
      budget: newCampaign.budget ? parseFloat(newCampaign.budget.toString()) : null,
      startDate: newCampaign.startDate?.toISOString() || null,
      endDate: newCampaign.endDate?.toISOString() || null,
      createdAt: newCampaign.createdAt.toISOString(),
      updatedAt: newCampaign.updatedAt.toISOString(),
    };

    console.log('✅ Campaign created successfully:', newCampaign.id);
    return NextResponse.json({ success: true, data: response }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}