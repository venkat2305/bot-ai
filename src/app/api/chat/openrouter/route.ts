import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
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
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenRouter API key not configured' }), { 
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

    const openrouter = createOpenRouter({
      apiKey: OPENROUTER_API_KEY,
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'Bot AI',
      },
    });

    const result = streamText({
      model: openrouter(model),
      messages,
    });

    // Use native Vercel AI SDK stream format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error with OpenRouter chat completion:', error);
    return new Response(JSON.stringify({ error: 'Failed to get chat completion' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}