import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSubscription } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscriptionId = await createSubscription(session.user.id);
    return NextResponse.json({ subscriptionId });
  } catch (error: any) {
    console.error('Subscription creation failed', error);
    return NextResponse.json({ error: 'Subscription creation failed' }, { status: 500 });
  }
}
