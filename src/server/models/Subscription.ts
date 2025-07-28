import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    razorpaySubscriptionId: { type: String, required: true },
    razorpayCustomerId: { type: String, required: true },
    planId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelledAt: Date,
    metadata: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model('Subscription', SubscriptionSchema);
