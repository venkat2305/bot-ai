import { NextResponse } from 'next/server';

interface ModelPricing {
  prompt: string;
  completion: string;
}

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: ModelPricing;
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

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

export async function GET() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP error! status: ${response.status}` }, { status: response.status });
    }

    const data: OpenRouterResponse = await response.json();
    const freeModelArr = data.data.filter(
      (model) =>
        model.pricing.prompt === "0" && model.pricing.completion === "0"
    );
    
    return NextResponse.json(freeModelArr);
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return NextResponse.json({ error: 'Failed to fetch OpenRouter models' }, { status: 500 });
  }
}