import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API Route: /api/leads/get - Starting web interface request');
    
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

    // Get leads from PostgreSQL via Prisma (no API key authentication for web interface)
    console.log('🔍 Querying database with:', { tenantId, organizationId });
    
    const leadsArray = await prisma.lead.findMany({
      where: {
        tenantId,
        organizationId
      },
      include: {
        campaign: true // Include campaign data
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${leadsArray.length} leads in database`);
    
    // Convert array to object format for compatibility with existing frontend
    const leads: any = {};
    leadsArray.forEach((lead) => {
      leads[lead.id] = lead;
    });

    const response = {
      success: true,
      data: leads,
      path: `tenants/${tenantId}/organizations/${organizationId}/leads`
    };
    
    console.log('✅ Sending successful response:', { 
      success: response.success, 
      leadCount: Object.keys(leads).length,
      path: response.path 
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}