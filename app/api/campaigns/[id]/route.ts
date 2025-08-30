import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';
import { UpdateCampaignData } from '@/types/campaign';

// GET - Obtener una campaña específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Route: /api/campaigns/[id] - GET request');
    
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const campaignId = params.id;

    if (!tenantId || !organizationId || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and campaignId are required' },
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

    // Get campaign with products and lead count
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        organizationId,
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

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const response = {
      ...campaign,
      budget: campaign.budget ? parseFloat(campaign.budget.toString()) : null,
      startDate: campaign.startDate?.toISOString() || null,
      endDate: campaign.endDate?.toISOString() || null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };

    console.log('✅ Campaign found:', campaignId);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una campaña
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Route: /api/campaigns/[id] - PUT request');

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

    const { tenantId, organizationId, ...updateData }: UpdateCampaignData & {
      tenantId: string;
      organizationId: string;
    } = body;

    const campaignId = params.id;

    if (!tenantId || !organizationId || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and campaignId are required' },
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

    // Check if campaign exists and belongs to tenant/organization
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        organizationId,
      }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Update campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.budget !== undefined && { budget: updateData.budget }),
        ...(updateData.startDate !== undefined && { 
          startDate: updateData.startDate ? new Date(updateData.startDate) : null 
        }),
        ...(updateData.endDate !== undefined && { 
          endDate: updateData.endDate ? new Date(updateData.endDate) : null 
        }),
        ...(updateData.status && { status: updateData.status }),
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

    // Update product relationships if provided
    if (updateData.productIds !== undefined) {
      // Delete existing relationships
      await prisma.campaignProduct.deleteMany({
        where: { campaignId }
      });

      // Create new relationships
      if (updateData.productIds.length > 0) {
        await prisma.campaignProduct.createMany({
          data: updateData.productIds.map(productId => ({
            campaignId,
            productId,
          }))
        });
      }
    }

    const response = {
      ...updatedCampaign,
      budget: updatedCampaign.budget ? parseFloat(updatedCampaign.budget.toString()) : null,
      startDate: updatedCampaign.startDate?.toISOString() || null,
      endDate: updatedCampaign.endDate?.toISOString() || null,
      createdAt: updatedCampaign.createdAt.toISOString(),
      updatedAt: updatedCampaign.updatedAt.toISOString(),
    };

    console.log('✅ Campaign updated successfully:', campaignId);
    return NextResponse.json({ success: true, data: response });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una campaña
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 API Route: /api/campaigns/[id] - DELETE request');

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const campaignId = params.id;

    if (!tenantId || !organizationId || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and campaignId are required' },
        { status: 400 }
      );
    }

    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['campaigns:delete'],
      rateLimitConfig: {
        maxRequests: 20,
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

    // Check if campaign exists and belongs to tenant/organization
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if campaign has leads (optional warning)
    if (existingCampaign._count.leads > 0) {
      console.log(`⚠️ Deleting campaign with ${existingCampaign._count.leads} leads`);
    }

    // Delete campaign (cascade will handle relationships)
    await prisma.campaign.delete({
      where: { id: campaignId }
    });

    console.log('✅ Campaign deleted successfully:', campaignId);
    return NextResponse.json({ 
      success: true, 
      message: 'Campaign deleted successfully',
      deletedLeads: existingCampaign._count.leads 
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}