// Subscription plan definitions and feature limits
export type PlanType = "FREE" | "BASIC" | "PRO" | "ENTERPRISE";

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  priceId?: string; // Stripe price ID
  interval: "month" | "year";
  description: string;
  features: string[];
  limits: {
    employees: number; // -1 for unlimited
    locations: number;
    reportsPerMonth: number;
    storageGB: number;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
  };
}

export const PLANS: Record<PlanType, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    price: 0,
    interval: "month",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 5 employees",
      "Basic time tracking",
      "Attendance reports",
      "Email support",
      "Mobile app access",
    ],
    limits: {
      employees: 5,
      locations: 1,
      reportsPerMonth: 10,
      storageGB: 1,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    price: 29,
    priceId: process.env.STRIPE_BASIC_PRICE_ID, // Set in .env
    interval: "month",
    description: "For growing businesses",
    features: [
      "Up to 25 employees",
      "All Free features",
      "Advanced reports & analytics",
      "Multiple locations",
      "Break tracking",
      "Email & chat support",
    ],
    limits: {
      employees: 25,
      locations: 5,
      reportsPerMonth: 100,
      storageGB: 10,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    price: 79,
    priceId: process.env.STRIPE_PRO_PRICE_ID, // Set in .env
    interval: "month",
    description: "For established companies",
    features: [
      "Up to 100 employees",
      "All Basic features",
      "Advanced analytics & insights",
      "Unlimited locations",
      "Custom reports",
      "API access",
      "Priority support",
      "NFC card management",
    ],
    limits: {
      employees: 100,
      locations: -1, // unlimited
      reportsPerMonth: -1, // unlimited
      storageGB: 50,
      apiAccess: true,
      prioritySupport: true,
      customBranding: false,
    },
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 0, // Custom pricing
    interval: "month",
    description: "For large organizations with custom needs",
    features: [
      "Unlimited employees",
      "All Pro features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantees",
      "Custom branding",
      "On-premise deployment option",
      "24/7 phone support",
    ],
    limits: {
      employees: -1, // unlimited
      locations: -1, // unlimited
      reportsPerMonth: -1, // unlimited
      storageGB: -1, // unlimited
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
};

export function getPlan(planId: PlanType): Plan {
  return PLANS[planId] || PLANS.FREE;
}

export function checkFeatureAccess(
  plan: PlanType,
  feature: keyof Plan["limits"]
): boolean {
  const planConfig = getPlan(plan);
  return planConfig.limits[feature] === true || planConfig.limits[feature] === -1;
}

export function checkLimit(
  plan: PlanType,
  limit: keyof Plan["limits"],
  currentUsage: number
): boolean {
  const planConfig = getPlan(plan);
  const limitValue = planConfig.limits[limit];
  
  // -1 means unlimited
  if (limitValue === -1) return true;
  
  // For boolean limits, check if enabled
  if (typeof limitValue === "boolean") return limitValue;
  
  // For numeric limits, check if within limit
  return currentUsage < limitValue;
}

export function getUpgradeMessage(plan: PlanType, feature: string): string {
  const nextPlan = getNextPlan(plan);
  if (!nextPlan) return "Contact us for Enterprise pricing";
  return `Upgrade to ${nextPlan.name} to unlock ${feature}`;
}

function getNextPlan(plan: PlanType): Plan | null {
  const order: PlanType[] = ["FREE", "BASIC", "PRO", "ENTERPRISE"];
  const currentIndex = order.indexOf(plan);
  if (currentIndex === -1 || currentIndex === order.length - 1) return null;
  return PLANS[order[currentIndex + 1]];
}
