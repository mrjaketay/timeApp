import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixNulls() {
  await prisma.$executeRaw`
    UPDATE "EmployeeProfile" 
    SET "name" = COALESCE("name", 'Unknown Employee')
    WHERE "name" IS NULL;
  `;
  console.log("Fixed NULL names");
  await prisma.$disconnect();
}

fixNulls();
