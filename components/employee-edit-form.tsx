"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Loader2, Radio, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { updateEmployee } from "@/app/actions/employee";
import { registerNFCCard } from "@/app/actions/nfc";

type EmployeeEditFormProps = {
  employee: {
    id: string;
    name: string | null;
    email: string | null;
    employeeId: string | null;
    phone: string | null;
    address: string | null;
    salaryRate: number | null;
    employmentStartDate: string | null;
    dateOfBirth: string | null;
    isActive: boolean;
    nfcCards: Array<{
      id: string;
      uid: string;
      isActive: boolean;
      registeredAt: string;
      lastUsedAt: string | null;
    }>;
  };
};

type FormState = {
  name: string;
  email: string;
  employeeId: string;
  phone: string;
  address: string;
  salaryRate: string;
  employmentStartDate: string;
  dateOfBirth: string;
  status: "active" | "inactive";
};

export function EmployeeEditForm({ employee }: EmployeeEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [formState, setFormState] = useState<FormState>({
    name: employee.name ?? "",
    email: employee.email ?? "",
    employeeId: employee.employeeId ?? "",
    phone: employee.phone ?? "",
    address: employee.address ?? "",
    salaryRate:
      typeof employee.salaryRate === "number" ? employee.salaryRate.toString() : "",
    employmentStartDate: employee.employmentStartDate
      ? employee.employmentStartDate.slice(0, 10)
      : "",
    dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "",
    status: employee.isActive ? "active" : "inactive",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [cardUid, setCardUid] = useState("");
  const [isRegisteringCard, setIsRegisteringCard] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setNfcSupported(true);
    }
  }, []);

  const handleInputChange = (
    field: keyof FormState,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formState.name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide the employee's name.",
        variant: "destructive",
      });
      return;
    }

    let salaryRate: number | null = null;
    if (formState.salaryRate.trim()) {
      const parsedSalary = parseFloat(formState.salaryRate);
      if (Number.isNaN(parsedSalary) || parsedSalary < 0) {
        toast({
          title: "Invalid salary",
          description: "Salary rate must be a positive number.",
          variant: "destructive",
        });
        return;
      }
      salaryRate = parsedSalary;
    }

    setIsSaving(true);

    try {
      const result = await updateEmployee({
        id: employee.id,
        name: formState.name.trim(),
        email: formState.email.trim() ? formState.email.trim() : null,
        employeeId: formState.employeeId.trim()
          ? formState.employeeId.trim()
          : null,
        phone: formState.phone.trim() ? formState.phone.trim() : null,
        address: formState.address.trim() ? formState.address.trim() : null,
        salaryRate,
        employmentStartDate: formState.employmentStartDate || null,
        dateOfBirth: formState.dateOfBirth || null,
        isActive: formState.status === "active",
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Employee updated",
          description: result.message,
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterCard = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!cardUid.trim()) {
      toast({
        title: "UID required",
        description: "Please scan or enter the NFC card UID.",
        variant: "destructive",
      });
      return;
    }

    setIsRegisteringCard(true);

    try {
      const result = await registerNFCCard({
        uid: cardUid.trim(),
        employeeProfileId: employee.id,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Card linked",
          description: "NFC card registered successfully.",
        });
        setCardUid("");
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to register card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegisteringCard(false);
    }
  };

  const handleScanCard = async () => {
    if (!nfcSupported) {
      toast({
        title: "NFC not supported",
        description: "This device does not support NFC scanning.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    try {
      // @ts-ignore - NDEFReader is not yet in the DOM typings
      const reader = new NDEFReader();
      await reader.scan();

      const handleReading = ({ message }: any) => {
        const record = message.records[0];
        const uid = new TextDecoder().decode(record.data);
        setCardUid(uid);
        toast({
          title: "Card scanned",
          description: "Card UID captured successfully.",
        });
        setIsScanning(false);
        reader.removeEventListener("reading", handleReading);
      };

      const handleError = () => {
        toast({
          title: "Scan failed",
          description: "Could not read the NFC card. Please try again.",
          variant: "destructive",
        });
        setIsScanning(false);
        reader.removeEventListener("error", handleError);
      };

      reader.addEventListener("reading", handleReading);
      reader.addEventListener("error", handleError);

      setTimeout(() => {
        setIsScanning(false);
        reader.removeEventListener("reading", handleReading);
        reader.removeEventListener("error", handleError);
      }, 30000);
    } catch (error) {
      toast({
        title: "NFC error",
        description: "Failed to start NFC scan. Please try again.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-gradient-to-br from-white/70 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              Update contact details, employment info, and profile status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formState.name}
                    onChange={(event) => handleInputChange("name", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formState.email}
                    onChange={(event) => handleInputChange("email", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    placeholder="Optional unique identifier"
                    value={formState.employeeId}
                    onChange={(event) =>
                      handleInputChange("employeeId", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+1 555-123-4567"
                    value={formState.phone}
                    onChange={(event) => handleInputChange("phone", event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Street, City, State, ZIP"
                    value={formState.address}
                    onChange={(event) => handleInputChange("address", event.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentStartDate">Employment Start Date</Label>
                  <Input
                    id="employmentStartDate"
                    type="date"
                    value={formState.employmentStartDate}
                    onChange={(event) =>
                      handleInputChange("employmentStartDate", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formState.dateOfBirth}
                    onChange={(event) =>
                      handleInputChange("dateOfBirth", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salaryRate">Hourly Rate</Label>
                  <Input
                    id="salaryRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 25.00"
                    value={formState.salaryRate}
                    onChange={(event) =>
                      handleInputChange("salaryRate", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formState.status}
                    onValueChange={(value: "active" | "inactive") =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Linked NFC Cards</span>
            </CardTitle>
            <CardDescription>
              Manage cards that this employee can use to clock in and out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={handleRegisterCard}
              className="grid gap-4 md:grid-cols-[2fr_auto]"
            >
              <div className="space-y-2">
                <Label htmlFor="cardUid">Add New Card</Label>
                <Input
                  id="cardUid"
                  placeholder="Scan or enter card UID"
                  value={cardUid}
                  onChange={(event) => setCardUid(event.target.value)}
                  disabled={isRegisteringCard}
                />
              </div>
              <div className="flex items-end space-x-2">
                {nfcSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleScanCard}
                    disabled={isRegisteringCard || isScanning}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Radio className="mr-2 h-4 w-4" />
                        Scan
                      </>
                    )}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isRegisteringCard || !cardUid.trim()}
                >
                  {isRegisteringCard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    "Link Card"
                  )}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {employee.nfcCards.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cards are currently linked to this employee.
                </p>
              )}

              {employee.nfcCards.map((card) => (
                <div
                  key={card.id}
                  className="flex flex-wrap items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">UID: {card.uid}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered {format(new Date(card.registeredAt), "MMM dd, yyyy")}
                    </p>
                    {card.lastUsedAt && (
                      <p className="text-xs text-muted-foreground">
                        Last used {format(new Date(card.lastUsedAt), "MMM dd, yyyy")}
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
      </div>

      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>
              Helpful notes for editing employee information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              When you update an employee&apos;s name or email, it immediately updates
              everywhere the employee appears in the dashboard.
            </p>
            <p>
              Employee IDs must stay unique. If you recycle an old badge, be sure to
              clear the previous ID first.
            </p>
            <p>
              Linking a new NFC card lets the employee clock in from the shared kiosk.
              You can scan the card or type the UID manually.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
