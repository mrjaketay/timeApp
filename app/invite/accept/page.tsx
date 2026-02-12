"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptanceMessage, setAcceptanceMessage] = useState<string>("");

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/validate?token=${token}`);
        const data = await response.json();

        if (data.error) {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        } else {
          setInvitation(data.invitation);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load invitation. Please check the link.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    } else {
      setIsLoading(false);
    }
  }, [token, toast]);

  const handleAccept = async () => {
    setIsAccepting(true);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      } else {
        setAccepted(true);
        setAcceptanceMessage(data.message || "Invitation accepted successfully!");
        toast({
          title: "Success",
          description: data.message || "Invitation accepted successfully!",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to accept invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Invalid Invitation</span>
            </CardTitle>
            <CardDescription>No invitation token provided</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Invitation Not Found</span>
            </CardTitle>
            <CardDescription>This invitation may have expired or already been used.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status !== "PENDING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {invitation.status === "ACCEPTED" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>
                {invitation.status === "ACCEPTED" ? "Invitation Already Accepted" : "Invitation Expired"}
              </span>
            </CardTitle>
            <CardDescription>
              {invitation.status === "ACCEPTED"
                ? "This invitation has already been accepted."
                : "This invitation has expired. Please request a new one."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiresAt = new Date(invitation.expiresAt);
  const isExpired = expiresAt < new Date();

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Invitation Expired</span>
            </CardTitle>
            <CardDescription>
              This invitation expired on {expiresAt.toLocaleDateString()}. Please request a new invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <span>Welcome to {invitation.company?.name || "TimeTrack"}!</span>
            </CardTitle>
            <CardDescription className="text-center">Your invitation has been accepted successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground whitespace-pre-line">
                {acceptanceMessage || `You&apos;ve been successfully added to ${invitation.company?.name}.`}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                You don&apos;t need to log in. Your employer will manage your attendance and timesheets.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>Accept Invitation</span>
          </CardTitle>
          <CardDescription>
            You have been invited to join {invitation.company?.name || "a company"} on TimeTrack
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm font-medium">Employee Name</p>
              <p className="text-muted-foreground">{invitation.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-muted-foreground">{invitation.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Company</p>
              <p className="text-muted-foreground">{invitation.company?.name || "N/A"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Click the button below to accept this invitation and be added to the company.
            </p>
            <Button onClick={handleAccept} className="w-full" disabled={isAccepting} size="lg">
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting Invitation...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><div className="animate-pulse text-muted-foreground">Loading invitation...</div></div>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
