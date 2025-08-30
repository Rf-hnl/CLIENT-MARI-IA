import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { tenantId, organizationId, leadIds, campaignId } = await request.json();

    console.log('=== BULK ASSIGN CAMPAIGN API ===');
    console.log('Request body:', { tenantId, organizationId, leadIds, campaignId });

    // Validate required fields
    if (!tenantId || !organizationId || !leadIds || !Array.isArray(leadIds) || !campaignId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: tenantId, organizationId, leadIds array, and campaignId'
      }, { status: 400 });
    }

    // Validate that campaign exists and belongs to the tenant/organization
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId: tenantId,
        organizationId: organizationId
      }
    });
    
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found or does not belong to your organization'
      }, { status: 404 });
    }

    console.log('Campaign found:', campaign.name);

    // Update all leads with the new campaign ID using Prisma updateMany
    const updateResult = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        tenantId: tenantId,
        organizationId: organizationId
      },
      data: {
        campaignId: campaignId,
        updatedAt: new Date()
      }
    });

    console.log('Update result:', updateResult);

    // Get updated leads for response
    const updatedLeads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        tenantId: tenantId,
        organizationId: organizationId
      },
      select: {
        id: true,
        name: true,
        campaignId: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        updatedLeadsCount: updateResult.count,
        campaignId: campaignId,
        campaignName: campaign.name,
        updatedLeads: updatedLeads
      }
    });

  } catch (error) {
    console.error('Error in bulk campaign assignment:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error during bulk campaign assignment'
    }, { status: 500 });
  }
}