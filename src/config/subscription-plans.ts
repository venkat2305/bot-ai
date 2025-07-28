// Centralized subscription plans configuration
// Plans must be created in Razorpay Dashboard first

export interface SubscriptionPlan {
  id: string;                    // Razorpay plan ID
  internalId: string;           // Internal reference for database
  name: string;                 // Display name
  description: string;          // Plan description
  price: number;               // Price in paise (₹100 = 10000)
  currency: string;            // Currency code
  interval: number;            // Billing interval count
  period: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Billing period
  features: string[];          // List of features included
  popular?: boolean;           // Mark as popular plan
  stripePriceId?: string;      // For future Stripe integration
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  TEST_MONTHLY: {
    id: 'plan_QyUF3Pke1IYFcA',        // Test plan ID from dashboard
    internalId: 'test_monthly',        // Internal reference
    name: 'Test Monthly',
    description: 'Test subscription for development and testing',
    price: 100,                        // ₹1 in paise
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    features: [
      'GitHub Repository Import',
      'Unlimited Chat History',
      'Priority AI Models',
      'Advanced Code Analysis',
      'Priority Support',
      'Export Conversations',
    ],
    popular: false,
  },
  PRO_MONTHLY: {
    id: 'plan_QwuAA00ZJKNHHX',        // Razorpay plan ID from dashboard
    internalId: 'pro_monthly',         // Internal reference
    name: 'Pro Monthly',
    description: 'Premium AI features with unlimited access',
    price: 10000,                      // ₹100 in paise
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    features: [
      'GitHub Repository Import',
      'Unlimited Chat History',
      'Priority AI Models',
      'Advanced Code Analysis',
      'Priority Support',
      'Export Conversations',
    ],
    popular: true,
  },
} as const;

// Type for plan keys
export type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

// Helper functions
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.id === planId);
}

export function getPlanByInternalId(internalId: string): SubscriptionPlan | undefined {
  return Object.values(SUBSCRIPTION_PLANS).find(plan => plan.internalId === internalId);
}

export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

export function getAvailablePlans(): SubscriptionPlan[] {
  // Return only plans that should be shown to users
  // Useful for hiding certain plans without removing them
  return Object.values(SUBSCRIPTION_PLANS);
}

export function formatPrice(priceInPaise: number, currency: string = 'INR'): string {
  const price = priceInPaise / 100; // Convert paise to rupees
  if (currency === 'INR') {
    return `₹${price}`;
  }
  return `${currency} ${price}`;
}

export function getPlanPrice(planKey: PlanKey): number {
  return SUBSCRIPTION_PLANS[planKey].price;
}

export function isPlanActive(planKey: PlanKey): boolean {
  // Check if plan is available for new subscriptions
  // Useful for deprecating plans without breaking existing subscriptions
  return true; // All plans are active by default
}

// Validation helper
export function isValidPlanId(planId: string): boolean {
  return Object.values(SUBSCRIPTION_PLANS).some(plan => plan.id === planId);
}

export function isValidInternalPlanId(internalId: string): boolean {
  return Object.values(SUBSCRIPTION_PLANS).some(plan => plan.internalId === internalId);
}

// Default plan for new users
export const DEFAULT_PLAN: SubscriptionPlan = {
  id: 'free',
  internalId: 'free',
  name: 'Free',
  description: 'Basic AI features with limited usage',
  price: 0,
  currency: 'INR',
  interval: 1,
  period: 'monthly',
  features: [
    'Limited Chat History',
    'Basic AI Models',
    'Community Support',
  ],
}; 