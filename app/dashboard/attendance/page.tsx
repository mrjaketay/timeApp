import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { MapPin, Eye } from "lucide-react";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return <div>No company found</div>;
  }

  const page = parseInt(searchParams.page || "1");
  const perPage = 20;
  const skip = (page - 1) * perPage;

  const where: any = { companyId };
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    where.employeeProfile = {
      OR: [
        { name: { contains: searchLower } },
        { email: { contains: searchLower } },
        { employeeId: { contains: searchLower } },
      ],
    };
  }

  const [events, total] = await Promise.all([
    prisma.attendanceEvent.findMany({
      where,
      select: {
        id: true,
        employeeProfileId: true,
        companyId: true,
        eventType: true,
        locationLat: true,
        locationLng: true,
        address: true,
        capturedAt: true,
        deviceInfo: true,
        notes: true,
        employeeProfile: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
          },
        },
        nfcCard: {
          select: {
            id: true,
            uid: true,
          },
        },
      },
      orderBy: { capturedAt: "desc" },
      take: perPage,
      skip,
    }),
    prisma.attendanceEvent.count({ where }),
  ]);

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Attendance Logs
          </h1>
          <p className="text-muted-foreground mt-1">View and manage employee attendance</p>
        </div>
        <Button asChild className="shadow-lg hover:shadow-xl transition-shadow">
          <Link href="/dashboard/attendance/manage">Manage Attendance</Link>
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Attendance Events</CardTitle>
          <CardDescription>
            {total} total {total === 1 ? "event" : "events"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium">
                        {event.employeeProfile.name || event.employeeProfile.email || "Unknown Employee"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.eventType === "CLOCK_IN" && "Clocked In"}
                        {event.eventType === "CLOCK_OUT" && "Clocked Out"}
                        {event.eventType === "BREAK_START" && "Break Started"}
                        {event.eventType === "BREAK_END" && "Break Ended"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{format(event.capturedAt, "MMM d, yyyy")}</p>
                      <p>{format(event.capturedAt, "HH:mm:ss")}</p>
                    </div>
                    {event.address && (
                      <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <div>
                          <p className="line-clamp-1">{event.address}</p>
                          <p className="text-xs">
                            {event.locationLat.toFixed(6)}, {event.locationLng.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/attendance/${event.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Map
                  </Link>
                </Button>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No attendance events found.
              </div>
            )}
          </div>

          {total > perPage && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {skip + 1} to {Math.min(skip + perPage, total)} of {total}
              </p>
              <div className="flex space-x-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`?page=${page - 1}`}>Previous</Link>
                  </Button>
                )}
                {skip + perPage < total && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`?page=${page + 1}`}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
