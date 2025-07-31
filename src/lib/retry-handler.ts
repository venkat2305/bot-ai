import Job, { JobType, IJob } from '@/server/models/Job';
import { razorpayCircuitBreaker } from './circuit-breaker';
import dbConnect from './mongodb';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  jitter?: boolean; // Add randomness to prevent thundering herd
}

export class RetryHandler {
  /**
   * Retry an operation with exponential backoff
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      jitter = true
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          console.error(`Operation failed after ${maxRetries + 1} attempts:`, lastError.message);
          throw lastError;
        }

        const delay = this.calculateDelay(attempt + 1, baseDelay, maxDelay, jitter);
        console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Create a job for later retry processing
   */
  static async createRetryJob(
    type: JobType,
    payload: Record<string, any>,
    options: RetryOptions = {}
  ): Promise<IJob> {
    await dbConnect();

    const {
      maxRetries = 3,
      baseDelay = 1000
    } = options;

    const nextAttemptAt = new Date(Date.now() + baseDelay);

    const job = await Job.create({
      type,
      payload,
      maxRetries,
      nextAttemptAt,
      status: 'pending'
    });

    console.log(`Created retry job ${job._id} of type ${type}`);
    return job;
  }

  /**
   * Process pending jobs that are ready for retry
   */
  static async processPendingJobs(): Promise<void> {
    await dbConnect();

    const now = new Date();
    const jobs = await Job.find({
      status: 'pending',
      nextAttemptAt: { $lte: now }
    }).limit(10); // Process in batches

    console.log(`Processing ${jobs.length} pending jobs`);

    for (const job of jobs) {
      await this.processJob(job);
    }
  }

  /**
   * Process a single job with retry logic
   */
  static async processJob(job: IJob): Promise<void> {
    try {
      // Mark job as processing
      await Job.findByIdAndUpdate(job._id, {
        status: 'processing',
        updatedAt: new Date()
      });

      // Execute the job based on type
      await this.executeJobByType(job);

      // Mark as completed
      await Job.findByIdAndUpdate(job._id, {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Job ${job._id} completed successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Job ${job._id} failed:`, errorMessage);

      await this.handleJobFailure(job, errorMessage);
    }
  }

  /**
   * Handle job failure and schedule retry if needed
   */
  private static async handleJobFailure(job: IJob, errorMessage: string): Promise<void> {
    const newRetryCount = job.retryCount + 1;

    if (newRetryCount <= job.maxRetries) {
      // Schedule retry with exponential backoff
      const delay = this.calculateDelay(newRetryCount, 1000, 300000, true);
      const nextAttemptAt = new Date(Date.now() + delay);

      await Job.findByIdAndUpdate(job._id, {
        status: 'pending',
        retryCount: newRetryCount,
        nextAttemptAt,
        error: errorMessage,
        updatedAt: new Date()
      });

      console.log(`Job ${job._id} scheduled for retry ${newRetryCount}/${job.maxRetries} in ${delay}ms`);
    } else {
      // Max retries exceeded, mark as failed
      await Job.findByIdAndUpdate(job._id, {
        status: 'failed',
        error: errorMessage,
        failedAt: new Date(),
        updatedAt: new Date()
      });

      console.error(`Job ${job._id} failed permanently after ${job.maxRetries} retries`);
    }
  }

  /**
   * Execute job based on its type
   */
  private static async executeJobByType(job: IJob): Promise<void> {
    switch (job.type) {
      case 'subscription_sync':
        await this.syncSubscription(job.payload);
        break;
      case 'subscription_fetch':
        await this.fetchSubscription(job.payload);
        break;
      case 'payment_verify':
        await this.verifyPayment(job.payload);
        break;
      case 'webhook_retry':
        await this.retryWebhook(job.payload);
        break;
      case 'customer_create':
        await this.createCustomer(job.payload);
        break;
      case 'refund_process':
        await this.processRefund(job.payload);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  // Job execution methods with circuit breaker
  private static async syncSubscription(payload: any): Promise<void> {
    const { RazorpayService } = await import('./razorpay');
    
    await razorpayCircuitBreaker.execute(async () => {
      const result = await RazorpayService.fetchSubscription(payload.subscriptionId);
      if (!result.success) {
        throw new Error(`Failed to fetch subscription: ${result.error}`);
      }
      // Update local database with Razorpay data
      // Implementation will be added in reconciliation job
    });
  }

  private static async fetchSubscription(payload: any): Promise<void> {
    const { RazorpayService } = await import('./razorpay');
    
    await razorpayCircuitBreaker.execute(async () => {
      const result = await RazorpayService.fetchSubscription(payload.subscriptionId);
      if (!result.success) {
        throw new Error(`Failed to fetch subscription: ${result.error}`);
      }
    });
  }

  private static async verifyPayment(payload: any): Promise<void> {
    // Implementation for payment verification
    console.log('Verifying payment:', payload.paymentId);
  }

  private static async retryWebhook(payload: any): Promise<void> {
    // Implementation for webhook retry
    console.log('Retrying webhook:', payload.webhookId);
  }

  private static async createCustomer(payload: any): Promise<void> {
    const { RazorpayService } = await import('./razorpay');
    
    await razorpayCircuitBreaker.execute(async () => {
      const result = await RazorpayService.createCustomer(payload);
      if (!result.success) {
        throw new Error(`Failed to create customer: ${result.error}`);
      }
    });
  }

  private static async processRefund(payload: any): Promise<void> {
    const { RazorpayService } = await import('./razorpay');
    
    await razorpayCircuitBreaker.execute(async () => {
      const result = await RazorpayService.createRefund(payload.paymentId, payload.refundData);
      if (!result.success) {
        throw new Error(`Failed to process refund: ${result.error}`);
      }
    });
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    jitter: boolean
  ): number {
    // Exponential backoff: delay = baseDelay * (2 ^ attempt)
    let delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

    if (jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterRange = delay * 0.25;
      const jitterOffset = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(baseDelay, delay + jitterOffset);
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 