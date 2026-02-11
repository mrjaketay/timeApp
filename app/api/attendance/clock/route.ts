import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const clockSchema = z.object({
  nfcCardId: z.string().optional(), // NFC card UID or employee code
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0),
  address: z.string().optional(),
  deviceInfo: z.string().optional(),
  eventType: z.enum(["CLOCK_IN", "CLOCK_OUT"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = clockSchema.parse(body);

    // Verify location is provided (mandatory requirement)
    if (!validated.locationLat || !validated.locationLng) {
      return NextResponse.json(
        { error: "Location is required for clock in/out" },
        { status: 400 }
      );
    }

    // Verify NFC card ID or employee code is provided
    if (!validated.nfcCardId) {
      return NextResponse.json(
        { error: "NFC card ID or employee code is required" },
        { status: 400 }
      );
    }

    // Find employee by NFC card UID or employee code
    let employeeProfile = null;
    let nfcCard = null;

    // Try to find by NFC card UID first
    nfcCard = await prisma.nFCCard.findUnique({
      where: { uid: validated.nfcCardId },
      include: {
        employeeProfile: {
          include: {
            company: true,
          },
        },
      },
    });

    if (nfcCard && nfcCard.isActive) {
      employeeProfile = nfcCard.employeeProfile;
    } else {
      // If not found by NFC UID, try to find by employee code
      employeeProfile = await prisma.employeeProfile.findFirst({
        where: {
          employeeId: validated.nfcCardId,
          isActive: true,
        },
        include: {
          company: true,
          nfcCards: {
            where: { isActive: true },
            take: 1,
          },
        },
      });

      if (employeeProfile && employeeProfile.nfcCards.length > 0) {
        nfcCard = employeeProfile.nfcCards[0];
      }
    }

    if (!employeeProfile || !employeeProfile.isActive) {
      return NextResponse.json(
        { error: "Employee not found or inactive" },
        { status: 400 }
      );
    }

    const companyId = employeeProfile.companyId;

    // Get last attendance event to determine if we should clock in or out
    const lastEvent = await prisma.attendanceEvent.findFirst({
      where: {
        employeeProfileId: employeeProfile.id,
        companyId,
      },
      orderBy: {
        capturedAt: "desc",
      },
    });

    // Determine event type
    let eventType = validated.eventType;
    
    // If event type not provided, determine from last event
    if (!eventType) {
      if (lastEvent && lastEvent.eventType === "CLOCK_IN") {
        // Check if it's a double clock in (within 5 minutes)
        const timeDiff = Date.now() - lastEvent.capturedAt.getTime();
        if (timeDiff < 5 * 60 * 1000) {
          return NextResponse.json(
            { error: "Please wait before clocking in again" },
            { status: 400 }
          );
        }
        eventType = "CLOCK_OUT";
      } else if (lastEvent && lastEvent.eventType === "CLOCK_OUT") {
        eventType = "CLOCK_IN";
      } else {
        eventType = "CLOCK_IN"; // Default to clock in if no previous event
      }
    } else {
      // Validate that event type matches expected state
      if (eventType === "CLOCK_IN" && lastEvent && lastEvent.eventType === "CLOCK_IN") {
        const timeDiff = Date.now() - lastEvent.capturedAt.getTime();
        if (timeDiff < 5 * 60 * 1000) {
          return NextResponse.json(
            { error: "Already clocked in. Please clock out first." },
            { status: 400 }
          );
        }
      }
      if (eventType === "CLOCK_OUT" && (!lastEvent || lastEvent.eventType === "CLOCK_OUT")) {
        return NextResponse.json(
          { error: "No active clock in found. Please clock in first." },
          { status: 400 }
        );
      }
    }

    // Create attendance event
    const attendanceEvent = await prisma.attendanceEvent.create({
      data: {
        employeeProfileId: employeeProfile.id,
        companyId,
        nfcCardId: nfcCard?.id,
        eventType,
        locationLat: validated.locationLat,
        locationLng: validated.locationLng,
        accuracyMeters: validated.accuracyMeters,
        address: validated.address,
        deviceInfo: validated.deviceInfo,
      },
    });

    // Update timesheet if clock out
    if (eventType === "CLOCK_OUT" && lastEvent) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      const hoursWorked =
        (attendanceEvent.capturedAt.getTime() - lastEvent.capturedAt.getTime()) /
        (1000 * 60 * 60);

      await prisma.timesheet.upsert({
        where: {
          employeeProfileId_companyId_date: {
            employeeProfileId: employeeProfile.id,
            companyId,
            date,
          },
        },
        update: {
          clockOutId: attendanceEvent.id,
          hoursWorked,
          updatedAt: new Date(),
        },
        create: {
          employeeProfileId: employeeProfile.id,
          companyId,
          date,
          clockInId: lastEvent.id,
          clockOutId: attendanceEvent.id,
          hoursWorked,
        },
      });
    }

    // Update NFC card last used
    if (nfcCard) {
      await prisma.nFCCard.update({
        where: { id: nfcCard.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      eventType,
      employeeName: employeeProfile.name,
      attendanceEvent,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Clock error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
