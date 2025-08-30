import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { 
      tenantId, 
      organizationId, 
      leadId, 
      conversionValue, 
      createClientRecord, 
      clientData, 
      notes 
    } = await request.json();

    if (!tenantId || !organizationId || !leadId) {
      return NextResponse.json(
        { success: false, error: 'tenantId, organizationId, and leadId are required' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the lead to convert
      const lead = await tx.lead.findUnique({
        where: { id: leadId }
      });

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Update lead as converted
      const updatedLead = await tx.lead.update({
        where: {
          id: leadId,
          tenantId,
          organizationId
        },
        data: {
          status: 'won',
          // Note: These fields don't exist in current schema but are expected by frontend
          // We'll store them in aiAnalysis JSON field for now
          aiAnalysis: {
            ...((lead.aiAnalysis as any) || {}),
            converted_to_client: true,
            conversion_value: conversionValue,
            conversion_date: new Date().toISOString(),
            conversion_notes: notes
          }
        }
      });

      let newClientId = null;

      // Create client record if requested
      if (createClientRecord && clientData) {
        const newClient = await tx.client.create({
          data: {
            tenantId,
            organizationId,
            name: clientData.name || lead.name || 'Unnamed Client',
            email: clientData.email || lead.email,
            phone: clientData.phone || lead.phone,
            company: clientData.company || lead.company,
            notes: `Converted from lead: ${lead.name || lead.id}${notes ? ` - ${notes}` : ''}`,
            status: 'active'
          }
        });
        newClientId = newClient.id;
      }

      return { lead: updatedLead, clientId: newClientId };
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error converting lead:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}