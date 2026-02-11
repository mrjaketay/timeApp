"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HealthCheckPage() {
  const [checks, setChecks] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((res) => res.json())
      .then((data) => {
        setChecks(data);
        setLoading(false);
      })
      .catch((err) => {
        setChecks({ error: err.message });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Checking configuration...</p>
        </div>
      </div>
    );
  }

  const hasError = checks?.error || !checks?.checks?.hasSecret;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration Health Check</CardTitle>
            <CardDescription>Check if your environment variables are set correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checks?.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <p className="font-semibold">Error</p>
                </div>
                <p className="mt-2 text-red-700">{checks.error}</p>
                {checks.instructions && (
                  <div className="mt-4 p-3 bg-white rounded border border-red-200">
                    <p className="text-sm font-medium text-red-900 mb-2">How to fix:</p>
                    <p className="text-sm text-red-800">{checks.instructions}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {checks?.checks?.hasSecret ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">NEXTAUTH_SECRET</p>
                        <p className="text-sm text-muted-foreground">
                          {checks?.checks?.hasSecret
                            ? "Set correctly"
                            : "Not set - required"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {checks?.checks?.hasUrl ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      )}
                      <div>
                        <p className="font-medium">NEXTAUTH_URL</p>
                        <p className="text-sm text-muted-foreground">
                          {checks?.checks?.hasUrl
                            ? "Set correctly"
                            : "Not set - optional for dev"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {checks?.checks?.hasDatabase ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">DATABASE_URL</p>
                        <p className="text-sm text-muted-foreground">
                          {checks?.checks?.hasDatabase
                            ? "Set correctly"
                            : "Not set - required"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {checks?.instructions && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">
                        Step 1: Create .env file
                      </p>
                      <p className="text-sm text-blue-800 mb-2">
                        Create a file named <code className="bg-white px-1 rounded">.env</code> in the root directory (same folder as package.json)
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">
                        Step 2: Add these lines to .env:
                      </p>
                      <div className="bg-white p-3 rounded border border-blue-200 font-mono text-sm space-y-1">
                        {checks.instructions.envExample.map((line: string, i: number) => (
                          <div key={i} className="flex items-center justify-between">
                            <span>{line}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(line.replace(/\[generate below\]/, ""));
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-900 mb-2">
                        Step 3: Generate NEXTAUTH_SECRET
                      </p>
                      <p className="text-sm text-blue-800 mb-2">
                        Open PowerShell and run this command:
                      </p>
                      <div className="bg-white p-3 rounded border border-blue-200 relative">
                        <code className="font-mono text-xs break-all block pr-10">
                          {checks.instructions.powershellCommand}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(checks.instructions.powershellCommand);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-blue-700 mt-2">
                        Copy the output and paste it as the value for NEXTAUTH_SECRET in your .env file
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-blue-900 mb-2">
                        Step 4: Restart the server
                      </p>
                      <p className="text-sm text-blue-800">
                        After creating/updating .env, stop the server (Ctrl+C) and restart with <code className="bg-white px-1 rounded">npm run dev</code>
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
