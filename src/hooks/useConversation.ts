import { useState, useEffect, useCallback, useRef } from 'react';

export interface Message {
  _id?: string;
  role: 'user' | 'assistant';
  content: string;
}

export type ModelType = 'groq' | 'openrouter' | 'perplexity';

export default function useConversation(chatId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedModelType, setSelectedModelType] = useState<ModelType>('groq');
  const [selectedModel, setSelectedModel] = useState<string>('llama-3.1-8b-instant');
  const previousChatIdRef = useRef<string | undefined>();

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

  useEffect(() => {
    if (selectedModelType === 'groq') {
      setSelectedModel('llama-3.1-8b-instant');
    } else if (selectedModelType === 'openrouter') {
      setSelectedModel('mythomist/mythomax-l2-13b');
    } else {
      setSelectedModel('llama-3-sonar-small-32k-online');
    }
  }, [selectedModelType]);

  const sendMessage = useCallback(
    async (input: string) => {
      let currentChatId = chatId;
      let newChatId: string | null = null;

      if (!input.trim()) return;

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

        let apiEndpoint = '';
        if (selectedModelType === 'perplexity') {
          apiEndpoint = '/api/chat/perplexity';
        } else if (selectedModelType === 'groq') {
          apiEndpoint = '/api/chat/groq';
        } else if (selectedModelType === 'openrouter') {
          apiEndpoint = '/api/chat/openrouter';
        }

        const aiResponse = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: allMessages,
          }),
        });
        console.log('aiResponse', aiResponse);

        if (!aiResponse.ok) {
          throw new Error(`AI API error! status: ${aiResponse.status}`);
        }

        const data = await aiResponse.json();
        const aiMessageContent = data.choices[0].message.content;
        const aiMessage: Message = {
          role: 'assistant',
          content: aiMessageContent,
        };

        setMessages((prevMessages) => [...prevMessages, aiMessage]);

        await fetch(`/api/chat/${currentChatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(aiMessage),
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
    [chatId, messages, selectedModel, selectedModelType]
  );

  return {
    messages,
    loading,
    sendMessage,
    selectedModel,
    setSelectedModel,
    selectedModelType,
    setSelectedModelType,
  };
}