import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as jose from 'jose';

// PUT - Establecer la organización activa para un usuario y devolver un nuevo token
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 [SET ACTIVE ORG] Request to switch organization...');

    // 1. Autenticación y obtención del contexto del usuario actual
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-for-debugging-only');

    let currentUserClaims;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      currentUserClaims = payload;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { userId, tenantId } = currentUserClaims;

    if (!userId || !tenantId) {
      return NextResponse.json({ error: 'Invalid token claims' }, { status: 401 });
    }

    // 2. Obtener la nueva ID de organización del cuerpo de la solicitud
    const body = await request.json();
    const { newOrganizationId } = body;

    if (!newOrganizationId) {
      return NextResponse.json({ error: 'newOrganizationId is required' }, { status: 400 });
    }

    // 3. Verificar que la nueva organización existe y pertenece al tenant del usuario
    const targetOrganization = await prisma.organization.findFirst({
      where: {
        id: newOrganizationId,
        tenantId: tenantId as string,
      },
    });

    if (!targetOrganization) {
      return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 404 });
    }

    // 4. Generar un nuevo token JWT con la organizationId actualizada
    // Usamos los claims del token anterior y solo sobreescribimos organizationId
    const newClaims = { ...currentUserClaims, organizationId: newOrganizationId };

    const newJwt = await new jose.SignJWT(newClaims)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // La misma expiración que el token original
      .sign(secret);

    console.log(`✅ [SET ACTIVE ORG] User ${userId} switched to organization ${newOrganizationId}`);

    // 5. Devolver el nuevo token
    return NextResponse.json({
      success: true,
      message: 'Organización activa actualizada. Utiliza el nuevo token para futuras solicitudes.',
      newAuthToken: newJwt,
    });

  } catch (error) {
    console.error('💥 [SET ACTIVE ORG] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
