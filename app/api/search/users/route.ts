import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    console.log("[Search Users] Session check:", {
      hasSession: !!session,
      role: session?.user?.role,
    });

    if (!session?.user || session.user.role !== "ADMIN") {
      console.log("[Search Users] Unauthorized - returning empty suggestions");
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const queryLower = query.toLowerCase();
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: queryLower } },
          { email: { contains: queryLower } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const suggestions = users.map((user) => ({
      id: user.id,
      text: user.name || user.email,
      type: user.role,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
