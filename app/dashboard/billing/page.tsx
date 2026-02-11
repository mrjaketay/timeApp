import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCompanySubscription, cancelSubscription } from "@/app/actions/subscription";
import { getPlan, PLANS, PlanType } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { CreditCard, CheckCircle2, XCircle, ArrowRight, Calendar, AlertCircle } from "lucide-react";
import { BillingActions } from "@/components/billing-actions";

export default async function BillingPage() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "EMPLOYER") {
    redirect("/dashboard");
  }

  const companyId = session.user.companyMemberships?.[0]?.companyId;

  if (!companyId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <p>No company found for your account.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get subscription (gracefully handle errors)
  let subscription = null;
  try {
    const subscriptionResult = await getCompanySubscription();
    if (subscriptionResult.success) {
      subscription = subscriptionResult.subscription;
    }
  } catch (error) {
    console.error("Error getting subscription:", error);
    // Continue with null subscription (will default to FREE)
  }

  // Get current usage
  const [employeeCount, paymentHistory] = await Promise.all([
    prisma.employeeProfile.count({
      where: { companyId, isActive: true },
    }),
    prisma.payment.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const plan = subscription ? getPlan(subscription.plan as PlanType) : getPlan("FREE");
  const isOnFreePlan = subscription?.plan === "FREE";
  const isCanceled = subscription?.cancelAtPeriodEnd || subscription?.status === "CANCELED";
  const isPastDue = subscription?.status === "PAST_DUE";

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment methods</p>
      </div>

      {/* Current Plan */}
      <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription className="mt-1">
                {subscription?.currentPeriodEnd
                  ? `Next billing date: ${format(subscription.currentPeriodEnd, "MMM d, yyyy")}`
                  : "Your current subscription plan"}
              </CardDescription>
            </div>
            <Badge
              variant={
                isOnFreePlan
                  ? "secondary"
                  : isCanceled
                  ? "destructive"
                  : isPastDue
                  ? "destructive"
                  : "default"
              }
              className="text-sm px-3 py-1"
            >
              {isOnFreePlan
                ? "Free Plan"
                : isCanceled
                ? "Canceling"
                : isPastDue
                ? "Past Due"
                : subscription?.status || "Active"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1">{plan.description}</p>
              {subscription?.plan !== "FREE" && subscription?.plan !== "ENTERPRISE" && (
                <p className="text-xl font-semibold mt-2">
                  ${plan.price}/{plan.interval === "month" ? "mo" : "yr"}
                </p>
              )}
            </div>
            {!isOnFreePlan && (
              <Button variant="outline" asChild>
                <Link href="/pricing">Change Plan</Link>
              </Button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Active Employees</p>
              <p className="text-2xl font-bold mt-1">
                {employeeCount} / {plan.limits.employees === -1 ? "∞" : plan.limits.employees}
              </p>
              {plan.limits.employees !== -1 && employeeCount >= plan.limits.employees * 0.9 && (
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {employeeCount >= plan.limits.employees
                    ? "Limit reached"
                    : "Approaching limit"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Locations</p>
              <p className="text-2xl font-bold mt-1">
                {plan.limits.locations === -1 ? "Unlimited" : `0 / ${plan.limits.locations}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Storage</p>
              <p className="text-2xl font-bold mt-1">
                {plan.limits.storageGB === -1 ? "Unlimited" : `${plan.limits.storageGB} GB`}
              </p>
            </div>
          </div>

          {/* Plan Features */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">Plan Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cancel Notice */}
          {isCanceled && subscription?.currentPeriodEnd && (
            <div className="pt-4 border-t">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-100">
                    Subscription Canceling
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Your subscription will end on {format(subscription.currentPeriodEnd, "MMM d, yyyy")}.
                    You&apos;ll continue to have access until then.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t flex flex-wrap gap-3">
            {isOnFreePlan ? (
              <Button asChild>
                <Link href="/pricing">
                  Upgrade Plan <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/pricing">Change Plan</Link>
                </Button>
                <BillingActions
                  subscription={subscription}
                  isCanceled={isCanceled}
                  currentPlan={plan}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card className="bg-gradient-to-br from-white/80 to-white dark:from-card/80 dark:to-card backdrop-blur-sm">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
            <CardDescription>View your recent payments and invoices</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-xl bg-card/50 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        payment.status === "SUCCEEDED"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : payment.status === "FAILED"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {payment.status === "SUCCEEDED" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        ${(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.description || "Subscription payment"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(payment.createdAt, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      payment.status === "SUCCEEDED"
                        ? "default"
                        : payment.status === "FAILED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
