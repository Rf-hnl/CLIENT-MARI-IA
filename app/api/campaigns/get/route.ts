import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Route: /api/campaigns/get - Starting web interface request');
    
    const body = await request.json();
    console.log('📥 Request body received:', body);
    
    const { tenantId, organizationId } = body;
    console.log('🏢 Extracted values:', { tenantId, organizationId });

    if (!tenantId || !organizationId) {
      console.log('❌ Missing required values:', { tenantId: !!tenantId, organizationId: !!organizationId });
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    // Get campaigns from PostgreSQL via Prisma (no API key authentication for web interface)
    console.log('🔍 Querying database with:', { tenantId, organizationId });
    
    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId,
        organizationId
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${campaigns.length} campaigns in database`);

    const response = {
      success: true,
      data: campaigns.map(campaign => ({
        ...campaign,
        budget: campaign.budget ? parseFloat(campaign.budget.toString()) : null,
        startDate: campaign.startDate?.toISOString() || null,
        endDate: campaign.endDate?.toISOString() || null,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      }))
    };
    
    console.log('✅ Sending successful response:', { 
      success: response.success, 
      campaignCount: campaigns.length
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}