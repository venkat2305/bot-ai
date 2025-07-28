import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Permission } from '@/lib/permissions';

export interface SubscriptionData {
  user: {
    id: string;
    name: string;
    email: string;
    subscriptionTier: 'free' | 'pro';
    isPro: boolean;
  };
  subscription: {
    id: string;
    razorpaySubscriptionId: string;
    planId: string;
    planName: string;
    status: string;
    isActive: boolean;
    isInGracePeriod: boolean;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelledAt?: string;
    gracePeriodEnd?: string;
    price: number;
    formattedPrice: string;
    currency: string;
    features: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
  permissions: Permission[];
  canUpgrade: boolean;
  hasActiveSubscription: boolean;
}

export function useSubscription() {
  const { data: session, status } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionData = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/user/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      const result = await response.json();
      if (result.success) {
        setSubscriptionData(result.data);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, status]);

  const refreshSubscription = useCallback(() => {
    return fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const syncSubscriptionStatus = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/user/subscription', {
        method: 'PUT',
      });

      if (response.ok) {
        await refreshSubscription();
      }
    } catch (err) {
      console.error('Error syncing subscription status:', err);
    }
  }, [session?.user?.id, refreshSubscription]);

  const hasPermission = useCallback((permission: Permission) => {
    return subscriptionData?.permissions.includes(permission) || false;
  }, [subscriptionData?.permissions]);

  const createSubscription = useCallback(async (planId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (cancelAtCycleEnd: boolean = false, reason?: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelAtCycleEnd, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      const result = await response.json();
      await refreshSubscription();
      return result;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [refreshSubscription]);

  // Fetch subscription data on component mount and session change
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  return {
    subscriptionData,
    loading,
    error,
    refreshSubscription,
    syncSubscriptionStatus,
    hasPermission,
    createSubscription,
    cancelSubscription,
    // Convenience getters
    isPro: subscriptionData?.user.isPro || false,
    isActive: subscriptionData?.hasActiveSubscription || false,
    canUpgrade: subscriptionData?.canUpgrade || false,
    subscriptionTier: subscriptionData?.user.subscriptionTier || 'free',
  };
} 