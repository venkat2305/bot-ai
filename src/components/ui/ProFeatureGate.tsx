"use client";
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { PERMISSIONS, getPermissionsForTier } from '@/lib/permissions';

interface Props {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function ProFeatureGate({ permission, fallback, children }: Props) {
  const { data: session } = useSession();
  const tier = session?.user?.subscriptionTier || 'free';
  const permissions = getPermissionsForTier(tier);
  if (!permissions.includes(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
