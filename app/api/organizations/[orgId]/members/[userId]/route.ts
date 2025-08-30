import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  const { orgId, userId } = await params;

  const { role } = await req.json();
  if (!role) return NextResponse.json({ error: "Missing required field: role" }, { status: 400 });
  if (!Object.values(Role).includes(role as Role)) {
    return NextResponse.json({ error: "Invalid role provided" }, { status: 400 });
  }

  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!member) {
      return NextResponse.json({ error: "User is not a member of this organization" }, { status: 404 });
    }

    // Protege al último OWNER
    if (member.role === Role.OWNER && role !== Role.OWNER) {
      const owners = await prisma.organizationMember.findMany({
        where: { organizationId: orgId, role: Role.OWNER },
      });
      if (owners.length === 1 && owners[0].userId === userId) {
        return NextResponse.json(
          { error: "Cannot change the role of the last owner of the organization." },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.organizationMember.update({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      data: { role: role as Role, updatedAt: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating member role:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Member not found or does not belong to this organization" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  const { orgId, userId } = await params;

  try {
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const member = await prisma.organizationMember.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });
    if (!member) {
      return NextResponse.json({ error: "User is not a member of this organization" }, { status: 404 });
    }

    // Protege al último OWNER
    if (member.role === Role.OWNER) {
      const owners = await prisma.organizationMember.findMany({
        where: { organizationId: orgId, role: Role.OWNER },
      });
      if (owners.length === 1 && owners[0].userId === userId) {
        return NextResponse.json(
          { error: "Cannot remove the last owner of the organization." },
          { status: 400 }
        );
      }
    }

    await prisma.organizationMember.delete({
      where: { userId_organizationId: { userId, organizationId: orgId } },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error: any) {
    console.error("Error removing member:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Member not found or does not belong to this organization" },
        { status: 404 }
      );
    }
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
