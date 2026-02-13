import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

function getAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "NEXTAUTH_SECRET is not set. Please create a .env file in the root directory with:\n\n" +
      "NEXTAUTH_SECRET=\"your-secret-here\"\n" +
      "NEXTAUTH_URL=\"http://localhost:3000\"\n" +
      "DATABASE_URL=\"postgresql://user:password@localhost:5432/timetrack\"\n\n" +
      "Generate NEXTAUTH_SECRET in PowerShell:\n" +
      "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))"
    );
  }
  // Clean the secret (remove BOM, trim whitespace, remove quotes if wrapped)
  const cleaned = secret.trim().replace(/^["']|["']$/g, '');
  if (cleaned.length < 32) {
    console.warn("[Auth] Warning: NEXTAUTH_SECRET should be at least 32 characters long");
  }
  return cleaned;
}

// Validate environment variables on first load
function validateEnvVars() {
  const secret = process.env.NEXTAUTH_SECRET;
  const url = process.env.NEXTAUTH_URL || process.env.NEXTAUTH_URL_INTERNAL;
  const dbUrl = process.env.DATABASE_URL;

  if (!secret) {
    console.error("[Auth] ERROR: NEXTAUTH_SECRET is not set");
  } else {
    console.log("[Auth] ✓ NEXTAUTH_SECRET is configured");
  }

  if (!url) {
    console.warn("[Auth] WARNING: NEXTAUTH_URL is not set, defaulting to http://localhost:3000");
  } else {
    console.log(`[Auth] ✓ NEXTAUTH_URL is configured: ${url}`);
  }

  if (!dbUrl) {
    console.error("[Auth] ERROR: DATABASE_URL is not set");
  } else {
    console.log("[Auth] ✓ DATABASE_URL is configured");
  }
}

// Run validation once when module loads (non-blocking)
if (typeof window === 'undefined') {
  validateEnvVars();
}

function getAuthOptions(): NextAuthOptions {
  return {
    secret: getAuthSecret(),
    debug: process.env.NODE_ENV === "development",
    providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[Auth] Missing email or password");
            return null;
          }

          const email = credentials.email.toLowerCase().trim();

          // findFirst with mode: 'insensitive' so login works regardless of email casing in DB (PostgreSQL is case-sensitive)
          const user = await prisma.user.findFirst({
            where: {
              email: { equals: email, mode: "insensitive" },
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              companyMemberships: {
                select: {
                  companyId: true,
                  role: true,
                  company: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          });

          if (!user) {
            console.log(`[Auth] User not found: ${email}`);
            return null;
          }

          if (!user.password) {
            console.log(`[Auth] User has no password set: ${email}`);
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log(`[Auth] Invalid password for: ${email}`);
            return null;
          }

          console.log(`[Auth] Successfully authenticated: ${email} (${user.role})`);

          // Only include essential data in JWT token (not full company objects)
          // ADMIN users might not have companyMemberships, so handle that
          const companyMemberships = user.companyMemberships?.map((membership) => ({
            companyId: membership.companyId,
            role: membership.role,
          })) || [];

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyMemberships,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const stack = error instanceof Error ? error.stack : undefined;
          console.error("[Auth] Error during authentication:", message, stack ? "\n" + stack : "");
          // Return null to show login failed; don't expose DB details to client
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyMemberships = user.companyMemberships || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as string) || "EMPLOYER";
        session.user.companyMemberships = (token.companyMemberships as any) || [];
        
        // Log for debugging (only in development)
        if (process.env.NODE_ENV === "development") {
          console.log("[Auth/Session] Setting session - Role:", token.role, "ID:", token.id);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  };
}

// Export as getter to delay evaluation until actually needed
// This prevents the error from being thrown during module import
let _authOptions: NextAuthOptions | null = null;

export function getAuthOptionsLazy(): NextAuthOptions {
  if (!_authOptions) {
    _authOptions = getAuthOptions();
  }
  return _authOptions;
}

// Export as computed property to delay evaluation
// This will still throw if imported, but allows route handler to catch it
export const authOptions: NextAuthOptions = new Proxy({} as NextAuthOptions, {
  get() {
    return getAuthOptions();
  },
});
