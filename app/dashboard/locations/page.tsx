import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/map-view";
import { format } from "date-fns";

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: { date?: string; employeeId?: string; search?: string };
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return <div>No company found</div>;
  }

  const date = searchParams.date ? new Date(searchParams.date) : new Date();
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const where: any = {
    companyId,
    capturedAt: {
      gte: date,
      lt: nextDay,
    },
  };

  if (searchParams.employeeId) {
    where.employeeProfileId = searchParams.employeeId;
  }

  // If search is provided, filter by employee name or email
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

  const events = await prisma.attendanceEvent.findMany({
    where,
    select: {
      id: true,
      employeeProfileId: true,
      locationLat: true,
      locationLng: true,
      address: true,
      capturedAt: true,
      eventType: true,
      employeeProfile: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
        },
      },
    },
    orderBy: { capturedAt: "asc" },
  });

  const clockIns = events.filter((e) => e.eventType === "CLOCK_IN");
  const mapPoints = clockIns.map((event) => ({
    lat: event.locationLat,
    lng: event.locationLng,
    label: `${event.employeeProfile.name || event.employeeProfile.email || event.employeeProfile.employeeId || "Unknown"} - ${format(event.capturedAt, "HH:mm")}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Locations Map</h1>
        <p className="text-muted-foreground">View today&apos;s check-in locations on a map</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Check-In Locations</CardTitle>
          <CardDescription>
            {clockIns.length} clock in {clockIns.length === 1 ? "event" : "events"} on{" "}
            {format(date, "MMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mapPoints.length > 0 ? (
            <div className="h-[600px] w-full rounded-lg overflow-hidden">
              <MapView
                lat={mapPoints[0].lat}
                lng={mapPoints[0].lng}
                multiplePoints={mapPoints}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No clock-in events found for today.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
