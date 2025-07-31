import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { syncSubscriptions, generateSyncReport } from '@/jobs/subscription-sync';
import { JobProcessor } from '@/jobs/job-processor';
import { RetryHandler } from '@/lib/retry-handler';
import { razorpayCircuitBreaker } from '@/lib/circuit-breaker';

export async function POST(req: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check here
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    const { action } = await req.json();

    switch (action) {
      case 'sync_subscriptions':
        const syncResult = await syncSubscriptions();
        return NextResponse.json({
          success: true,
          message: 'Subscription sync completed',
          result: syncResult
        });

      case 'process_jobs':
        await RetryHandler.processPendingJobs();
        return NextResponse.json({
          success: true,
          message: 'Pending jobs processed'
        });

      case 'start_job_processor':
        JobProcessor.start();
        return NextResponse.json({
          success: true,
          message: 'Job processor started'
        });

      case 'stop_job_processor':
        JobProcessor.stop();
        return NextResponse.json({
          success: true,
          message: 'Job processor stopped'
        });

      case 'reset_circuit_breaker':
        razorpayCircuitBreaker.reset();
        return NextResponse.json({
          success: true,
          message: 'Circuit breaker reset'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in admin sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication (admin only)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate status report
    const [syncReport, jobProcessorStatus, circuitBreakerStats] = await Promise.all([
      generateSyncReport(),
      Promise.resolve(JobProcessor.getStatus()),
      Promise.resolve(razorpayCircuitBreaker.getStats())
    ]);

    return NextResponse.json({
      syncReport,
      jobProcessor: jobProcessorStatus,
      circuitBreaker: circuitBreakerStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting admin status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 