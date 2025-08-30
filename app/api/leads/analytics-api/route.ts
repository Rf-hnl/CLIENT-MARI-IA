import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

export async function GET(request: NextRequest) {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['analytics:read'],
      rateLimitConfig: {
        maxRequests: 200, // 200 analytics calls per hour
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;

    // Get tenantId and organizationId from query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required as query parameters' },
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

    console.log('📊 [LEADS-ANALYTICS-API] Getting advanced analytics for:', { tenantId, organizationId });

    try {
      // Get advanced analytics from database filtered by organization
      const whereClause = { organizationId, tenantId };
      
      // Basic counts
      const totalLeads = await prisma.lead.count({ where: whereClause });
      const newLeads = await prisma.lead.count({ where: { ...whereClause, status: 'new' } });
      const interestedLeads = await prisma.lead.count({ where: { ...whereClause, status: 'interested' } });
      const qualifiedLeads = await prisma.lead.count({ where: { ...whereClause, status: 'qualified' } });
      const followUpLeads = await prisma.lead.count({ where: { ...whereClause, status: 'follow_up' } });
      const wonLeads = await prisma.lead.count({ where: { ...whereClause, status: 'won' } });
      const lostLeads = await prisma.lead.count({ where: { ...whereClause, status: 'lost' } });

      // Advanced analytics
      const highPriorityLeads = await prisma.lead.count({ 
        where: { ...whereClause, priority: 'high' } 
      });
      
      const qualifiedTrueLeads = await prisma.lead.count({ 
        where: { ...whereClause, isQualified: true } 
      });

      const convertedLeads = await prisma.lead.count({ 
        where: { ...whereClause, convertedToClient: true } 
      });

      // Source breakdown
      const sources = await prisma.lead.groupBy({
        by: ['source'],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      // Priority breakdown  
      const priorities = await prisma.lead.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      // Recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLeads = await prisma.lead.count({
        where: {
          ...whereClause,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Conversion rates
      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : '0';
      const qualificationRate = totalLeads > 0 ? ((qualifiedTrueLeads / totalLeads) * 100).toFixed(2) : '0';

      // Build comprehensive analytics response
      const analytics = {
        overview: {
          totalLeads,
          recentLeads: recentLeads,
          conversionRate: parseFloat(conversionRate),
          qualificationRate: parseFloat(qualificationRate),
        },
        statusDistribution: {
          new: newLeads,
          interested: interestedLeads,
          qualified: qualifiedLeads,
          follow_up: followUpLeads,
          won: wonLeads,
          lost: lostLeads,
        },
        priorityDistribution: priorities.reduce((acc: any, item: any) => {
          acc[item.priority] = item._count.id;
          return acc;
        }, {}),
        sourceDistribution: sources.reduce((acc: any, item: any) => {
          acc[item.source || 'unknown'] = item._count.id;
          return acc;
        }, {}),
        metrics: {
          highPriorityLeads,
          qualifiedLeads: qualifiedTrueLeads,
          convertedLeads,
          totalLeads,
        },
        performance: {
          last30Days: recentLeads,
          conversionRate: parseFloat(conversionRate),
          qualificationRate: parseFloat(qualificationRate),
        }
      };

      console.log('✅ [LEADS-ANALYTICS-API] Advanced analytics calculated successfully');

      return NextResponse.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString(),
        apiKeyId: apiKey.id
      });

    } catch (dbError) {
      console.error('❌ [LEADS-ANALYTICS-API] Database error:', dbError);
      
      // Fallback analytics if database query fails
      const fallbackAnalytics = {
        overview: {
          totalLeads: 0,
          recentLeads: 0,
          conversionRate: 0,
          qualificationRate: 0,
        },
        statusDistribution: {
          new: 0, interested: 0, qualified: 0, follow_up: 0, won: 0, lost: 0
        },
        priorityDistribution: {
          low: 0, medium: 0, high: 0, urgent: 0
        },
        sourceDistribution: {},
        metrics: {
          highPriorityLeads: 0,
          qualifiedLeads: 0,
          convertedLeads: 0,
          totalLeads: 0,
        },
        performance: {
          last30Days: 0,
          conversionRate: 0,
          qualificationRate: 0,
        }
      };

      return NextResponse.json({
        success: true,
        data: fallbackAnalytics,
        timestamp: new Date().toISOString(),
        note: 'Using fallback data due to database connection issue'
      });
    }

  } catch (error) {
    console.error('❌ [LEADS-ANALYTICS-API] Error getting analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Error fetching leads analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}