import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { ImageAttachment, GitHubAttachment, ChatMessage, ChatRequest } from '@/types/chat';

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { messages, model, useSearchGrounding }: ChatRequest = await req.json();

    if (!messages || !model) {
      return new Response(JSON.stringify({ error: 'Messages and model are required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const google = createGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
    });

    // Transform messages to support images and GitHub attachments according to AI SDK format
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
      if (message.images && message.images.length > 0) {
        // Create content array with text and images
        const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];
        
        // Add text part first if there's content
        if (messageContent && messageContent.trim()) {
          content.push({
            type: 'text',
            text: messageContent
          });
        }
        
        // Add images - based on AI SDK documentation format
        message.images.forEach((image, index) => {
          content.push({
            type: 'image',
            image: image.url
          });
        });

        const transformedMessage = {
          role: message.role,
          content: content
        };
        
        return transformedMessage;
      } else {
        // Regular text message
        return {
          role: message.role,
          content: messageContent
        };
      }
    }));

    // Create model with search grounding configuration if enabled
    const modelInstance = useSearchGrounding 
      ? google(model, { useSearchGrounding: true })
      : google(model);

    const result = streamText({
      model: modelInstance as any,
      messages: transformedMessages as any,
    });

    // Use native Vercel AI SDK stream format
    return result.toTextStreamResponse();
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