import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ManageAttendanceList } from "@/components/manage-attendance-list";

export default async function ManageAttendancePage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getSession();

  if (!session?.user || (session.user.role !== "EMPLOYER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Attendance</h1>
          <p className="text-muted-foreground">Manage employee attendance and breaks</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No company found for your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build where clause for employee search
  const where: any = {
    companyId,
    isActive: true,
  };

  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    where.OR = [
      { name: { contains: searchLower, mode: "insensitive" } },
      { email: { contains: searchLower, mode: "insensitive" } },
    ];
  }

  // Get all active employees - optimized
  const employees = await prisma.employeeProfile.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const employeeProfileIds = employees.map(e => e.id);

  // Fetch all attendance data in bulk - MUCH faster than N+1 queries
  const [allEvents, allClockIns, allClockOuts, allBreakEvents] = await Promise.all([
    // Get all recent events - we'll filter in memory
    prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: { in: employeeProfileIds },
        companyId,
      },
      orderBy: { capturedAt: "desc" },
      select: {
        id: true,
        employeeProfileId: true,
        eventType: true,
        capturedAt: true,
      },
      take: Math.min(employeeProfileIds.length * 5, 100), // Limit to 100 events max
    }),
    // Get all clock ins - we'll get most recent per employee in memory
    prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: { in: employeeProfileIds },
        companyId,
        eventType: "CLOCK_IN",
      },
      orderBy: { capturedAt: "desc" },
      select: {
        id: true,
        employeeProfileId: true,
        capturedAt: true,
      },
      take: employeeProfileIds.length * 2, // Get recent clock ins per employee
    }),
    // Get clock outs after their last clock in
    prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: { in: employeeProfileIds },
        companyId,
        eventType: "CLOCK_OUT",
      },
      orderBy: { capturedAt: "desc" },
      select: {
        id: true,
        employeeProfileId: true,
        capturedAt: true,
      },
    }),
    // Get break events
    prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: { in: employeeProfileIds },
        companyId,
        eventType: { in: ["BREAK_START", "BREAK_END"] },
      },
      orderBy: { capturedAt: "desc" },
      select: {
        id: true,
        employeeProfileId: true,
        eventType: true,
        capturedAt: true,
      },
    }),
  ]);

  // Create maps for O(1) lookup - get most recent per employee
  const lastEventMap = new Map();
  allEvents.forEach(e => {
    if (!lastEventMap.has(e.employeeProfileId)) {
      lastEventMap.set(e.employeeProfileId, e);
    }
  });
  
  const clockInMap = new Map();
  allClockIns.forEach(e => {
    if (!clockInMap.has(e.employeeProfileId)) {
      clockInMap.set(e.employeeProfileId, e);
    }
  });
  const clockOutMap = new Map<string, typeof allClockOuts[0]>();
  allClockOuts.forEach(co => {
    const existing = clockOutMap.get(co.employeeProfileId);
    if (!existing || co.capturedAt > existing.capturedAt) {
      clockOutMap.set(co.employeeProfileId, co);
    }
  });
  const breakEventsMap = new Map<string, typeof allBreakEvents[0]>();
  allBreakEvents.forEach(be => {
    const existing = breakEventsMap.get(be.employeeProfileId);
    if (!existing || be.capturedAt > existing.capturedAt) {
      breakEventsMap.set(be.employeeProfileId, be);
    }
  });

  // Process employee statuses - all in memory now, no more queries
  const employeeStatuses = employees.map((employee) => {
    const lastEvent = lastEventMap.get(employee.id);
    const lastClockIn = clockInMap.get(employee.id);
    const clockOut = lastClockIn ? clockOutMap.get(employee.id) : null;
    const clockOutAfterClockIn = lastClockIn && clockOut && clockOut.capturedAt > lastClockIn.capturedAt;

    const isClockedIn = !!lastClockIn && !clockOutAfterClockIn;
    const clockInTime = lastClockIn?.capturedAt || null;

    // Check break status
    let isOnBreak = false;
    let breakStartTime: Date | null = null;
    if (isClockedIn && lastClockIn) {
      const lastBreakEvent = breakEventsMap.get(employee.id);
      if (lastBreakEvent && lastBreakEvent.capturedAt >= lastClockIn.capturedAt) {
        if (lastBreakEvent.eventType === "BREAK_START") {
          isOnBreak = true;
          breakStartTime = lastBreakEvent.capturedAt;
        }
      }
    }

    return {
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        employeeId: employee.employeeId,
      },
      lastEvent,
      isClockedIn: isClockedIn && !!clockInTime,
      clockInTime,
      isOnBreak,
      breakStartTime,
    };
  });

  // Filter to show only clocked-in employees
  const clockedInEmployees = employeeStatuses.filter((status) => status.isClockedIn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Attendance</h1>
        <p className="text-muted-foreground">Manage employee attendance, breaks, and clock out</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currently Clocked In Employees</CardTitle>
          <CardDescription>
            {clockedInEmployees.length} {clockedInEmployees.length === 1 ? "employee" : "employees"} currently clocked in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManageAttendanceList employees={clockedInEmployees} />
        </CardContent>
      </Card>
    </div>
  );
}
