"use client";
import { useSession } from 'next-auth/react';

export default function ProBadge() {
  const { data: session } = useSession();
  if (session?.user?.subscriptionTier !== 'pro') return null;
  return <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 text-black rounded">PRO</span>;
}
