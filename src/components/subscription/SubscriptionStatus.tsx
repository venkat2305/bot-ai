'use client';

import { useState } from 'react';
import { Crown, Calendar, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from './UpgradeModal';

export default function SubscriptionStatus() {
  const { subscriptionData, loading, error, refreshSubscription, cancelSubscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  if (loading && !subscriptionData) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading subscription...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">Failed to load subscription status</span>
        </div>
        <button
          onClick={refreshSubscription}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  const { user, subscription, canUpgrade, hasActiveSubscription } = subscriptionData;

  const handleCancelSubscription = async (cancelAtCycleEnd: boolean) => {
    try {
      setCancelling(true);
      await cancelSubscription(cancelAtCycleEnd, 'User requested cancellation');
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      // Could add error toast here
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = () => {
    if (!subscription) return null;
    
    switch (subscription.status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'past_due':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    if (!subscription) return 'Free Plan';
    
    if (subscription.isActive) return 'Active';
    if (subscription.isInGracePeriod) return 'Payment Issue';
    if (subscription.status === 'cancelled') return 'Cancelled';
    return subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Crown className={`w-6 h-6 ${user.isPro ? 'text-yellow-500' : 'text-gray-400'}`} />
            <h2 className="text-xl font-semibold">Subscription</h2>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${
              hasActiveSubscription ? 'text-green-700' : 'text-gray-600'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Free Plan */}
        {!subscription && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Free Plan</h3>
              <p className="text-sm text-gray-600 mb-3">
                You're currently on the free plan with limited features.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Limited chat history</li>
                <li>• Basic AI models</li>
                <li>• Community support</li>
              </ul>
            </div>
            {canUpgrade && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        )}

        {/* Pro Plan */}
        {subscription && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{subscription.planName}</h3>
                <span className="text-lg font-bold text-blue-600">
                  {subscription.formattedPrice}/month
                </span>
              </div>
              
              {subscription.isActive && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Next billing: {formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}

              {subscription.isInGracePeriod && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Payment failed. Grace period until {formatDate(subscription.gracePeriodEnd!)}
                    </span>
                  </div>
                </div>
              )}

              {subscription.cancelledAt && (
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      Cancelled on {formatDate(subscription.cancelledAt)}
                      {subscription.isActive && ` • Access until ${formatDate(subscription.currentPeriodEnd)}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Features included:</p>
                <ul className="space-y-1">
                  {subscription.features.map((feature, index) => (
                    <li key={index}>• {feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {subscription.isActive && !subscription.cancelledAt && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="flex-1 bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                >
                  Cancel Subscription
                </button>
              )}
              
              {!subscription.isActive && canUpgrade && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reactivate Pro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={() => {
          refreshSubscription();
        }}
      />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your Pro subscription? You can choose to:
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleCancelSubscription(false)}
                disabled={cancelling}
                className="w-full p-3 border border-red-200 rounded-lg text-left hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-red-600">Cancel immediately</div>
                <div className="text-sm text-gray-600">Lose access now, get refund</div>
              </button>
              
              <button
                onClick={() => handleCancelSubscription(true)}
                disabled={cancelling}
                className="w-full p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="font-medium">Cancel at period end</div>
                <div className="text-sm text-gray-600">
                  Keep access until {subscription && formatDate(subscription.currentPeriodEnd)}
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={cancelling}
              >
                Keep Subscription
              </button>
            </div>

            {cancelling && (
              <div className="mt-4 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cancelling...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 