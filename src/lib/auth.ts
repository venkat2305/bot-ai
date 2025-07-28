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
  session: {
    strategy: 'database' as const,
  },
  callbacks: {
    async session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id;

        try {
          // Fetch fresh user data with subscription info
          await dbConnect();
          const userData = await User.findById(user.id)
            .populate('subscriptionId')
            .lean() as any;

          if (userData) {
            // Attach subscription tier and permissions to session
            session.user.subscriptionTier = userData.subscriptionTier || 'free';
            session.user.permissions = getSessionPermissions(userData.subscriptionTier || 'free');
            session.user.isPro = userData.subscriptionTier === 'pro';
            
            // Attach subscription info if available
            if (userData.subscriptionId) {
              session.user.hasActiveSubscription = true;
            } else {
              session.user.hasActiveSubscription = false;
            }
          } else {
            // Fallback for new users
            session.user.subscriptionTier = 'free';
            session.user.permissions = getSessionPermissions('free');
            session.user.isPro = false;
            session.user.hasActiveSubscription = false;
          }
        } catch (error) {
          console.error('Error fetching user data in session callback:', error);
          // Fallback values on error
          session.user.subscriptionTier = 'free';
          session.user.permissions = getSessionPermissions('free');
          session.user.isPro = false;
          session.user.hasActiveSubscription = false;
        }
      }
      return session;
    },
  },
}; 