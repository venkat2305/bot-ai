import { NextRequest, NextResponse } from 'next/server';
import { RazorpayService } from '@/lib/razorpay';
import { RazorpaySubscriptionWebhook } from '@/types/subscription';
import dbConnect from '@/lib/mongodb';
import Subscription from '@/server/models/Subscription';
import Payment from '@/server/models/Payment';
import User from '@/server/models/User';
import mongoose from 'mongoose';

// Model for tracking processed webhooks to prevent duplicates
const ProcessedWebhookSchema = new mongoose.Schema({
  webhookId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
  subscriptionId: String,
  paymentId: String,
});

const ProcessedWebhook = mongoose.models.ProcessedWebhook || 
  mongoose.model('ProcessedWebhook', ProcessedWebhookSchema);

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

    await dbConnect();

    // Check if webhook already processed (idempotency)
    const webhookId = `${webhookData.event}_${webhookData.created_at}_${webhookData.payload.subscription?.entity?.id || webhookData.payload.payment?.entity?.id}`;
    
    const existingWebhook = await ProcessedWebhook.findOne({ webhookId });
    if (existingWebhook) {
      console.log('Webhook already processed:', webhookId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Process webhook based on event type
    let result;
    switch (webhookData.event) {
      case 'subscription.charged':
        result = await handleSubscriptionCharged(webhookData);
        break;
      case 'subscription.authenticated':
        result = await handleSubscriptionAuthenticated(webhookData);
        break;
      case 'subscription.activated':
        result = await handleSubscriptionActivated(webhookData);
        break;
      case 'subscription.cancelled':
        result = await handleSubscriptionCancelled(webhookData);
        break;
      case 'payment.failed':
        result = await handlePaymentFailed(webhookData);
        break;
      default:
        console.log('Unhandled webhook event:', webhookData.event);
        result = { success: true, message: 'Event not handled' };
    }

    // Mark webhook as processed
    await ProcessedWebhook.create({
      webhookId,
      eventType: webhookData.event,
      subscriptionId: webhookData.payload.subscription?.entity?.id,
      paymentId: webhookData.payload.payment?.entity?.id
    });

    console.log('Webhook processed successfully:', webhookId);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCharged(webhookData: RazorpaySubscriptionWebhook) {
  const subscriptionEntity = webhookData.payload.subscription.entity;
  const paymentEntity = webhookData.payload.payment?.entity;

  if (!paymentEntity) {
    console.error('Payment entity missing in subscription.charged webhook');
    return { success: false, error: 'Missing payment data' };
  }

  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Update subscription status
      const subscription = await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionEntity.id },
        {
          status: 'active',
          currentPeriodStart: new Date(subscriptionEntity.current_start * 1000),
          currentPeriodEnd: new Date(subscriptionEntity.current_end * 1000),
        },
        { session, new: true }
      );

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionEntity.id}`);
      }

      // Create payment record
      await Payment.create([{
        userId: subscription.userId,
        subscriptionId: subscription._id,
        razorpayPaymentId: paymentEntity.id,
        razorpayOrderId: paymentEntity.order_id,
        amount: paymentEntity.amount,
        currency: paymentEntity.currency,
        status: 'captured',
        method: paymentEntity.method,
        gatewayData: paymentEntity,
        notes: paymentEntity.notes
      }], { session });

      // Upgrade user to pro
      await User.findByIdAndUpdate(
        subscription.userId,
        {
          subscriptionTier: 'pro',
          subscriptionId: subscription._id
        },
        { session }
      );
    });

    console.log('Subscription charged successfully processed');
    return { success: true, message: 'Subscription charged processed' };

  } catch (error) {
    console.error('Error handling subscription charged:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

async function handleSubscriptionAuthenticated(webhookData: RazorpaySubscriptionWebhook) {
  const subscriptionEntity = webhookData.payload.subscription.entity;

  await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscriptionEntity.id },
    {
      status: 'authenticated',
      currentPeriodStart: new Date(subscriptionEntity.current_start * 1000),
      currentPeriodEnd: new Date(subscriptionEntity.current_end * 1000),
    }
  );

  console.log('Subscription authenticated processed');
  return { success: true, message: 'Subscription authenticated processed' };
}

async function handleSubscriptionActivated(webhookData: RazorpaySubscriptionWebhook) {
  const subscriptionEntity = webhookData.payload.subscription.entity;

  const subscription = await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscriptionEntity.id },
    {
      status: 'active',
      currentPeriodStart: new Date(subscriptionEntity.current_start * 1000),
      currentPeriodEnd: new Date(subscriptionEntity.current_end * 1000),
    },
    { new: true }
  );

  if (subscription) {
    // Upgrade user to pro
    await User.findByIdAndUpdate(
      subscription.userId,
      {
        subscriptionTier: 'pro',
        subscriptionId: subscription._id
      }
    );
  }

  console.log('Subscription activated processed');
  return { success: true, message: 'Subscription activated processed' };
}

async function handleSubscriptionCancelled(webhookData: RazorpaySubscriptionWebhook) {
  const subscriptionEntity = webhookData.payload.subscription.entity;

  const subscription = await Subscription.findOneAndUpdate(
    { razorpaySubscriptionId: subscriptionEntity.id },
    {
      status: 'cancelled',
      cancelledAt: new Date(),
    },
    { new: true }
  );

  if (subscription) {
    // Downgrade user to free
    await User.findByIdAndUpdate(
      subscription.userId,
      {
        subscriptionTier: 'free',
        subscriptionId: null
      }
    );
  }

  console.log('Subscription cancelled processed');
  return { success: true, message: 'Subscription cancelled processed' };
}

async function handlePaymentFailed(webhookData: RazorpaySubscriptionWebhook) {
  const subscriptionEntity = webhookData.payload.subscription.entity;
  const paymentEntity = webhookData.payload.payment?.entity;

  if (!paymentEntity) {
    console.error('Payment entity missing in payment.failed webhook');
    return { success: false, error: 'Missing payment data' };
  }

  const subscription = await Subscription.findOne({ 
    razorpaySubscriptionId: subscriptionEntity.id 
  });

  if (subscription) {
    // Create failed payment record
    await Payment.create({
      userId: subscription.userId,
      subscriptionId: subscription._id,
      razorpayPaymentId: paymentEntity.id,
      razorpayOrderId: paymentEntity.order_id,
      amount: paymentEntity.amount,
      currency: paymentEntity.currency,
      status: 'failed',
      failureReason: paymentEntity.error_description,
      gatewayData: paymentEntity,
      notes: paymentEntity.notes
    });

    // Set subscription to past_due with grace period
    const gracePeriodEnd = new Date();
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3); // 3 days grace period

    await Subscription.findByIdAndUpdate(subscription._id, {
      status: 'past_due',
      gracePeriodEnd
    });
  }

  console.log('Payment failed processed');
  return { success: true, message: 'Payment failed processed' };
} 