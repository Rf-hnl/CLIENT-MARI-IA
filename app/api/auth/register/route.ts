import { NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const prisma = new PrismaClient();
const saltRounds = 10;

// Function to generate a unique tenant identifier from name
function generateTenantIdentifier(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

export async function POST(request: Request) {
  try {
    const {
      tenantName,
      userEmail,
      password,
      userName,
    } = await request.json();

    if (!tenantName || !userEmail || !password || !userName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'User with this email already exists',
          errorType: 'EMAIL_EXISTS',
          suggestion: 'Try logging in instead'
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate tenant identifier
    const baseIdentifier = generateTenantIdentifier(tenantName);
    
    const result = await prisma.$transaction(async (tx) => {
      // Check if identifier already exists and make it unique
      let identifier = baseIdentifier;
      let counter = 1;
      
      while (await tx.tenant.findUnique({ where: { slug: identifier } })) {
        identifier = `${baseIdentifier}-${counter}`;
        counter++;
      }

      // Create user first since it's needed for tenant owner
      const newUser = await tx.user.create({
        data: {
          email: userEmail,
          hashedPassword: hashedPassword, // Using correct field name
          name: userName, // Using correct field name
        },
      });

      // Create tenant with the user as owner
      const newTenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: identifier, // Using actual DB field after reset
          ownerId: newUser.id, // Set owner immediately
        },
      });

      // Create organization with the user as owner
      const newOrganization = await tx.organization.create({
        data: {
          name: tenantName, // Default org name is the same as tenant name
          tenantId: newTenant.id,
          ownerId: newUser.id, // Set owner immediately
        },
      });

      // Create organization membership for the owner
      const organizationMembership = await tx.organizationMember.create({
        data: {
          userId: newUser.id,
          organizationId: newOrganization.id,
          role: Role.OWNER
        }
      });

      return { newUser, newTenant, newOrganization, organizationMembership };
    });

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );
    const token = await new jose.SignJWT({
      userId: result.newUser.id,
      email: result.newUser.email,
      tenantId: result.newTenant.id,
      organizationId: result.newOrganization.id,
      roles: ['TENANT_ADMIN'], // Directly assign role name for token payload
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret);

    console.log('🎫 JWT Token created for user:', result.newUser.email);
    console.log('🎫 Token preview:', token.substring(0, 30) + '...');

    const response = NextResponse.json(
      { 
        message: 'User and tenant created successfully',
        tenantIdentifier: result.newTenant.slug, // Using actual DB field after reset
        userName: result.newUser.name,
        userEmail: result.newUser.email,
        token: token // Send token to client for localStorage
      },
      { status: 201 }
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
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
