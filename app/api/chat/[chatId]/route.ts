import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function getChatIdFromUrl(url: string) {
  const pathParts = new URL(url).pathname.split('/');
  return pathParts[3];
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
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