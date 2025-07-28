import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/permissions';
import { RazorpayService } from '@/lib/razorpay';
import dbConnect from '@/lib/mongodb';
import User from '@/server/models/User';
import Payment from '@/server/models/Payment';
import Subscription from '@/server/models/Subscription';
import mongoose from 'mongoose';

async function handleRefund(req: NextRequest, context?: any, user?: any) {
  try {

    await dbConnect();
    
    // Get request body
    const { paymentId, amount, speed = 'normal', reason, notes } = await req.json();
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Find the payment record
    const payment = await Payment.findOne({ 
      razorpayPaymentId: paymentId 
    }).populate('subscriptionId');

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment is eligible for refund
    if (!['captured', 'authorized'].includes(payment.status)) {
      return NextResponse.json(
        { error: 'Payment is not eligible for refund' },
        { status: 400 }
      );
    }

    // Check if already refunded
    if (payment.status === 'refunded') {
      return NextResponse.json(
        { error: 'Payment has already been refunded' },
        { status: 400 }
      );
    }

    // Validate refund amount
    const refundAmount = amount || payment.amount;
    const remainingAmount = payment.amount - payment.refundAmount;
    
    if (refundAmount > remainingAmount) {
      return NextResponse.json(
        { error: 'Refund amount exceeds remaining refundable amount' },
        { status: 400 }
      );
    }

    // Create refund with Razorpay
    const refundResult = await RazorpayService.createRefund(paymentId, {
      amount: refundAmount,
      speed,
      notes: {
        ...notes,
        reason,
        userId: payment.userId.toString(),
        processedBy: user.id
      }
    });

    if (!refundResult.success) {
      console.error('Failed to create Razorpay refund:', refundResult.error);
      return NextResponse.json(
        { error: 'Failed to process refund with payment provider' },
        { status: 500 }
      );
    }

    const razorpayRefund = refundResult.data;
    const session_db = await mongoose.startSession();

    try {
      await session_db.withTransaction(async () => {
        // Update payment record
        const isFullRefund = (payment.refundAmount + refundAmount) >= payment.amount;
        
        await Payment.findByIdAndUpdate(
          payment._id,
          {
            status: isFullRefund ? 'refunded' : payment.status,
            refundId: razorpayRefund?.id,
            refundAmount: payment.refundAmount + refundAmount,
            refundedAt: new Date(),
            refundReason: reason,
                          notes: {
                ...payment.notes,
                refund: {
                  razorpayRefundId: razorpayRefund?.id,
                refundSpeed: speed,
                refundReason: reason,
                processedBy: user.id,
                processedAt: new Date()
              }
            }
          },
          { session: session_db }
        );

        // If full refund, handle subscription and user downgrades
        if (isFullRefund && payment.subscriptionId) {
          const subscription = await Subscription.findById(payment.subscriptionId).session(session_db);
          
          if (subscription) {
            // Cancel the subscription if it's still active
            if (['active', 'authenticated'].includes(subscription.status)) {
              await Subscription.findByIdAndUpdate(
                subscription._id,
                {
                  status: 'cancelled',
                  cancelledAt: new Date(),
                  metadata: {
                    ...subscription.metadata,
                    cancellationReason: 'Full refund processed',
                    refundId: razorpayRefund?.id
                  }
                },
                { session: session_db }
              );

              // Cancel subscription in Razorpay as well
              try {
                await RazorpayService.cancelSubscription(
                  subscription.razorpaySubscriptionId,
                  false // Immediate cancellation
                );
              } catch (error) {
                console.error('Failed to cancel subscription in Razorpay:', error);
                // Continue with local cancellation even if Razorpay fails
              }
            }

            // Downgrade user to free tier
            await User.findByIdAndUpdate(
              subscription.userId,
              {
                subscriptionTier: 'free',
                subscriptionId: null
              },
              { session: session_db }
            );
          }
        }
      });

      console.log('Refund processed successfully:', {
        paymentId,
        refundId: razorpayRefund?.id,
        refundAmount,
        isFullRefund: (payment.refundAmount + refundAmount) >= payment.amount,
        reason
      });

      return NextResponse.json({
        success: true,
        refund: {
          id: razorpayRefund?.id,
          amount: refundAmount,
          currency: razorpayRefund?.currency,
          status: razorpayRefund?.status,
          speed: razorpayRefund?.speed_requested,
          createdAt: razorpayRefund?.created_at ? new Date(razorpayRefund.created_at * 1000).toISOString() : new Date().toISOString()
        },
        payment: {
          id: payment._id,
          status: (payment.refundAmount + refundAmount) >= payment.amount ? 'refunded' : payment.status,
          totalRefunded: payment.refundAmount + refundAmount,
          remainingAmount: payment.amount - (payment.refundAmount + refundAmount)
        }
      });

    } catch (error) {
      console.error('Error updating database during refund:', error);
      throw error;
    } finally {
      await session_db.endSession();
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch refund history for a payment
async function handleGetRefundHistory(req: NextRequest, context?: any, user?: any) {
  try {

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Find payment and check user ownership
    const payment = await Payment.findOne({
      razorpayPaymentId: paymentId,
      userId: user.id
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      payment: {
        id: payment._id,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        refundAmount: payment.refundAmount,
        refundPercentage: payment.refundPercentage,
        isRefunded: payment.isRefunded,
        refundedAt: payment.refundedAt,
        refundReason: payment.refundReason,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching refund details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export the handlers with RBAC protection
export const POST = withRBAC(PERMISSIONS.PAYMENT_REFUND, handleRefund);
export const GET = withRBAC(PERMISSIONS.PAYMENT_HISTORY, handleGetRefundHistory); 