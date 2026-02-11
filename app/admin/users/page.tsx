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

  // Optimize: Only fetch what we need, use select instead of include where possible
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      members: {
        where: {
          role: "EMPLOYER",
        },
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // Get all admins
  const adminUsers = await prisma.user.findMany({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform data for hierarchical component
  const companiesData = companies.map((company) => {
    // Get employers (users with EMPLOYER role in this company)
    const employers = company.members.map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.user.role,
      createdAt: membership.user.createdAt,
      companyId: company.id,
      companyName: company.name,
    }));

    // Get employees - they belong to the company but aren't directly assigned to specific employers
    // We'll show them under the company, and they can be viewed as a group
    const employees = company.employeeProfiles.map((profile) => {
      return {
        id: profile.user.id,
        name: profile.user.name,
        email: profile.user.email,
        createdAt: profile.user.createdAt,
        companyId: company.id,
        companyName: company.name,
        employerId: "", // Employees aren't directly assigned to specific employers
        employerName: "",
      };
    });

    return {
      id: company.id,
      name: company.name,
      employers,
      employees,
    };
  });

  // Apply search filter if provided
  let filteredCompanies = companiesData;
  let filteredAdmins = adminUsers;

  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    
    // Filter companies
    filteredCompanies = companiesData
      .map((company) => {
        const companyNameMatches = company.name.toLowerCase().includes(searchLower);
        
        // If company name matches, show ALL employers and employees (don't filter them)
        // If company name doesn't match, only show matching users
        const filteredEmployers = companyNameMatches
          ? company.employers // Show all if company matches
          : company.employers.filter(
              (emp) =>
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.email.toLowerCase().includes(searchLower)
            );
        
        const filteredEmployees = companyNameMatches
          ? company.employees // Show all if company matches
          : company.employees.filter(
              (emp) =>
                emp.name?.toLowerCase().includes(searchLower) ||
                emp.email.toLowerCase().includes(searchLower)
            );

        // Only include company if it has matching users or company name matches
        if (
          companyNameMatches ||
          filteredEmployers.length > 0 ||
          filteredEmployees.length > 0
        ) {
          return {
            ...company,
            employers: filteredEmployers,
            employees: filteredEmployees,
          };
        }
        return null;
      })
      .filter((c) => c !== null) as typeof companiesData;

    // Filter admins
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
        <p className="text-muted-foreground">
          Manage all system users organized by company hierarchy
        </p>
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
