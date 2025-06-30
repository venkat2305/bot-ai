import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return NextResponse.json({ error: 'Perplexity API key not configured' }, { status: 500 });
  }

  try {
    const { messages, model, stream }: ChatRequest = await req.json();

    if (!messages || !model) {
      return NextResponse.json({ error: 'Messages and model are required' }, { status: 400 });
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP error! status: ${response.status}` }, { status: response.status });
    }

    if (stream) {
      const readableStream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          const encoder = new TextEncoder();

          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
                controller.close();
                break;
              }

              const chunk = decoder.decode(value);
              const lines = chunk.split("\\n").filter((line) => line.trim() !== "");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") {
                    continue;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices[0]?.delta?.content || "";
                    if (content) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\\n\\n`));
                    }
                  } catch (e) {
                    console.error("Error parsing JSON:", e);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Stream reading error:", error);
            controller.close();
          }
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
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error with Perplexity chat completion:', error);
    return NextResponse.json({ error: 'Failed to get chat completion' }, { status: 500 });
  }
}