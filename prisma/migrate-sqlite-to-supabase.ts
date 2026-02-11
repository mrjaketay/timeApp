/**
 * Migration script to transfer data from SQLite to Supabase
 * 
 * This script reads data from your old SQLite database (dev.db) and
 * transfers it to your Supabase PostgreSQL database.
 * 
 * Usage: npx tsx prisma/migrate-sqlite-to-supabase.ts
 */

import { PrismaClient as PrismaClientSQLite } from "@prisma/client";
import { PrismaClient as PrismaClientPostgres } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

// Read SQLite data using a separate Prisma client
async function readSQLiteData() {
  const sqliteDbPath = path.join(process.cwd(), "prisma", "dev.db");
  
  if (!fs.existsSync(sqliteDbPath)) {
    throw new Error(`SQLite database not found at ${sqliteDbPath}`);
  }

  console.log("📖 Reading data from SQLite database...\n");
  
  // Temporarily change DATABASE_URL to SQLite
  const originalDbUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = `file:${sqliteDbPath}`;
  
  // We need to use a different approach - use better-sqlite3 directly
  const Database = require("better-sqlite3");
  const db = new Database(sqliteDbPath, { readonly: true });

  try {
    const data: any = {};

    // Read Users
    data.users = db.prepare("SELECT * FROM User").all();
    console.log(`   Found ${data.users.length} users`);

    // Read Companies
    data.companies = db.prepare("SELECT * FROM Company").all();
    console.log(`   Found ${data.companies.length} companies`);

    // Read Company Memberships
    data.memberships = db.prepare("SELECT * FROM CompanyMembership").all();
    console.log(`   Found ${data.memberships.length} memberships`);

    // Read Employee Profiles
    data.profiles = db.prepare("SELECT * FROM EmployeeProfile").all();
    console.log(`   Found ${data.profiles.length} employee profiles`);

    // Read NFC Cards
    data.nfcCards = db.prepare("SELECT * FROM NFCCard").all();
    console.log(`   Found ${data.nfcCards.length} NFC cards`);

    // Read Attendance Events
    data.attendanceEvents = db.prepare("SELECT * FROM AttendanceEvent").all();
    console.log(`   Found ${data.attendanceEvents.length} attendance events`);

    // Read Timesheets
    data.timesheets = db.prepare("SELECT * FROM Timesheet").all();
    console.log(`   Found ${data.timesheets.length} timesheets`);

    // Read Subscriptions
    data.subscriptions = db.prepare("SELECT * FROM Subscription").all();
    console.log(`   Found ${data.subscriptions.length} subscriptions`);

    // Read Payments
    data.payments = db.prepare("SELECT * FROM Payment").all();
    console.log(`   Found ${data.payments.length} payments`);

    // Read Invitations
    data.invitations = db.prepare("SELECT * FROM Invitation").all();
    console.log(`   Found ${data.invitations.length} invitations`);

    // Read Reports
    data.reports = db.prepare("SELECT * FROM Report").all();
    console.log(`   Found ${data.reports.length} reports`);

    // Restore original DATABASE_URL
    process.env.DATABASE_URL = originalDbUrl;

    db.close();
    return data;
  } catch (error) {
    db.close();
    process.env.DATABASE_URL = originalDbUrl;
    throw error;
  }
}

