import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use placeholder during build when DATABASE_URL is not set (e.g. Netlify build step).
// At runtime the real DATABASE_URL must be set or login and all DB operations will fail.
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://localhost:5432/build";

if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.DATABASE_URL
) {
  console.warn(
    "[Prisma] DATABASE_URL is not set in production. Login and database operations will fail. Set DATABASE_URL in your host environment (e.g. Netlify env vars)."
  );
}

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
