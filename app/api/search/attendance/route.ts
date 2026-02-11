import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "EMPLOYER") {
      console.log("[Search Attendance] Unauthorized - returning empty suggestions");
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;
    if (!companyId) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const queryLower = query.toLowerCase();
    const events = await prisma.attendanceEvent.findMany({
      where: {
        companyId,
        employeeProfile: {
          OR: [
            { name: { contains: queryLower } },
            { email: { contains: queryLower } },
            { employeeId: { contains: queryLower } },
          ],
        },
      },
      take: 20, // Get more to filter unique employees
      include: {
        employeeProfile: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          },
        },
      },
      orderBy: { capturedAt: "desc" },
    });

    // Get unique employees
    const uniqueEmployees = new Map();
    events.forEach(event => {
      if (!uniqueEmployees.has(event.employeeProfile.id)) {
        uniqueEmployees.set(event.employeeProfile.id, event.employeeProfile);
      }
    });

    const suggestions = Array.from(uniqueEmployees.values())
      .slice(0, 5)
      .map((employee) => ({
        id: employee.id,
        text: employee.name || employee.email || employee.employeeId || "Unknown Employee",
        type: "Attendance",
      }));

    console.log("[Search Attendance] Found:", suggestions.length, suggestions);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search attendance error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
