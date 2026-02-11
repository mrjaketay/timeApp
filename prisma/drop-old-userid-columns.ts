import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function dropOldColumns() {
  console.log("Dropping old userId columns...");
  
  await prisma.$executeRaw`ALTER TABLE "EmployeeProfile" DROP COLUMN IF EXISTS "userId";`;
  await prisma.$executeRaw`ALTER TABLE "NFCCard" DROP COLUMN IF EXISTS "userId";`;
  await prisma.$executeRaw`ALTER TABLE "AttendanceEvent" DROP COLUMN IF EXISTS "userId";`;
  await prisma.$executeRaw`ALTER TABLE "Timesheet" DROP COLUMN IF EXISTS "userId";`;
  
  console.log("✅ Old columns dropped");
  await prisma.$disconnect();
}

dropOldColumns();
