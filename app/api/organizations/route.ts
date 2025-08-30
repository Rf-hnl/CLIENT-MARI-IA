import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// GET - Obtener todas las organizaciones de un tenant
export async function GET(request: NextRequest) {
  try {
    console.log('🏢 [ORGANIZATIONS API] Getting all organizations for a tenant...');

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
        tenantId: payload.tenantId as string
      };
    } catch (error) {
      console.error('🚨 [ORGANIZATIONS API] JWT verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Token verification failed or tenantId missing' }, { status: 401 });
    }

    // Buscar todas las organizaciones para el tenantId del usuario
    const organizations = await prisma.organization.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`✅ [ORGANIZATIONS API] Found ${organizations.length} organizations for tenant ${user.tenantId}`);
    return NextResponse.json({ success: true, organizations });

  } catch (error) {
    console.error('💥 [ORGANIZATIONS API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
