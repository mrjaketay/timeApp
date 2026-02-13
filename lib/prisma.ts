import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use placeholder during build when DATABASE_URL is not set (e.g. Netlify build step).
// At runtime the real DATABASE_URL is injected by the host.
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://localhost:5432/build";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
