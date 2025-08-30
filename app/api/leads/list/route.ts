/**
 * LEADS LIST ENDPOINT
 * 
 * Simple GET endpoint to list leads with filtering
 * GET /api/leads/list?tenantId=xxx&organizationId=xxx&limit=50&offset=0
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['leads:read'],
      rateLimitConfig: {
        maxRequests: 300, // 300 list requests per hour
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // Optional filter
    const source = searchParams.get('source'); // Optional filter

    if (!tenantId || !organizationId) {
      return NextResponse.json({
        success: false,
        error: 'tenantId and organizationId are required as query parameters'
      }, { status: 400 });
    }

    // Validate tenant access against API key
    const tenantValidation = validateTenantAccess(apiKey, tenantId, organizationId);
    if (!tenantValidation.valid) {
      return NextResponse.json({
        success: false,
        error: tenantValidation.error
      }, { status: 403 });
    }

    // Build where clause with optional filters
    const whereClause: any = {
      tenantId,
      organizationId
    };

    if (status) {
      whereClause.status = status;
    }

    if (source) {
      whereClause.source = source;
    }

    console.log('📋 Getting leads list:', { tenantId, organizationId, limit, offset, filters: { status, source } });

    // Get leads from database
    const leads = await prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // Max 100 per request
      skip: offset,
      include: {
        campaign: true // Include campaign data
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        status: true,
        source: true,
        priority: true,
        qualificationScore: true,
        isQualified: true,
        campaignId: true,
        campaign: true,
        contactAttempts: true,
        createdAt: true,
        updatedAt: true,
        // Don't return sensitive internal fields
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.lead.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      data: {
        leads,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + leads.length < totalCount
        },
        filters: {
          status,
          source
        }
      }
    });

  } catch (error) {
    console.error('❌ Error listing leads:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}