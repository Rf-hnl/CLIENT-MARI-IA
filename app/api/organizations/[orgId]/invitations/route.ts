import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assuming prisma client is available at this path
import { Role, InvitationStatus } from '@prisma/client'; // Import enums
import * as jose from 'jose';

// Helper function to generate a secure random token
function generateToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') // convert to hexadecimal format
    .slice(0, length); // return required number of characters
}

// Helper function to get base URL from request
function getBaseUrlFromRequest(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

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

// POST /api/orgs/:orgId/invitations
export async function POST(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const { email, role, expiresAt } = await req.json();

  // Get current user from token
  const userPayload = await getUserFromRequest(req);
  if (!userPayload || !userPayload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Basic validation
  if (!email || !role || !expiresAt) {
    return NextResponse.json({ error: 'Missing required fields: email, role, expiresAt' }, { status: 400 });
  }

  if (!Object.values(Role).includes(role as Role)) {
    return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
  }

  try {
    // Check if the organization exists and user is a member with proper permissions
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        members: {
          include: { user: true }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is a member with permission to invite OR is the organization owner
    const currentUserMember = organization.members.find(m => m.userId === userPayload.userId);
    const isOwner = organization.ownerId === userPayload.userId;
    
    if (!isOwner && (!currentUserMember || (currentUserMember.role !== Role.OWNER && currentUserMember.role !== Role.ADMIN))) {
      return NextResponse.json({ error: 'Insufficient permissions to invite users' }, { status: 403 });
    }

    // Check for existing pending invitations for the same email and organization
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        organizationId: orgId,
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'An invitation for this email already exists and is pending.' }, { status: 409 });
    }

    // Check if user is already a member
    const existingMember = organization.members.find(m => m.user.email?.toLowerCase() === email.toLowerCase());
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 });
    }

    // Generate a unique token
    const token = generateToken(48);
    const invitationTokenExpiry = new Date(expiresAt);

    const newInvitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        organizationId: orgId,
        role: role as Role,
        status: InvitationStatus.PENDING,
        expiresAt: invitationTokenExpiry,
        token: token,
        invitedByUserId: userPayload.userId as string,
      },
    });

    // Create invitation link using current request domain
    const baseUrl = getBaseUrlFromRequest(req);
    const invitationLink = `${baseUrl}/invite/${token}`;

    return NextResponse.json({
      ...newInvitation,
      invitationLink,
      message: 'Invitation created successfully. Share the link with the invitee.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}

// GET /api/orgs/:orgId/invitations
export async function GET(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;

  // Get current user from token
  const userPayload = await getUserFromRequest(req);
  if (!userPayload || !userPayload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if the organization exists and user has permissions
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: userPayload.userId as string },
          select: { role: true }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is a member with permissions to view invitations OR is the organization owner
    const currentUserMember = organization.members[0];
    const isOwner = organization.ownerId === userPayload.userId;
    
    if (!isOwner && (!currentUserMember || (currentUserMember.role !== Role.OWNER && currentUserMember.role !== Role.ADMIN))) {
      return NextResponse.json({ error: 'Insufficient permissions to view invitations' }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        organizationId: orgId,
        status: InvitationStatus.PENDING,
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        token: true,
        invitedByUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });

    return NextResponse.json(invitations);

  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}

// DELETE /api/orgs/:orgId/invitations/:invitationId
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = await params;
  const invitationId = req.nextUrl.searchParams.get('invitationId');

  // Get current user from token
  const userPayload = await getUserFromRequest(req);
  if (!userPayload || !userPayload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!invitationId) {
    return NextResponse.json({ error: 'Missing invitationId query parameter' }, { status: 400 });
  }

  try {
    // Check if the organization exists and user has permissions
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        ownerId: true,
        members: {
          where: { userId: userPayload.userId as string },
          select: { role: true }
        }
      }
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user is a member with permissions to cancel invitations OR is the organization owner
    const currentUserMember = organization.members[0];
    const isOwner = organization.ownerId === userPayload.userId;
    
    if (!isOwner && (!currentUserMember || (currentUserMember.role !== Role.OWNER && currentUserMember.role !== Role.ADMIN))) {
      return NextResponse.json({ error: 'Insufficient permissions to cancel invitations' }, { status: 403 });
    }

    const deletedInvitation = await prisma.invitation.delete({
      where: {
        id: invitationId,
        organizationId: orgId,
      },
    });

    return NextResponse.json({ message: 'Invitation cancelled successfully', invitation: deletedInvitation });

  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Invitation not found or does not belong to this organization' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
  }
}

// TODO: Implement GET, PATCH, DELETE for members
