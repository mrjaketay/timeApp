/**
 * Migration script using raw SQL to move employees from User to EmployeeProfile
 * This works before the schema is updated
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateEmployeesSQL() {
  console.log("🔄 Migrating employees using SQL...\n");

  try {
    // Step 1: Add new columns to EmployeeProfile (if they don't exist)
    console.log("📝 Step 1: Adding name and email columns to EmployeeProfile...");
    try {
      await prisma.$executeRaw`
        ALTER TABLE "EmployeeProfile" 
        ADD COLUMN IF NOT EXISTS "name" TEXT,
        ADD COLUMN IF NOT EXISTS "email" TEXT;
      `;
      console.log("   ✅ Columns added");
    } catch (error: any) {
      if (!error.message.includes("duplicate column")) {
        throw error;
      }
      console.log("   ℹ️  Columns already exist");
    }

    // Step 2: Add employeeProfileId columns to related tables
    console.log("\n📝 Step 2: Adding employeeProfileId columns...");
    try {
      await prisma.$executeRaw`
        ALTER TABLE "NFCCard" 
        ADD COLUMN IF NOT EXISTS "employeeProfileId" TEXT;
      `;
      await prisma.$executeRaw`
        ALTER TABLE "AttendanceEvent" 
        ADD COLUMN IF NOT EXISTS "employeeProfileId" TEXT;
      `;
      await prisma.$executeRaw`
        ALTER TABLE "Timesheet" 
        ADD COLUMN IF NOT EXISTS "employeeProfileId" TEXT;
      `;
      console.log("   ✅ Columns added");
    } catch (error: any) {
      console.log("   ℹ️  Some columns may already exist");
    }

    // Step 3: Update EmployeeProfile with name and email from User
    console.log("\n📝 Step 3: Updating EmployeeProfile with user data...");
    const updated = await prisma.$executeRaw`
      UPDATE "EmployeeProfile" ep
      SET 
        "name" = u."name",
        "email" = u."email"
      FROM "User" u
      WHERE ep."userId" = u."id" 
        AND u."role" = 'EMPLOYEE'
        AND (ep."name" IS NULL OR ep."email" IS NULL);
    `;
    console.log(`   ✅ Updated ${updated} employee profiles`);

    // Step 4: Update NFCCard to point to EmployeeProfile
    console.log("\n📝 Step 4: Updating NFCCard relationships...");
    const nfcUpdated = await prisma.$executeRaw`
      UPDATE "NFCCard" nfc
      SET "employeeProfileId" = ep."id"
      FROM "EmployeeProfile" ep
      WHERE nfc."userId" = ep."userId"
        AND nfc."employeeProfileId" IS NULL;
    `;
    console.log(`   ✅ Updated ${nfcUpdated} NFC cards`);

    // Step 5: Update AttendanceEvent to point to EmployeeProfile
    console.log("\n📝 Step 5: Updating AttendanceEvent relationships...");
    const eventUpdated = await prisma.$executeRaw`
      UPDATE "AttendanceEvent" ae
      SET "employeeProfileId" = ep."id"
      FROM "EmployeeProfile" ep
      WHERE ae."userId" = ep."userId"
        AND ae."employeeProfileId" IS NULL;
    `;
    console.log(`   ✅ Updated ${eventUpdated} attendance events`);

    // Step 6: Update Timesheet to point to EmployeeProfile
    console.log("\n📝 Step 6: Updating Timesheet relationships...");
    const timesheetUpdated = await prisma.$executeRaw`
      UPDATE "Timesheet" ts
      SET "employeeProfileId" = ep."id"
      FROM "EmployeeProfile" ep
      WHERE ts."userId" = ep."userId"
        AND ts."employeeProfileId" IS NULL;
    `;
    console.log(`   ✅ Updated ${timesheetUpdated} timesheets`);

    console.log("\n✅ SQL migration completed!");
    console.log("\n📊 Next step: Run 'npm run db:push' to apply schema changes");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateEmployeesSQL()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
