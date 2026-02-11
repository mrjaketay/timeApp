import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = acceptInvitationSchema.parse(body);

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: validated.token },
      include: {
        company: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 });
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({ error: "Invitation has already been accepted" }, { status: 400 });
    }

    // Check if employee already exists in this company
    const existingEmployee = await prisma.employeeProfile.findFirst({
      where: {
        OR: [
          { email: invitation.email },
          ...(invitation.employeeId ? [{ employeeId: invitation.employeeId }] : []),
        ],
        companyId: invitation.companyId,
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: "You are already an employee in this company" },
        { status: 400 }
      );
    }

    // Check if employeeId is unique
    if (invitation.employeeId) {
      const duplicateEmployeeId = await prisma.employeeProfile.findUnique({
        where: { employeeId: invitation.employeeId },
      });
      if (duplicateEmployeeId && duplicateEmployeeId.companyId !== invitation.companyId) {
        return NextResponse.json(
          { error: "Employee ID already exists. Please contact your employer." },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Create employee profile directly (no User record needed)
      await tx.employeeProfile.create({
        data: {
          name: invitation.name,
          email: invitation.email,
          companyId: invitation.companyId,
          employeeId: invitation.employeeId || undefined,
          phone: invitation.phone || undefined,
          address: invitation.address || undefined,
          isActive: true,
        },
      });

      // Mark invitation as accepted
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Welcome to ${invitation.company.name}! You've been successfully added to the company. Your employer will be able to see you in their employee list.`,
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
