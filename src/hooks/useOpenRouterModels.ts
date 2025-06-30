import { useState, useEffect } from "react";

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
  architecture?: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider?: {
    context_length: number;
    max_completion_tokens?: number;
    is_moderated: boolean;
  };
  per_request_limits?: {
    prompt_tokens: string;
    completion_tokens: string;
  };
}

export default function useOpenRouterModels() {
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);

  useEffect(() => {
    async function getOpenRouterModels(): Promise<void> {
      try {
        const response = await fetch('/api/openrouter/models');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const models: OpenRouterModel[] = await response.json();
        setOpenRouterModels(models);
      } catch (error) {
        console.error('Error fetching OpenRouter models:', error);
      }
    }

    getOpenRouterModels();
  }, []);

  return { openRouterModels };
}