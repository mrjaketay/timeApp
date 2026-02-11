"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { getOnboardingProgress } from "@/app/actions/onboarding";

export function ProfileCompletionBanner() {
  const router = useRouter();
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const result = await getOnboardingProgress();
        if (result.success && result.progress) {
          setProgress(result.progress.percentage);
          setCompleted(result.progress.completed);
        }
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  if (loading || completed || dismissed || progress >= 100) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Complete your profile
              </h3>
              <button
                onClick={() => setDismissed(true)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your profile is {progress}% complete. Complete your setup to unlock all features.
            </p>
            <Progress value={progress} className="h-2" />
            <Button
              size="sm"
              onClick={() => router.push("/onboarding")}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Complete Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
