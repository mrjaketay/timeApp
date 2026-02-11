"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateSettingsSchema = z.object({
  invitationMessage: z.string().optional(),
});

export async function updateCompanySettings(data: z.infer<typeof updateSettingsSchema>) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    const validated = updateSettingsSchema.parse(data);

    await prisma.company.update({
      where: { id: companyId },
      data: {
        invitationMessage: validated.invitationMessage || null,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true, message: "Settings updated successfully" };
  } catch (error) {
    console.error("Update settings error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update settings" };
  }
}

export async function getCompanySettings() {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        invitationMessage: true,
      },
    });

    return { success: true, settings: company };
  } catch (error) {
    console.error("Get settings error:", error);
    return { error: "Failed to get settings" };
  }
}
