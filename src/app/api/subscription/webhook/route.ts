import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/razorpay';
import { RazorpaySubscriptionWebhook } from '@/types/subscription';
import { WebhookHandler } from '@/lib/webhook-handler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    
    if (!signature) {
      console.error('Missing Razorpay signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Missing RAZORPAY_WEBHOOK_SECRET environment variable');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const isValidSignature = RazorpayService.verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData: RazorpaySubscriptionWebhook = JSON.parse(body);
    
    console.log('Received webhook:', {
      event: webhookData.event,
      subscriptionId: webhookData.payload.subscription?.entity?.id,
      paymentId: webhookData.payload.payment?.entity?.id
    });

    // Use centralized webhook handler with reliability patterns
    const result = await WebhookHandler.processWebhook(webhookData);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 