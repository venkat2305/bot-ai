import { razorpay } from './razorpay';
import { PLANS } from '@/config/plans';
import User from '@/server/models/User';
import Subscription from '@/server/models/Subscription';

export async function createSubscription(userId: string) {
  const user: any = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const customer = await razorpay.customers.create({
    name: user.name || '',
    email: user.email,
    notes: { userId: user._id.toString() },
  });

  const sub: any = await razorpay.subscriptions.create({
    plan_id: PLANS.PRO_MONTHLY.id,
    customer_notify: 1,
    customer_id: customer.id,
  } as any);

  const newSub = await Subscription.create({
    userId: user._id,
    razorpaySubscriptionId: sub.id,
    razorpayCustomerId: customer.id,
    planId: PLANS.PRO_MONTHLY.id,
    status: sub.status,
    currentPeriodStart: new Date(sub.current_start * 1000),
    currentPeriodEnd: new Date(sub.current_end * 1000),
  });

  await User.findByIdAndUpdate(userId, {
    subscriptionTier: 'pro',
    subscriptionId: newSub._id,
  });

  return sub.id;
}
