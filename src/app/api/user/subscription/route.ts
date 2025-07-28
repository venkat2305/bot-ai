import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/server/models/User';
import Subscription from '@/server/models/Subscription';
import { getPlanByInternalId, formatPrice } from '@/config/subscription-plans';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get user with subscription details
    const user = await User.findById(session.user.id).populate('subscriptionId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the latest subscription (in case user has multiple)
    const latestSubscription = await Subscription.findOne({
      userId: user._id
    }).sort({ createdAt: -1 });

    // Prepare user subscription data
    const subscriptionData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        isPro: user.subscriptionTier === 'pro'
      },
      subscription: null as any,
      permissions: getUserPermissions(user.subscriptionTier),
      canUpgrade: user.subscriptionTier === 'free',
      hasActiveSubscription: false
    };

    if (latestSubscription) {
      const plan = getPlanByInternalId(latestSubscription.planId);
      const isActive = latestSubscription.status === 'active' && 
        new Date() < latestSubscription.currentPeriodEnd;
      const isInGracePeriod = latestSubscription.status === 'past_due' && 
        latestSubscription.gracePeriodEnd && 
        new Date() < latestSubscription.gracePeriodEnd;

      subscriptionData.subscription = {
        id: latestSubscription._id,
        razorpaySubscriptionId: latestSubscription.razorpaySubscriptionId,
        planId: latestSubscription.planId,
        planName: plan?.name || 'Unknown Plan',
        status: latestSubscription.status,
        isActive,
        isInGracePeriod,
        currentPeriodStart: latestSubscription.currentPeriodStart,
        currentPeriodEnd: latestSubscription.currentPeriodEnd,
        cancelledAt: latestSubscription.cancelledAt,
        gracePeriodEnd: latestSubscription.gracePeriodEnd,
        price: plan?.price || 0,
        formattedPrice: plan ? formatPrice(plan.price, plan.currency) : '₹0',
        currency: plan?.currency || 'INR',
        features: plan?.features || [],
        createdAt: latestSubscription.createdAt,
        updatedAt: latestSubscription.updatedAt
      };

      subscriptionData.hasActiveSubscription = isActive || isInGracePeriod;
      subscriptionData.canUpgrade = !isActive && !isInGracePeriod;
    }

    return NextResponse.json({
      success: true,
      data: subscriptionData
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get user permissions based on subscription tier
function getUserPermissions(subscriptionTier: string): string[] {
  const permissions = {
    free: [
      'chat:basic',
      'history:limited'
    ],
    pro: [
      'chat:basic',
      'chat:unlimited',
      'github:import',
      'history:unlimited',
      'support:priority',
      'export:conversations',
      'models:premium'
    ]
  };

  return permissions[subscriptionTier as keyof typeof permissions] || permissions.free;
}

// PUT endpoint to manually sync subscription status
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find user's active subscription
    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'authenticated', 'past_due'] }
    });

    if (!activeSubscription) {
      // No active subscription, ensure user is on free tier
      await User.findByIdAndUpdate(user._id, {
        subscriptionTier: 'free',
        subscriptionId: null
      });

      return NextResponse.json({
        success: true,
        message: 'User downgraded to free tier',
        subscriptionTier: 'free'
      });
    }

    // Check if subscription is still valid
    const isActive = activeSubscription.status === 'active' && 
      new Date() < activeSubscription.currentPeriodEnd;
    const isInGracePeriod = activeSubscription.status === 'past_due' && 
      activeSubscription.gracePeriodEnd && 
      new Date() < activeSubscription.gracePeriodEnd;

    const shouldBePro = isActive || isInGracePeriod;
    const currentTier = shouldBePro ? 'pro' : 'free';

    // Update user if tier doesn't match
    if (user.subscriptionTier !== currentTier) {
      await User.findByIdAndUpdate(user._id, {
        subscriptionTier: currentTier,
        subscriptionId: shouldBePro ? activeSubscription._id : null
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription status synced',
      subscriptionTier: currentTier,
      subscriptionStatus: activeSubscription.status
    });

  } catch (error) {
    console.error('Error syncing subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 