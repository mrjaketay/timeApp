import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default async function MyTimesheetsPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYEE") {
    redirect("/clock");
  }

  const userId = session.user.id;
  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return <div>No company found</div>;
  }

  const timesheets = await prisma.timesheet.findMany({
    where: {
      userId,
      companyId,
    },
    include: {
      clockIn: true,
      clockOut: true,
    },
    orderBy: { date: "desc" },
    take: 30,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Timesheets</h1>
        <p className="text-muted-foreground">View your attendance history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timesheets.map((timesheet) => (
              <div
                key={timesheet.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{format(timesheet.date, "MMMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground">
                    {timesheet.clockIn
                      ? `Clocked in at ${format(timesheet.clockIn.capturedAt, "HH:mm")}`
                      : "No clock in"}
                    {timesheet.clockOut
                      ? ` • Clocked out at ${format(timesheet.clockOut.capturedAt, "HH:mm")}`
                      : " • Not clocked out"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {timesheet.hoursWorked
                      ? `${timesheet.hoursWorked.toFixed(2)}h`
                      : "-"}
                  </p>
                </div>
              </div>
            ))}
            {timesheets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No timesheets found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
