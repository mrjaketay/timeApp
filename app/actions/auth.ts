"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { revalidatePath } from "next/cache";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  role: z.enum(["ADMIN", "EMPLOYER", "EMPLOYEE"]).default("EMPLOYER"),
});

export async function register(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse(data);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user and company in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: validated.name,
          email: validated.email,
          password: hashedPassword,
          role: validated.role,
          onboardingCompleted: false,
          onboardingStep: 0, // Start at 0, will be updated during onboarding
        },
      });

      // Create company if employer
      let company = null;
      if (validated.role === "EMPLOYER") {
        const slug = validated.companyName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        
        company = await tx.company.create({
          data: {
            name: validated.companyName,
            slug: `${slug}-${Date.now()}`,
            timezone: "UTC", // Default, can be updated in onboarding
          },
        });

        // Create company membership
        await tx.companyMembership.create({
          data: {
            userId: user.id,
            companyId: company.id,
            role: validated.role,
          },
        });
      }

      return { user, company };
    });

    return { success: true, user: result.user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to register user" };
  }
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function login(data: z.infer<typeof loginSchema>) {
  try {
    const validated = loginSchema.parse(data);
    // Login is handled by NextAuth, but we can validate here
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to login" };
  }
}
