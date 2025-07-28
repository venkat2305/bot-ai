export const PLANS = {
  PRO_MONTHLY: {
    id: process.env.RAZORPAY_PRO_MONTHLY_PLAN_ID as string,
    name: 'Pro Monthly',
    price: 10000,
    currency: 'INR',
    features: [
      'GitHub Repository Import',
      'Unlimited Chat History',
      'Priority Support',
    ],
  },
} as const;
