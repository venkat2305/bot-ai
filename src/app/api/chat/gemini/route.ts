import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
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

    const google = createGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
    });

    const result = streamText({
      model: google(model),
      messages,
    });

    // Use native Vercel AI SDK stream format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error with Gemini chat completion:', error);
    return new Response(JSON.stringify({ error: 'Failed to get chat completion' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 