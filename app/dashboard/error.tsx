"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  const message = error?.message ?? "Unknown error";
  const isConnectionError =
    /max clients|MaxClients|connection|pool|ECONNREFUSED|connect/i.test(message);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <CardTitle>Dashboard error</CardTitle>
          </div>
          <CardDescription>Something went wrong loading the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-mono text-muted-foreground break-words">{message}</p>
          {isConnectionError && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
              <strong>Database connection:</strong> Use the pooled URL (e.g. Supabase port 6543 with{" "}
              <code className="text-xs">?pgbouncer=true</code>) as <code className="text-xs">DATABASE_URL</code>.
              See CONNECTION_POOL.md.
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.assign("/dashboard")}>
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
