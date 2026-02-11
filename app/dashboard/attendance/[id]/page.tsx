import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { MapPin, ArrowLeft } from "lucide-react";
import { MapView } from "@/components/map-view";

export default async function AttendanceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return <div>No company found</div>;
  }

  const event = await prisma.attendanceEvent.findUnique({
    where: { id: params.id },
    include: {
      user: {
        include: {
          employeeProfile: true,
        },
      },
      nfcCard: true,
    },
  });

  if (!event || event.companyId !== companyId) {
    return <div>Event not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/attendance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Attendance Details</h1>
          <p className="text-muted-foreground">View location and event information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-medium">{event.user.name || event.user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Type</p>
              <p className="font-medium">
                {event.eventType === "CLOCK_IN" ? "Clock In" : "Clock Out"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">
                {format(event.capturedAt, "MMM d, yyyy • HH:mm:ss")}
              </p>
            </div>
            {event.nfcCard && (
              <div>
                <p className="text-sm text-muted-foreground">NFC Card</p>
                <p className="font-medium">{event.nfcCard.uid}</p>
              </div>
            )}
            {event.deviceInfo && (
              <div>
                <p className="text-sm text-muted-foreground">Device</p>
                <p className="font-medium text-sm">{event.deviceInfo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.address && (
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="font-medium">{event.address}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Coordinates</p>
              <p className="font-medium font-mono text-sm">
                {event.locationLat.toFixed(6)}, {event.locationLng.toFixed(6)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="font-medium">{event.accuracyMeters.toFixed(0)} meters</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Map</CardTitle>
          <CardDescription>Employee location at time of clock event</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full rounded-lg overflow-hidden">
            <MapView
              lat={event.locationLat}
              lng={event.locationLng}
              address={event.address || undefined}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
