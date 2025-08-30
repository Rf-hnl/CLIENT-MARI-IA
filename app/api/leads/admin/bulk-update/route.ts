import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { uid, organizationId, tenantId, leadIds, updates } = await request.json();

    if (!uid || !organizationId || !tenantId || !leadIds || !Array.isArray(leadIds) || !updates) {
      return NextResponse.json(
        { success: false, error: 'uid, organizationId, tenantId, leadIds array, and updates are required' },
        { status: 400 }
      );
    }

    const results = [];

    // Update each lead
    for (const leadId of leadIds) {
      try {
        const updatedLead = await prisma.lead.update({
          where: {
            id: leadId,
            tenantId,
            organizationId
          },
          data: updates
        });
        results.push({ leadId, success: true, data: updatedLead });
      } catch (error) {
        console.error(`Error updating lead ${leadId}:`, error);
        results.push({ 
          leadId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      summary: {
        successful: successCount,
        failed: leadIds.length - successCount,
        total: leadIds.length
      },
      results
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}