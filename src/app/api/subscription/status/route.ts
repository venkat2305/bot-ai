import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import Subscription from '@/server/models/Subscription';

export async function POST(req: NextRequest) {
  const { subscriptionId } = await req.json();
  if (!subscriptionId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  try {
    const sub = await razorpay.subscriptions.fetch(subscriptionId);
    await Subscription.findOneAndUpdate({ razorpaySubscriptionId: subscriptionId }, { status: sub.status });
    return NextResponse.json(sub);
  } catch (err) {
    console.error('Fetch failed', err);
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
