"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { PLANS, PlanType } from "@/lib/subscription";
import { createCheckoutSession } from "@/app/actions/subscription";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const planId = searchParams.get("plan") as PlanType | null;
  const interval = (searchParams.get("interval") || "month") as "month" | "year";
  
  const plan = planId ? PLANS[planId] : null;

  useEffect(() => {
    if (!planId || !plan) {
      router.push("/pricing");
    }
  }, [planId, plan, router]);

  if (!planId || !plan) {
    return null;
  }

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      const result = await createCheckoutSession({
        planId,
        interval,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.success) {
        toast({
          title: "Success",
          description: result.message || `${plan.name} plan activated successfully!`,
        });
        router.push("/dashboard/billing");
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const price = interval === "year" ? plan.price * 12 * 0.8 : plan.price;
  const monthlyPrice = interval === "year" ? Math.round(price / 12) : plan.price;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/pricing">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Link>
        </Button>

        <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Confirm Your Plan</CardTitle>
            <CardDescription>Review your selection and confirm</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plan Summary */}
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Badge variant="default">{plan.name}</Badge>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Billing Period</span>
                  <span className="font-semibold capitalize">{interval}ly</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold">${monthlyPrice}</span>
                    <span className="text-sm text-muted-foreground">/{interval === "month" ? "month" : "year"}</span>
                  </div>
                </div>
                {interval === "year" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold">${Math.round(price)}/year</span>
                  </div>
                )}
                {interval === "year" && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                    Save 20% with annual billing
                  </p>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="font-semibold mb-3">What&apos;s included:</h4>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Limits */}
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Employees:</span>
                <span className="font-semibold">
                  {plan.limits.employees === -1 ? "Unlimited" : plan.limits.employees}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Locations:</span>
                <span className="font-semibold">
                  {plan.limits.locations === -1 ? "Unlimited" : plan.limits.locations}
                </span>
              </div>
            </div>

            {/* Note */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> This is a demo checkout. In production, this would integrate with Stripe for secure payment processing.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/pricing")}
                disabled={isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm ${plan.name} Plan`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
