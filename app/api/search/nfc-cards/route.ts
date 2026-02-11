import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    console.log("[Search NFC Cards] Session check:", {
      hasSession: !!session,
      role: session?.user?.role,
    });

    if (!session?.user || session.user.role !== "EMPLOYER") {
      console.log("[Search NFC Cards] Unauthorized - returning empty suggestions");
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
    const nfcCards = await prisma.nFCCard.findMany({
      where: {
        companyId,
        OR: [
          { uid: { contains: queryLower } },
          {
            user: {
              OR: [
                { name: { contains: queryLower } },
                { email: { contains: queryLower } },
              ],
            },
          },
        ],
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

    const suggestions = nfcCards.map((card) => ({
      id: card.id,
      text: `${card.user.name || card.user.email} (${card.uid})`,
      type: "NFC Card",
    }));

    console.log("[Search NFC Cards] Found:", suggestions.length);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search NFC cards error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
