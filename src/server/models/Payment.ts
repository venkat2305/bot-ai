import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      required: false, // May not be available for all payment types
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Amount in paise (₹100 = 10000)
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
      enum: ['INR'],
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'created',
      index: true,
    },
    method: {
      type: String,
      required: false, // Available after payment completion
      enum: ['card', 'netbanking', 'wallet', 'upi', 'emi', 'paylater'],
    },
    // Refund related fields
    refundId: {
      type: String,
      default: null,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
    refundReason: {
      type: String,
      default: null,
    },
    // Additional payment metadata from Razorpay
    gatewayData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Failure details
    failureReason: {
      type: String,
      default: null,
    },
    // Notes for internal tracking
    notes: {
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
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ subscriptionId: 1, createdAt: -1 });
PaymentSchema.index({ razorpayPaymentId: 1, status: 1 });

// Virtual for checking if payment is successful
PaymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'captured' || this.status === 'authorized';
});

// Virtual for checking if payment is refunded
PaymentSchema.virtual('isRefunded').get(function() {
  return this.status === 'refunded';
});

// Virtual for getting refund percentage
PaymentSchema.virtual('refundPercentage').get(function() {
  if (this.amount === 0) return 0;
  return (this.refundAmount / this.amount) * 100;
});

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema); 