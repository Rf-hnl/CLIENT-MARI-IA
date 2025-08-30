import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const { uid, organizationId, tenantId, leadIds } = await request.json();

    if (!uid || !organizationId || !tenantId || !leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json(
        { success: false, error: 'uid, organizationId, tenantId, and leadIds array are required' },
        { status: 400 }
      );
    }

    const results = [];

    // Delete each lead
    for (const leadId of leadIds) {
      try {
        await prisma.lead.delete({
          where: {
            id: leadId,
            tenantId,
            organizationId
          }
        });
        results.push({ leadId, success: true });
      } catch (error) {
        console.error(`Error deleting lead ${leadId}:`, error);
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
      results,
      deletedCount: successCount,
      totalCount: leadIds.length
    });

  } catch (error) {
    console.error('Error in bulk delete:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}