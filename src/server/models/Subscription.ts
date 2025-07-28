import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayCustomerId: {
      type: String,
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ['pro_monthly'], // Can be expanded for future plans
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'authenticated', 'active', 'cancelled', 'past_due', 'unpaid', 'halted', 'completed'],
      default: 'created',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    gracePeriodEnd: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for efficient queries
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ razorpaySubscriptionId: 1, status: 1 });

// Virtual for checking if subscription is currently active
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && new Date() < this.currentPeriodEnd;
});

// Virtual for checking if in grace period
SubscriptionSchema.virtual('isInGracePeriod').get(function() {
  return this.status === 'past_due' && this.gracePeriodEnd && new Date() < this.gracePeriodEnd;
});

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema); 