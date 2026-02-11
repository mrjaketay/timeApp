import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const lastEvent = await prisma.attendanceEvent.findFirst({
      where: {
        userId,
        companyId,
      },
      orderBy: {
        capturedAt: "desc",
      },
    });

    return NextResponse.json({ event: lastEvent });
  } catch (error) {
    console.error("Error fetching last event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
