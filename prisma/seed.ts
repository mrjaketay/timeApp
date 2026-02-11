import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@timetrack.com" },
    update: {},
    create: {
      email: "admin@timetrack.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create company
  const company = await prisma.company.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
    },
  });
  console.log("Created company:", company.name);

  // Create employer user
  const employerPassword = await bcrypt.hash("employer123", 10);
  const employer = await prisma.user.upsert({
    where: { email: "employer@acme.com" },
    update: {},
    create: {
      email: "employer@acme.com",
      name: "John Employer",
      password: employerPassword,
      role: "EMPLOYER",
    },
  });
  console.log("Created employer user:", employer.email);

  // Create company membership for employer
  await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: employer.id,
        companyId: company.id,
      },
    },
    update: {},
    create: {
      userId: employer.id,
      companyId: company.id,
      role: "EMPLOYER",
    },
  });

  // Create employee users
  const employee1Password = await bcrypt.hash("employee123", 10);
  const employee1 = await prisma.user.upsert({
    where: { email: "alice@acme.com" },
    update: {},
    create: {
      email: "alice@acme.com",
      name: "Alice Johnson",
      password: employee1Password,
      role: "EMPLOYEE",
    },
  });

  const employee2Password = await bcrypt.hash("employee123", 10);
  const employee2 = await prisma.user.upsert({
    where: { email: "bob@acme.com" },
    update: {},
    create: {
      email: "bob@acme.com",
      name: "Bob Smith",
      password: employee2Password,
      role: "EMPLOYEE",
    },
  });

  const employee3Password = await bcrypt.hash("employee123", 10);
  const employee3 = await prisma.user.upsert({
    where: { email: "charlie@acme.com" },
    update: {},
    create: {
      email: "charlie@acme.com",
      name: "Charlie Brown",
      password: employee3Password,
      role: "EMPLOYEE",
    },
  });

  // Create company memberships
  for (const employee of [employee1, employee2, employee3]) {
    await prisma.companyMembership.upsert({
      where: {
        userId_companyId: {
          userId: employee.id,
          companyId: company.id,
        },
      },
      update: {},
      create: {
        userId: employee.id,
        companyId: company.id,
        role: "EMPLOYEE",
      },
    });
  }

  // Create employee profiles
  const profile1 = await prisma.employeeProfile.upsert({
    where: { userId: employee1.id },
    update: {},
    create: {
      userId: employee1.id,
      companyId: company.id,
      employeeId: "EMP001",
      isActive: true,
    },
  });

  const profile2 = await prisma.employeeProfile.upsert({
    where: { userId: employee2.id },
    update: {},
    create: {
      userId: employee2.id,
      companyId: company.id,
      employeeId: "EMP002",
      isActive: true,
    },
  });

  const profile3 = await prisma.employeeProfile.upsert({
    where: { userId: employee3.id },
    update: {},
    create: {
      userId: employee3.id,
      companyId: company.id,
      employeeId: "EMP003",
      isActive: true,
    },
  });

  console.log("Created employee profiles");

  // Create NFC cards
  const nfcCard1 = await prisma.nFCCard.upsert({
    where: { uid: "ABC123456789" },
    update: {},
    create: {
      uid: "ABC123456789",
      userId: employee1.id,
      companyId: company.id,
      registeredBy: employer.id,
      isActive: true,
    },
  });

  const nfcCard2 = await prisma.nFCCard.upsert({
    where: { uid: "XYZ987654321" },
    update: {},
    create: {
      uid: "XYZ987654321",
      userId: employee2.id,
      companyId: company.id,
      registeredBy: employer.id,
      isActive: true,
    },
  });

  const nfcCard3 = await prisma.nFCCard.upsert({
    where: { uid: "DEF456789123" },
    update: {},
    create: {
      uid: "DEF456789123",
      userId: employee3.id,
      companyId: company.id,
      registeredBy: employer.id,
      isActive: true,
    },
  });

  console.log("Created NFC cards");

  // Create attendance events for the past few days
  const today = new Date();
  today.setHours(9, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Sample coordinates (San Francisco area)
  const baseLat = 37.7749;
  const baseLng = -122.4194;

  const attendanceEvents = [
    // Employee 1 - Two days ago
    {
      userId: employee1.id,
      companyId: company.id,
      nfcCardId: nfcCard1.id,
      eventType: "CLOCK_IN",
      locationLat: baseLat + 0.001,
      locationLng: baseLng + 0.001,
      accuracyMeters: 10,
      address: "123 Main St, San Francisco, CA 94102",
      capturedAt: new Date(twoDaysAgo.setHours(9, 0, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
    {
      userId: employee1.id,
      companyId: company.id,
      nfcCardId: nfcCard1.id,
      eventType: "CLOCK_OUT",
      locationLat: baseLat + 0.001,
      locationLng: baseLng + 0.001,
      accuracyMeters: 10,
      address: "123 Main St, San Francisco, CA 94102",
      capturedAt: new Date(twoDaysAgo.setHours(17, 30, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
    // Employee 1 - Yesterday
    {
      userId: employee1.id,
      companyId: company.id,
      nfcCardId: nfcCard1.id,
      eventType: "CLOCK_IN",
      locationLat: baseLat + 0.002,
      locationLng: baseLng + 0.002,
      accuracyMeters: 15,
      address: "125 Main St, San Francisco, CA 94102",
      capturedAt: new Date(yesterday.setHours(8, 45, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
    {
      userId: employee1.id,
      companyId: company.id,
      nfcCardId: nfcCard1.id,
      eventType: "CLOCK_OUT",
      locationLat: baseLat + 0.002,
      locationLng: baseLng + 0.002,
      accuracyMeters: 15,
      address: "125 Main St, San Francisco, CA 94102",
      capturedAt: new Date(yesterday.setHours(17, 15, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
    // Employee 2 - Yesterday
    {
      userId: employee2.id,
      companyId: company.id,
      nfcCardId: nfcCard2.id,
      eventType: "CLOCK_IN",
      locationLat: baseLat - 0.001,
      locationLng: baseLng - 0.001,
      accuracyMeters: 12,
      address: "456 Market St, San Francisco, CA 94103",
      capturedAt: new Date(yesterday.setHours(9, 15, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
    {
      userId: employee2.id,
      companyId: company.id,
      nfcCardId: nfcCard2.id,
      eventType: "CLOCK_OUT",
      locationLat: baseLat - 0.001,
      locationLng: baseLng - 0.001,
      accuracyMeters: 12,
      address: "456 Market St, San Francisco, CA 94103",
      capturedAt: new Date(yesterday.setHours(18, 0, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
    // Employee 3 - Today
    {
      userId: employee3.id,
      companyId: company.id,
      nfcCardId: nfcCard3.id,
      eventType: "CLOCK_IN",
      locationLat: baseLat,
      locationLng: baseLng,
      accuracyMeters: 8,
      address: "789 Mission St, San Francisco, CA 94105",
      capturedAt: new Date(today.setHours(8, 30, 0)),
      deviceInfo: "Mozilla/5.0 (Android; Mobile; rv:109.0)",
    },
  ];

  for (const event of attendanceEvents) {
    await prisma.attendanceEvent.create({ data: event });
  }

  console.log("Created attendance events");

  // Create timesheets
  const timesheets = [
    {
      userId: employee1.id,
      companyId: company.id,
      date: twoDaysAgo,
      clockInId: (await prisma.attendanceEvent.findFirst({
        where: {
          userId: employee1.id,
          eventType: "CLOCK_IN",
          capturedAt: {
            gte: new Date(twoDaysAgo.setHours(0, 0, 0)),
            lt: new Date(twoDaysAgo.setHours(23, 59, 59)),
          },
        },
      }))?.id,
      clockOutId: (await prisma.attendanceEvent.findFirst({
        where: {
          userId: employee1.id,
          eventType: "CLOCK_OUT",
          capturedAt: {
            gte: new Date(twoDaysAgo.setHours(0, 0, 0)),
            lt: new Date(twoDaysAgo.setHours(23, 59, 59)),
          },
        },
      }))?.id,
      hoursWorked: 8.5,
    },
    {
      userId: employee1.id,
      companyId: company.id,
      date: yesterday,
      clockInId: (await prisma.attendanceEvent.findFirst({
        where: {
          userId: employee1.id,
          eventType: "CLOCK_IN",
          capturedAt: {
            gte: new Date(yesterday.setHours(0, 0, 0)),
            lt: new Date(yesterday.setHours(23, 59, 59)),
          },
        },
      }))?.id,
      clockOutId: (await prisma.attendanceEvent.findFirst({
        where: {
          userId: employee1.id,
          eventType: "CLOCK_OUT",
          capturedAt: {
            gte: new Date(yesterday.setHours(0, 0, 0)),
            lt: new Date(yesterday.setHours(23, 59, 59)),
          },
        },
      }))?.id,
      hoursWorked: 8.5,
    },
    {
      userId: employee2.id,
      companyId: company.id,
      date: yesterday,
      clockInId: (await prisma.attendanceEvent.findFirst({
        where: {
          userId: employee2.id,
          eventType: "CLOCK_IN",
          capturedAt: {
            gte: new Date(yesterday.setHours(0, 0, 0)),
            lt: new Date(yesterday.setHours(23, 59, 59)),
          },
        },
      }))?.id,
      clockOutId: (await prisma.attendanceEvent.findFirst({
        where: {
          userId: employee2.id,
          eventType: "CLOCK_OUT",
          capturedAt: {
            gte: new Date(yesterday.setHours(0, 0, 0)),
            lt: new Date(yesterday.setHours(23, 59, 59)),
          },
        },
      }))?.id,
      hoursWorked: 8.75,
    },
  ];

  for (const timesheet of timesheets) {
    if (timesheet.clockInId && timesheet.clockOutId) {
      await prisma.timesheet.upsert({
        where: {
          userId_companyId_date: {
            userId: timesheet.userId,
            companyId: timesheet.companyId,
            date: timesheet.date,
          },
        },
        update: timesheet,
        create: timesheet,
      });
    }
  }

  console.log("Created timesheets");
  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
