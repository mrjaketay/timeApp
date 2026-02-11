"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { PLANS, PlanType } from "@/lib/subscription";

const createCheckoutSchema = z.object({
  planId: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]),
  interval: z.enum(["month", "year"]),
});

// Create Stripe checkout session (placeholder - integrate Stripe SDK)
export async function createCheckoutSession(data: z.infer<typeof createCheckoutSchema>) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    const validated = createCheckoutSchema.parse(data);

    // Free plan - activate immediately
    if (validated.planId === "FREE") {
      await prisma.subscription.upsert({
        where: { companyId },
        update: {
          plan: "FREE",
          status: "ACTIVE",
        },
        create: {
          companyId,
          plan: "FREE",
          status: "ACTIVE",
        },
      });

      revalidatePath("/dashboard/billing");
      return { success: true };
    }

    // Enterprise - return contact info
    if (validated.planId === "ENTERPRISE") {
      return { error: "Please contact sales@timetrack.com for Enterprise pricing" };
    }

    // Paid plans - activate immediately (for demo/testing)
    // In production, integrate Stripe checkout here
    const plan = PLANS[validated.planId];
    
    // For now, activate the plan immediately without payment
    // TODO: Integrate Stripe checkout session creation
    await prisma.subscription.upsert({
      where: { companyId },
      update: {
        plan: validated.planId,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (validated.interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
      create: {
        companyId,
        plan: validated.planId,
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (validated.interval === "year" ? 365 : 30) * 24 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/dashboard/billing");
    revalidatePath("/pricing");
    
    return {
      success: true,
      message: `${plan.name} plan activated successfully!`,
    };
  } catch (error) {
    console.error("Create checkout session error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create checkout session" };
  }
}

// Get company subscription
export async function getCompanySubscription() {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    let subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    // Create FREE subscription if none exists (auto-create for existing companies)
    if (!subscription) {
      try {
        subscription = await prisma.subscription.create({
          data: {
            companyId,
            plan: "FREE",
            status: "ACTIVE",
          },
        });
      } catch (createError) {
        // If create fails (e.g., race condition), try to fetch again
        console.error("Error creating subscription:", createError);
        subscription = await prisma.subscription.findUnique({
          where: { companyId },
        });
        
        // If still no subscription, return error
        if (!subscription) {
          return { error: "Failed to initialize subscription" };
        }
      }
    }

    return { success: true, subscription };
  } catch (error) {
    console.error("Get subscription error:", error);
    // Return error but don't throw - let calling code handle gracefully
    return { error: "Failed to get subscription" };
  }
}

// Cancel subscription
export async function cancelSubscription() {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
    });

    if (!subscription) {
      return { error: "No subscription found" };
    }

    // If already on FREE, nothing to cancel
    if (subscription.plan === "FREE") {
      return { error: "You are already on the Free plan" };
    }

    // Cancel at period end
    await prisma.subscription.update({
      where: { companyId },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    // TODO: Cancel Stripe subscription

    revalidatePath("/dashboard/billing");
    return { success: true, message: "Subscription will be canceled at the end of the billing period" };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { error: "Failed to cancel subscription" };
  }
}

// Update subscription plan
export async function updateSubscriptionPlan(planId: PlanType) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    const validated = createCheckoutSchema.parse({ planId, interval: "month" });

    await prisma.subscription.upsert({
      where: { companyId },
      update: {
        plan: validated.planId,
      },
      create: {
        companyId,
        plan: validated.planId,
        status: "ACTIVE",
      },
    });

    revalidatePath("/dashboard/billing");
    return { success: true, message: "Subscription updated successfully" };
  } catch (error) {
    console.error("Update subscription error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update subscription" };
  }
}
