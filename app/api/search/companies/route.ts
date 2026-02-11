import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    console.log("[Search Companies] Session check:", {
      hasSession: !!session,
      role: session?.user?.role,
      email: session?.user?.email,
    });

    if (!session?.user || session.user.role !== "ADMIN") {
      console.log("[Search Companies] Unauthorized - returning empty suggestions");
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    console.log("[Search Companies] Query:", query);

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const queryLower = query.toLowerCase();
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: queryLower } },
          { slug: { contains: queryLower } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log("[Search Companies] Found:", companies.length);

    const suggestions = companies.map((company) => ({
      id: company.id,
      text: company.name,
      type: "Company",
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search companies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
