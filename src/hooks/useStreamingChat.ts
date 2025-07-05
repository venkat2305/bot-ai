import { useState, useCallback, useRef } from 'react';
import { ModelConfig } from '@/config/models';

export interface StreamingMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

interface StreamingChatOptions {
  onMessageUpdate?: (messages: StreamingMessage[]) => void;
  onError?: (error: string) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export function useStreamingChat(options: StreamingChatOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(async (
    messages: StreamingMessage[],
    model: ModelConfig,
    onChunk: (chunk: string) => void
  ) => {
    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    options.onStreamStart?.();

    try {
      const response = await fetch(model.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.name,
          messages: messages.map(({ role, content }) => ({ role, content })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              
              if (delta) {
                onChunk(delta);
              }
            } catch (e) {
              // Skip invalid JSON lines
              continue;
            }
          }
        }
      }

      reader.releaseLock();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      options.onError?.(errorMessage);
      throw error;
    } finally {
      setIsStreaming(false);
      options.onStreamEnd?.();
      abortControllerRef.current = null;
    }
  }, [options]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    streamChat,
    isStreaming,
    cancelStream,
  };
}