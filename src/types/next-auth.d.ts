import 'next-auth';
import { DefaultSession } from 'next-auth';
import { Permission } from '@/lib/permissions';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscriptionTier: string;
      permissions: Permission[];
      isPro: boolean;
      hasActiveSubscription: boolean;
    } & DefaultSession['user'];
  }
} 