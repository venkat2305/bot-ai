import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';

interface ImageAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: ImageAttachment[];
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
}

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages, model }: ChatRequest = await req.json();

    if (!messages || !model) {
      return new Response(JSON.stringify({ error: 'Messages and model are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Incoming messages:', JSON.stringify(messages, null, 2));

    const google = createGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
    });

    // Transform messages to support images according to AI SDK format
    const transformedMessages = messages.map(message => {
      if (message.images && message.images.length > 0) {
        console.log(`Message with ${message.images.length} images:`, message.images);
        
        // Create content array with text and images
        const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];
        
        // Add text part first if there's content
        if (message.content && message.content.trim()) {
          content.push({
            type: 'text',
            text: message.content
          });
        }
        
        // Add images - based on AI SDK documentation format
        message.images.forEach((image, index) => {
          console.log(`Adding image ${index + 1}:`, image.url);
          content.push({
            type: 'image',
            image: image.url
          });
        });

        const transformedMessage = {
          role: message.role,
          content: content
        };
        
        console.log('Transformed multimodal message:', JSON.stringify(transformedMessage, null, 2));
        return transformedMessage;
      } else {
        // Regular text message
        return {
          role: message.role,
          content: message.content
        };
      }
    });

    console.log('Final transformed messages:', JSON.stringify(transformedMessages, null, 2));

    const result = streamText({
      model: google(model),
      messages: transformedMessages as any,
    });

    // Use native Vercel AI SDK stream format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error with Gemini chat completion:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(JSON.stringify({ error: 'Failed to get chat completion' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 