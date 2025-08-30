import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const { tenantId, organizationId, leadId, status, notes } = await request.json();

    if (!tenantId || !organizationId || !leadId || !status) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, leadId, and status are required' },
        { status: 400 }
      );
    }

    // Get current lead to track status change
    const currentLead = await prisma.lead.findUnique({
      where: {
        id: leadId
      }
    });

    if (!currentLead) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update lead status
    const updatedLead = await prisma.lead.update({
      where: {
        id: leadId,
        tenantId,
        organizationId
      },
      data: {
        status,
        ...(notes && { notes })
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedLead,
      statusChange: {
        from: currentLead.status,
        to: status
      }
    });

  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}