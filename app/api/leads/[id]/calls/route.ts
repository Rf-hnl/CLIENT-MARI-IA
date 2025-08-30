import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// GET - Obtener todas las llamadas de un lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📞 [LEAD CALLS API] Getting calls for lead:', params.id);

    // Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { 
        id: payload.userId as string, 
        email: payload.email as string,
        tenantId: payload.tenantId as string,
        organizationId: payload.organizationId as string
      };
    } catch (error) {
      console.error('🚨 [LEAD CALLS API] JWT verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Validar que el lead existe y pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        organizationId: user.organizationId
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Obtener las llamadas del lead (por ahora devolvemos array vacío ya que no existe la tabla aún)
    // TODO: Implementar cuando se cree el modelo de CallLog en Prisma
    const callLogs = [];

    console.log('✅ [LEAD CALLS API] Retrieved calls:', callLogs.length);
    return NextResponse.json({ success: true, data: callLogs });

  } catch (error) {
    console.error('💥 [LEAD CALLS API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Crear un nuevo registro de llamada
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📞 [LEAD CALLS API] Creating call log for lead:', params.id);

    // Autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { 
        id: payload.userId as string, 
        email: payload.email as string,
        tenantId: payload.tenantId as string,
        organizationId: payload.organizationId as string
      };
    } catch (error) {
      console.error('🚨 [LEAD CALLS API] JWT verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Validar que el lead existe y pertenece al tenant
    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        organizationId: user.organizationId
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();

    // TODO: Implementar cuando se cree el modelo de CallLog en Prisma
    // Por ahora, simular la creación
    const newCallLog = {
      id: `call_${params.id}_${Date.now()}`,
      leadId: params.id,
      timestamp: new Date(),
      ...body
    };

    console.log('✅ [LEAD CALLS API] Call log created:', newCallLog.id);
    return NextResponse.json({ success: true, data: newCallLog });

  } catch (error) {
    console.error('💥 [LEAD CALLS API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}