import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow health check and test endpoints without auth
  if (
    path === "/health-check" ||
    path.startsWith("/api/auth/check") ||
    path.startsWith("/api/test") ||
    path.startsWith("/api/auth/error") ||
    path.startsWith("/api/invitations") ||
    path.startsWith("/invite/accept") ||
    path.startsWith("/_next") ||
    path.startsWith("/api/auth/[...nextauth]")
  ) {
    return NextResponse.next();
  }

  // Allow landing page, login, register, pricing, and onboarding pages (onboarding has its own auth check)
  if (path === "/" || path === "/login" || path === "/register" || path === "/pricing" || path === "/onboarding") {
    return NextResponse.next();
  }

  // If NEXTAUTH_SECRET is not set, redirect to health check
  // But allow login/register to work
  if (!process.env.NEXTAUTH_SECRET) {
    if (path !== "/login" && path !== "/register") {
      return NextResponse.redirect(new URL("/health-check", req.url));
    }
  }

  // For other routes, let NextAuth middleware handle it
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
