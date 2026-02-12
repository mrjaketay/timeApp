import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { WelcomeMessage } from "@/components/welcome-message";
import { RecentActivityGrouped } from "@/components/admin/recent-activity-grouped";

export default async function AdminDashboardPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    // Redirect based on actual role
    if (session.user.role === "EMPLOYEE") {
      redirect("/clock");
    } else {
      redirect("/dashboard");
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalCompanies, activeEmployees, todayCheckIns] = await Promise.all([
    prisma.company.count(),
    prisma.employeeProfile.count({
      where: { isActive: true },
    }),
    prisma.attendanceEvent.count({
      where: {
        eventType: "CLOCK_IN",
        capturedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
  ]);

  // Get recent activity - only fetch what we need for display (limit to prevent slow queries)
  const recentActivity = await prisma.attendanceEvent.findMany({
    take: 50, // Reduced from 100 for better performance
    orderBy: { capturedAt: "desc" },
    select: {
      id: true,
      eventType: true,
      capturedAt: true,
      employeeProfile: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <WelcomeMessage userName={session.user.name} />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Registered companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">Active across all companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today Check Ins</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCheckIns}</div>
            <p className="text-xs text-muted-foreground">Clock ins today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Placeholder</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest clock in/out events grouped by company and date</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <RecentActivityGrouped activities={recentActivity.map(event => ({
              id: event.id,
              eventType: event.eventType,
              capturedAt: event.capturedAt,
              user: {
                name: event.employeeProfile?.name || "Unknown",
                email: event.employeeProfile?.email || "unknown@example.com",
              },
              company: {
                id: event.company?.id || "",
                name: event.company?.name || "Unknown Company",
              },
              employeeProfile: (event as any).employeeProfile ?? null,
            }))} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
