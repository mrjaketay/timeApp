import { NextRequest, NextResponse } from "next/server";
import { sendEmail, renderInvitationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();

    if (!to) {
      return NextResponse.json({ error: "Email address required" }, { status: 400 });
    }

    console.log("[Test Email] Starting email test...");
    console.log("[Test Email] RESEND_API_KEY exists:", !!process.env.RESEND_API_KEY);
    console.log("[Test Email] RESEND_API_KEY value:", process.env.RESEND_API_KEY ? "***" + process.env.RESEND_API_KEY.slice(-4) : "NOT SET");
    console.log("[Test Email] RESEND_FROM_EMAIL:", process.env.RESEND_FROM_EMAIL || "not set");

    const emailContent = renderInvitationEmail({
      employeeName: "Test User",
      companyName: "Test Company",
      invitationLink: "http://localhost:3000/test",
      customMessage: "This is a test email",
    });

    const result = await sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    return NextResponse.json({
      success: result,
      message: result
        ? "Test email sent successfully. Check your inbox and the server console for details."
        : "Test email failed. Check the server console for error details.",
      apiKeyConfigured: !!process.env.RESEND_API_KEY,
      fromEmail: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    });
  } catch (error: any) {
    console.error("[Test Email] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to send test email",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
