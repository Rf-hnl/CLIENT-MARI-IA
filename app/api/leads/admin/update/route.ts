import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiAuthMiddleware, validateTenantAccess } from '@/lib/auth/api-middleware';

export async function PUT(request: NextRequest) {
  try {
    // Apply security middleware
    const authResult = await apiAuthMiddleware(request, {
      requireAuth: true,
      requiredPermissions: ['leads:update'],
      rateLimitConfig: {
        maxRequests: 150, // 150 updates per hour
        windowMs: 60 * 60 * 1000
      },
      allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
      requireTenantValidation: true
    });

    if (authResult.response) {
      return authResult.response; // Return error response if auth failed
    }

    const apiKey = authResult.apiKey!;
    const { tenantId, organizationId, leadId, updates } = await request.json();

    if (!tenantId || !organizationId || !leadId || !updates) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, leadId, and updates are required' },
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

    // Validate campaignId if being updated
    if (updates.campaignId || updates.campaign_id) {
      const campaignId = updates.campaignId || updates.campaign_id;
      if (campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: {
            id: campaignId,
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
    }

    // Field mapping from snake_case (frontend) to camelCase (Prisma schema)
    const fieldMapping: Record<string, string> = {
      'qualification_score': 'qualificationScore',
      'is_qualified': 'isQualified',
      'contact_attempts': 'contactAttempts',
      'response_rate': 'responseRate',
      'converted_to_client': 'convertedToClient',
      'client_id': 'clientId',
      'conversion_date': 'conversionDate',
      'conversion_value': 'conversionValue',
      'last_contact_date': 'lastContactDate',
      'next_follow_up_date': 'nextFollowUpDate',
      'qualification_notes': 'qualificationNotes',
      'internal_notes': 'internalNotes',
      'assigned_agent_id': 'assignedAgentId',
      'assigned_agent_name': 'assignedAgentName',
      'ai_score': 'aiScore',
      'ai_score_breakdown': 'aiScoreBreakdown',
      'ai_score_factors': 'aiScoreFactors',
      'ai_score_updated_at': 'aiScoreUpdatedAt',
      'interest_level': 'interestLevel',
      'budget_range': 'budgetRange',
      'decision_timeline': 'decisionTimeline',
      'best_contact_time': 'bestContactTime',
      'preferred_contact_method': 'preferredContactMethod',
      // NEW: Campaign relationship mapping
      'campaign_id': 'campaignId'
    };

    // Clean updates object - remove Firebase timestamp objects, convert to Date, and map field names
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      // Map field name from snake_case to camelCase
      const mappedKey = fieldMapping[key] || key;
      
      // Convert Firebase timestamp objects to Date
      if (value && typeof value === 'object' && '_seconds' in value) {
        cleanUpdates[mappedKey] = new Date(value._seconds * 1000);
      } else {
        cleanUpdates[mappedKey] = value;
      }
    });

    // Update lead in PostgreSQL via Prisma
    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId,
        tenantId,
        organizationId
      },
      data: cleanUpdates
    });

    return NextResponse.json({
      success: true,
      data: updatedLead
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}