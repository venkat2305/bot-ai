import { RetryHandler } from '@/lib/retry-handler';
import { syncSubscriptions } from './subscription-sync';
import dbConnect from '@/lib/mongodb';

/**
 * Job processor that runs periodically to handle pending jobs
 */
export class JobProcessor {
  private static isProcessing = false;
  private static processInterval: NodeJS.Timeout | null = null;

  /**
   * Start the job processor with automatic scheduling
   */
  static start(intervalMs: number = 30000): void { // Run every 30 seconds
    if (this.processInterval) {
      console.log('Job processor already running');
      return;
    }

    console.log(`Starting job processor with ${intervalMs}ms interval`);
    
    this.processInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processJobs();
      }
    }, intervalMs);

    // Process jobs immediately on start
    setTimeout(() => this.processJobs(), 1000);
  }

  /**
   * Stop the job processor
   */
  static stop(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('Job processor stopped');
    }
  }

  /**
   * Process all pending jobs
   */
  static async processJobs(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    
    try {
      await dbConnect();
      
      console.log('Processing pending jobs...');
      await RetryHandler.processPendingJobs();
      
    } catch (error) {
      console.error('Error processing jobs:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Run daily subscription sync
   */
  static async runDailySync(): Promise<void> {
    try {
      console.log('Running daily subscription synchronization...');
      const result = await syncSubscriptions();
      
      console.log('Daily sync completed:', {
        totalSubscriptions: result.totalSubscriptions,
        syncedCount: result.syncedCount,
        discrepanciesFound: result.discrepanciesFound,
        errorsCount: result.errorsCount
      });

      // Log discrepancies for monitoring
      if (result.discrepancies.length > 0) {
        console.warn('Subscription discrepancies found:', result.discrepancies);
      }

      if (result.errors.length > 0) {
        console.error('Subscription sync errors:', result.errors);
      }

    } catch (error) {
      console.error('Fatal error in daily sync:', error);
      throw error;
    }
  }

  /**
   * Get job processor status
   */
  static getStatus(): {
    isRunning: boolean;
    isProcessing: boolean;
    intervalMs: number;
  } {
    return {
      isRunning: this.processInterval !== null,
      isProcessing: this.isProcessing,
      intervalMs: this.processInterval ? 30000 : 0
    };
  }
}

/**
 * Initialize job processor for Next.js app
 * Call this in your app startup
 */
export function initializeJobProcessor(): void {
  // Only run in production or if explicitly enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_JOB_PROCESSOR === 'true') {
    JobProcessor.start();
    
    // Schedule daily sync at 2 AM
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);
    
    // If it's already past 2 AM today, schedule for tomorrow
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    
    const msUntil2AM = next2AM.getTime() - now.getTime();
    
    setTimeout(() => {
      JobProcessor.runDailySync();
      
      // Then run every 24 hours
      setInterval(() => {
        JobProcessor.runDailySync();
      }, 24 * 60 * 60 * 1000);
      
    }, msUntil2AM);

    console.log(`Daily sync scheduled for ${next2AM.toISOString()}`);
  } else {
    console.log('Job processor disabled (not in production)');
  }
}

/**
 * Cleanup job processor on app shutdown
 */
export function cleanupJobProcessor(): void {
  JobProcessor.stop();
}

// Auto-initialize if running in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  initializeJobProcessor();
} 