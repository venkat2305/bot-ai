import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import User from '@/server/models/User';
import Subscription from '@/server/models/Subscription';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user: any = await User.findById(session.user.id).populate('subscriptionId').lean();
  return NextResponse.json({ subscription: user?.subscriptionId, tier: user?.subscriptionTier });
}
