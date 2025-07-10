import { useState, useEffect, useCallback, useRef } from 'react';
import { ModelConfig, getActiveModels, getModelById, DEFAULT_MODEL_ID } from '@/config/models';
import { useStreamingChat } from './useStreamingChat';
import { ImageAttachment, GitHubAttachment, Message } from '@/types/chat';

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
      if (!chatId || chatId === 'new') { // Keep 'new' check for safety during transition
        setMessages([]);
        previousChatIdRef.current = chatId;
        return;
      }

      // We only want to fetch if the chat ID *actually* changes.
      if (previousChatIdRef.current !== chatId) {
        setLoading(true);
        try {
          const response = await fetch(`/api/chat/${chatId}/messages`);
          if (response.ok) {
            const data = await response.json();
            setMessages(data);
          } else {
            // A 404 is expected for a new chat, which is fine.
            if (response.status === 404) {
               setMessages([]);
            } else {
              console.error('Failed to fetch messages');
              setMessages([]);
            }
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
    async (input: string, images?: ImageAttachment[], githubAttachment?: GitHubAttachment, useSearchGrounding?: boolean) => {
      const currentChatId = chatId;

      if (!input.trim() && (!images || images.length === 0) && !githubAttachment) return;
      if (!selectedModel) {
        console.error('No model selected');
        return;
      }
      if (!currentChatId || currentChatId === 'new') {
        console.error('Invalid chatId for sending message');
        return;
      }
      
      const isNewChat = messages.length === 0;

      const userMessage: Message = { 
        role: 'user', 
        content: input,
        ...(images && images.length > 0 && { images }),
        ...(githubAttachment && { githubAttachment }),
        ...(useSearchGrounding && { useSearchGrounding })
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setLoading(true);

      try {
        // Save user message to DB
        await fetch(`/api/chat/${currentChatId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...userMessage,
            title: isNewChat ? input.substring(0, 50) : undefined
          }),
        });

        if (isNewChat) {
          window.dispatchEvent(new CustomEvent('chat-created'));
        }

        const allMessages = [
          ...messages,
          userMessage
        ].map(({ role, content, images, githubAttachment, useSearchGrounding }) => ({ 
          role, 
          content,
          ...(images && images.length > 0 && { images }),
          ...(githubAttachment && { githubAttachment }),
          ...(useSearchGrounding && { useSearchGrounding })
        }));

        // Create streaming assistant message
        const streamingMessage: Message = {
          role: 'assistant',
          content: '',
          isStreaming: true,
          reasoningContent: '',
          mainContent: '',
          hasActiveReasoning: false,
        };
        setMessages((prevMessages) => [...prevMessages, streamingMessage]);

        let fullContent = '';
        let isInsideThink = false;
        let reasoningBuffer = '';
        let mainBuffer = '';
        let pendingContent = '';
        
        const isReasoningModel = selectedModel?.capabilities.isReasoningModel;

        await streamChat(allMessages, selectedModel, (chunk) => {
          fullContent += chunk;
          
          if (!isReasoningModel) {
            // For non-reasoning models, just update content normally
            setMessages((prevMessages) => {
              const newMessages = [...prevMessages];
              const lastMessage = { ...newMessages[newMessages.length - 1] }; // Create a new object
              if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
                lastMessage.content = fullContent;
                newMessages[newMessages.length - 1] = lastMessage;
              }
              return newMessages;
            });
            return;
          }

          pendingContent += chunk;

          // Process the pending content for <think> tags
          let remainingContent = pendingContent;

          while (remainingContent.length > 0) {
            if (!isInsideThink) {
              // Look for opening <think> tag
              const thinkStart = remainingContent.indexOf('<think>');
              if (thinkStart !== -1) {
                // Add content before <think> to main content
                const beforeThink = remainingContent.substring(0, thinkStart);
                mainBuffer += beforeThink;
                
                // Move past the <think> tag
                remainingContent = remainingContent.substring(thinkStart + 7);
                isInsideThink = true;
              } else {
                // Check if we have a partial <think> tag at the end
                const partialStart = remainingContent.lastIndexOf('<');
                if (partialStart !== -1 && remainingContent.substring(partialStart).match(/^<t?h?i?n?k?$/)) {
                  // Keep potential partial tag for next chunk
                  mainBuffer += remainingContent.substring(0, partialStart);
                  pendingContent = remainingContent.substring(partialStart);
                  break;
                } else {
                  // No <think> found, add all to main content
                  mainBuffer += remainingContent;
                  pendingContent = '';
                  break;
                }
              }
            } else {
              // Look for closing </think> tag
              const thinkEnd = remainingContent.indexOf('</think>');
              if (thinkEnd !== -1) {
                // Add content before </think> to reasoning
                const insideThink = remainingContent.substring(0, thinkEnd);
                reasoningBuffer += insideThink;
                
                // Move past the </think> tag
                remainingContent = remainingContent.substring(thinkEnd + 8);
                isInsideThink = false;
              } else {
                // Check if we have a partial </think> tag at the end
                const partialEnd = remainingContent.lastIndexOf('<');
                if (partialEnd !== -1 && remainingContent.substring(partialEnd).match(/^<\/?t?h?i?n?k?>?$/)) {
                  // Keep potential partial tag for next chunk
                  reasoningBuffer += remainingContent.substring(0, partialEnd);
                  pendingContent = remainingContent.substring(partialEnd);
                  break;
                } else {
                  // No </think> found yet, add all to reasoning and wait for more
                  reasoningBuffer += remainingContent;
                  pendingContent = '';
                  break;
                }
              }
            }
          }

          setMessages((prevMessages) => {
            const newMessages = [...prevMessages];
            const lastMessage = { ...newMessages[newMessages.length - 1] }; // Create a new object
            if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              lastMessage.content = fullContent;
              lastMessage.reasoningContent = reasoningBuffer;
              lastMessage.mainContent = mainBuffer;
              lastMessage.hasActiveReasoning = isInsideThink;
              newMessages[newMessages.length - 1] = lastMessage;
            }
            return newMessages;
          });
        });

        // Finalize the streaming message
        const finalMessage: Message = {
          role: 'assistant',
          content: fullContent,
          isStreaming: false,
          ...(isReasoningModel && {
            reasoningContent: reasoningBuffer,
            mainContent: mainBuffer,
            hasActiveReasoning: false,
          }),
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