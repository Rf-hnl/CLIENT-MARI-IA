import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import * as jose from 'jose';

// GET - Obtener información de la organización del usuario
export async function GET(request: NextRequest) {
  try {
    console.log('🏢 [ORGANIZATION API] Getting organization info...');

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
      console.error('🚨 [ORGANIZATION API] JWT verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    // Validar que los registros existen
    const [tenant, organization] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: user.tenantId } }),
      prisma.organization.findUnique({ where: { id: user.organizationId } })
    ]);

    console.log('✅ [DEBUG] Records found:', {
      tenant: tenant ? tenant.name : 'NOT FOUND',
      organization: organization ? organization.name : 'NOT FOUND'
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('✅ [ORGANIZATION API] Organization found:', organization.id);
    return NextResponse.json({ success: true, organization });

  } catch (error) {
    console.error('💥 [ORGANIZATION API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Actualizar información de la organización
export async function PUT(request: NextRequest) {
  try {
    console.log('🏢 [ORGANIZATION API] Updating organization info...');

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
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    // Parsear body
    const body = await request.json();
    console.log('📦 [ORGANIZATION API] Update data received');

    // Validar que los registros existen
    const [tenant, organization] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: user.tenantId } }),
      prisma.organization.findUnique({ where: { id: user.organizationId } })
    ]);

    if (!tenant || !organization) {
      return NextResponse.json({ error: 'Tenant or organization not found' }, { status: 404 });
    }

    // Validar que la organización a actualizar es la correcta
    if (body.id && body.id !== user.organizationId) {
      return NextResponse.json({ error: 'Organization access denied' }, { status: 403 });
    }

    // Preparar datos para actualizar
    const updateData: any = {};
    const allowedFields = [
      'name', 'description', 'tagline', 'industry', 'website', 'email', 'phone',
      'address', 'city', 'country', 'logo', 'services', 'companyValues',
      'salesPitch', 'targetAudience', 'timezone'
    ];
    const nullableFields = [
      'description', 'tagline', 'industry', 'website', 'email', 'phone',
      'address', 'city', 'country', 'logo', 'companyValues',
      'salesPitch', 'targetAudience', 'timezone'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (nullableFields.includes(field) && body[field] === '') {
          updateData[field] = null;
        } else {
          updateData[field] = body[field];
        }
      }
    }
    updateData.updatedAt = new Date();

    // Actualizar organización usando el ID del JWT
    const updatedOrganization = await prisma.organization.update({
      where: { id: user.organizationId },
      data: updateData
    });

    console.log('✅ [ORGANIZATION API] Organization updated:', updatedOrganization.id);
    
    return NextResponse.json({ 
      success: true, 
      organization: updatedOrganization,
      message: 'Organización actualizada exitosamente'
    });

  } catch (error) {
    console.error('💥 [ORGANIZATION API] Update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Crear nueva organización manualmente
export async function POST(request: NextRequest) {
  try {
    console.log('🏢 [ORGANIZATION API] Creating new organization...');

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
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    // Parsear body
    const body = await request.json();
    console.log('📦 [ORGANIZATION API] Create data received');

    // Validar que el tenant del usuario existe
    const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found for current user' }, { status: 404 });
    }

    // Crear nueva organización en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const newOrganization = await tx.organization.create({
        data: {
          name: body.name || `Nueva Organización de ${user.email?.split('@')[0] || 'Usuario'}`,
          description: body.description || 'Descripción de la nueva organización',
          tenantId: user.tenantId, // Asociar al tenant del usuario
          ownerId: user.id,        // El usuario que la crea es el dueño
          industry: body.industry || null,
          website: body.website || null,
          phone: body.phone || null,
          email: body.email || null,
          timezone: body.timezone || 'UTC',
        }
      });

      // Crear membresía automáticamente para el owner
      const organizationMembership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: newOrganization.id,
          role: Role.OWNER
        }
      });

      return { newOrganization, organizationMembership };
    });

    console.log('✅ [ORGANIZATION API] New organization created:', result.newOrganization.id);
    
    return NextResponse.json({ 
      success: true, 
      organization: result.newOrganization,
      message: 'Organización creada exitosamente'
    });

  } catch (error) {
    console.error('💥 [ORGANIZATION API] Create error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}