import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

export async function DELETE(request: NextRequest) {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['leads:delete'],
      rateLimitConfig: {
        maxRequests: 50, // 50 deletes per hour (more restrictive)
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;
    const { uid, organizationId, tenantId, leadId } = await request.json();

    if (!organizationId || !tenantId || !leadId) {
      return NextResponse.json(
        { success: false, error: 'organizationId, tenantId, and leadId are required' },
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

    // Delete lead from PostgreSQL via Prisma
    await prisma.lead.delete({
      where: {
        id: leadId,
        tenantId,
        organizationId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}