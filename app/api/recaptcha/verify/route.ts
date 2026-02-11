import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "CAPTCHA token is required" }, { status: 400 });
    }

    // In development, allow dev-token
    if (process.env.NODE_ENV === "development" && token === "dev-token") {
      return NextResponse.json({ success: true });
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.warn("reCAPTCHA secret key not configured. Skipping verification in development.");
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "CAPTCHA verification not configured" }, { status: 500 });
    }

    // Verify token with Google reCAPTCHA
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true, score: data.score });
    } else {
      return NextResponse.json(
        { error: "CAPTCHA verification failed", details: data["error-codes"] },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return NextResponse.json({ error: "Failed to verify CAPTCHA" }, { status: 500 });
  }
}
