/**
 * Script to fix relationship errors from the migration
 * This validates and fixes foreign key constraints
 */

import { PrismaClient } from "@prisma/client";
import * as path from "path";
import * as fs from "fs";

const prisma = new PrismaClient();

async function fixRelationships() {
  console.log("🔧 Fixing relationship errors from migration...\n");

  try {
    // Read SQLite data to get the original relationships
    const sqliteDbPath = path.join(process.cwd(), "prisma", "dev.db");
    if (!fs.existsSync(sqliteDbPath)) {
      throw new Error(`SQLite database not found at ${sqliteDbPath}`);
    }

    const Database = require("better-sqlite3");
    const db = new Database(sqliteDbPath, { readonly: true });

    try {
      // Get all data from SQLite
      const sqliteData = {
        memberships: db.prepare("SELECT * FROM CompanyMembership").all(),
        profiles: db.prepare("SELECT * FROM EmployeeProfile").all(),
        nfcCards: db.prepare("SELECT * FROM NFCCard").all(),
        attendanceEvents: db.prepare("SELECT * FROM AttendanceEvent").all(),
        timesheets: db.prepare("SELECT * FROM Timesheet").all(),
      };

      // Get all valid IDs from Supabase
      const supabaseUsers = await prisma.user.findMany({ select: { id: true } });
      const supabaseCompanies = await prisma.company.findMany({ select: { id: true } });
      const supabaseUserIds = new Set(supabaseUsers.map(u => u.id));
      const supabaseCompanyIds = new Set(supabaseCompanies.map(c => c.id));

      console.log(`   Found ${supabaseUsers.length} users and ${supabaseCompanies.length} companies in Supabase\n`);

      // Fix Company Memberships
      console.log("📦 Fixing Company Memberships...");
      let fixedMemberships = 0;
      for (const membership of sqliteData.memberships) {
        if (supabaseUserIds.has(membership.userId) && supabaseCompanyIds.has(membership.companyId)) {
          try {
            await prisma.companyMembership.upsert({
              where: {
                userId_companyId: {
                  userId: membership.userId,
                  companyId: membership.companyId,
                },
              },
              update: { role: membership.role },
              create: {
                id: membership.id,
                userId: membership.userId,
                companyId: membership.companyId,
                role: membership.role,
                createdAt: new Date(membership.createdAt),
                updatedAt: new Date(membership.updatedAt),
              },
            });
            fixedMemberships++;
          } catch (err: any) {
            // Skip if already exists or other error
          }
        }
      }
      console.log(`   ✅ Fixed ${fixedMemberships} memberships`);

      // Fix Employee Profiles
      console.log("📦 Fixing Employee Profiles...");
      let fixedProfiles = 0;
      for (const profile of sqliteData.profiles) {
        if (supabaseUserIds.has(profile.userId) && supabaseCompanyIds.has(profile.companyId)) {
          try {
            await prisma.employeeProfile.upsert({
              where: { userId: profile.userId },
              update: {
                companyId: profile.companyId,
                photo: profile.photo,
                employeeId: profile.employeeId,
                phone: profile.phone,
                address: profile.address,
                dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
                salaryRate: profile.salaryRate,
                employmentStartDate: profile.employmentStartDate ? new Date(profile.employmentStartDate) : null,
                isActive: profile.isActive === 1,
              },
              create: {
                id: profile.id,
                userId: profile.userId,
                companyId: profile.companyId,
                photo: profile.photo,
                employeeId: profile.employeeId,
                phone: profile.phone,
                address: profile.address,
                dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
                salaryRate: profile.salaryRate,
                employmentStartDate: profile.employmentStartDate ? new Date(profile.employmentStartDate) : null,
                isActive: profile.isActive === 1,
                createdAt: new Date(profile.createdAt),
                updatedAt: new Date(profile.updatedAt),
              },
            });
            fixedProfiles++;
          } catch (err: any) {
            // Skip if error
          }
        }
      }
      console.log(`   ✅ Fixed ${fixedProfiles} employee profiles`);

      // Fix NFC Cards
      console.log("📦 Fixing NFC Cards...");
      let fixedCards = 0;
      for (const card of sqliteData.nfcCards) {
        if (supabaseUserIds.has(card.userId) && supabaseCompanyIds.has(card.companyId)) {
          try {
            await prisma.nFCCard.upsert({
              where: { uid: card.uid },
              update: {
                userId: card.userId,
                companyId: card.companyId,
                isActive: card.isActive === 1,
                registeredBy: card.registeredBy,
                lastUsedAt: card.lastUsedAt ? new Date(card.lastUsedAt) : null,
              },
              create: {
                id: card.id,
                uid: card.uid,
                userId: card.userId,
                companyId: card.companyId,
                isActive: card.isActive === 1,
                registeredBy: card.registeredBy,
                lastUsedAt: card.lastUsedAt ? new Date(card.lastUsedAt) : null,
                registeredAt: new Date(card.registeredAt),
              },
            });
            fixedCards++;
          } catch (err: any) {
            // Skip if error
          }
        }
      }
      console.log(`   ✅ Fixed ${fixedCards} NFC cards`);

      // Fix Attendance Events
      console.log("📦 Fixing Attendance Events...");
      let fixedEvents = 0;
      const existingEvents = await prisma.attendanceEvent.findMany({ select: { id: true } });
      const existingEventIds = new Set(existingEvents.map(e => e.id));

      for (const event of sqliteData.attendanceEvents) {
        if (
          supabaseUserIds.has(event.userId) &&
          supabaseCompanyIds.has(event.companyId) &&
          !existingEventIds.has(event.id)
        ) {
          try {
            await prisma.attendanceEvent.create({
              data: {
                id: event.id,
                userId: event.userId,
                companyId: event.companyId,
                nfcCardId: event.nfcCardId && supabaseUserIds.has(event.userId) ? event.nfcCardId : null,
                eventType: event.eventType,
                locationLat: event.locationLat,
                locationLng: event.locationLng,
                accuracyMeters: event.accuracyMeters,
                address: event.address,
                capturedAt: new Date(event.capturedAt),
                deviceInfo: event.deviceInfo,
                notes: event.notes,
              },
            });
            fixedEvents++;
          } catch (err: any) {
            // Skip if error
          }
        }
      }
      console.log(`   ✅ Fixed ${fixedEvents} attendance events`);

      // Fix Timesheets
      console.log("📦 Fixing Timesheets...");
      let fixedTimesheets = 0;
      const existingAttendanceIds = await prisma.attendanceEvent.findMany({ select: { id: true } });
      const existingAttendanceIdSet = new Set(existingAttendanceIds.map(e => e.id));

      for (const timesheet of sqliteData.timesheets) {
        if (
          supabaseUserIds.has(timesheet.userId) &&
          supabaseCompanyIds.has(timesheet.companyId)
        ) {
          // Only set clockInId/clockOutId if the attendance events exist
          const clockInId = timesheet.clockInId && existingAttendanceIdSet.has(timesheet.clockInId) 
            ? timesheet.clockInId 
            : null;
          const clockOutId = timesheet.clockOutId && existingAttendanceIdSet.has(timesheet.clockOutId) 
            ? timesheet.clockOutId 
            : null;

          try {
            await prisma.timesheet.upsert({
              where: {
                userId_companyId_date: {
                  userId: timesheet.userId,
                  companyId: timesheet.companyId,
                  date: new Date(timesheet.date),
                },
              },
              update: {
                clockInId,
                clockOutId,
                hoursWorked: timesheet.hoursWorked,
                breakMinutes: timesheet.breakMinutes || 0,
                notes: timesheet.notes,
              },
              create: {
                id: timesheet.id,
                userId: timesheet.userId,
                companyId: timesheet.companyId,
                date: new Date(timesheet.date),
                clockInId,
                clockOutId,
                hoursWorked: timesheet.hoursWorked,
                breakMinutes: timesheet.breakMinutes || 0,
                notes: timesheet.notes,
                createdAt: new Date(timesheet.createdAt),
                updatedAt: new Date(timesheet.updatedAt),
              },
            });
            fixedTimesheets++;
          } catch (err: any) {
            // Skip if error
          }
        }
      }
      console.log(`   ✅ Fixed ${fixedTimesheets} timesheets`);

      console.log("\n✅ Relationship fixes completed!");
      console.log("\n📊 Summary:");
      console.log(`   - Memberships: ${fixedMemberships}`);
      console.log(`   - Employee Profiles: ${fixedProfiles}`);
      console.log(`   - NFC Cards: ${fixedCards}`);
      console.log(`   - Attendance Events: ${fixedEvents}`);
      console.log(`   - Timesheets: ${fixedTimesheets}`);

    } finally {
      db.close();
    }
  } catch (error) {
    console.error("❌ Error fixing relationships:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixRelationships()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
