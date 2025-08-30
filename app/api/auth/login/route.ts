import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, password, tenantIdentifier } = await request.json();

    if (!email || !password || !tenantIdentifier) {
      return NextResponse.json(
        { error: 'Email, password, and tenant identifier are required' },
        { status: 400 }
      );
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: {
        slug: tenantIdentifier,
      },
      include: {
        organizations: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ 
        error: 'Organización no encontrada. Verifica el identificador de tu empresa.' 
      }, { status: 404 });
    }

    // Find the user by email - simplified since user schema doesn't have organization relation
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'El usuario no existe. Verifica tu email.' },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta. Inténtalo de nuevo.' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );
    const token = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      tenantId: tenant.id, // Using tenant from the lookup
      organizationId: tenant.organizations[0]?.id || '', // Using first organization
      roles: ['USER'], // Default role since roles relation doesn't exist
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    console.log('🎫 JWT Token created for login:', user.email);
    console.log('🎫 Token preview:', token.substring(0, 30) + '...');

    const response = NextResponse.json(
      { 
        message: 'Login successful',
        token: token // Send token to client for localStorage
      },
      { status: 200 }
    );

    // Still set cookie for middleware compatibility
    response.cookies.set('auth_token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;

  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
