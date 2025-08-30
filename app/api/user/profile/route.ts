import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    console.error('❌ [USER API] Error verifying token:', error);
    return null;
  }
}

// GET - Obtener perfil de usuario
export async function GET(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId as string },
      select: {
        id: true,
        email: true,
        name: true,
        profilePicture: true,
        emailVerified: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Transform to match User interface
    const userProfile = {
      id: user.id,
      email: user.email,
      displayName: user.name || user.email,
      avatarUrl: user.profilePicture,
      phone: (user.metadata as any)?.phone || null,
      emailVerified: user.emailVerified,
      role: 'USER' as const,
      lastSignIn: (user.metadata as any)?.lastSignIn ? new Date((user.metadata as any).lastSignIn) : null,
      signInCount: (user.metadata as any)?.signInCount || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({ user: userProfile });

  } catch (error) {
    console.error('❌ [USER API] Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar perfil de usuario
export async function PUT(request: Request) {
  try {
    const userPayload = await getUserFromRequest(request);
    if (!userPayload || !userPayload.userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { displayName, avatarUrl, phone, currentPassword, newPassword } = body;

    // Get current user for password verification if needed
    let user = null;
    if (newPassword && currentPassword) {
      user = await prisma.user.findUnique({
        where: { id: userPayload.userId as string },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Contraseña actual incorrecta' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (displayName !== undefined) {
      updateData.name = displayName;
    }

    if (avatarUrl !== undefined) {
      updateData.profilePicture = avatarUrl;
    }

    if (newPassword && currentPassword && user) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.hashedPassword = hashedPassword;
    }

    // Update metadata if phone is provided
    if (phone !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userPayload.userId as string },
        select: { metadata: true },
      });

      const currentMetadata = (currentUser?.metadata as any) || {};
      updateData.metadata = {
        ...currentMetadata,
        phone,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userPayload.userId as string },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        profilePicture: true,
        emailVerified: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform to match User interface
    const userProfile = {
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.name || updatedUser.email,
      avatarUrl: updatedUser.profilePicture,
      phone: (updatedUser.metadata as any)?.phone || null,
      emailVerified: updatedUser.emailVerified,
      role: 'USER' as const,
      lastSignIn: (updatedUser.metadata as any)?.lastSignIn ? new Date((updatedUser.metadata as any).lastSignIn) : null,
      signInCount: (updatedUser.metadata as any)?.signInCount || 0,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: userProfile,
    });

  } catch (error) {
    console.error('❌ [USER API] Error updating profile:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}