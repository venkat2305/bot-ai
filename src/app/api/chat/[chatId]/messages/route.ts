import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, content, title } = await req.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let chat = await Chat.findOne({
      uuid: chatId,
      userId: session.user.id,
    });

    if (!chat) {
      // If chat is not found and a title is provided, create a new chat.
      // This happens on the first message of a new conversation.
      if (title) {
        const newChat = new Chat({
          userId: session.user.id,
          uuid: chatId,
          title: title,
        });
        await newChat.save();
        chat = newChat;
      } else {
        // If no chat and no title, it's an error (e.g., assistant message for a non-existent chat).
        return NextResponse.json({ error: 'Chat not found and no title provided for creation' }, { status: 404 });
      }
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