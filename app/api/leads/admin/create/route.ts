import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

export async function POST(request: NextRequest) {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['leads:create'],
      rateLimitConfig: {
        maxRequests: 100, // 100 leads per hour
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;
    const body = await request.json();
    const { tenantId, organizationId, leadData } = body;

    console.log('📥 Received authenticated request:', { tenantId, organizationId, apiKeyId: apiKey.id });

    if (!tenantId || !organizationId || !leadData) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and leadData are required' },
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

    console.log('✅ Request validation passed');
    console.log('📋 leadData received:', leadData);

    // Validate campaignId if provided
    if (leadData.campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: {
          id: leadData.campaignId,
          tenantId,
          organizationId,
        }
      });
      
      if (!campaign) {
        return NextResponse.json(
          { success: false, error: 'Invalid campaignId: Campaign not found or does not belong to this organization' },
          { status: 400 }
        );
      }
    }

    // Map leadData to Prisma schema fields (using exact field names from schema)
    const mappedLeadData = {
      tenantId,
      organizationId,
      name: leadData.name,
      phone: leadData.phone,
      email: leadData.email || null,
      company: leadData.company || null,
      position: leadData.position || null,
      source: leadData.source || 'other',
      status: leadData.status || 'new',
      priority: leadData.priority || 'medium',
      notes: leadData.notes || null,
      qualificationNotes: leadData.qualification_notes || null,
      preferredContactMethod: leadData.preferred_contact_method || null,
      conversionValue: leadData.conversion_value ? parseFloat(leadData.conversion_value.toString()) : null,
      // NEW: Campaign relationship
      campaignId: leadData.campaignId || null,
      // Set default values for required fields with exact schema names
      contactAttempts: 0,
      responseRate: 0,
      qualificationScore: 0,
      isQualified: false,
      convertedToClient: false
    };

    console.log('📝 Creating lead with data:', mappedLeadData);

    // Create lead in PostgreSQL via Prisma
    const newLead = await prisma.lead.create({
      data: mappedLeadData
    });

    return NextResponse.json({
      success: true,
      data: newLead
    });

  } catch (error) {
    console.error('❌ Error creating lead:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}