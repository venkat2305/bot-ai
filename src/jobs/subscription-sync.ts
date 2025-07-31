import { RazorpayService } from '@/lib/razorpay';
import { razorpayCircuitBreaker } from '@/lib/circuit-breaker';
import { RetryHandler } from '@/lib/retry-handler';
import Subscription from '@/server/models/Subscription';
import User from '@/server/models/User';
import Payment from '@/server/models/Payment';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export interface SyncResult {
  totalSubscriptions: number;
  syncedCount: number;
  discrepanciesFound: number;
  errorsCount: number;
  discrepancies: Array<{
    subscriptionId: string;
    localStatus: string;
    razorpayStatus: string;
    action: string;
  }>;
  errors: Array<{
    subscriptionId: string;
    error: string;
  }>;
}

/**
 * Daily subscription synchronization job
 * Compares local database with Razorpay status and corrects discrepancies
 */
export async function syncSubscriptions(): Promise<SyncResult> {
  await dbConnect();
  
  console.log('Starting subscription synchronization job...');
  
  const result: SyncResult = {
    totalSubscriptions: 0,
    syncedCount: 0,
    discrepanciesFound: 0,
    errorsCount: 0,
    discrepancies: [],
    errors: []
  };

  try {
    // Get all active/past_due subscriptions to sync
    const subscriptions = await Subscription.find({
      status: { $in: ['active', 'past_due', 'authenticated'] },
      razorpaySubscriptionId: { $exists: true, $ne: null }
    });

    result.totalSubscriptions = subscriptions.length;
    console.log(`Found ${subscriptions.length} subscriptions to sync`);

    for (const subscription of subscriptions) {
      try {
        await syncSingleSubscription(subscription, result);
        result.syncedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Failed to sync subscription ${subscription._id}:`, errorMessage);
        
        result.errorsCount++;
        result.errors.push({
          subscriptionId: subscription.razorpaySubscriptionId,
          error: errorMessage
        });

        // Create retry job for failed sync
        await RetryHandler.createRetryJob('subscription_sync', {
          subscriptionId: subscription.razorpaySubscriptionId,
          localSubscriptionId: subscription._id.toString()
        });
      }
    }

    // Handle grace period expiry for past_due subscriptions
    await handleGracePeriodExpiry(result);

    console.log('Subscription sync completed:', {
      total: result.totalSubscriptions,
      synced: result.syncedCount,
      discrepancies: result.discrepanciesFound,
      errors: result.errorsCount
    });

    return result;

  } catch (error) {
    console.error('Fatal error in subscription sync:', error);
    throw error;
  }
}

/**
 * Sync a single subscription with Razorpay
 */
async function syncSingleSubscription(subscription: any, result: SyncResult): Promise<void> {
  // Fetch subscription from Razorpay with circuit breaker
  const razorpayResult = await razorpayCircuitBreaker.execute(async () => {
    return await RazorpayService.fetchSubscription(subscription.razorpaySubscriptionId);
  });

  if (!razorpayResult.success) {
    throw new Error(`Failed to fetch Razorpay subscription: ${razorpayResult.error}`);
  }

  const razorpaySubscription = razorpayResult.data;
  if (!razorpaySubscription) {
    throw new Error('Razorpay subscription data is undefined');
  }

  const localStatus = subscription.status;
  const razorpayStatus = razorpaySubscription.status;

  // Check for status discrepancies
  if (shouldUpdateStatus(localStatus, razorpayStatus)) {
    console.log(`Status discrepancy found for ${subscription.razorpaySubscriptionId}: local=${localStatus}, razorpay=${razorpayStatus}`);
    
    const action = await reconcileSubscriptionStatus(subscription, razorpaySubscription);
    
    result.discrepanciesFound++;
    result.discrepancies.push({
      subscriptionId: subscription.razorpaySubscriptionId,
      localStatus,
      razorpayStatus,
      action
    });
  }

  // Update last sync timestamp
  await Subscription.findByIdAndUpdate(subscription._id, {
    lastSyncAt: new Date(),
    metadata: {
      ...subscription.metadata,
      lastRazorpayStatus: razorpayStatus,
      lastSyncResult: 'success'
    }
  });
}

/**
 * Determine if local status should be updated based on Razorpay status
 */
function shouldUpdateStatus(localStatus: string, razorpayStatus: string): boolean {
  // Define status priority (higher priority overwrites lower)
  const statusPriority: Record<string, number> = {
    'created': 1,
    'authenticated': 2,
    'active': 3,
    'past_due': 4,
    'cancelled': 5,
    'expired': 5,
    'paused': 3
  };

  // Always update if statuses are different and Razorpay has definitive states
  if (localStatus !== razorpayStatus) {
    // Razorpay cancelled/expired should always override local status
    if (['cancelled', 'expired'].includes(razorpayStatus)) {
      return true;
    }
    
    // Active in Razorpay should override past_due locally
    if (razorpayStatus === 'active' && localStatus === 'past_due') {
      return true;
    }

    // Past_due in Razorpay should override active locally
    if (razorpayStatus === 'past_due' && localStatus === 'active') {
      return true;
    }
  }

  return false;
}

/**
 * Reconcile subscription status between local and Razorpay
 */
async function reconcileSubscriptionStatus(
  subscription: any, 
  razorpaySubscription: any
): Promise<string> {
  const session = await mongoose.startSession();
  
  try {
    let action = '';
    
    await session.withTransaction(async () => {
      const updateData: any = {
        status: razorpaySubscription.status,
        currentPeriodStart: new Date(razorpaySubscription.current_start * 1000),
        currentPeriodEnd: new Date(razorpaySubscription.current_end * 1000),
        lastSyncAt: new Date(),
        metadata: {
          ...subscription.metadata,
          syncedFromRazorpay: true,
          razorpayUpdatedAt: new Date(razorpaySubscription.updated_at * 1000)
        }
      };

      // Handle specific status transitions
      switch (razorpaySubscription.status) {
        case 'cancelled':
        case 'expired':
          updateData.cancelledAt = new Date();
          action = 'downgraded_user_to_free';
          
          // Downgrade user to free
          await User.findByIdAndUpdate(
            subscription.userId,
            {
              subscriptionTier: 'free',
              subscriptionId: null
            },
            { session }
          );
          break;

        case 'active':
          action = 'upgraded_user_to_pro';
          
          // Ensure user has pro access
          await User.findByIdAndUpdate(
            subscription.userId,
            {
              subscriptionTier: 'pro',
              subscriptionId: subscription._id
            },
            { session }
          );
          break;

        case 'past_due':
          action = 'marked_subscription_past_due';
          // Don't immediately downgrade - maintain pro access during grace period
          break;

        default:
          action = `updated_status_to_${razorpaySubscription.status}`;
      }

      // Update subscription
      await Subscription.findByIdAndUpdate(
        subscription._id,
        updateData,
        { session }
      );
    });

    console.log(`Reconciled subscription ${subscription.razorpaySubscriptionId}: ${action}`);
    return action;

  } finally {
    await session.endSession();
  }
}

/**
 * Handle grace period expiry for past_due subscriptions
 */
async function handleGracePeriodExpiry(result: SyncResult): Promise<void> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Find past_due subscriptions older than 3 days
  const expiredSubscriptions = await Subscription.find({
    status: 'past_due',
    updatedAt: { $lte: threeDaysAgo }
  }).populate('userId');

  for (const subscription of expiredSubscriptions) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Downgrade to free tier
        await User.findByIdAndUpdate(
          subscription.userId,
          {
            subscriptionTier: 'free',
            subscriptionId: null
          },
          { session }
        );

        // Update subscription status
        await Subscription.findByIdAndUpdate(
          subscription._id,
          {
            status: 'expired_grace_period',
            gracePeriodExpiredAt: new Date()
          },
          { session }
        );
      });

      console.log(`Grace period expired for subscription ${subscription.razorpaySubscriptionId}, user downgraded`);
      
      result.discrepanciesFound++;
      result.discrepancies.push({
        subscriptionId: subscription.razorpaySubscriptionId,
        localStatus: 'past_due',
        razorpayStatus: 'grace_period_expired',
        action: 'downgraded_after_grace_period'
      });

    } catch (error) {
      console.error(`Failed to handle grace period expiry for ${subscription.razorpaySubscriptionId}:`, error);
    } finally {
      await session.endSession();
    }
  }
}

/**
 * Sync payment records for discrepancies
 */
export async function syncPayments(subscriptionId: string): Promise<void> {
  try {
    // This would fetch payment history from Razorpay and sync with local records
    // Implementation depends on your payment tracking requirements
    console.log(`Syncing payments for subscription ${subscriptionId}`);
    
    // TODO: Implement payment sync if needed
    // const payments = await razorpay.subscriptions.fetchPayments(subscriptionId);
    // Compare with local Payment records and reconcile
    
  } catch (error) {
    console.error(`Failed to sync payments for subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Generate reconciliation report
 */
export async function generateSyncReport(): Promise<{
  totalSubscriptions: number;
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  cancelledSubscriptions: number;
  lastSyncResults: SyncResult | null;
}> {
  await dbConnect();

  const [
    totalCount,
    activeCount,
    pastDueCount,
    cancelledCount
  ] = await Promise.all([
    Subscription.countDocuments({}),
    Subscription.countDocuments({ status: 'active' }),
    Subscription.countDocuments({ status: 'past_due' }),
    Subscription.countDocuments({ status: { $in: ['cancelled', 'expired'] } })
  ]);

  return {
    totalSubscriptions: totalCount,
    activeSubscriptions: activeCount,
    pastDueSubscriptions: pastDueCount,
    cancelledSubscriptions: cancelledCount,
    lastSyncResults: null // Could store last sync results in database if needed
  };
} 