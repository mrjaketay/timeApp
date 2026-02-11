"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UpgradeBannerProps {
  message: string;
  currentLimit?: number;
  currentUsage?: number;
  feature?: string;
}

export function UpgradeBanner({ message, currentLimit, currentUsage, feature }: UpgradeBannerProps) {
  const router = useRouter();

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
              Plan Limit Reached
            </h3>
            <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
              {message}
            </p>
            {currentLimit !== undefined && currentUsage !== undefined && (
              <p className="text-xs text-orange-700 dark:text-orange-300 mb-3">
                Current usage: {currentUsage} / {currentLimit} {feature || "items"}
              </p>
            )}
            <Button
              onClick={() => router.push("/pricing")}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="sm"
            >
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
