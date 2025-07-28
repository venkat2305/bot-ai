'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Check, Crown, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/config/subscription-plans';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradeModal({ isOpen, onClose, onSuccess }: UpgradeModalProps) {
  const { data: session } = useSession();
  const { createSubscription, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS.TEST_MONTHLY);

  const availablePlans = Object.values(SUBSCRIPTION_PLANS);

  const handleUpgrade = async () => {
    if (!session?.user) {
      setError('Please log in to upgrade');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create subscription with backend
      const subscriptionResult = await createSubscription(selectedPlan.id);

      if (!subscriptionResult.success) {
        throw new Error('Failed to create subscription');
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionResult.subscriptionId,
        name: `Bot AI ${selectedPlan.name}`,
        description: selectedPlan.description,
        image: '/logo192.png',
        handler: async function (response: any) {
          try {
            // Payment successful - refresh subscription data
            await refreshSubscription();
            onSuccess?.();
            onClose();
          } catch (err) {
            console.error('Error after payment:', err);
            setError('Payment completed but there was an issue updating your account. Please contact support.');
          }
        },
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
        },
        notes: {
          userId: session.user.id,
          planId: selectedPlan.internalId,
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to start upgrade process');
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleUpgradeClick = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Failed to load payment system. Please try again.');
      return;
    }
    await handleUpgrade();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[var(--border-color)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-[var(--text-color)]">Choose Your Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Selection */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-[var(--text-color)]">Select a plan:</h4>
            <div className="space-y-3">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan.id === plan.id
                      ? 'border-[var(--primary-color)] bg-[var(--bg-tertiary)]'
                      : 'border-[var(--border-color)] hover:border-[var(--text-muted)]'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[var(--text-color)]">{plan.name}</h3>
                        {plan.popular && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Most Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mt-1">{plan.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-[var(--text-color)]">
                        {formatPrice(plan.price, plan.currency)}
                      </div>
                      <div className="text-sm text-[var(--text-muted)]">per month</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Plan Features */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-[var(--text-color)]">What you'll get with {selectedPlan.name}:</h4>
            <div className="space-y-2">
              {selectedPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-[var(--text-color)]">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-color)]"
              disabled={loading}
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgradeClick}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Subscribe for ${formatPrice(selectedPlan.price)}/month`
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-4 text-xs text-[var(--text-muted)] text-center">
            <p>Secured by Razorpay • You can cancel anytime • Test plan for development</p>
          </div>
        </div>
      </div>
    </div>
  );
} 