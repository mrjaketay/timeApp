"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required to save changes"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function updateProfile(data: z.infer<typeof updateProfileSchema>) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const validated = updateProfileSchema.parse(data);

    // Verify password before allowing changes
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return { error: "User not found or no password set" };
    }

    const isValid = await bcrypt.compare(validated.password, user.password);
    if (!isValid) {
      return { error: "Password is incorrect" };
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return { error: "Email is already taken by another account" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: validated.name,
        email: validated.email.toLowerCase().trim(),
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Update profile error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    const validated = changePasswordSchema.parse(data);

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return { error: "User not found or no password set" };
    }

    // Verify current password
    const isValid = await bcrypt.compare(validated.currentPassword, user.password);
    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Change password error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to change password" };
  }
}

export async function updateProfileImage(imageUrl: string | null) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return { error: "Unauthorized" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    return { success: true, message: "Profile picture updated successfully" };
  } catch (error) {
    console.error("Update profile image error:", error);
    return { error: "Failed to update profile picture" };
  }
}
