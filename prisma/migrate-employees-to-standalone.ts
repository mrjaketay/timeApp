/**
 * Migration script to move employees from User table to standalone EmployeeProfile
 * 
 * This script:
 * 1. Creates new EmployeeProfile records from User records with role="EMPLOYEE"
 * 2. Updates all foreign key relationships (NFCCard, AttendanceEvent, Timesheet)
 * 3. Removes employee User records
 * 
 * Run: npx tsx prisma/migrate-employees-to-standalone.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateEmployees() {
  console.log("🔄 Migrating employees from User table to standalone EmployeeProfile...\n");

  try {
    // Step 1: Find all employee users
    const employeeUsers = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        employeeProfile: true,
        nfcCards: true,
        attendanceEvents: true,
        companyMemberships: true,
      },
    });

    console.log(`📦 Found ${employeeUsers.length} employee users to migrate\n`);

    if (employeeUsers.length === 0) {
      console.log("✅ No employees to migrate. Done!");
      return;
    }

    // Step 2: For each employee user, create/update EmployeeProfile
    for (const user of employeeUsers) {
      console.log(`   Migrating ${user.email || user.name || user.id}...`);

      // Get company from membership
      const membership = user.companyMemberships[0];
      if (!membership) {
        console.log(`     ⚠️  Skipping - no company membership found`);
        continue;
      }

      // Check if EmployeeProfile already exists
      let employeeProfile;
      if (user.employeeProfile) {
        // Update existing profile
        employeeProfile = await prisma.employeeProfile.update({
          where: { id: user.employeeProfile.id },
          data: {
            name: user.name || "Unknown Employee",
            email: user.email,
            // Keep existing data
          },
        });
        console.log(`     ✅ Updated existing EmployeeProfile`);
      } else {
        // Create new profile
        employeeProfile = await prisma.employeeProfile.create({
          data: {
            name: user.name || "Unknown Employee",
            email: user.email,
            companyId: membership.companyId,
            employeeId: `EMP-${Date.now()}`, // Generate temporary ID
            isActive: true,
          },
        });
        console.log(`     ✅ Created new EmployeeProfile`);
      }

      // Step 3: Update NFCCard relationships
      for (const nfcCard of user.nfcCards) {
        await prisma.nFCCard.update({
          where: { id: nfcCard.id },
          data: {
            employeeProfileId: employeeProfile.id,
          },
        });
      }
      if (user.nfcCards.length > 0) {
        console.log(`     ✅ Updated ${user.nfcCards.length} NFC cards`);
      }

      // Step 4: Update AttendanceEvent relationships
      for (const event of user.attendanceEvents) {
        await prisma.attendanceEvent.update({
          where: { id: event.id },
          data: {
            employeeProfileId: employeeProfile.id,
          },
        });
      }
      if (user.attendanceEvents.length > 0) {
        console.log(`     ✅ Updated ${user.attendanceEvents.length} attendance events`);
      }

      // Step 5: Update Timesheet relationships
      const timesheets = await prisma.timesheet.findMany({
        where: { userId: user.id },
      });
      for (const timesheet of timesheets) {
        await prisma.timesheet.update({
          where: { id: timesheet.id },
          data: {
            employeeProfileId: employeeProfile.id,
          },
        });
      }
      if (timesheets.length > 0) {
        console.log(`     ✅ Updated ${timesheets.length} timesheets`);
      }

      // Step 6: Delete employee User record (cascades will handle related records)
      await prisma.user.delete({
        where: { id: user.id },
      });
      console.log(`     ✅ Deleted User record`);
    }

    console.log("\n✅ Migration completed successfully!");
    console.log(`\n📊 Summary: Migrated ${employeeUsers.length} employees`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateEmployees()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
