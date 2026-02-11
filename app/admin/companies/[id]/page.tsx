import { getSession } from "@/lib/get-session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Building2, Users, Mail, Phone, MapPin, Globe, Briefcase, Calendar, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function CompanyViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          members: true,
          employeeProfiles: true,
          attendanceEvents: true,
          nfcCards: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!company) {
    notFound();
  }

  // Get subscription info if available
  const subscription = await prisma.subscription.findFirst({
    where: { companyId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/companies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-muted-foreground">Company details and information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Company Information</span>
            </CardTitle>
            <CardDescription>Basic company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Hash className="h-4 w-4" />
                  <span>Company ID</span>
                </div>
                <p className="font-mono text-sm font-medium">{company.id}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Building2 className="h-4 w-4" />
                  <span>Company Name</span>
                </div>
                <p className="font-medium">{company.name}</p>
              </div>

              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Hash className="h-4 w-4" />
                  <span>Slug</span>
                </div>
                <p className="font-mono text-sm">{company.slug}</p>
              </div>

              {company.website && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </div>
                  <a
                    href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}

              {company.phone && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </div>
                  <p className="text-sm">{company.phone}</p>
                </div>
              )}

              {company.address && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </div>
                  <p className="text-sm">{company.address}</p>
                </div>
              )}

              {company.industry && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span>Industry</span>
                  </div>
                  <p className="text-sm">{company.industry}</p>
                </div>
              )}

              {company.companySize && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <Users className="h-4 w-4" />
                    <span>Company Size</span>
                  </div>
                  <p className="text-sm">{company.companySize}</p>
                </div>
              )}

              {company.country && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Country</span>
                  </div>
                  <p className="text-sm">{company.country}</p>
                </div>
              )}

              {company.timezone && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span>Timezone</span>
                  </div>
                  <p className="text-sm">{company.timezone}</p>
                </div>
              )}

              {company.taxId && (
                <div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                    <Hash className="h-4 w-4" />
                    <span>Tax ID</span>
                  </div>
                  <p className="font-mono text-sm">{company.taxId}</p>
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-sm">{format(company.createdAt, "MMM d, yyyy 'at' HH:mm")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Company usage statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{company._count.members}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{company._count.employeeProfiles}</div>
                <div className="text-sm text-muted-foreground">Employees</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{company._count.attendanceEvents}</div>
                <div className="text-sm text-muted-foreground">Attendance Events</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold">{company._count.nfcCards}</div>
                <div className="text-sm text-muted-foreground">NFC Cards</div>
              </div>
            </div>

            {subscription && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Subscription Plan</span>
                  <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                    {subscription.plan}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Status: {subscription.status}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Company Members</span>
          </CardTitle>
          <CardDescription>
            {company.members.length} {company.members.length === 1 ? "member" : "members"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {company.members.length > 0 ? (
            <div className="space-y-3">
              {company.members.map((membership) => (
                <div
                  key={membership.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{membership.user.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{membership.user.email}</p>
                      </div>
                      <Badge variant="outline">{membership.role}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined: {format(membership.user.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No members found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
