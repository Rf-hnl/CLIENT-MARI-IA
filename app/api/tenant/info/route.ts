import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 [TENANT INFO] Fetching tenant information...');

    // 1. Autenticación y autorización
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [TENANT INFO] No authorization header');
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
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    console.log('👤 [TENANT INFO] User context:', {
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      organizationId: user.organizationId
    });

    // 2. Obtener información del tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!tenant) {
      console.log('❌ [TENANT INFO] Tenant not found:', user.tenantId);
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Obtener información de la organización
    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });

    if (!organization) {
      console.log('❌ [TENANT INFO] Organization not found:', user.organizationId);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // 4. Verificar que la organización pertenece al tenant
    if (organization.tenantId !== tenant.id) {
      console.log('❌ [TENANT INFO] Organization does not belong to tenant');
      return NextResponse.json({ error: 'Organization does not belong to tenant' }, { status: 403 });
    }

    console.log('✅ [TENANT INFO] Data loaded:', {
      tenant: tenant.name,
      organization: organization.name
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        identifier: tenant.slug,
        slug: tenant.slug,
        plan: tenant.plan
      },
      organization,
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('💥 [TENANT INFO] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}