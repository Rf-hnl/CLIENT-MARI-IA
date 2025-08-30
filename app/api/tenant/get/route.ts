import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

export async function GET(request: NextRequest) {
  try {
    console.log('🏢 [TENANT GET] Fetching tenant information...');

    // 1. Autenticación JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('❌ [TENANT GET] No authorization header');
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
        email: payload.email as string
      };
    } catch (error) {
      console.log('❌ [TENANT GET] Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    console.log('👤 [TENANT GET] User authenticated:', user.email);

    // 2. Buscar tenant del usuario (método simple sin JWT adicional)
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id },
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
      console.log('❌ [TENANT GET] Tenant not found for user:', user.id);
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Buscar organización del tenant
    const organization = await prisma.organization.findFirst({
      where: { 
        tenantId: tenant.id,
        ownerId: user.id 
      }
    });

    if (!organization) {
      console.log('❌ [TENANT GET] Organization not found for tenant:', tenant.id);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('✅ [TENANT GET] Data loaded:', {
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
    console.error('💥 [TENANT GET] Internal error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}