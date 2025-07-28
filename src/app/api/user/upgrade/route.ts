import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSubscription } from '@/lib/subscription';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const subscriptionId = await createSubscription(session.user.id);
    return NextResponse.json({ subscriptionId });
  } catch (err) {
    console.error('Upgrade failed', err);
    return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 });
  }
}
