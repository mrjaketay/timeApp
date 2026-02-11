"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cancelSubscription } from "@/app/actions/subscription";
import { XCircle, RotateCcw, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BillingActionsProps {
  subscription: {
    id: string;
    plan: string;
    cancelAtPeriodEnd: boolean;
    status: string;
  } | null;
  isCanceled: boolean;
  currentPlan: {
    name: string;
    price: number;
  };
}

export function BillingActions({ subscription, isCanceled, currentPlan }: BillingActionsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancel = async () => {
    startTransition(async () => {
      const result = await cancelSubscription();
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Canceling",
          description: result.message || "Your subscription will be canceled at the end of the billing period.",
        });
        router.refresh();
      }
    });
  };

  if (!subscription || subscription.plan === "FREE" || subscription.plan === "ENTERPRISE") {
    return null;
  }

  if (isCanceled) {
    return (
      <Button variant="outline" disabled>
        <RotateCcw className="mr-2 h-4 w-4" />
        Canceling at period end
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive hover:text-destructive">
          <XCircle className="mr-2 h-4 w-4" />
          Cancel Subscription
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your {currentPlan.name} subscription? You&apos;ll continue to
            have access to all features until the end of your billing period. After that, your
            account will be downgraded to the Free plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Canceling...
              </>
            ) : (
              "Yes, Cancel Subscription"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
