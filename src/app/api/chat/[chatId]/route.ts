import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/server/models/Chat';
import Message from '@/server/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
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

    // Delete all messages in the chat
    await Message.deleteMany({ chatId: chat._id });

    // Delete the chat itself
    await Chat.deleteOne({ _id: chat._id });

    return NextResponse.json(
      { message: 'Chat deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 