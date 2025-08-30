import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvitationStatus, Role } from '@prisma/client';
import * as jose from 'jose';

// Helper function to get user from JWT token
async function getUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('❌ Error verifying token:', error);
    return null;
  }
}

// GET /api/invitations/:token - Get invitation details
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return NextResponse.json({ 
        error: 'La invitación ya no es válida',
        status: invitation.status 
      }, { status: 400 });
    }

    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      // Mark as expired
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED }
      });

      return NextResponse.json({ error: 'La invitación ha expirado' }, { status: 400 });
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      organization: invitation.organization,
      invitedBy: invitation.invitedByUser,
      expiresAt: invitation.expiresAt
    });

  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json({ error: 'Error al obtener la invitación' }, { status: 500 });
  }
}

// POST /api/invitations/:token/accept - Accept invitation
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Get current user from token
  const userPayload = await getUserFromRequest(req);
  if (!userPayload || !userPayload.userId) {
    return NextResponse.json({ error: 'No autorizado. Por favor inicia sesión primero.' }, { status: 401 });
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get invitation
      const invitation = await tx.invitation.findUnique({
        where: { token },
        include: {
          organization: true
        }
      });

      if (!invitation) {
        throw new Error('Invitación no encontrada');
      }

      if (invitation.status !== InvitationStatus.PENDING) {
        throw new Error(`La invitación ya no es válida. Estado: ${invitation.status}`);
      }

      if (invitation.expiresAt && new Date() > invitation.expiresAt) {
        // Mark as expired
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.EXPIRED }
        });
        throw new Error('La invitación ha expirado');
      }

      // Get user details
      const user = await tx.user.findUnique({
        where: { id: userPayload.userId as string }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verify email matches (optional - you might want to allow different emails)
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        throw new Error(`Esta invitación es para ${invitation.email} pero tu cuenta es ${user.email}. Por razones de seguridad, solo el usuario correcto puede aceptar la invitación.`);
      }

      // Check if user is already a member
      const existingMember = await tx.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: invitation.organizationId
          }
        }
      });

      if (existingMember) {
        // Mark invitation as accepted even if already member
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { 
            status: InvitationStatus.ACCEPTED,
            acceptedAt: new Date()
          }
        });
        throw new Error('Ya eres miembro de esta organización');
      }

      // Add user to organization
      const newMember = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          joinedAt: new Date()
        }
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { 
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date()
        }
      });

      return {
        member: newMember,
        organization: invitation.organization,
        role: invitation.role
      };
    });

    return NextResponse.json({
      message: '¡Invitación aceptada exitosamente!',
      organization: result.organization,
      role: result.role
    });

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ 
      error: error.message || 'Error al aceptar la invitación' 
    }, { status: 400 });
  }
}