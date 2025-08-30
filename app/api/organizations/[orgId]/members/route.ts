import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvitationStatus, Role } from "@prisma/client";
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

// Helper function to get base URL from request
function getBaseUrlFromRequest(request: Request): string {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

// Helper function to check if user has permission to manage members
async function checkMemberManagementPermission(orgId: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      ownerId: true,
      members: {
        where: { userId: userId },
        select: { role: true }
      }
    }
  });

  if (!organization) {
    return { hasPermission: false, error: 'Organization not found' };
  }

  // Check if user is organization owner
  const isOwner = organization.ownerId === userId;
  
  // Check if user is a member with OWNER or ADMIN role
  const currentUserMember = organization.members[0];
  const hasAdminRole = currentUserMember && (currentUserMember.role === Role.OWNER || currentUserMember.role === Role.ADMIN);

  if (!isOwner && !hasAdminRole) {
    return { hasPermission: false, error: 'Insufficient permissions to manage members' };
  }

  return { hasPermission: true, organization };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  try {
    const organization = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Get confirmed members
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    });

    // Get pending invitations
    const pendingInvitations = await prisma.invitation.findMany({
      where: { 
        organizationId: orgId,
        status: InvitationStatus.PENDING 
      },
      include: {
        invitedByUser: { 
          select: { id: true, email: true, name: true } 
        }
      }
    });

    // Format confirmed members
    const formattedMembers = members.map((m) => ({
      type: 'member',
      userId: m.userId,
      email: m.user?.email ?? null,
      name: m.user?.name ?? null,
      role: m.role,
      status: 'confirmed',
      addedByUserId: m.addedByUserId ?? null,
    }));

    // Format pending invitations
    const formattedInvitations = pendingInvitations.map((inv) => ({
      type: 'invitation',
      invitationId: inv.id,
      userId: null,
      email: inv.email,
      name: null,
      role: inv.role,
      status: 'pending',
      expiresAt: inv.expiresAt,
      invitationLink: `${getBaseUrlFromRequest(req)}/invite/${inv.token}`,
      addedByUserId: inv.invitedByUserId,
      addedByUser: inv.invitedByUser,
    }));

    // Combine members and invitations for the main response
    const allMembers = [...formattedMembers, ...formattedInvitations];

    // Return combined array for frontend compatibility 
    // (the frontend expects members.map() to work directly on the response)
    return NextResponse.json(allMembers);
  } catch (err) {
    console.error("Error fetching organization members:", err instanceof Error ? err.stack : err);
    return NextResponse.json({ error: "Failed to fetch organization members" }, { status: 500 });
  }
}

// PUT /api/organizations/:orgId/members - Update member role
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  // Get current user from token
  const userPayload = await getUserFromRequest(req);
  if (!userPayload || !userPayload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId: targetUserId, newRole } = await req.json();

    // Basic validation
    if (!targetUserId || !newRole) {
      return NextResponse.json({ error: 'Missing required fields: userId, newRole' }, { status: 400 });
    }

    if (!Object.values(Role).includes(newRole as Role)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    // Check permissions
    const permissionCheck = await checkMemberManagementPermission(orgId, userPayload.userId as string);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    // Prevent user from changing their own role (security measure)
    if (targetUserId === userPayload.userId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Check if target user is a member of the organization
    const targetMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId
        }
      },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 404 });
    }

    // Prevent changing role of organization owner (additional security)
    if (targetUserId === permissionCheck.organization?.ownerId) {
      return NextResponse.json({ error: 'Cannot change role of organization owner' }, { status: 400 });
    }

    // Update member role
    const updatedMember = await prisma.organizationMember.update({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId
        }
      },
      data: {
        role: newRole as Role,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    return NextResponse.json({
      message: `Role updated successfully to ${newRole}`,
      member: {
        userId: updatedMember.userId,
        email: updatedMember.user?.email,
        name: updatedMember.user?.name,
        role: updatedMember.role,
        updatedAt: updatedMember.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

// DELETE /api/organizations/:orgId/members - Remove member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  // Get current user from token
  const userPayload = await getUserFromRequest(req);
  if (!userPayload || !userPayload.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId: targetUserId } = await req.json();

    // Basic validation
    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing required field: userId' }, { status: 400 });
    }

    // Check permissions
    const permissionCheck = await checkMemberManagementPermission(orgId, userPayload.userId as string);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    // Prevent user from removing themselves (they should use leave endpoint instead)
    if (targetUserId === userPayload.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself. Use leave endpoint instead.' }, { status: 400 });
    }

    // Prevent removing organization owner
    if (targetUserId === permissionCheck.organization?.ownerId) {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 400 });
    }

    // Check if target user is a member of the organization
    const targetMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId
        }
      },
      include: {
        user: {
          select: { email: true, name: true }
        }
      }
    });

    if (!targetMember) {
      return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 404 });
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId: targetUserId,
          organizationId: orgId
        }
      }
    });

    return NextResponse.json({
      message: 'Member removed successfully',
      removedMember: {
        userId: targetMember.userId,
        email: targetMember.user?.email,
        name: targetMember.user?.name,
        role: targetMember.role
      }
    });

  } catch (error: any) {
    console.error('Error removing member:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
