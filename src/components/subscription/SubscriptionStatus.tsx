"use client";
import { useSession } from 'next-auth/react';

export default function SubscriptionStatus() {
  const { data: session } = useSession();
  const tier = session?.user?.subscriptionTier || 'free';
  return <span className="text-xs">Plan: {tier}</span>;
}
