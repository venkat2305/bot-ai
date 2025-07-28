import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { RazorpayService } from '@/lib/razorpay';
import { SUBSCRIPTION_PLANS, getPlanById } from '@/config/subscription-plans';
import dbConnect from '@/lib/mongodb';
import User from '@/server/models/User';
import Subscription from '@/server/models/Subscription';

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Get request body
    const { planId } = await req.json();
    
    if (!planId) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Validate plan exists
    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      userId: user._id,
      status: { $in: ['active', 'authenticated'] }
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Create Razorpay customer
    const customerResult = await RazorpayService.createCustomer({
      name: user.name || user.email,
      email: user.email,
      notes: {
        userId: user._id.toString(),
        planId: plan.internalId
      }
    });

    if (!customerResult.success) {
      console.error('Failed to create Razorpay customer:', customerResult.error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    const customer = customerResult.data;

    // Create Razorpay subscription
    const subscriptionResult = await RazorpayService.createSubscription({
      plan_id: planId,
      customer_id: customer?.id || '',
      total_count: 12, // 12 months
      notes: {
        userId: user._id.toString(),
        planId: plan.internalId
      }
    });

    if (!subscriptionResult.success) {
      console.error('Failed to create Razorpay subscription:', subscriptionResult.error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    const razorpaySubscription = subscriptionResult.data;

    // Create subscription in our database
    const subscription = new Subscription({
      userId: user._id,
      razorpaySubscriptionId: razorpaySubscription?.id || '',
      razorpayCustomerId: customer?.id || '',
      planId: plan.internalId,
      status: razorpaySubscription?.status || 'created',
      currentPeriodStart: new Date((razorpaySubscription?.current_start || Date.now() / 1000) * 1000),
      currentPeriodEnd: new Date((razorpaySubscription?.current_end || (Date.now() / 1000) + 2592000) * 1000),
      metadata: {
        planName: plan.name,
        razorpayPlanId: planId
      }
    });

    await subscription.save();

    // Return subscription ID for frontend Razorpay initialization
    return NextResponse.json({
      success: true,
      subscriptionId: razorpaySubscription?.id,
      customerId: customer?.id,
      planDetails: {
        name: plan.name,
        price: plan.price,
        currency: plan.currency
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 