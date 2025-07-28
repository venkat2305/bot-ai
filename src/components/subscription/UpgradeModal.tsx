'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, Check, Crown, Loader2 } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/config/subscription-plans';
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

  const proMonthlyPlan = SUBSCRIPTION_PLANS.PRO_MONTHLY;

  const handleUpgrade = async () => {
    if (!session?.user) {
      setError('Please log in to upgrade');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create subscription with backend
      const subscriptionResult = await createSubscription(proMonthlyPlan.id);

      if (!subscriptionResult.success) {
        throw new Error('Failed to create subscription');
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: subscriptionResult.subscriptionId,
        name: 'Bot AI Pro',
        description: proMonthlyPlan.description,
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
          planId: proMonthlyPlan.internalId,
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
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Details */}
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-4">
              <h3 className="text-2xl font-bold mb-2">{proMonthlyPlan.name}</h3>
              <div className="text-3xl font-bold mb-2">
                {proMonthlyPlan.currency === 'INR' ? '₹' : '$'}
                {proMonthlyPlan.price / 100}
                <span className="text-lg font-normal opacity-90">/month</span>
              </div>
              <p className="opacity-90">{proMonthlyPlan.description}</p>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">What you'll get:</h4>
            <div className="space-y-2">
              {proMonthlyPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgradeClick}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upgrade Now'
              )}
            </button>
          </div>

          {/* Security Note */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Secured by Razorpay • You can cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
} 