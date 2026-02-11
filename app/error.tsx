"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error for debugging
    console.error("Application error:", error);
  }, [error]);

  const isConfigError = error.message?.includes("NEXTAUTH_SECRET") || 
                       error.message?.includes("configuration");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Internal Server Error</CardTitle>
          </div>
          <CardDescription>Something went wrong</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConfigError ? (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-red-900 mb-2">Configuration Error</p>
                <p className="text-sm text-red-800">{error.message}</p>
              </div>
              <div className="space-y-2">
                <Button onClick={() => router.push("/health-check")} className="w-full">
                  Go to Setup Page
                </Button>
                <Button variant="outline" onClick={reset} className="w-full">
                  Try Again
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-semibold text-yellow-900 mb-2">Error Details</p>
                <p className="text-sm text-yellow-800 font-mono break-all">
                  {error.message || "Unknown error occurred"}
                </p>
                {error.digest && (
                  <p className="text-xs text-yellow-700 mt-2">Error ID: {error.digest}</p>
                )}
              </div>
              <div className="space-y-2">
                <Button onClick={reset} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => router.push("/health-check")} className="w-full">
                  Check Configuration
                </Button>
                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  Go Home
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
