"use client";
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function UpgradeModal() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const res = await fetch('/api/user/upgrade', { method: 'POST' });
    const data = await res.json();
    // For simplicity, redirect to Razorpay checkout page
    if (data.subscriptionId) {
      // you would open Razorpay checkout here
      alert(`Subscription created: ${data.subscriptionId}`);
    }
    setLoading(false);
  };

  if (session?.user?.subscriptionTier === 'pro') return null;

  return (
    <button onClick={handleUpgrade} disabled={loading} className="p-2 bg-blue-500 text-white rounded">
      {loading ? 'Processing...' : 'Upgrade to Pro'}
    </button>
  );
}
