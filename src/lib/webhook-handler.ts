import mongoose from 'mongoose';
import { RazorpaySubscriptionWebhook } from '@/types/subscription';
import ProcessedWebhook from '@/server/models/ProcessedWebhook';
import Subscription from '@/server/models/Subscription';
import Payment from '@/server/models/Payment';
import User from '@/server/models/User';
import { RetryHandler } from './retry-handler';
import { razorpayCircuitBreaker } from './circuit-breaker';
import dbConnect from './mongodb';

export class WebhookHandler {
  /**
   * Process webhook with idempotency checking and error handling
   */
  static async processWebhook(webhookData: RazorpaySubscriptionWebhook): Promise<{ success: boolean; message: string }> {
    await dbConnect();

    // Generate unique webhook ID for idempotency
    const webhookId = this.generateWebhookId(webhookData);
    
    // Check if webhook already processed
    const existingWebhook = await ProcessedWebhook.findOne({ webhookId });
    if (existingWebhook) {
      console.log(`Webhook ${webhookId} already processed at ${existingWebhook.processedAt}`);
      return { success: true, message: 'Already processed' };
    }

    const session = await mongoose.startSession();
    
    try {
      let result: { success: boolean; message: string };
      
      await session.withTransaction(async () => {
        // Mark webhook as processed first (idempotency)
        await ProcessedWebhook.create([{
          webhookId,
          eventType: webhookData.event,
          processedAt: new Date(),
          subscriptionId: webhookData.payload.subscription?.entity?.id,
          paymentId: webhookData.payload.payment?.entity?.id,
          metadata: {
            created_at: webhookData.created_at,
            account_id: webhookData.account_id
          }
        }], { session });

        // Process the actual webhook
        result = await this.handleWebhookEvent(webhookData, session);
      });

      console.log(`Webhook ${webhookId} processed successfully:`, result.message);
      return result!;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error processing webhook ${webhookId}:`, errorMessage);

      // Create retry job for failed webhook processing
      await RetryHandler.createRetryJob('webhook_retry', {
        webhookId,
        webhookData,
        error: errorMessage
      }, {
        maxRetries: 3,
        baseDelay: 5000 // 5 seconds
      });

      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Handle specific webhook event types
   */
  private static async handleWebhookEvent(
    webhookData: RazorpaySubscriptionWebhook, 
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    switch (webhookData.event) {
      case 'subscription.charged':
        return await this.handleSubscriptionCharged(webhookData, session);
      case 'subscription.authenticated':
        return await this.handleSubscriptionAuthenticated(webhookData, session);
      case 'subscription.activated':
        return await this.handleSubscriptionActivated(webhookData, session);
      case 'subscription.cancelled':
        return await this.handleSubscriptionCancelled(webhookData, session);
      case 'payment.failed':
        return await this.handlePaymentFailed(webhookData, session);
      case 'subscription.paused':
        return await this.handleSubscriptionPaused(webhookData, session);
      case 'subscription.resumed':
        return await this.handleSubscriptionResumed(webhookData, session);
      default:
        console.log(`Unhandled webhook event: ${webhookData.event}`);
        return { success: true, message: 'Event not handled' };
    }
  }

  /**
   * Handle subscription.charged event
   */
  private static async handleSubscriptionCharged(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const subscriptionEntity = webhookData.payload.subscription.entity;
    const paymentEntity = webhookData.payload.payment?.entity;

    if (!paymentEntity) {
      throw new Error('Payment entity missing in subscription.charged webhook');
    }

    // Update subscription status with circuit breaker protection
    const subscription = await razorpayCircuitBreaker.execute(async () => {
      return await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionEntity.id },
        {
          status: 'active',
          currentPeriodStart: new Date(subscriptionEntity.current_start * 1000),
          currentPeriodEnd: new Date(subscriptionEntity.current_end * 1000),
          lastWebhookAt: new Date(),
          metadata: {
            ...subscriptionEntity,
            lastChargeAt: new Date()
          }
        },
        { session, new: true }
      );
    });

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
      notes: paymentEntity.notes,
      capturedAt: new Date(paymentEntity.created_at * 1000)
    }], { session });

    // Upgrade user to pro (ensure they maintain access)
    await User.findByIdAndUpdate(
      subscription.userId,
      {
        subscriptionTier: 'pro',
        subscriptionId: subscription._id,
        lastBillingAt: new Date()
      },
      { session }
    );

    return { success: true, message: 'Subscription charged processed' };
  }

  /**
   * Handle subscription.authenticated event
   */
  private static async handleSubscriptionAuthenticated(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const subscriptionEntity = webhookData.payload.subscription.entity;

    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionEntity.id },
      {
        status: 'authenticated',
        lastWebhookAt: new Date()
      },
      { session }
    );

    return { success: true, message: 'Subscription authenticated' };
  }

  /**
   * Handle subscription.activated event
   */
  private static async handleSubscriptionActivated(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const subscriptionEntity = webhookData.payload.subscription.entity;

    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionEntity.id },
      {
        status: 'active',
        currentPeriodStart: new Date(subscriptionEntity.current_start * 1000),
        currentPeriodEnd: new Date(subscriptionEntity.current_end * 1000),
        lastWebhookAt: new Date()
      },
      { session, new: true }
    );

    if (subscription) {
      // Activate user's pro access
      await User.findByIdAndUpdate(
        subscription.userId,
        {
          subscriptionTier: 'pro',
          subscriptionId: subscription._id
        },
        { session }
      );
    }

    return { success: true, message: 'Subscription activated' };
  }

  /**
   * Handle subscription.cancelled event
   */
  private static async handleSubscriptionCancelled(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const subscriptionEntity = webhookData.payload.subscription.entity;

    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionEntity.id },
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        lastWebhookAt: new Date()
      },
      { session, new: true }
    );

    if (subscription) {
      // Downgrade user to free tier
      await User.findByIdAndUpdate(
        subscription.userId,
        {
          subscriptionTier: 'free',
          subscriptionId: null
        },
        { session }
      );
    }

    return { success: true, message: 'Subscription cancelled' };
  }

  /**
   * Handle payment.failed event
   */
  private static async handlePaymentFailed(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const paymentEntity = webhookData.payload.payment?.entity;

    if (!paymentEntity) {
      throw new Error('Payment entity missing in payment.failed webhook');
    }

    // Find the subscription for this payment
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: paymentEntity.subscription_id
    }).session(session);

    if (subscription) {
      // Update subscription to past_due status
      await Subscription.findByIdAndUpdate(
        subscription._id,
        {
          status: 'past_due',
          lastWebhookAt: new Date(),
          metadata: {
            ...subscription.metadata,
            lastFailedPayment: new Date(),
            failureReason: paymentEntity.error_reason
          }
        },
        { session }
      );

      // Create failed payment record
      await Payment.create([{
        userId: subscription.userId,
        subscriptionId: subscription._id,
        razorpayPaymentId: paymentEntity.id,
        amount: paymentEntity.amount,
        currency: paymentEntity.currency,
        status: 'failed',
        method: paymentEntity.method,
        gatewayData: paymentEntity,
        failureReason: paymentEntity.error_reason,
        failedAt: new Date(paymentEntity.created_at * 1000)
      }], { session });

      // Note: Don't immediately downgrade user - give grace period
      // Reconciliation job will handle downgrade after grace period
    }

    return { success: true, message: 'Payment failure processed' };
  }

  /**
   * Handle subscription.paused event
   */
  private static async handleSubscriptionPaused(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const subscriptionEntity = webhookData.payload.subscription.entity;

    await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionEntity.id },
      {
        status: 'paused',
        pausedAt: new Date(),
        lastWebhookAt: new Date()
      },
      { session }
    );

    return { success: true, message: 'Subscription paused' };
  }

  /**
   * Handle subscription.resumed event
   */
  private static async handleSubscriptionResumed(
    webhookData: RazorpaySubscriptionWebhook,
    session: mongoose.ClientSession
  ): Promise<{ success: boolean; message: string }> {
    const subscriptionEntity = webhookData.payload.subscription.entity;

    const subscription = await Subscription.findOneAndUpdate(
      { razorpaySubscriptionId: subscriptionEntity.id },
      {
        status: 'active',
        pausedAt: undefined,
        lastWebhookAt: new Date()
      },
      { session, new: true }
    );

    if (subscription) {
      // Reactivate user's pro access
      await User.findByIdAndUpdate(
        subscription.userId,
        {
          subscriptionTier: 'pro',
          subscriptionId: subscription._id
        },
        { session }
      );
    }

    return { success: true, message: 'Subscription resumed' };
  }

  /**
   * Generate unique webhook ID for idempotency
   */
  private static generateWebhookId(webhookData: RazorpaySubscriptionWebhook): string {
    const components = [
      webhookData.event,
      webhookData.created_at.toString(),
      webhookData.payload.subscription?.entity?.id || '',
      webhookData.payload.payment?.entity?.id || '',
      webhookData.account_id || ''
    ];

    return components.filter(Boolean).join('_');
  }
} 