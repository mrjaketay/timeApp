import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDuplicates() {
  // Set unique employeeId for any NULL or duplicate values
  await prisma.$executeRaw`
    UPDATE "EmployeeProfile" 
    SET "employeeId" = 'EMP-' || id
    WHERE "employeeId" IS NULL OR "employeeId" = '';
  `;
  
  // Fix any duplicates by making them unique
  await prisma.$executeRaw`
    UPDATE "EmployeeProfile" ep1
    SET "employeeId" = 'EMP-' || ep1.id
    WHERE EXISTS (
      SELECT 1 FROM "EmployeeProfile" ep2
      WHERE ep2."employeeId" = ep1."employeeId"
      AND ep2.id != ep1.id
      AND ep2.id < ep1.id
    );
  `;
  
  console.log("✅ Fixed duplicate employeeIds");
  await prisma.$disconnect();
}

fixDuplicates();
