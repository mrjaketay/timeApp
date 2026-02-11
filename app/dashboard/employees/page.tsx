import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import { EmployeeStatusButton } from "@/components/employee-status-button";
import { EmployeeDeleteButton } from "@/components/employee-delete-button";
import { getCompanySubscription } from "@/app/actions/subscription";
import { getPlan, checkLimit, PlanType } from "@/lib/subscription";
import { UpgradeBanner } from "@/components/upgrade-banner";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { search?: string };
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
            <h1 className="text-3xl font-bold">Employees</h1>
            <p className="text-muted-foreground">Manage your team members</p>
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

    const where: any = { companyId };
    if (searchParams.search) {
      const searchLower = searchParams.search.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { email: { contains: searchLower } },
        { employeeId: { contains: searchLower } },
      ];
    }

    const employees = await prisma.employeeProfile.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        photo: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            nfcCards: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check subscription limits (gracefully handle errors)
    let subscription = null;
    let plan = getPlan("FREE");
    let isAtLimit = false;
    const employeeCount = employees.filter(e => e.isActive).length;
    
    try {
      const subscriptionResult = await getCompanySubscription();
      if (subscriptionResult.success && subscriptionResult.subscription) {
        subscription = subscriptionResult.subscription;
        plan = getPlan(subscription.plan as PlanType);
        isAtLimit = !checkLimit(subscription.plan as PlanType, "employees", employeeCount);
      }
    } catch (error) {
      // If subscription check fails, just use FREE plan defaults
      console.error("Error checking subscription:", error);
    }

    return (
      <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Employees
          </h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <Button asChild className="shadow-lg hover:shadow-xl transition-shadow">
          <Link href="/dashboard/employees/invite">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      {isAtLimit && (
        <UpgradeBanner
          message={`You've reached your plan limit of ${plan.limits.employees} employees. Upgrade to add more employees.`}
          currentLimit={plan.limits.employees}
          currentUsage={employeeCount}
          feature="employees"
        />
      )}

      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>
            {employees.length} {employees.length === 1 ? "employee" : "employees"}
            {plan.limits.employees !== -1 && (
              <span className="text-muted-foreground">
                {" "}/ {plan.limits.employees} limit
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee, index) => (
              <div
                key={employee.id}
                className="flex items-center justify-between p-4 border rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={employee.photo || undefined} />
                    <AvatarFallback>
                      {employee.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || employee.email?.[0].toUpperCase() || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/dashboard/employees/${employee.id}`}
                        className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                      >
                        {employee.name || employee.email || "Unknown Employee"}
                      </Link>
                      <Badge variant={employee.isActive ? "success" : "secondary"}>
                        {employee.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {employee.email && (
                      <p className="text-sm text-muted-foreground">
                        {employee.email}
                      </p>
                    )}
                    {employee.employeeId && (
                      <p className="text-xs text-muted-foreground">
                        ID: {employee.employeeId}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {employee._count.nfcCards} NFC {employee._count.nfcCards === 1 ? "card" : "cards"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/employees/${employee.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/employees/${employee.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <EmployeeStatusButton
                    employeeId={employee.id}
                    isActive={employee.isActive}
                  />
                  <EmployeeDeleteButton
                    employeeId={employee.id}
                    employeeName={employee.name || employee.email || "Unknown Employee"}
                  />
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No employees yet. Add your first employee to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    );
  } catch (error) {
    console.error("Employees page error:", error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <p className="mb-4">An error occurred while loading employees.</p>
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
