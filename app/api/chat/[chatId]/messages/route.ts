import { type NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Chat from '@/models/Chat'
import Message from '@/models/Message'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

function getChatIdFromUrl(url: string) {
  const pathParts = new URL(url).pathname.split('/');
  return pathParts[3];
}

export async function GET(req: NextRequest) {
  try {
    const chatId = getChatIdFromUrl(req.url);
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const chat = await Chat.findOne({
      uuid: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await Message.find({ chatId: chat._id }).sort({
      createdAt: 'asc',
    });

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const chatId = getChatIdFromUrl(req.url);
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, content } = await req.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const chat = await Chat.findOne({
      uuid: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const newMessage = new Message({
      chatId: chat._id,
      role,
      content,
    });

    await newMessage.save();

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 