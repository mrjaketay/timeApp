import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersHierarchical } from "@/components/admin/users-hierarchical";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch companies + employers + employees (using fields that exist on EmployeeProfile)
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      members: {
        where: { role: "EMPLOYER" },
        select: {
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
      },
      employeeProfiles: {
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const companiesData = companies.map((company) => {
    const employers = company.members.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.user.role,
      createdAt: membership.user.createdAt,
      companyId: company.id,
      companyName: company.name,
    }));

    const employees = company.employeeProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name || "Unknown",
      email: profile.email || "unknown@example.com",
      createdAt: profile.createdAt,
      companyId: company.id,
      companyName: company.name,
      employerId: "",
      employerName: "",
    }));

    return {
      id: company.id,
      name: company.name,
      employers,
      employees,
    };
  });

  let filteredCompanies = companiesData;
  let filteredAdmins = adminUsers;

  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();

    filteredCompanies = companiesData
      .map((company) => {
        const companyNameMatches = company.name.toLowerCase().includes(searchLower);

        const filteredEmployers = companyNameMatches
          ? company.employers
          : company.employers.filter(
              (emp) =>
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.email.toLowerCase().includes(searchLower)
            );

        const filteredEmployees = companyNameMatches
          ? company.employees
          : company.employees.filter(
              (emp) =>
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.email.toLowerCase().includes(searchLower)
            );

        if (companyNameMatches || filteredEmployers.length > 0 || filteredEmployees.length > 0) {
          return {
            ...company,
            employers: filteredEmployers,
            employees: filteredEmployees,
          };
        }

        return null;
      })
      .filter((c) => c !== null) as typeof companiesData;

    filteredAdmins = adminUsers.filter(
      (admin) =>
        admin.name?.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower)
    );
  }

  const totalUsers =
    filteredAdmins.length +
    filteredCompanies.reduce(
      (sum, company) => sum + company.employers.length + company.employees.length,
      0
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all system users organized by company hierarchy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Hierarchy</CardTitle>
          <CardDescription>
            {totalUsers} {totalUsers === 1 ? "user" : "users"} found
            {searchParams.search && ` matching "${searchParams.search}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCompanies.length > 0 || filteredAdmins.length > 0 ? (
            <UsersHierarchical companies={filteredCompanies} admins={filteredAdmins} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchParams.search ? (
                <>
                  <p>No users found matching &quot;{searchParams.search}&quot;</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </>
              ) : (
                <p>No users found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
