import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getAuthOptionsLazy } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseISO } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const authOptions = getAuthOptionsLazy();
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;
    const searchParams = req.nextUrl.searchParams;
    const startDate = parseISO(searchParams.get("startDate") || "");
    const endDate = parseISO(searchParams.get("endDate") || "");
    const exportFormat = searchParams.get("format") || "CSV";
    const employeeId = searchParams.get("employeeId") || "";
    const reportType = searchParams.get("reportType") || "TIMESHEET";

    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    // Build where clause
    const whereClause: any = {
      companyId,
      capturedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Filter by employee if provided
    if (employeeId) {
      whereClause.userId = employeeId;
    }

    // Get attendance events for date range
    const events = await prisma.attendanceEvent.findMany({
      where: whereClause,
      include: {
        user: true,
      },
      orderBy: { capturedAt: "asc" },
    });

    if (exportFormat === "CSV" || exportFormat === "EXCEL") {
      // For CSV and Excel, we'll generate CSV content
      // Excel can be handled similarly or with a library like xlsx
      const headers = [
        "Date",
        "Time",
        "Employee Name",
        "Employee Email",
        "Event Type",
        "Location Lat",
        "Location Lng",
        "Accuracy (meters)",
        "Address",
      ];

      const rows = events.map((event) => [
        event.capturedAt.toISOString().split("T")[0],
        event.capturedAt.toTimeString().split(" ")[0],
        event.user.name || "",
        event.user.email,
        event.eventType,
        event.locationLat.toString(),
        event.locationLng.toString(),
        event.accuracyMeters.toString(),
        event.address || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      ].join("\n");

      if (exportFormat === "CSV") {
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="report-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.csv"`,
          },
        });
      } else {
        // For Excel, return CSV with .xlsx extension (basic implementation)
        // For full Excel support, you'd need to use a library like xlsx
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="report-${startDate.toISOString().split("T")[0]}-${endDate.toISOString().split("T")[0]}.xlsx"`,
          },
        });
      }
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
