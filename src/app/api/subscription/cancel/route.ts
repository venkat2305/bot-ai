import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RazorpayService } from '@/lib/razorpay';
import dbConnect from '@/lib/mongodb';
import User from '@/server/models/User';
import Subscription from '@/server/models/Subscription';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Get request body
    const { cancelAtCycleEnd = false, reason } = await req.json();

    // Get user details
    const user = await User.findById(session.user.id).populate('subscriptionId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has an active subscription
    const subscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'authenticated'] }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Cancel subscription in Razorpay
    const cancelResult = await RazorpayService.cancelSubscription(
      subscription.razorpaySubscriptionId,
      cancelAtCycleEnd
    );

    if (!cancelResult.success) {
      console.error('Failed to cancel Razorpay subscription:', cancelResult.error);
      return NextResponse.json(
        { error: 'Failed to cancel subscription with payment provider' },
        { status: 500 }
      );
    }

    const razorpaySubscription = cancelResult.data;
    const session_db = await mongoose.startSession();

    try {
      await session_db.withTransaction(async () => {
        // Update subscription in database
        await Subscription.findByIdAndUpdate(
          subscription._id,
          {
            status: 'cancelled',
            cancelledAt: new Date(),
            metadata: {
              ...subscription.metadata,
              cancellationReason: reason,
              cancelAtCycleEnd,
              razorpayStatus: razorpaySubscription?.status
            }
          },
          { session: session_db }
        );

        // If immediate cancellation, downgrade user immediately
        if (!cancelAtCycleEnd) {
          await User.findByIdAndUpdate(
            user._id,
            {
              subscriptionTier: 'free',
              subscriptionId: null
            },
            { session: session_db }
          );
        }
        // If cancel at cycle end, user retains pro access until period ends
        // The webhook will handle the final downgrade
      });

      console.log('Subscription cancelled successfully:', {
        subscriptionId: subscription.razorpaySubscriptionId,
        userId: user._id,
        cancelAtCycleEnd,
        reason
      });

      return NextResponse.json({
        success: true,
        message: cancelAtCycleEnd 
          ? 'Subscription will be cancelled at the end of current billing cycle'
          : 'Subscription cancelled immediately',
        subscriptionStatus: razorpaySubscription?.status,
        accessEndsAt: cancelAtCycleEnd 
          ? subscription.currentPeriodEnd.toISOString()
          : new Date().toISOString()
      });

    } catch (error) {
      console.error('Error updating database during cancellation:', error);
      throw error;
    } finally {
      await session_db.endSession();
    }

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check cancellation status
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get user's subscription
    const subscription = await Subscription.findOne({
      userId: session.user.id
    }).sort({ createdAt: -1 }); // Get latest subscription

    if (!subscription) {
      return NextResponse.json({
        hasCancellation: false,
        subscription: null
      });
    }

    const canCancel = ['active', 'authenticated'].includes(subscription.status);
    const isCancelled = subscription.status === 'cancelled';
    const hasAccess = subscription.status === 'active' || 
      (isCancelled && subscription.currentPeriodEnd > new Date());

    return NextResponse.json({
      hasCancellation: isCancelled,
      canCancel,
      hasAccess,
      subscription: {
        id: subscription._id,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelledAt: subscription.cancelledAt,
        planId: subscription.planId
      }
    });

  } catch (error) {
    console.error('Error checking cancellation status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 