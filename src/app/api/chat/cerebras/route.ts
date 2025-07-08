import { streamText } from 'ai';
import { createCerebras } from '@ai-sdk/cerebras';
import { NextRequest } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
}

export async function POST(req: NextRequest) {
  const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

  if (!CEREBRAS_API_KEY) {
    return new Response(JSON.stringify({ error: 'Cerebras API key not configured' }), { 
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

    const cerebras = createCerebras({
      apiKey: CEREBRAS_API_KEY,
    });

    const result = streamText({
      model: cerebras(model),
      messages,
    });

    // Use native Vercel AI SDK stream format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error with Cerebras chat completion:', error);
    return new Response(JSON.stringify({ error: 'Failed to get chat completion' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 