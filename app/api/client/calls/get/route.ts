import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [CLIENT CALLS GET] Fetching call history...');

    // 1. Autenticación y autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [CLIENT CALLS GET] No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { id: payload.userId as string, email: payload.email as string };
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    // 2. Parsear request
    const body = await request.json();
    const { clientId, tenantId, organizationId } = body;

    console.log('📦 [CLIENT CALLS GET] Request body:', { clientId, tenantId, organizationId });

    if (!clientId || !tenantId || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Verificar que el tenant existe y pertenece al usuario
    const tenant = await prisma.tenant.findFirst({
      where: { 
        id: tenantId,
        ownerId: user.id 
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found or access denied' }, { status: 404 });
    }

    // 4. Buscar el cliente
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId: tenantId,
        organizationId: organizationId
      }
    });

    if (!client) {
      console.log('❌ [CLIENT CALLS GET] Client not found:', clientId);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log('✅ [CLIENT CALLS GET] Client found:', { id: client.id, name: client.name, email: client.email });

    // 5. Buscar leads asociados al cliente (por email)
    const associatedLeads = await prisma.lead.findMany({
      where: {
        email: client.email,
        tenantId: tenantId,
        organizationId: organizationId
      },
      select: { id: true }
    });

    const leadIds = associatedLeads.map(lead => lead.id);
    console.log('📋 [CLIENT CALLS GET] Associated lead IDs:', leadIds);

    // 6. Si no hay leads asociados, retornar lista vacía
    if (leadIds.length === 0) {
      console.log('📝 [CLIENT CALLS GET] No associated leads found, returning empty call history');
      return NextResponse.json({
        success: true,
        data: []
      });
    }

    // 7. Buscar call logs de todos los leads asociados
    const callLogs = await prisma.leadCallLog.findMany({
      where: {
        leadId: { in: leadIds },
        tenantId: tenantId,
        organizationId: organizationId
      },
      include: {
        lead: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📞 [CLIENT CALLS GET] Found call logs:', callLogs.length);

    // 8. Formatear los call logs para el formato esperado por el frontend
    const formattedCallLogs = callLogs.map(log => ({
      id: log.id,
      clientId: clientId, // Mapear al clientId para compatibilidad
      leadId: log.leadId,
      timestamp: {
        _seconds: Math.floor(log.createdAt.getTime() / 1000),
        _nanoseconds: 0
      },
      callType: log.callType,
      durationMinutes: 0, // Será actualizado cuando ElevenLabs proporcione la duración
      agentId: log.agentId,
      agentName: log.agentName,
      outcome: log.status, // Mapear status a outcome
      notes: log.notes,
      elevenLabsBatchId: log.elevenLabsBatchId,
      elevenLabsJobId: log.elevenLabsJobId,
      conversationId: log.conversationId,
      transcriptionStatus: log.transcriptionStatus || 'pending',
      createdAt: log.createdAt,
      updatedAt: log.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: formattedCallLogs
    });

  } catch (error) {
    console.error('💥 [CLIENT CALLS GET] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}