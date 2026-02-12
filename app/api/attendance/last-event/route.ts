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

    const userEmail = session.user.email;
    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId || !userEmail) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    // Attendance events are keyed by EmployeeProfile; resolve current user to employee in this company (e.g. by email)
    const employee = await prisma.employeeProfile.findFirst({
      where: {
        companyId,
        email: userEmail,
        isActive: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ event: null });
    }

    const lastEvent = await prisma.attendanceEvent.findFirst({
      where: {
        employeeProfileId: employee.id,
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
