import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Subscription from '@/server/models/Subscription';
import { razorpay } from '@/lib/razorpay';

const secret = process.env.RAZORPAY_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (signature !== expected) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  const event = JSON.parse(body);

  if (event.event === 'subscription.charged') {
    const subId = event.payload.subscription.entity.id;
    await Subscription.findOneAndUpdate({ razorpaySubscriptionId: subId }, { status: 'active' });
  } else if (event.event === 'subscription.cancelled') {
    const subId = event.payload.subscription.entity.id;
    await Subscription.findOneAndUpdate({ razorpaySubscriptionId: subId }, { status: 'cancelled', cancelledAt: new Date() });
  }

  return NextResponse.json({ received: true });
}
