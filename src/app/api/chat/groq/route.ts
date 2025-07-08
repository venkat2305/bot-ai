import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { NextRequest } from 'next/server';
import { ImageAttachment, GitHubAttachment, ChatMessage, ChatRequest } from '@/types/chat';

export async function POST(req: NextRequest) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: 'Groq API key not configured' }), { 
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

    console.log('Groq incoming messages:', JSON.stringify(messages, null, 2));

    const groq = createGroq({
      apiKey: GROQ_API_KEY,
    });

    // Transform messages to support images and GitHub attachments according to AI SDK format
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
            console.log('Final message content length:', messageContent.length);
          } else {
            console.error('Failed to fetch GitHub content:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching GitHub content:', error);
        }
      }
      if (message.images && message.images.length > 0) {
        console.log(`Groq message with ${message.images.length} images:`, message.images);
        
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
          console.log(`Adding image ${index + 1} to Groq:`, image.url);
          content.push({
            type: 'image',
            image: image.url
          });
        });

        const transformedMessage = {
          role: message.role,
          content: content
        };
        
        console.log('Groq transformed multimodal message:', JSON.stringify(transformedMessage, null, 2));
        return transformedMessage;
      } else {
        // Regular text message
        return {
          role: message.role,
          content: messageContent
        };
      }
    }));

    console.log('Groq final transformed messages:', JSON.stringify(transformedMessages, null, 2));

    const result = streamText({
      model: groq(model),
      messages: transformedMessages as any,
    });

    // Use native Vercel AI SDK stream format
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Error with Groq chat completion:', error);
    console.error('Groq error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(JSON.stringify({ error: 'Failed to get chat completion' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}