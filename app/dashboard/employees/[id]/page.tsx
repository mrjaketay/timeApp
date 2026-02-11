import { getSession } from "@/lib/get-session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AvatarEditor } from "@/components/avatar-editor";
import { ArrowLeft, Edit, Mail, Phone, MapPin, User, Calendar, DollarSign, Building2, CreditCard } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session?.user || session.user.role !== "EMPLOYER") {
      redirect("/dashboard");
    }

    const companyId = session.user.companyMemberships?.[0]?.companyId;

    if (!companyId) {
      redirect("/dashboard/employees");
    }

    const employee = await prisma.employeeProfile.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        nfcCards: {
          where: { isActive: true },
        },
        company: true,
      },
    });

    if (!employee) {
      notFound();
    }

    // Calculate tenure (employment duration)
    const employmentStartDate = employee.employmentStartDate || employee.createdAt;
    const tenureDays = Math.floor(
      (new Date().getTime() - employmentStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const tenureYears = Math.floor(tenureDays / 365);
    const tenureMonths = Math.floor((tenureDays % 365) / 30);

    // Get recent attendance stats
    const recentAttendance = await prisma.attendanceEvent.findMany({
      where: {
        employeeProfileId: employee.id,
        companyId,
        capturedAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
        },
      },
      orderBy: {
        capturedAt: "desc",
      },
      take: 10,
    });

    const clockIns = recentAttendance.filter((e) => e.eventType === "CLOCK_IN").length;
    const clockOuts = recentAttendance.filter((e) => e.eventType === "CLOCK_OUT").length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/employees">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Employee Profile</h1>
              <p className="text-muted-foreground">View employee details and information</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/employees/${employee.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Profile Card */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <AvatarEditor
                    employeeId={employee.id}
                    currentPhoto={employee.photo}
                    employeeName={employee.name}
                    employeeEmail={employee.email || undefined}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-2xl">
                        {employee.name || employee.email || "Unknown Employee"}
                      </CardTitle>
                      <Badge variant={employee.isActive ? "success" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {employee.email && (
                      <CardDescription className="mt-1">
                        {employee.email}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {employee.name && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Full Name</p>
                        <p className="text-sm text-muted-foreground">{employee.name}</p>
                      </div>
                    </div>
                  )}

                  {employee.email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Email Address</p>
                        <p className="text-sm text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  )}

                  {employee.phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Phone Number</p>
                        <p className="text-sm text-muted-foreground">{employee.phone}</p>
                      </div>
                    </div>
                  )}

                  {employee.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm text-muted-foreground">{employee.address}</p>
                      </div>
                    </div>
                  )}

                  {employee.dateOfBirth && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Date of Birth</p>
                        <p className="text-sm text-muted-foreground">
                          {format(employee.dateOfBirth, "MMMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {employee.employeeId && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Employee ID</p>
                        <p className="text-sm text-muted-foreground">{employee.employeeId}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Company</p>
                      <p className="text-sm text-muted-foreground">{employee.company.name}</p>
                    </div>
                  </div>

                  {employee.employmentStartDate && (
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Employment Start Date</p>
                        <p className="text-sm text-muted-foreground">
                          {format(employee.employmentStartDate, "MMMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tenure</p>
                      <p className="text-sm text-muted-foreground">
                        {tenureYears > 0
                          ? `${tenureYears} year${tenureYears > 1 ? "s" : ""}, ${tenureMonths} month${tenureMonths !== 1 ? "s" : ""}`
                          : `${tenureMonths} month${tenureMonths !== 1 ? "s" : ""}`}
                        {tenureDays === 0 && " (Today)"}
                      </p>
                    </div>
                  </div>

                  {employee.salaryRate !== null && employee.salaryRate !== undefined && (
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Salary Rate</p>
                        <p className="text-sm text-muted-foreground">
                          ${employee.salaryRate.toFixed(2)} / hour
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={employee.isActive ? "success" : "secondary"} className="mt-1">
                    {employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NFC Cards</p>
                  <p className="text-2xl font-bold mt-1">{employee.nfcCards.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Profile Created</p>
                  <p className="text-sm mt-1">
                    {format(employee.createdAt, "MMM dd, yyyy")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity (30 days)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clock Ins</p>
                  <p className="text-2xl font-bold mt-1">{clockIns}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clock Outs</p>
                  <p className="text-2xl font-bold mt-1">{clockOuts}</p>
                </div>
              </CardContent>
            </Card>

            {/* NFC Cards */}
            {employee.nfcCards.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>NFC Cards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employee.nfcCards.map((card) => (
                      <div key={card.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="text-sm font-medium">Card {card.uid.slice(-8)}</p>
                          {card.lastUsedAt && (
                            <p className="text-xs text-muted-foreground">
                              Last used: {format(card.lastUsedAt, "MMM dd, yyyy")}
                            </p>
                          )}
                        </div>
                        <Badge variant={card.isActive ? "success" : "secondary"}>
                          {card.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Employee profile page error:", error);
    redirect("/dashboard/employees");
  }
}
