"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/get-session";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const putEmployeeOnBreakSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  notes: z.string().optional(),
});

const clockOutEmployeeSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  notes: z.string().optional(),
});

const endEmployeeBreakSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  notes: z.string().optional(),
});

/**
 * Put an employee on break (employer/admin only)
 */
export async function putEmployeeOnBreak(data: z.infer<typeof putEmployeeOnBreakSchema>) {
  const session = await getSession();

  if (!session?.user || (session.user.role !== "EMPLOYER" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;
  if (!companyId) {
    return { error: "No company associated with your account." };
  }

  try {
    const validated = putEmployeeOnBreakSchema.parse(data);

    // Verify employee belongs to this company
    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { id: validated.employeeId },
      select: { companyId: true, isActive: true },
    });

    if (!employeeProfile || employeeProfile.companyId !== companyId) {
      return { error: "Employee not found or does not belong to your company." };
    }

    if (!employeeProfile.isActive) {
      return { error: "Employee is not active." };
    }

    // Check if employee is currently clocked in
    const lastEvent = await prisma.attendanceEvent.findFirst({
      where: {
        employeeProfileId: validated.employeeId,
        companyId,
      },
      orderBy: { capturedAt: "desc" },
    });

    if (!lastEvent || lastEvent.eventType !== "CLOCK_IN") {
      return { error: "Employee must be clocked in to go on break." };
    }

    // Check if already on break
    const breakEvents = await prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: { in: ["BREAK_START", "BREAK_END"] },
        capturedAt: {
          gte: lastEvent.capturedAt, // After last clock in
        },
      },
      orderBy: { capturedAt: "desc" },
    });

    if (breakEvents.length > 0 && breakEvents[0].eventType === "BREAK_START") {
      return { error: "Employee is already on break." };
    }

    // Get company location for break event (use last clock-in location or company default)
    const locationLat = lastEvent.locationLat;
    const locationLng = lastEvent.locationLng;
    const address = lastEvent.address || null;

    // Create break start event
    await prisma.attendanceEvent.create({
      data: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: "BREAK_START",
        locationLat,
        locationLng,
        accuracyMeters: lastEvent.accuracyMeters,
        address,
        notes: validated.notes || `Break started by ${session.user.name || session.user.email}`,
      },
    });

    revalidatePath("/dashboard/attendance/manage");
    return { success: true, message: "Employee put on break successfully." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error putting employee on break:", error);
    return { error: "Failed to put employee on break." };
  }
}

/**
 * End an employee's break (employer/admin only)
 */
export async function endEmployeeBreak(data: z.infer<typeof endEmployeeBreakSchema>) {
  const session = await getSession();

  if (!session?.user || (session.user.role !== "EMPLOYER" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;
  if (!companyId) {
    return { error: "No company associated with your account." };
  }

  try {
    const validated = endEmployeeBreakSchema.parse(data);

    // Verify employee belongs to this company
    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { id: validated.employeeId },
      select: { companyId: true },
    });

    if (!employeeProfile || employeeProfile.companyId !== companyId) {
      return { error: "Employee not found or does not belong to your company." };
    }

    // Check if employee is on break
    const breakStartEvent = await prisma.attendanceEvent.findFirst({
      where: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: "BREAK_START",
      },
      orderBy: { capturedAt: "desc" },
    });

    if (!breakStartEvent) {
      return { error: "Employee is not currently on break." };
    }

    // Check if break was already ended
    const breakEndEvent = await prisma.attendanceEvent.findFirst({
      where: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: "BREAK_END",
        capturedAt: {
          gte: breakStartEvent.capturedAt,
        },
      },
    });

    if (breakEndEvent) {
      return { error: "Break has already been ended." };
    }

    // Create break end event
    await prisma.attendanceEvent.create({
      data: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: "BREAK_END",
        locationLat: breakStartEvent.locationLat,
        locationLng: breakStartEvent.locationLng,
        accuracyMeters: breakStartEvent.accuracyMeters,
        address: breakStartEvent.address,
        notes: validated.notes || `Break ended by ${session.user.name || session.user.email}`,
      },
    });

    revalidatePath("/dashboard/attendance/manage");
    return { success: true, message: "Employee break ended successfully." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error ending employee break:", error);
    return { error: "Failed to end employee break." };
  }
}

