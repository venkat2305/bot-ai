import mongoose, { Document, Schema } from 'mongoose';

export interface IProcessedWebhook extends Document {
  webhookId: string;
  eventType: string;
  processedAt: Date;
  subscriptionId?: string;
  paymentId?: string;
  metadata?: Record<string, any>;
}

const ProcessedWebhookSchema = new Schema<IProcessedWebhook>({
  webhookId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  processedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  subscriptionId: {
    type: String,
    sparse: true,
    index: true
  },
  paymentId: {
    type: String,
    sparse: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  // Auto-delete webhook records after 90 days to prevent collection bloat
  expireAfterSeconds: 90 * 24 * 60 * 60 // 90 days in seconds
});

// Compound index for efficient lookups
ProcessedWebhookSchema.index({ eventType: 1, processedAt: -1 });

export default mongoose.models.ProcessedWebhook || 
  mongoose.model<IProcessedWebhook>('ProcessedWebhook', ProcessedWebhookSchema); 