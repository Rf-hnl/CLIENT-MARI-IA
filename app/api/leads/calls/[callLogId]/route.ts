import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// PATCH - Actualizar el resultado de una llamada
export async function PATCH(
  request: NextRequest,
  { params }: { params: { callLogId: string } }
) {
  try {
    console.log('📞 [CALL LOG API] Updating call log:', params.callLogId);

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
      console.error('🚨 [CALL LOG API] JWT verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();

    // TODO: Implementar cuando se cree el modelo de CallLog en Prisma
    // Por ahora, simular la actualización
    const updatedCallLog = {
      id: params.callLogId,
      timestamp: new Date(),
      ...body
    };

    console.log('✅ [CALL LOG API] Call log updated:', updatedCallLog.id);
    return NextResponse.json({ success: true, data: updatedCallLog });

  } catch (error) {
    console.error('💥 [CALL LOG API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}