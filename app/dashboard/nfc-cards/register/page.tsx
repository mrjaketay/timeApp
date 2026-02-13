"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Radio, Loader2, Copy, Check } from "lucide-react";
import Link from "next/link";
import { registerNFCCard } from "@/app/actions/nfc";

interface Employee {
  id: string;
  name: string | null;
  email: string | null;
  employeeId: string | null;
}

export default function RegisterNFCCardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    uid: "",
    employeeProfileId: "",
  });
  const [nfcSupported, setNfcSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [registeredUid, setRegisteredUid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const tapUrl =
    typeof window !== "undefined" && registeredUid
      ? `${window.location.origin}/tap?card=${encodeURIComponent(registeredUid)}`
      : "";

  useEffect(() => {
    fetchEmployees();
    
    // Check if NFC is supported
    if (typeof window !== "undefined" && "NDEFReader" in window) {
      setNfcSupported(true);
    }
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const scanNFC = async () => {
    if (!nfcSupported) {
      toast({
        title: "NFC not supported",
        description: "Your device does not support NFC. Please enter the UID manually.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    try {
      // @ts-ignore - NDEFReader is not in TypeScript types yet
      const reader = new NDEFReader();
      await reader.scan();

      reader.addEventListener("reading", ({ message }: any) => {
        const record = message.records[0];
        const uid = new TextDecoder().decode(record.data);
        setFormData((prev) => ({ ...prev, uid }));
        setIsScanning(false);
        toast({
          title: "NFC card scanned",
          description: "Card UID captured successfully.",
        });
      });

      reader.addEventListener("error", () => {
        toast({
          title: "NFC scan failed",
          description: "Could not read NFC card. Please try again or enter UID manually.",
          variant: "destructive",
        });
        setIsScanning(false);
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        setIsScanning(false);
      }, 30000);
    } catch (error) {
      toast({
        title: "NFC error",
        description: "Failed to start NFC scan. Please use manual entry.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.uid.trim()) {
      toast({
        title: "UID required",
        description: "Please enter or scan the NFC card UID.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.employeeProfileId) {
      toast({
        title: "Employee required",
        description: "Please select an employee to assign this card to.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await registerNFCCard({
        uid: formData.uid.trim(),
        employeeProfileId: formData.employeeProfileId,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "NFC card registered. Write the tap URL to your card.",
        });
        setRegisteredUid(formData.uid.trim());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register NFC card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTapUrl = async () => {
    if (!tapUrl) return;
    try {
      await navigator.clipboard.writeText(tapUrl);
      setCopied(true);
      toast({ title: "Copied", description: "Tap URL copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (registeredUid) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/nfc-cards">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Card registered</CardTitle>
            <CardDescription>
              Write this URL to your NFC tag so a tap opens it and clocks the employee in or out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input readOnly value={tapUrl} className="font-mono text-sm" />
              <Button onClick={copyTapUrl} variant="secondary" className="shrink-0">
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy URL"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use an NFC write app (e.g. NFC Tools) to write this URL to the physical card. After that, tapping the card on a phone will open this link and clock the employee in or out (location required).
            </p>
            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link href="/dashboard/nfc-cards">Back to NFC cards</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRegisteredUid(null);
                  setFormData({ uid: "", employeeProfileId: formData.employeeProfileId });
                }}
              >
                Register another card
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/nfc-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Register NFC Card</h1>
          <p className="text-muted-foreground">Register a new NFC card for an employee</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Card Information</CardTitle>
          <CardDescription>
            Scan or manually enter the NFC card UID and assign it to an employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="uid">Card UID</Label>
              <div className="flex space-x-2">
                <Input
                  id="uid"
                  placeholder="Enter or scan card UID"
                  value={formData.uid}
                  onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                  required
                  className="flex-1"
                />
                {nfcSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={scanNFC}
                    disabled={isScanning || isSubmitting}
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
              </div>
              {!nfcSupported && (
                <p className="text-xs text-muted-foreground">
                  NFC scanning is not supported on your device. Please enter the UID manually.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Assign to Employee</Label>
              {isLoadingEmployees ? (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading employees...</span>
                </div>
              ) : employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No employees found. Please invite employees first.
                </p>
              ) : (
                <Select
                  value={formData.employeeProfileId}
                  onValueChange={(value) => setFormData({ ...formData, employeeProfileId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name || employee.email || employee.employeeId || "Unknown Employee"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex space-x-2 pt-4">
              <Button type="submit" disabled={isSubmitting || !formData.employeeProfileId || employees.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register Card"
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/nfc-cards">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
