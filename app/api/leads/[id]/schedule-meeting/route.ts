'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

/**
 * POST - Agendar una nueva reunión para un lead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id;
    console.log(`🗓️ [SCHEDULE MEETING] Attempting to schedule for lead: ${leadId}`);

    // 1. Autenticación y obtención de userId
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-debugging-only');
    
    let userId: string;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      userId = payload.userId as string;
      if (!userId) throw new Error('User ID not found in token');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // 2. Validar Body de la petición
    const body = await request.json();
    const { 
      title, 
      description, 
      startTime, 
      endTime, 
      automated, 
      sentimentTrigger, 
      followUpType 
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Title, startTime, and endTime are required' }, { status: 400 });
    }

    // 3. Verificar que el lead existe y pertenece al usuario/tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { organization: true } } }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Asumimos que el lead debe pertenecer a una de las organizaciones del usuario
    const lead = await prisma.lead.findFirst({
        where: {
            id: leadId,
            organizationId: { in: user.memberships.map(m => m.organizationId) }
        }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found or access denied' }, { status: 404 });
    }

    // 4. Crear el evento en el calendario
    const newEvent = await prisma.leadCalendarEvent.create({
      data: {
        leadId,
        userId,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        automated: automated || false,
        sentimentTrigger,
        followUpType: followUpType || 'meeting',
        status: 'scheduled',
        // Otros campos podrían añadirse aquí
      }
    });

    console.log(`✅ [SCHEDULE MEETING] Event created successfully: ${newEvent.id} for lead ${leadId}`);

    // 5. (Opcional) Actualizar el estado del lead
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'contacted', // o 'meeting_scheduled' si existe
        lastContactDate: new Date(),
        nextFollowUpDate: new Date(startTime),
      }
    });

    console.log(`🔄 [SCHEDULE MEETING] Lead status updated for: ${leadId}`);

    return NextResponse.json({ success: true, event: newEvent });

  } catch (error) {
    console.error('💥 [SCHEDULE MEETING] Error creating calendar event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}
