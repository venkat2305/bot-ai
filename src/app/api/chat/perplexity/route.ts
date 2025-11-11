import { streamText } from 'ai';
import { createPerplexity } from '@ai-sdk/perplexity';
import { NextRequest } from 'next/server';
import { GitHubAttachment, ChatMessage, ChatRequest } from '@/types/chat';

export async function POST(req: NextRequest) {
  const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

  if (!PERPLEXITY_API_KEY) {
    return new Response(JSON.stringify({ error: 'Perplexity API key not configured' }), { 
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

    const perplexity = createPerplexity({
      apiKey: PERPLEXITY_API_KEY,
    });

    // Transform messages to handle GitHub attachments
    const transformedMessages = await Promise.all(messages.map(async (message) => {
      let messageContent = message.content;
      
      // If there's a GitHub attachment, fetch the content and append it
      if (message.githubAttachment && message.githubAttachment.url) {
        try {
          const response = await fetch(message.githubAttachment.url);
          if (response.ok) {
            const githubContent = await response.text();
            messageContent = `${message.content}\n\n[GitHub Repository Content]\n${githubContent}`;
          } else {
            console.error('Failed to fetch GitHub content:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching GitHub content:', error);
        }
      }
      
      return {
        role: message.role,
        content: messageContent
      };
    }));

    const result = streamText({
      model: perplexity(model) as any,
      messages: transformedMessages as any,
    });

    // Use native Vercel AI SDK stream format
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Error with Perplexity chat completion:', error);
    return new Response(JSON.stringify({ error: 'Failed to get chat completion' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}