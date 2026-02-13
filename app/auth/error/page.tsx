"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    // If it's a configuration error, redirect to health check after a moment
    if (error === "Configuration") {
      const timer = setTimeout(() => {
        router.push("/health-check");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, router]);

  if (error === "Configuration") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle>Authentication Configuration Error</CardTitle>
            </div>
            <CardDescription>
              NEXTAUTH_SECRET is not configured
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The application requires environment variables to be set. Redirecting to setup page...
            </p>
            <div className="flex space-x-2">
              <Button asChild>
                <Link href="/health-check">Go to Setup Page</Link>
              </Button>
              <Button variant="outline" onClick={() => router.push("/health-check")}>
                Setup Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>An error occurred during authentication</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Error: {error || "Unknown error"}</p>
          <Button asChild>
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
