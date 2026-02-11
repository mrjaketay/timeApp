"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const completeOnboardingSchema = z.object({
  phone: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  address: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  timezone: z.string().default("UTC"),
  step: z.number().min(1).max(4),
});

export async function completeOnboarding(data: z.infer<typeof completeOnboardingSchema>) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return { error: "Unauthorized" };
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;
  if (!companyId) {
    return { error: "No company associated with your account." };
  }

  try {
    const validated = completeOnboardingSchema.parse(data);

    // Update company information
    await prisma.company.update({
      where: { id: companyId },
      data: {
        phone: validated.phone || null,
        website: validated.website || null,
        address: validated.address || null,
        industry: validated.industry || null,
        companySize: validated.companySize || null,
        timezone: validated.timezone || "UTC",
      },
    });

    // Update user onboarding status
    const isComplete = validated.step >= 2; // Complete if reached step 2 or more
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: isComplete,
        onboardingStep: isComplete ? 4 : validated.step,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
    return { success: true, message: "Onboarding completed successfully." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error completing onboarding:", error);
    return { error: "Failed to complete onboarding." };
  }
}

export async function getOnboardingProgress() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        onboardingCompleted: true,
        onboardingStep: true,
        companyMemberships: {
          select: {
            company: {
              select: {
                phone: true,
                website: true,
                address: true,
                industry: true,
                companySize: true,
                timezone: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    const company = user.companyMemberships[0]?.company;
    const completedFields = [
      company?.phone,
      company?.website,
      company?.address,
      company?.industry,
      company?.companySize,
      company?.timezone && company.timezone !== "UTC",
    ].filter(Boolean).length;

    const totalFields = 6;
    const completionPercentage = user.onboardingCompleted 
      ? 100 
      : Math.round((completedFields / totalFields) * 100);

    return {
      success: true,
      progress: {
        completed: user.onboardingCompleted,
        step: user.onboardingStep,
        percentage: completionPercentage,
      },
    };
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return { error: "Failed to fetch onboarding progress." };
  }
}

export async function updateCompanyProfile(data: {
  phone?: string;
  website?: string;
  address?: string;
  industry?: string;
  companySize?: string;
  timezone?: string;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    return { error: "Unauthorized" };
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;
  if (!companyId) {
    return { error: "No company associated with your account." };
  }

  try {
    await prisma.company.update({
      where: { id: companyId },
      data: {
        phone: data.phone || null,
        website: data.website || null,
        address: data.address || null,
        industry: data.industry || null,
        companySize: data.companySize || null,
        timezone: data.timezone || "UTC",
      },
    });

    // Recalculate onboarding progress
    const progress = await getOnboardingProgress();
    if (progress.success && progress.progress.percentage === 100) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          onboardingCompleted: true,
          onboardingStep: 4,
        },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true, message: "Company profile updated successfully." };
  } catch (error) {
    console.error("Error updating company profile:", error);
    return { error: "Failed to update company profile." };
  }
}
