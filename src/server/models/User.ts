import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  emailVerified: {
    type: Date,
  },
  // Subscription related fields
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
    index: true,
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null,
    index: true,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if user is pro
UserSchema.virtual('isPro').get(function() {
  return this.subscriptionTier === 'pro';
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 