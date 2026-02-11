import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Eye } from "lucide-react";

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const where: any = {};
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    where.OR = [
      { name: { contains: searchLower } },
      { slug: { contains: searchLower } },
    ];
  }

  const companies = await prisma.company.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
    },
  });

  // Get all counts in parallel using aggregation - MUCH faster than N+1 queries
  const companyIds = companies.map(c => c.id);
  
  const [employerCounts, employeeCounts] = await Promise.all([
    // Get employer counts grouped by company
    prisma.companyMembership.groupBy({
      by: ['companyId'],
      where: {
        companyId: { in: companyIds },
        role: 'EMPLOYER',
      },
      _count: true,
    }),
    // Get employee counts grouped by company
    prisma.employeeProfile.groupBy({
      by: ['companyId'],
      where: {
        companyId: { in: companyIds },
        isActive: true,
      },
      _count: true,
    }),
  ]);

  // Create maps for O(1) lookup
  const employerCountMap = new Map(employerCounts.map(c => [c.companyId, c._count]));
  const employeeCountMap = new Map(employeeCounts.map(c => [c.companyId, c._count]));

  // Combine data
  const companiesWithCounts = companies.map((company) => ({
    ...company,
    employerCount: employerCountMap.get(company.id) || 0,
    employeeCount: employeeCountMap.get(company.id) || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companies</h1>
        <p className="text-muted-foreground">Manage all registered companies</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company List</CardTitle>
          <CardDescription>
            {companiesWithCounts.length} {companiesWithCounts.length === 1 ? "company" : "companies"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companiesWithCounts.length > 0 ? (
            <div className="space-y-4">
              {companiesWithCounts.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Slug: {company.slug}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.employerCount || 0} {company.employerCount === 1 ? "employer" : "employers"} • {company.employeeCount || 0} {company.employeeCount === 1 ? "employee" : "employees"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {format(company.createdAt, "MMM d, yyyy")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/companies/${company.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchParams.search ? (
                <>
                  <p>No companies found matching &quot;{searchParams.search}&quot;</p>
                  <p className="text-sm mt-2">Try a different search term</p>
                </>
              ) : (
                <p>No companies registered yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
