import OpenAI from "openai";
import { NextResponse } from 'next/server';

export async function POST(req) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
  }

  const { messages, model, stream } = await req.json();

  if (!messages || !model) {
    return NextResponse.json({ error: 'Messages and model are required' }, { status: 400 });
  }

  try {
    const groq = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    if (stream) {
      const response = await groq.chat.completions.create({
        model,
        messages,
        stream: true,
      });

      const readableStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\\n\\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } else {
      const response = await groq.chat.completions.create({
        model,
        messages,
        stream: false,
      });

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error with Groq chat completion:', error);
    return NextResponse.json({ error: 'Failed to get chat completion' }, { status: 500 });
  }
} 