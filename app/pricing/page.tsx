"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Sparkles, Zap, Crown, Users, Clock, FileText, MapPin, HeadphonesIcon } from "lucide-react";
import { PLANS, PlanType } from "@/lib/subscription";
import { createCheckoutSession } from "@/app/actions/subscription";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");
  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);

  const handleSelectPlan = async (planId: PlanType) => {
    if (!session?.user) {
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      setLoadingPlan(planId);
      
      // Enterprise - contact sales
      if (planId === "ENTERPRISE") {
        window.location.href = "mailto:sales@timetrack.com?subject=Enterprise Inquiry";
        return;
      }

      // Create checkout session (handles FREE and paid plans)
      const result = await createCheckoutSession({
        planId,
        interval: billingInterval,
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
          description: result.message || `${PLANS[planId].name} plan activated successfully!`,
        });
        router.push("/dashboard/billing");
        router.refresh();
      } else if ("url" in result && typeof result.url === "string") {
        // If Stripe checkout URL is returned (future implementation)
        window.location.href = result.url;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const getPlanIcon = (planId: PlanType) => {
    switch (planId) {
      case "FREE":
        return <Users className="h-6 w-6" />;
      case "BASIC":
        return <Zap className="h-6 w-6" />;
      case "PRO":
        return <Sparkles className="h-6 w-6" />;
      case "ENTERPRISE":
        return <Crown className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planId: PlanType) => {
    switch (planId) {
      case "FREE":
        return "border-gray-300 dark:border-gray-700";
      case "BASIC":
        return "border-blue-500";
      case "PRO":
        return "border-purple-500";
      case "ENTERPRISE":
        return "border-yellow-500";
    }
  };

  const planOrder: PlanType[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[2s]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-[4s]"></div>
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-block">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              Simple, Transparent Pricing
            </Badge>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free, scale as you grow. No credit card required to get started.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-sm ${billingInterval === "month" ? "font-semibold" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingInterval === "year" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm ${billingInterval === "year" ? "font-semibold" : "text-muted-foreground"}`}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 20%
              </Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {planOrder.map((planId) => {
            const plan = PLANS[planId];
            const isPopular = planId === "PRO";
            const isEnterprise = planId === "ENTERPRISE";
            
            // Calculate pricing correctly
            let displayPrice: string;
            if (isEnterprise) {
              displayPrice = "Custom";
            } else if (billingInterval === "year") {
              const yearlyPrice = Math.round(plan.price * 12 * 0.8); // 20% discount
              const monthlyEquivalent = Math.round(yearlyPrice / 12);
              displayPrice = `$${monthlyEquivalent}`;
            } else {
              displayPrice = `$${plan.price}`;
            }

            return (
              <Card
                key={planId}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  isPopular
                    ? "border-2 border-purple-500 shadow-xl scale-105 lg:scale-110 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-card"
                    : `border ${getPlanColor(planId)} bg-card/80 backdrop-blur-sm`
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div
                      className={`p-3 rounded-xl ${
                        isPopular
                          ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {getPlanIcon(planId)}
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {displayPrice}
                    </span>
                    {!isEnterprise && (
                      <span className="text-muted-foreground">
                        /{billingInterval === "month" ? "month" : "year"}
                        {billingInterval === "year" && (
                          <span className="block text-sm mt-1">
                            ${Math.round(plan.price * 12 * 0.8)}/year (${Math.round(plan.price * 0.8)}/month)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limits */}
                  <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Employees:</span>
                      <span className="font-semibold">
                        {plan.limits.employees === -1 ? "Unlimited" : plan.limits.employees}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Locations:</span>
                      <span className="font-semibold">
                        {plan.limits.locations === -1 ? "Unlimited" : plan.limits.locations}
                      </span>
                    </div>
                    {plan.limits.reportsPerMonth !== -1 && (
                      <div className="flex items-center justify-between">
                        <span>Reports/month:</span>
                        <span className="font-semibold">{plan.limits.reportsPerMonth}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-6">
                  <Button
                    onClick={() => handleSelectPlan(planId)}
                    disabled={loadingPlan === planId}
                    className={`w-full ${
                      isPopular
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                        : ""
                    }`}
                    variant={isPopular ? "default" : "outline"}
                  >
                    {loadingPlan === planId ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isEnterprise ? (
                      <>
                        Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : planId === "FREE" ? (
                      <>
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate your billing.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my plan limits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We&apos;ll notify you when you&apos;re approaching your limits. You can upgrade your plan or contact us for custom solutions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The Free plan is available forever with no credit card required. Paid plans include a 14-day free trial.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Need help choosing a plan?{" "}
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Contact our sales team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