/**
 * Clock out an employee manually (employer/admin only)
 */
export async function clockOutEmployee(data: z.infer<typeof clockOutEmployeeSchema>) {
  const session = await getSession();

  if (!session?.user || (session.user.role !== "EMPLOYER" && session.user.role !== "ADMIN")) {
    return { error: "Unauthorized" };
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;
  if (!companyId) {
    return { error: "No company associated with your account." };
  }

  try {
    const validated = clockOutEmployeeSchema.parse(data);

    // Verify employee belongs to this company
    const employeeProfile = await prisma.employeeProfile.findUnique({
      where: { id: validated.employeeId },
      select: { companyId: true },
    });

    if (!employeeProfile || employeeProfile.companyId !== companyId) {
      return { error: "Employee not found or does not belong to your company." };
    }

    // Get last clock in event
    const lastClockIn = await prisma.attendanceEvent.findFirst({
      where: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: "CLOCK_IN",
      },
      orderBy: { capturedAt: "desc" },
    });

    // Check if there's a later clock out
    if (lastClockIn) {
      const laterClockOut = await prisma.attendanceEvent.findFirst({
        where: {
          employeeProfileId: validated.employeeId,
          companyId,
          eventType: "CLOCK_OUT",
          capturedAt: {
            gt: lastClockIn.capturedAt,
          },
        },
      });

      if (laterClockOut) {
        return { error: "Employee is already clocked out." };
      }
    } else {
      return { error: "Employee is not currently clocked in." };
    }

    // Get location from last clock in
    const locationLat = lastClockIn.locationLat;
    const locationLng = lastClockIn.locationLng;
    const address = lastClockIn.address || null;

    // Create clock out event
    const clockOutEvent = await prisma.attendanceEvent.create({
      data: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: "CLOCK_OUT",
        locationLat,
        locationLng,
        accuracyMeters: lastClockIn.accuracyMeters,
        address,
        notes: validated.notes || `Manually clocked out by ${session.user.name || session.user.email}`,
      },
    });

    // Update timesheet
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    // Calculate hours worked (including break time)
    const hoursWorked = (clockOutEvent.capturedAt.getTime() - lastClockIn.capturedAt.getTime()) / (1000 * 60 * 60);

    // Calculate break minutes
    const breakEvents = await prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: validated.employeeId,
        companyId,
        eventType: { in: ["BREAK_START", "BREAK_END"] },
        capturedAt: {
          gte: lastClockIn.capturedAt,
          lte: clockOutEvent.capturedAt,
        },
      },
      orderBy: { capturedAt: "asc" },
    });

    let breakMinutes = 0;
    for (let i = 0; i < breakEvents.length; i += 2) {
      if (breakEvents[i]?.eventType === "BREAK_START" && breakEvents[i + 1]?.eventType === "BREAK_END") {
        const breakDuration = (breakEvents[i + 1].capturedAt.getTime() - breakEvents[i].capturedAt.getTime()) / (1000 * 60);
        breakMinutes += breakDuration;
      }
    }

    await prisma.timesheet.upsert({
      where: {
        employeeProfileId_companyId_date: {
          employeeProfileId: validated.employeeId,
          companyId,
          date,
        },
      },
      update: {
        clockOutId: clockOutEvent.id,
        hoursWorked,
        breakMinutes: Math.round(breakMinutes),
        updatedAt: new Date(),
      },
      create: {
        employeeProfileId: validated.employeeId,
        companyId,
        date,
        clockInId: lastClockIn.id,
        clockOutId: clockOutEvent.id,
        hoursWorked,
        breakMinutes: Math.round(breakMinutes),
      },
    });

    revalidatePath("/dashboard/attendance/manage");
    return { success: true, message: "Employee clocked out successfully." };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    console.error("Error clocking out employee:", error);
    return { error: "Failed to clock out employee." };
  }
}
