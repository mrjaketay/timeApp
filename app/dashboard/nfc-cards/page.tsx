import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Plus, Radio } from "lucide-react";
import Link from "next/link";

export default async function NFCCardsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return <div>No company found</div>;
  }

  // Build where clause for search
  const where: any = { companyId };
  
  if (searchParams.search) {
    const searchLower = searchParams.search.toLowerCase();
    where.OR = [
      { uid: { contains: searchLower } },
      {
        employeeProfile: {
          OR: [
            { name: { contains: searchLower, mode: "insensitive" } },
            { email: { contains: searchLower, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const nfcCards = await prisma.nFCCard.findMany({
    where,
    include: {
      employeeProfile: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NFC Cards</h1>
          <p className="text-muted-foreground">Manage employee NFC cards</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/nfc-cards/register">
            <Plus className="mr-2 h-4 w-4" />
            Register Card
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Cards</CardTitle>
          <CardDescription>
            {nfcCards.length} {nfcCards.length === 1 ? "card" : "cards"} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nfcCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Radio className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">UID: {card.uid}</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned to: {(card.employeeProfile.name || card.employeeProfile.email) ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Registered: {format(card.registeredAt, "MMM d, yyyy")}
                      {card.lastUsedAt && ` • Last used: ${format(card.lastUsedAt, "MMM d, yyyy")}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {card.isActive ? (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            ))}
            {nfcCards.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No NFC cards registered yet. Register a card to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
