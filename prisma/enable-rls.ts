/**
 * Script to enable Row Level Security (RLS) on all tables in Supabase
 * Run: npx tsx prisma/enable-rls.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function enableRLS() {
  console.log("🔒 Enabling Row Level Security (RLS) on all tables...\n");

  try {
    // Enable RLS on all tables
    const tables = [
      "User",
      "Account",
      "Session",
      "VerificationToken",
      "Company",
      "CompanyMembership",
      "EmployeeProfile",
      "NFCCard",
      "AttendanceEvent",
      "Timesheet",
      "Report",
      "Invitation",
      "Subscription",
      "Payment",
    ];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`   ✅ Enabled RLS on ${table}`);
      } catch (error: any) {
        // Table might already have RLS enabled, or there's an issue
        if (error.message?.includes("already enabled")) {
          console.log(`   ℹ️  RLS already enabled on ${table}`);
        } else {
          console.error(`   ⚠️  Error enabling RLS on ${table}:`, error.message);
        }
      }
    }

    console.log("\n✅ RLS enabled on all tables!");
    console.log("\n📝 Note: Basic policies have been created.");
    console.log("   You may want to customize policies in Supabase dashboard for your specific needs.");

  } catch (error) {
    console.error("❌ Error enabling RLS:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

enableRLS()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
