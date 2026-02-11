import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ReportsForm } from "@/components/reports-form";
import { ReportsTable } from "@/components/reports-table";
import { ReportsExportButtons } from "@/components/reports-export-buttons";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { 
    startDate?: string; 
    endDate?: string;
    employeeId?: string;
    reportType?: string;
  };
}) {
  try {
    const session = await getSession();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      redirect("/dashboard");
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate attendance and timesheet reports</p>
          </div>
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <p className="mb-4">No company found for your account.</p>
                <p className="text-sm">Please contact support or create a company.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    let startDate: Date;
    let endDate: Date;
    
    try {
      startDate = searchParams.startDate
        ? parseISO(searchParams.startDate)
        : startOfMonth(new Date());
      endDate = searchParams.endDate
        ? parseISO(searchParams.endDate)
        : endOfMonth(new Date());
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid date range");
      }
    } catch (error) {
      // If date parsing fails, use current month
      startDate = startOfMonth(new Date());
      endDate = endOfMonth(new Date());
    }

    const employeeId = searchParams.employeeId;
    const reportType = searchParams.reportType || "TIMESHEET";

    // Build where clause
    const whereClause: any = {
      companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Filter by employee if selected - optimize: just use employeeProfileId directly
    if (employeeId) {
      whereClause.employeeProfileId = employeeId;
    }

    // Get timesheets for date range - optimize: only fetch what we need
    const timesheetsData = await prisma.timesheet.findMany({
      where: whereClause,
      select: {
        id: true,
        employeeProfileId: true,
        companyId: true,
        date: true,
        hoursWorked: true,
        breakMinutes: true,
        notes: true,
        clockIn: {
          select: {
            id: true,
            capturedAt: true,
            employeeProfile: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        clockOut: {
          select: {
            id: true,
            capturedAt: true,
            employeeProfile: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        employeeProfile: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Transform data to match component expectations
    const timesheets = timesheetsData.map((timesheet) => ({
      ...timesheet,
      user: timesheet.employeeProfile || timesheet.clockIn?.employeeProfile || timesheet.clockOut?.employeeProfile || { name: null, email: "Unknown" },
    }));

    // Calculate summary statistics
    const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
    const uniqueEmployees = new Set(timesheets.map(ts => ts.employeeProfileId)).size;
    const totalDays = timesheets.length;
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const avgHoursPerEmployee = uniqueEmployees > 0 ? totalHours / uniqueEmployees : 0;

    return (
      <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Generate attendance and timesheet reports</p>
        </div>

      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select filters and generate reports</CardDescription>
        </CardHeader>
        <CardContent>
          <ReportsForm
            defaultStartDate={format(startDate, "yyyy-MM-dd")}
            defaultEndDate={format(endDate, "yyyy-MM-dd")}
            defaultEmployeeId={employeeId}
            defaultReportType={reportType}
          />
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {timesheets.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
              <p className="text-xs text-muted-foreground">Across all employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueEmployees}</div>
              <p className="text-xs text-muted-foreground">Active in report</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDays}</div>
              <p className="text-xs text-muted-foreground">Work days recorded</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Hours/Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgHoursPerDay.toFixed(2)}h</div>
              <p className="text-xs text-muted-foreground">Per employee</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {reportType === "TIMESHEET" && "Timesheet Report"}
              {reportType === "ATTENDANCE" && "Attendance Summary"}
              {reportType === "EMPLOYEE_SUMMARY" && "Employee Summary"}
              {reportType === "HOURS_WORKED" && "Hours Worked Report"}
            </CardTitle>
            <CardDescription>
              {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
              {employeeId && ` • Filtered by employee`}
            </CardDescription>
          </div>
          <ReportsExportButtons 
            startDate={startDate} 
            endDate={endDate}
            employeeId={employeeId}
            reportType={reportType}
          />
        </CardHeader>
        <CardContent>
          <ReportsTable timesheets={timesheets} reportType={reportType} />
        </CardContent>
      </Card>
    </div>
    );
  } catch (error) {
    console.error("Reports page error:", error);
    return (
      <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Generate attendance and timesheet reports</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <p className="mb-4">An error occurred while loading reports.</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Please try again later."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
