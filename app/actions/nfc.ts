"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { normalizeNfcUid } from "@/lib/nfc-uid";

const registerNFCCardSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  employeeProfileId: z.string().min(1, "Employee ID is required"),
});

export async function registerNFCCard(data: z.infer<typeof registerNFCCardSchema>) {
  try {
    // Check authentication
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return { error: "Unauthorized" };
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return { error: "No company found for your account" };
    }

    // Validate input
    const validated = registerNFCCardSchema.parse(data);
    const normalizedUid = normalizeNfcUid(validated.uid);

    // Check if card already exists (by normalized UID so 04:A1 and 04a1 are treated as same)
    const existingCard = await prisma.nFCCard.findUnique({
      where: { uid: normalizedUid },
    });

    if (existingCard) {
      return { error: "This NFC card is already registered" };
    }

    // Verify the employee belongs to the company
    const employee = await prisma.employeeProfile.findFirst({
      where: {
        id: validated.employeeProfileId,
        companyId,
        isActive: true,
      },
    });

    if (!employee) {
      return { error: "Employee not found or is not active" };
    }

    // Create the NFC card (store normalized UID so tap URL and lookups match)
    await prisma.nFCCard.create({
      data: {
        uid: normalizedUid,
        employeeProfileId: validated.employeeProfileId,
        companyId,
        registeredBy: session.user.id,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/nfc-cards");
    
    return {
      success: true,
      message: "NFC card registered successfully",
    };
  } catch (error) {
    console.error("Register NFC card error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to register NFC card" };
  }
}
