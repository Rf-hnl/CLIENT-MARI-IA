import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['leads:read'],
      rateLimitConfig: {
        maxRequests: 200, // 200 reads per hour
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;
    console.log('🔍 API Route: /api/leads/admin/get - Starting authenticated request');
    
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

    // Validate tenant access against API key
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json(
        { success: false, error: tenantValidation.error },
        { status: 403 }
      );
    }

    // Get leads from PostgreSQL via Prisma
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