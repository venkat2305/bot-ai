import { useState, useEffect, useCallback, useRef } from 'react';
import { ModelConfig, getActiveModels, getModelById, DEFAULT_MODEL_ID } from '@/config/models';
import { useStreamingChat } from './useStreamingChat';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function useConversation(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL_ID);
  const previousChatIdRef = useRef<string | undefined>(undefined);

  // Get the selected model configuration
  const selectedModel = getModelById(selectedModelId);

  // Initialize streaming chat
  const { streamChat, isStreaming, cancelStream } = useStreamingChat({
    onError: (error) => {
      console.error('Streaming error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error during streaming. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  useEffect(() => {
    const fetchMessages = async () => {
      if (!chatId || chatId === 'new') {
        setMessages([]);
        previousChatIdRef.current = chatId;
        return;
      }
      
      // Don't fetch if we're transitioning from 'new' to a real chat ID (same conversation)
      if (previousChatIdRef.current === 'new' && messages.length > 0) {
        previousChatIdRef.current = chatId;
        return;
      }
      
      // Only fetch if this is a different chat
      if (previousChatIdRef.current !== chatId) {
        setLoading(true);
        try {
          const response = await fetch(`/api/chat/${chatId}/messages`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          } else {
            console.error('Failed to fetch messages');
            setMessages([]);
          }
        } catch (error) {
          console.error('Error fetching messages:', error);
          setMessages([]);
        } finally {
          setLoading(false);
        }
      }
      
      previousChatIdRef.current = chatId;
    };

    fetchMessages();
  }, [chatId]);

  const sendMessage = useCallback(
    async (input: string) => {
      let currentChatId = chatId;
      let newChatId: string | null = null;

      if (!input.trim()) return;
      if (!selectedModel) {
        console.error('No model selected');
        return;
      }

      const userMessage: Message = { role: 'user', content: input };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setLoading(true);

      try {
        if (!currentChatId || currentChatId === 'new') {
          const createResponse = await fetch('/api/chat/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: input.substring(0, 30) }),
          });
          if (!createResponse.ok) {
            throw new Error('Failed to create chat');
          }
          const newChat = await createResponse.json();
          currentChatId = newChat.uuid;
          newChatId = newChat.uuid;
        }

        if (!currentChatId) {
          throw new Error('No valid chat ID to send message to.');
        }

        // Save user message to DB
        await fetch(`/api/chat/${currentChatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userMessage),
        });

        const allMessages = [
          ...messages,
          userMessage
        ].map(({ role, content }) => ({ role, content }));

        // Create streaming assistant message
        const streamingMessage: Message = {
          role: 'assistant',
          content: '',
          isStreaming: true,
        };
        setMessages((prevMessages) => [...prevMessages, streamingMessage]);

        let assistantContent = '';
        await streamChat(allMessages, selectedModel, (chunk) => {
          assistantContent += chunk;
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              lastMessage.content = assistantContent;
            }
            return newMessages;
          });
        });

        // Finalize the streaming message
        const finalMessage: Message = {
          role: 'assistant',
          content: assistantContent,
          isStreaming: false,
        };
        
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            newMessages[newMessages.length - 1] = finalMessage;
          }
          return newMessages;
        });

        // Save final message to DB
        await fetch(`/api/chat/${currentChatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalMessage),
        });

        return { newChatId };
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [chatId, messages, selectedModel, streamChat]
  );

  return {
    messages,
    loading,
    sendMessage,
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    availableModels: getActiveModels(),
    isStreaming,
    cancelStream,
  };
}