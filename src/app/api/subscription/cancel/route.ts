import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import Subscription from '@/server/models/Subscription';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscriptionId } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await razorpay.subscriptions.cancel(subscriptionId);
    await Subscription.findOneAndUpdate({ razorpaySubscriptionId: subscriptionId }, { status: 'cancelled', cancelledAt: new Date() });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cancel failed', err);
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 });
  }
}
