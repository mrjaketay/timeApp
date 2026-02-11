import { NextResponse } from "next/server";

export async function GET() {
  // This endpoint should work even without NEXTAUTH_SECRET to help diagnose issues
  const checks = {
    hasSecret: !!process.env.NEXTAUTH_SECRET,
    hasUrl: !!process.env.NEXTAUTH_URL,
    hasDatabase: !!process.env.DATABASE_URL,
    secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
    nodeEnv: process.env.NODE_ENV,
  };

  const missing = [];
  if (!checks.hasSecret) missing.push("NEXTAUTH_SECRET");
  if (!checks.hasDatabase) missing.push("DATABASE_URL");

  return NextResponse.json({
    status: missing.length === 0 ? "ok" : "configuration_required",
    checks,
    missing,
    instructions: missing.length > 0 ? {
      step1: "Create a .env file in the root directory (same level as package.json)",
      step2: "Add the following lines:",
      envExample: [
        'NEXTAUTH_URL="http://localhost:3000"',
        'NEXTAUTH_SECRET="[generate below]"',
        'DATABASE_URL="postgresql://user:password@localhost:5432/timetrack?schema=public"',
      ],
      generateSecret: "PowerShell command to generate NEXTAUTH_SECRET:",
      powershellCommand: '[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))',
      step3: "After creating .env, restart the dev server (Ctrl+C then npm run dev)",
    } : null,
  });
}
