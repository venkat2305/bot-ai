import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from '@/lib/mongoClient';
import type { AuthOptions } from 'next-auth';
import { getSessionPermissions } from './rbac';
import User from '@/server/models/User';
import dbConnect from './mongodb';

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  // Use JWT sessions to avoid a DB read on every request
  session: { strategy: 'jwt' },
  callbacks: {
    // Populate JWT once on sign-in; avoid per-request DB round-trips
    async jwt({ token, user }) {
      // On initial sign-in, user is defined
      if (user) {
        // NextAuth sets token.sub; keep our own id as well
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userId = (user as any).id || (user as any)._id?.toString?.() || token.sub;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).id = userId;
        try {
          await dbConnect();
          const userData = await User.findById(userId)
            .populate('subscriptionId')
            .lean();
          const tier = (userData as any)?.subscriptionTier || 'free';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).subscriptionTier = tier;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).permissions = getSessionPermissions(tier);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).isPro = tier === 'pro';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).hasActiveSubscription = !!(userData as any)?.subscriptionId;
        } catch (error) {
          console.error('JWT callback enrichment failed:', error);
          // Safe defaults
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).subscriptionTier = 'free';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).permissions = getSessionPermissions('free');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).isPro = false;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (token as any).hasActiveSubscription = false;
        }
      } else {
        // Ensure defaults exist for subsequent requests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).subscriptionTier = (token as any).subscriptionTier ?? 'free';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).permissions = (token as any).permissions ?? getSessionPermissions('free');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).isPro = (token as any).isPro ?? false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (token as any).hasActiveSubscription = (token as any).hasActiveSubscription ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.id = ((token as any).id || (token as any).sub || session.user.id) as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.subscriptionTier = (token as any).subscriptionTier ?? 'free';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.permissions = (token as any).permissions ?? getSessionPermissions('free');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.isPro = !!(token as any).isPro;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.hasActiveSubscription = !!(token as any).hasActiveSubscription;
      }
      return session;
    },
  },
};