import mongoose, { Document, Schema } from 'mongoose';

export type JobType = 
  | 'subscription_sync'
  | 'payment_verify'
  | 'webhook_retry'
  | 'subscription_fetch'
  | 'customer_create'
  | 'refund_process';

export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface IJob extends Document {
  type: JobType;
  status: JobStatus;
  payload: Record<string, any>;
  retryCount: number;
  maxRetries: number;
  nextAttemptAt: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

const JobSchema = new Schema<IJob>({
  type: {
    type: String,
    required: true,
    enum: [
      'subscription_sync',
      'payment_verify', 
      'webhook_retry',
      'subscription_fetch',
      'customer_create',
      'refund_process'
    ],
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxRetries: {
    type: Number,
    default: 3,
    min: 0
  },
  nextAttemptAt: {
    type: Date,
    required: true,
    index: true
  },
  completedAt: {
    type: Date,
    sparse: true
  },
  failedAt: {
    type: Date,
    sparse: true
  },
  error: {
    type: String,
    sparse: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for efficient job processing
JobSchema.index({ status: 1, nextAttemptAt: 1 });
JobSchema.index({ type: 1, status: 1 });
JobSchema.index({ status: 1, createdAt: -1 });

// Auto-delete completed/failed jobs after 30 days
JobSchema.index(
  { completedAt: 1 }, 
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'completed' } }
);
JobSchema.index(
  { failedAt: 1 }, 
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'failed' } }
);

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema); 