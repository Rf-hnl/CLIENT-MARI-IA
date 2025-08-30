import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

// POST - Auto-crear organización para tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, userId, orgName } = body;

    if (!tenantId || !userId || !orgName) {
      return NextResponse.json(
        { success: false, error: 'tenantId, userId y orgName son requeridos' },
        { status: 400 }
      );
    }

    console.log(`[AUTO-CREATE ORG] Creando organización para tenant: ${tenantId}`);

    // Verificar si el tenant ya tiene una organización
    const existingOrg = await prisma.organization.findFirst({
      where: { 
        tenantId: tenantId,
        ownerId: userId
      }
    });

    if (existingOrg) {
      console.log(`[AUTO-CREATE ORG] Tenant ya tiene organización: ${existingOrg.id}`);
      return NextResponse.json({
        success: true,
        message: 'Tenant ya tiene una organización asignada',
        organization: existingOrg,
        created: false
      });
    }

    // Crear nueva organización en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: orgName,
          tenantId: tenantId,
          ownerId: userId
        }
      });

      // Crear membresía automáticamente para el owner
      const organizationMembership = await tx.organizationMember.create({
        data: {
          userId: userId,
          organizationId: organization.id,
          role: Role.OWNER
        }
      });

      return { organization, organizationMembership };
    });

    console.log(`[AUTO-CREATE ORG] Organización creada exitosamente: ${result.organization.id}`);

    return NextResponse.json({
      success: true,
      message: 'Organización creada exitosamente',
      organization: result.organization,
      created: true
    });

  } catch (error) {
    console.error('[AUTO-CREATE ORG] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}