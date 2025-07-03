import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions as any)) as Session | null;

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const chats = await Chat.find({ userId: session.user.id }).sort({
      createdAt: 'desc',
    });

    return NextResponse.json(chats, { status: 200 });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 