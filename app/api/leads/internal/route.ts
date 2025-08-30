import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener leads (con campaña asociada)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const organizationId = searchParams.get('organizationId');
    if (!tenantId || !organizationId) {
      return NextResponse.json({ success: false, error: 'tenantId and organizationId are required' }, { status: 400 });
    }
    const leads = await prisma.lead.findMany({
      where: { tenantId, organizationId },
      include: { campaign: true }
    });
    return NextResponse.json({ success: true, data: { leads } });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Actualizar campaña de un lead
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, campaignId } = body;
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }
    // Validar que la campaña exista si se envía campaignId
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign) {
        return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
      }
    }
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { campaignId: campaignId || null }
    });
    return NextResponse.json({ success: true, data: { lead: updatedLead } });
  } catch (error) {
    console.error('Error updating lead campaign:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
