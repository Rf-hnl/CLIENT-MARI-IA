import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
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
      user = { id: payload.userId as string, email: payload.email as string };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    console.log('🔍 [AUTH-CONTEXT] Getting context for user:', user.email);

    // Get user profile from database
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get user's tenant (first tenant where user is owner)
    const tenant = await prisma.tenant.findFirst({
      where: { ownerId: user.id }
    });

    // Get user's organization (first organization in their tenant)
    const organization = tenant ? await prisma.organization.findFirst({
      where: { 
        tenantId: tenant.id,
        ownerId: user.id 
      }
    }) : null;

    console.log('✅ [AUTH-CONTEXT] Context loaded:', {
      userId: userProfile.id,
      tenantId: tenant?.id,
      organizationId: organization?.id
    });

    return NextResponse.json({
      success: true,
      user: userProfile,
      tenant: tenant || null,
      organization: organization || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [AUTH-CONTEXT] Error getting context:', error);
    return NextResponse.json({
      error: 'Error getting user context',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}