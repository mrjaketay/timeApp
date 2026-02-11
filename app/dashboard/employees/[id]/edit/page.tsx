import { getSession } from "@/lib/get-session";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmployeeEditForm } from "@/components/employee-edit-form";

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const { id } = params;
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
          orderBy: {
            registeredAt: "desc",
          },
        },
      },
    });

    if (!employee) {
      notFound();
    }

    const employeeForForm = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      phone: employee.phone,
      address: employee.address,
      salaryRate: employee.salaryRate,
      employmentStartDate: employee.employmentStartDate
        ? employee.employmentStartDate.toISOString()
        : null,
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.toISOString() : null,
      isActive: employee.isActive,
      nfcCards: employee.nfcCards.map((card) => ({
        id: card.id,
        uid: card.uid,
        isActive: card.isActive,
        registeredAt: card.registeredAt.toISOString(),
        lastUsedAt: card.lastUsedAt ? card.lastUsedAt.toISOString() : null,
      })),
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/employees">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Employee</h1>
            <p className="text-muted-foreground">Update employee details and NFC cards</p>
          </div>
        </div>

        <EmployeeEditForm employee={employeeForForm} />
      </div>
    );
  } catch (error) {
    console.error("Edit employee page error:", error);
    redirect("/dashboard/employees");
  }
}