async function migrateData() {
  console.log("🔄 Starting data migration from SQLite to Supabase...\n");

  try {
    // Step 1: Read data from SQLite
    const sqliteData = await readSQLiteData();
    console.log("\n✅ Data read successfully!\n");

    // Step 2: Write data to Supabase
    console.log("📝 Writing data to Supabase...\n");
    const postgresClient = new PrismaClientPostgres();

    try {
      // Migrate Users
      if (sqliteData.users.length > 0) {
        console.log("📦 Migrating Users...");
        for (const user of sqliteData.users) {
          try {
            await postgresClient.user.upsert({
              where: { email: user.email },
              update: {
                name: user.name,
                password: user.password,
                role: user.role,
                image: user.image,
                emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
                onboardingCompleted: user.onboardingCompleted === 1,
                onboardingStep: user.onboardingStep || 0,
              },
              create: {
                id: user.id,
                email: user.email,
                name: user.name,
                password: user.password,
                role: user.role,
                image: user.image,
                emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
                onboardingCompleted: user.onboardingCompleted === 1,
                onboardingStep: user.onboardingStep || 0,
                createdAt: new Date(user.createdAt),
                updatedAt: new Date(user.updatedAt),
              },
            });
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating user ${user.email}:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.users.length} users`);
      }

      // Migrate Companies
      if (sqliteData.companies.length > 0) {
        console.log("📦 Migrating Companies...");
        for (const company of sqliteData.companies) {
          try {
            await postgresClient.company.upsert({
              where: { slug: company.slug },
              update: {
                name: company.name,
                invitationMessage: company.invitationMessage,
                phone: company.phone,
                address: company.address,
                website: company.website,
                industry: company.industry,
                companySize: company.companySize,
                timezone: company.timezone,
                country: company.country,
                taxId: company.taxId,
              },
              create: {
                id: company.id,
                name: company.name,
                slug: company.slug,
                invitationMessage: company.invitationMessage,
                phone: company.phone,
                address: company.address,
                website: company.website,
                industry: company.industry,
                companySize: company.companySize,
                timezone: company.timezone,
                country: company.country,
                taxId: company.taxId,
                createdAt: new Date(company.createdAt),
                updatedAt: new Date(company.updatedAt),
              },
            });
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating company ${company.slug}:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.companies.length} companies`);
      }

      // Migrate Company Memberships
      if (sqliteData.memberships.length > 0) {
        console.log("📦 Migrating Company Memberships...");
        for (const membership of sqliteData.memberships) {
          try {
            await postgresClient.companyMembership.upsert({
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
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating membership:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.memberships.length} memberships`);
      }

      // Migrate Employee Profiles
      if (sqliteData.profiles.length > 0) {
        console.log("📦 Migrating Employee Profiles...");
        for (const profile of sqliteData.profiles) {
          try {
            await postgresClient.employeeProfile.upsert({
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
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating profile:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.profiles.length} employee profiles`);
      }

      // Migrate NFC Cards
      if (sqliteData.nfcCards.length > 0) {
        console.log("📦 Migrating NFC Cards...");
        for (const card of sqliteData.nfcCards) {
          try {
            await postgresClient.nFCCard.upsert({
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
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating NFC card:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.nfcCards.length} NFC cards`);
      }

      // Migrate Attendance Events
      if (sqliteData.attendanceEvents.length > 0) {
        console.log("📦 Migrating Attendance Events...");
        let migratedEvents = 0;
        for (const event of sqliteData.attendanceEvents) {
          try {
            await postgresClient.attendanceEvent.create({
              data: {
                id: event.id,
                userId: event.userId,
                companyId: event.companyId,
                nfcCardId: event.nfcCardId,
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
            migratedEvents++;
          } catch (err: any) {
            if (!err.message?.includes("Unique constraint")) {
              console.error(`   ⚠️  Error migrating event ${event.id}:`, err.message);
            }
          }
        }
        console.log(`   ✅ Migrated ${migratedEvents} attendance events`);
      }

      // Migrate Timesheets
      if (sqliteData.timesheets.length > 0) {
        console.log("📦 Migrating Timesheets...");
        for (const timesheet of sqliteData.timesheets) {
          try {
            await postgresClient.timesheet.upsert({
              where: {
                userId_companyId_date: {
                  userId: timesheet.userId,
                  companyId: timesheet.companyId,
                  date: new Date(timesheet.date),
                },
              },
              update: {
                clockInId: timesheet.clockInId,
                clockOutId: timesheet.clockOutId,
                hoursWorked: timesheet.hoursWorked,
                breakMinutes: timesheet.breakMinutes || 0,
                notes: timesheet.notes,
              },
              create: {
                id: timesheet.id,
                userId: timesheet.userId,
                companyId: timesheet.companyId,
                date: new Date(timesheet.date),
                clockInId: timesheet.clockInId,
                clockOutId: timesheet.clockOutId,
                hoursWorked: timesheet.hoursWorked,
                breakMinutes: timesheet.breakMinutes || 0,
                notes: timesheet.notes,
                createdAt: new Date(timesheet.createdAt),
                updatedAt: new Date(timesheet.updatedAt),
              },
            });
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating timesheet:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.timesheets.length} timesheets`);
      }

      // Migrate Subscriptions
      if (sqliteData.subscriptions.length > 0) {
        console.log("📦 Migrating Subscriptions...");
        for (const subscription of sqliteData.subscriptions) {
          try {
            await postgresClient.subscription.upsert({
              where: { companyId: subscription.companyId },
              update: {
                plan: subscription.plan,
                status: subscription.status,
                stripeCustomerId: subscription.stripeCustomerId,
                stripeSubscriptionId: subscription.stripeSubscriptionId,
                stripePriceId: subscription.stripePriceId,
                currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : null,
                currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === 1,
                canceledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null,
                trialStart: subscription.trialStart ? new Date(subscription.trialStart) : null,
                trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : null,
              },
              create: {
                id: subscription.id,
                companyId: subscription.companyId,
                plan: subscription.plan,
                status: subscription.status,
                stripeCustomerId: subscription.stripeCustomerId,
                stripeSubscriptionId: subscription.stripeSubscriptionId,
                stripePriceId: subscription.stripePriceId,
                currentPeriodStart: subscription.currentPeriodStart ? new Date(subscription.currentPeriodStart) : null,
                currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === 1,
                canceledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : null,
                trialStart: subscription.trialStart ? new Date(subscription.trialStart) : null,
                trialEnd: subscription.trialEnd ? new Date(subscription.trialEnd) : null,
                createdAt: new Date(subscription.createdAt),
                updatedAt: new Date(subscription.updatedAt),
              },
            });
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating subscription:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.subscriptions.length} subscriptions`);
      }

      // Migrate Payments
      if (sqliteData.payments.length > 0) {
        console.log("📦 Migrating Payments...");
        let migratedPayments = 0;
        for (const payment of sqliteData.payments) {
          try {
            await postgresClient.payment.create({
              data: {
                id: payment.id,
                companyId: payment.companyId,
                subscriptionId: payment.subscriptionId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                stripePaymentIntentId: payment.stripePaymentIntentId,
                stripeInvoiceId: payment.stripeInvoiceId,
                description: payment.description,
                metadata: payment.metadata,
                paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
                createdAt: new Date(payment.createdAt),
                updatedAt: new Date(payment.updatedAt),
              },
            });
            migratedPayments++;
          } catch (err: any) {
            if (!err.message?.includes("Unique constraint")) {
              console.error(`   ⚠️  Error migrating payment ${payment.id}:`, err.message);
            }
          }
        }
        console.log(`   ✅ Migrated ${migratedPayments} payments`);
      }

      // Migrate Invitations
      if (sqliteData.invitations.length > 0) {
        console.log("📦 Migrating Invitations...");
        for (const invitation of sqliteData.invitations) {
          try {
            await postgresClient.invitation.upsert({
              where: { token: invitation.token },
              update: {
                email: invitation.email,
                name: invitation.name,
                companyId: invitation.companyId,
                invitedBy: invitation.invitedBy,
                employeeId: invitation.employeeId,
                phone: invitation.phone,
                address: invitation.address,
                status: invitation.status,
                expiresAt: new Date(invitation.expiresAt),
                acceptedAt: invitation.acceptedAt ? new Date(invitation.acceptedAt) : null,
              },
              create: {
                id: invitation.id,
                token: invitation.token,
                email: invitation.email,
                name: invitation.name,
                companyId: invitation.companyId,
                invitedBy: invitation.invitedBy,
                employeeId: invitation.employeeId,
                phone: invitation.phone,
                address: invitation.address,
                status: invitation.status,
                expiresAt: new Date(invitation.expiresAt),
                acceptedAt: invitation.acceptedAt ? new Date(invitation.acceptedAt) : null,
                createdAt: new Date(invitation.createdAt),
                updatedAt: new Date(invitation.updatedAt),
              },
            });
          } catch (err: any) {
            console.error(`   ⚠️  Error migrating invitation:`, err.message);
          }
        }
        console.log(`   ✅ Migrated ${sqliteData.invitations.length} invitations`);
      }

      // Migrate Reports
      if (sqliteData.reports.length > 0) {
        console.log("📦 Migrating Reports...");
        let migratedReports = 0;
        for (const report of sqliteData.reports) {
          try {
            await postgresClient.report.create({
              data: {
                id: report.id,
                companyId: report.companyId,
                generatedBy: report.generatedBy,
                type: report.type,
                format: report.format,
                status: report.status,
                fileUrl: report.fileUrl,
                parameters: report.parameters,
                error: report.error,
                createdAt: new Date(report.createdAt),
                completedAt: report.completedAt ? new Date(report.completedAt) : null,
              },
            });
            migratedReports++;
          } catch (err: any) {
            if (!err.message?.includes("Unique constraint")) {
              console.error(`   ⚠️  Error migrating report ${report.id}:`, err.message);
            }
          }
        }
        console.log(`   ✅ Migrated ${migratedReports} reports`);
      }

      console.log("\n✅ Migration completed successfully!");
      console.log("\n📊 Summary:");
      console.log(`   - Users: ${sqliteData.users.length}`);
      console.log(`   - Companies: ${sqliteData.companies.length}`);
      console.log(`   - Memberships: ${sqliteData.memberships.length}`);
      console.log(`   - Employee Profiles: ${sqliteData.profiles.length}`);
      console.log(`   - NFC Cards: ${sqliteData.nfcCards.length}`);
      console.log(`   - Attendance Events: ${sqliteData.attendanceEvents.length}`);
      console.log(`   - Timesheets: ${sqliteData.timesheets.length}`);
      console.log(`   - Subscriptions: ${sqliteData.subscriptions.length}`);
      console.log(`   - Payments: ${sqliteData.payments.length}`);
      console.log(`   - Invitations: ${sqliteData.invitations.length}`);
      console.log(`   - Reports: ${sqliteData.reports.length}`);

    } finally {
      await postgresClient.$disconnect();
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrateData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
