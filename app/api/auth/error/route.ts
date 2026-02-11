import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  // Redirect to the custom error page
  const errorUrl = new URL("/auth/error", req.url);
  if (error) {
    errorUrl.searchParams.set("error", error);
  }
  return NextResponse.redirect(errorUrl);
}
