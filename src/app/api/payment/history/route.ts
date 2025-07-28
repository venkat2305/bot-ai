import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Payment from '@/server/models/Payment';
import Subscription from '@/server/models/Subscription';
import { formatPrice } from '@/config/subscription-plans';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // Filter by payment status
    const startDate = searchParams.get('startDate'); // Filter by date range
    const endDate = searchParams.get('endDate');

    // Build query
    const query: any = { userId: session.user.id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get payments with subscription details
    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate({
          path: 'subscriptionId',
          select: 'planId razorpaySubscriptionId status currentPeriodStart currentPeriodEnd'
        })
        .sort({ createdAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Format payment data for frontend
    const formattedPayments = payments.map((payment: any) => ({
      id: payment._id.toString(),
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
      amount: payment.amount,
      formattedAmount: formatPrice(payment.amount, payment.currency),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      isSuccessful: ['captured', 'authorized'].includes(payment.status),
      isRefunded: payment.status === 'refunded',
      refundAmount: payment.refundAmount,
      formattedRefundAmount: payment.refundAmount > 0 
        ? formatPrice(payment.refundAmount, payment.currency) 
        : null,
      refundPercentage: payment.refundAmount > 0 
        ? Math.round((payment.refundAmount / payment.amount) * 100) 
        : 0,
      refundedAt: payment.refundedAt,
      refundReason: payment.refundReason,
      failureReason: payment.failureReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      subscription: payment.subscriptionId ? {
        id: payment.subscriptionId._id.toString(),
        planId: payment.subscriptionId.planId,
        status: payment.subscriptionId.status,
        currentPeriodStart: payment.subscriptionId.currentPeriodStart,
        currentPeriodEnd: payment.subscriptionId.currentPeriodEnd
      } : null
    }));

    // Calculate summary statistics
    const summary = await calculatePaymentSummary(session.user.id);

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      summary,
      filters: {
        status,
        startDate,
        endDate
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate payment summary
async function calculatePaymentSummary(userId: string) {
  const [
    totalPayments,
    successfulPayments,
    failedPayments,
    refundedPayments,
    totalAmountPaid,
    totalRefunded
  ] = await Promise.all([
    Payment.countDocuments({ userId }),
    Payment.countDocuments({ userId, status: { $in: ['captured', 'authorized'] } }),
    Payment.countDocuments({ userId, status: 'failed' }),
    Payment.countDocuments({ userId, status: 'refunded' }),
    Payment.aggregate([
             { $match: { userId: userId as any, status: { $in: ['captured', 'authorized'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    Payment.aggregate([
             { $match: { userId: userId as any, refundAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } }
    ])
  ]);

  const totalPaidAmount = totalAmountPaid[0]?.total || 0;
  const totalRefundedAmount = totalRefunded[0]?.total || 0;

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    refundedPayments,
    totalAmountPaid: totalPaidAmount,
    formattedTotalPaid: formatPrice(totalPaidAmount),
    totalRefunded: totalRefundedAmount,
    formattedTotalRefunded: formatPrice(totalRefundedAmount),
    netAmountPaid: totalPaidAmount - totalRefundedAmount,
    formattedNetAmount: formatPrice(totalPaidAmount - totalRefundedAmount),
    successRate: totalPayments > 0 
      ? Math.round((successfulPayments / totalPayments) * 100) 
      : 0
  };
}

// POST endpoint for admin to get payment history of any user
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // const user = await User.findById(session.user.id);
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const { userId, page = 1, limit = 10, status, startDate, endDate } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Build query
    const query: any = { userId };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get payments with subscription and user details
    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate({
          path: 'userId',
          select: 'name email subscriptionTier'
        })
        .populate({
          path: 'subscriptionId',
          select: 'planId razorpaySubscriptionId status currentPeriodStart currentPeriodEnd'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Format payment data
    const formattedPayments = payments.map((payment: any) => ({
      id: payment._id.toString(),
      razorpayPaymentId: payment.razorpayPaymentId,
      amount: payment.amount,
      formattedAmount: formatPrice(payment.amount, payment.currency),
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      refundAmount: payment.refundAmount,
      formattedRefundAmount: payment.refundAmount > 0 
        ? formatPrice(payment.refundAmount, payment.currency) 
        : null,
      createdAt: payment.createdAt,
      user: payment.userId ? {
        id: payment.userId._id.toString(),
        name: payment.userId.name,
        email: payment.userId.email,
        subscriptionTier: payment.userId.subscriptionTier
      } : null,
      subscription: payment.subscriptionId ? {
        id: payment.subscriptionId._id.toString(),
        planId: payment.subscriptionId.planId,
        status: payment.subscriptionId.status
      } : null
    }));

    const summary = await calculatePaymentSummary(userId);

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      summary,
      targetUserId: userId
    });

  } catch (error) {
    console.error('Error fetching admin payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 