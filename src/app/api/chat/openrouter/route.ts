import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextRequest } from 'next/server';
import { GitHubAttachment, ChatMessage, ChatRequest } from '@/types/chat';

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

    // Transform messages to handle GitHub attachments
    const transformedMessages = await Promise.all(messages.map(async (message) => {
      let messageContent = message.content;
      
      // If there's a GitHub attachment, fetch the content and append it
      if (message.githubAttachment && message.githubAttachment.url) {
        try {
          console.log('Fetching GitHub content from:', message.githubAttachment.url);
          const response = await fetch(message.githubAttachment.url);
          if (response.ok) {
            const githubContent = await response.text();
            console.log('GitHub content fetched successfully, length:', githubContent.length);
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
      model: openrouter(model),
      messages: transformedMessages,
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