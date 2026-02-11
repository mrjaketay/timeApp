import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";

export async function GET() {
  try {
    // Force revalidation of session
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("[Auth/Me] User role:", session.user.role, "Email:", session.user.email);
    }

    return NextResponse.json({
      role: session.user.role || "EMPLOYER", // Default fallback
      id: session.user.id,
      email: session.user.email,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
      }
    });
  } catch (error) {
    console.error("Error getting user info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
