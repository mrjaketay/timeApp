import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        company: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({
        error: "Invitation has expired",
        invitation: { ...invitation, status: "EXPIRED" },
      });
    }

    // Check if already accepted
    if (invitation.status === "ACCEPTED") {
      return NextResponse.json({
        error: "Invitation has already been accepted",
        invitation,
      });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error("Validate invitation error:", error);
    return NextResponse.json(
      { error: "Failed to validate invitation" },
      { status: 500 }
    );
  }
}
