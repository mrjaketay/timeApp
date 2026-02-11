"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCompanySubscription } from "@/app/actions/subscription";
import { getPlan, checkLimit, getUpgradeMessage, PlanType } from "@/lib/subscription";

const inviteEmployeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const updateEmployeeSchema = z.object({
  id: z.string().min(1, "Employee ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable(),
  employeeId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  salaryRate: z
    .number()
    .nonnegative("Salary rate cannot be negative")
    .optional()
    .nullable(),
  employmentStartDate: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function inviteEmployee(data: z.infer<typeof inviteEmployeeSchema>) {
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

    // Check subscription limits (gracefully handle errors)
    try {
      const subscriptionResult = await getCompanySubscription();
      if (subscriptionResult.success && subscriptionResult.subscription) {
        const subscription = subscriptionResult.subscription;
        const plan = getPlan(subscription.plan as PlanType);
        
        // Get current employee count
        const currentEmployeeCount = await prisma.employeeProfile.count({
          where: {
            companyId,
            isActive: true,
          },
        });

        // Check if adding this employee would exceed the limit
        if (!checkLimit(subscription.plan as PlanType, "employees", currentEmployeeCount)) {
          const upgradeMessage = getUpgradeMessage(subscription.plan as PlanType, "more employees");
          return { 
            error: `You've reached your plan limit of ${plan.limits.employees} employees. ${upgradeMessage}`,
            requiresUpgrade: true,
            currentLimit: plan.limits.employees,
            currentUsage: currentEmployeeCount,
          };
        }
      }
    } catch (error) {
      // If subscription check fails, allow the employee creation to proceed
      // (graceful degradation - don't block functionality)
      console.error("Error checking subscription limits:", error);
    }

    // Validate input
    const validated = inviteEmployeeSchema.parse(data);

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
      },
    });

    if (!company) {
      return { error: "Company not found" };
    }

    // Check if employee already exists (by email or employeeId)
    const existingEmployee = await prisma.employeeProfile.findFirst({
      where: {
        OR: [
          { email: validated.email },
          ...(validated.employeeId ? [{ employeeId: validated.employeeId }] : []),
        ],
        companyId,
      },
    });

    if (existingEmployee) {
      return { error: "Employee already exists in your company" };
    }

    // Check if employeeId is unique across all companies
    if (validated.employeeId) {
      const duplicateEmployeeId = await prisma.employeeProfile.findUnique({
        where: { employeeId: validated.employeeId },
      });
      if (duplicateEmployeeId) {
        return { error: "Employee ID already exists. Please use a different ID." };
      }
    }

    // Create employee profile directly (no User record needed)
    await prisma.employeeProfile.create({
      data: {
        name: validated.name,
        email: validated.email,
        companyId,
        employeeId: validated.employeeId || undefined,
        phone: validated.phone || undefined,
        address: validated.address || undefined,
        isActive: true,
      },
    });

    revalidatePath("/dashboard/employees");
    
    return {
      success: true,
      message: "Employee added successfully! They will now appear in your employee list.",
    };
  } catch (error) {
    console.error("Add employee error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to add employee" };
  }
}

export async function updateEmployee(data: z.infer<typeof updateEmployeeSchema>) {
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

    const validated = updateEmployeeSchema.parse(data);

    const employee = await prisma.employeeProfile.findFirst({
      where: {
        id: validated.id,
        companyId,
      },
    });

    if (!employee) {
      return { error: "Employee not found" };
    }

    if (validated.email) {
      const existingEmail = await prisma.employeeProfile.findFirst({
        where: {
          email: validated.email,
          companyId,
          NOT: {
            id: validated.id,
          },
        },
      });

      if (existingEmail) {
        return { error: "Another employee already uses this email" };
      }
    }

    if (validated.employeeId) {
      const duplicateEmployeeId = await prisma.employeeProfile.findUnique({
        where: { employeeId: validated.employeeId },
      });

      if (duplicateEmployeeId && duplicateEmployeeId.id !== validated.id) {
        return { error: "Employee ID already exists. Please use a different ID." };
      }
    }

    const updateData: {
      name: string;
      email: string | null;
      employeeId: string | null;
      phone: string | null;
      address: string | null;
      salaryRate: number | null;
      employmentStartDate: Date | null;
      dateOfBirth: Date | null;
      isActive?: boolean;
    } = {
      name: validated.name,
      email: validated.email ?? null,
      employeeId: validated.employeeId ?? null,
      phone: validated.phone ?? null,
      address: validated.address ?? null,
      salaryRate:
        typeof validated.salaryRate === "number" ? validated.salaryRate : null,
      employmentStartDate: validated.employmentStartDate
        ? new Date(validated.employmentStartDate)
        : null,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
    };

    if (typeof validated.isActive === "boolean") {
      updateData.isActive = validated.isActive;
    }

    if (
      updateData.employmentStartDate &&
      Number.isNaN(updateData.employmentStartDate.getTime())
    ) {
      return { error: "Invalid employment start date" };
    }

    if (updateData.dateOfBirth && Number.isNaN(updateData.dateOfBirth.getTime())) {
      return { error: "Invalid date of birth" };
    }

    await prisma.employeeProfile.update({
      where: { id: validated.id },
      data: updateData,
    });

    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${validated.id}`);

    return {
      success: true,
      message: "Employee details updated successfully.",
    };
  } catch (error) {
    console.error("Update employee error:", error);
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update employee" };
  }
}

export async function toggleEmployeeStatus(employeeId: string, isActive: boolean) {
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

    // Verify the employee belongs to the employer's company
    const employee = await prisma.employeeProfile.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      return { error: "Employee not found" };
    }

    // Update the employee status
    await prisma.employeeProfile.update({
      where: { id: employeeId },
      data: { isActive: !isActive },
    });

    revalidatePath("/dashboard/employees");
    
    return {
      success: true,
      message: `Employee ${!isActive ? "activated" : "deactivated"} successfully.`,
    };
  } catch (error) {
    console.error("Toggle employee status error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update employee status" };
  }
}

export async function deleteEmployee(employeeId: string) {
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

    // Verify the employee belongs to the employer's company
    const employee = await prisma.employeeProfile.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      return { error: "Employee not found" };
    }

    // Delete the employee profile and related data (cascades will handle relationships)
    await prisma.$transaction(async (tx) => {
      // Delete NFC cards associated with this employee
      await tx.nFCCard.deleteMany({
        where: { employeeProfileId: employeeId },
      });

      // Delete employee profile (cascades will delete attendance events and timesheets)
      await tx.employeeProfile.delete({
        where: { id: employeeId },
      });
    });

    revalidatePath("/dashboard/employees");
    
    return {
      success: true,
      message: "Employee deleted successfully.",
    };
  } catch (error) {
    console.error("Delete employee error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to delete employee" };
  }
}

export async function updateEmployeePhoto(employeeId: string, photo: string | null) {
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

    // Verify the employee belongs to the employer's company
    const employee = await prisma.employeeProfile.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    });

    if (!employee) {
      return { error: "Employee not found" };
    }

    // Update the employee photo
    await prisma.employeeProfile.update({
      where: { id: employeeId },
      data: { photo },
    });

    revalidatePath("/dashboard/employees");
    revalidatePath(`/dashboard/employees/${employeeId}`);
    
    return {
      success: true,
      message: photo ? "Profile picture updated successfully" : "Profile picture removed successfully",
    };
  } catch (error) {
    console.error("Update employee photo error:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update profile picture" };
  }
}
