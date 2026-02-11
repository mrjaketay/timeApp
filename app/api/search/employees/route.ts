import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "EMPLOYER") {
      console.log("[Search Employees] Unauthorized - returning empty suggestions");
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
    const employees = await prisma.employeeProfile.findMany({
      where: {
        companyId,
        user: {
          OR: [
            { name: { contains: queryLower } },
            { email: { contains: queryLower } },
          ],
        },
      },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const suggestions = employees.map((employee) => ({
      id: employee.id, // Use employee profile ID for navigation
      text: employee.user.name || employee.user.email,
      type: "Employee",
    }));

    console.log("[Search Employees] Found:", suggestions.length, suggestions);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search employees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
