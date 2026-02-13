import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { Users, Clock, AlertCircle, Clock3 } from "lucide-react";
import { WelcomeMessage } from "@/components/welcome-message";
import { ProfileCompletionBanner } from "@/components/profile-completion-banner";

export default async function DashboardPage() {
  try {
    const session = await getSession();

    if (!session?.user) {
      redirect("/login");
    }

    // Redirect based on role
    if (session.user.role === "ADMIN") {
      redirect("/admin");
    }

    if (session.user.role === "EMPLOYEE") {
      redirect("/clock");
    }

    // Only EMPLOYER role should reach here
    if (session.user.role !== "EMPLOYER") {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      );
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">No Company Found</h1>
            <p className="text-muted-foreground">
              Your account is not associated with a company. Please contact an administrator.
            </p>
          </div>
        </div>
      );
    }

  // Get today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Optimize: Calculate late arrivals in database, reduce data fetched
  const nineAM = new Date(today);
  nineAM.setHours(9, 0, 0, 0);

  const [employeesCount, todayCheckIns, todayHours, lateArrivals] = await Promise.all([
    prisma.employeeProfile.count({
      where: {
        companyId,
        isActive: true,
      },
    }),
    prisma.attendanceEvent.count({
      where: {
        companyId,
        eventType: "CLOCK_IN",
        capturedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    // Only fetch what we need for hours calculation - limit to prevent huge queries
    prisma.attendanceEvent.findMany({
      where: {
        companyId,
        capturedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        id: true,
        employeeProfileId: true,
        eventType: true,
        capturedAt: true,
      },
      orderBy: { capturedAt: "asc" },
      take: 1000, // Safety limit
    }),
    // Calculate late arrivals in database
    prisma.attendanceEvent.count({
      where: {
        companyId,
        eventType: "CLOCK_IN",
        capturedAt: {
          gte: nineAM,
          lt: tomorrow,
        },
      },
    }),
  ]);

  // Calculate total hours worked today - optimized
  const clockIns = todayHours.filter((e) => e.eventType === "CLOCK_IN");
  const clockOuts = todayHours.filter((e) => e.eventType === "CLOCK_OUT");
  
  // Use Map for O(1) lookup instead of O(n) find
  const clockOutMap = new Map<string, typeof clockOuts[0]>();
  clockOuts.forEach(co => {
    const existing = clockOutMap.get(co.employeeProfileId);
    if (!existing || co.capturedAt > existing.capturedAt) {
      clockOutMap.set(co.employeeProfileId, co);
    }
  });
  
  let totalHours = 0;
  clockIns.forEach((clockIn) => {
    const clockOut = clockOutMap.get(clockIn.employeeProfileId);
    if (clockOut && clockOut.capturedAt > clockIn.capturedAt) {
      const diff = clockOut.capturedAt.getTime() - clockIn.capturedAt.getTime();
      totalHours += diff / (1000 * 60 * 60);
    }
  });

  // Get recent activity - only fetch what we need
  const recentActivity = await prisma.attendanceEvent.findMany({
    where: { companyId },
    take: 10,
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
        },
      },
    },
  });

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <ProfileCompletionBanner />
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-3 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
          <WelcomeMessage userName={session.user.name} />
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-hover border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-card dark:to-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold">Employees</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all duration-300 shadow-sm">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{employeesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 via-white to-white dark:from-green-950/20 dark:via-card dark:to-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold">Today Check Ins</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 group-hover:from-green-500/30 group-hover:to-green-600/20 transition-all duration-300 shadow-sm">
              <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{todayCheckIns}</div>
            <p className="text-xs text-muted-foreground mt-1">Clock ins today</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 via-white to-white dark:from-orange-950/20 dark:via-card dark:to-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold">Late Arrivals</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-all duration-300 shadow-sm">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{lateArrivals}</div>
            <p className="text-xs text-muted-foreground mt-1">After 9:00 AM</p>
          </CardContent>
        </Card>

        <Card className="card-hover border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 via-white to-white dark:from-purple-950/20 dark:via-card dark:to-card group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold">Hours Today</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 group-hover:from-purple-500/30 group-hover:to-purple-600/20 transition-all duration-300 shadow-sm">
              <Clock3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total hours worked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 px-4 sm:px-6 py-4">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Recent Activity
            </CardTitle>
            <CardDescription className="mt-1">Latest clock in/out events</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((event, index) => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-l-transparent hover:border-l-primary animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        event.eventType === "CLOCK_IN" 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}>
                        {event.eventType === "CLOCK_IN" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <Clock3 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold">
                          {event.employeeProfile.name || event.employeeProfile.email || "Unknown Employee"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.eventType === "CLOCK_IN" ? "Clocked In" : "Clocked Out"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(event.capturedAt, "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.capturedAt, "MMM d")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    );
  } catch (error) {
    console.error("Dashboard page error:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Error</h1>
          <p className="text-muted-foreground">
            An error occurred while loading the dashboard. Please try again.
          </p>
          {error instanceof Error && (
            <p className="text-sm text-red-600 mt-2">{error.message}</p>
          )}
        </div>
      </div>
    );
  }
}
