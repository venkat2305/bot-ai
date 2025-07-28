'use client';

import { useState } from 'react';
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface RefundButtonProps {
  paymentId: string;
  amount?: number;
  onRefundSuccess?: () => void;
  className?: string;
}

export default function RefundButton({ 
  paymentId, 
  amount, 
  onRefundSuccess, 
  className = '' 
}: RefundButtonProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const handleRefund = async (refundAmount?: number, speed: 'normal' | 'optimum' = 'normal') => {
    if (!session?.user) {
      setError('You must be logged in to process refunds');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payment/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          amount: refundAmount,
          speed,
          reason: reason || 'User requested refund',
          notes: {
            processedBy: session.user.id,
            processedAt: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }

      const result = await response.json();
      
      if (result.success) {
        onRefundSuccess?.();
        setShowConfirmation(false);
        setReason('');
      }
    } catch (err) {
      console.error('Error processing refund:', err);
      setError(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        className={`inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors ${className}`}
      >
        <RefreshCw className="w-4 h-4" />
        Request Refund
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold">Process Refund</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Amount (optional)
                </label>
                <input
                  type="number"
                  placeholder={amount ? `₹${amount / 100}` : 'Full amount'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max={amount ? amount / 100 : undefined}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for full refund
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for refund
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain the reason for this refund..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleRefund(undefined, 'optimum')}
                disabled={loading}
                className="w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Process Instant Refund (Higher fees)'
                )}
              </button>
              
              <button
                onClick={() => handleRefund(undefined, 'normal')}
                disabled={loading}
                className="w-full p-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Process Normal Refund (5-7 days)
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setError(null);
                  setReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 