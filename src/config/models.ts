export interface ModelCapabilities {
  textInput: boolean;
  textOutput: boolean;
  imageInput: boolean;
  imageOutput: boolean;
  audioInput: boolean;
  audioOutput: boolean;
  transcription: boolean;
  pdfSupport: boolean;
  searchSupport: boolean;
  isReasoningModel: boolean;
}

export type ServiceProvider = 'groq' | 'openrouter' | 'perplexity' | 'cerebras' | 'gemini';

export interface ModelConfig {
  id: string;
  name: string;
  displayName: string;
  serviceProvider: ServiceProvider;
  description: string;
  contextWindow: number;
  maxCompletionTokens: number;
  maxFileSize?: string;
  capabilities: ModelCapabilities;
  isActive: boolean;
  apiEndpoint: string;
  ownedBy: string;
  created?: number;
}

export const MODEL_CONFIGS: ModelConfig[] = [
  // Groq Models
  {
    id: 'llama-3.3-70b-versatile',
    name: 'llama-3.3-70b-versatile',
    displayName: 'Llama 3.3 70B Versatile',
    serviceProvider: 'groq',
    description: 'Meta\'s latest large language model with excellent reasoning capabilities and versatile performance across various tasks.',
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: true,
    },
    isActive: true,
    apiEndpoint: '/api/chat/groq',
    ownedBy: 'Meta',
    created: 1733447754,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'llama-3.1-8b-instant',
    displayName: 'Llama 3.1 8B Instant',
    serviceProvider: 'groq',
    description: 'Fast and efficient smaller model from Meta, optimized for quick responses and real-time applications.',
    contextWindow: 131072,
    maxCompletionTokens: 131072,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: false,
    },
    isActive: true,
    apiEndpoint: '/api/chat/groq',
    ownedBy: 'Meta',
    created: 1693721698,
  },
  {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'deepseek-r1-distill-llama-70b',
    displayName: 'DeepSeek R1 Distill Llama 70B',
    serviceProvider: 'groq',
    description: 'Advanced reasoning model from DeepSeek with enhanced logical thinking and problem-solving capabilities.',
    contextWindow: 131072,
    maxCompletionTokens: 131072,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: true,
    },
    isActive: true,
    apiEndpoint: '/api/chat/groq',
    ownedBy: 'DeepSeek / Meta',
    created: 1737924940,
  },
  
  // OpenRouter Models
  {
    id: 'mistralai/mistral-nemo:free',
    name: 'mistralai/mistral-nemo:free',
    displayName: 'Mistral Nemo (Free)',
    serviceProvider: 'openrouter',
    description: 'A 12B parameter model with a 128k token context length built by Mistral in collaboration with NVIDIA.\n\nThe model is multilingual, supporting English, French, German, Spanish, Italian, Portuguese, Chinese, Japanese, Korean, Arabic, and Hindi.\n\nIt supports function calling and is released under the Apache 2.0 license.',
    contextWindow: 131072,
    maxCompletionTokens: 128000,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: false,
    },
    isActive: true,
    apiEndpoint: '/api/chat/openrouter',
    ownedBy: 'Mistral AI / NVIDIA',
    created: 1721347200,
  },
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'google/gemma-2-9b-it:free',
    displayName: 'Gemma 2 9B (Free)',
    serviceProvider: 'openrouter',
    description: 'Gemma 2 9B by Google is an advanced, open-source language model, that sets a new standard for efficiency and performance in its size class.\n\nDesigned for a wide variety of tasks, it empowers developers and researchers to build innovative applications, while maintaining accessibility, safety, and cost-effectiveness.\n\nSee the [launch announcement](https://blog.google/technology/developers/google-gemma-2/) for more details. Usage of Gemma is subject to Google\'s [Gemma Terms of Use](https://ai.google.dev/gemma/terms).',
    contextWindow: 8192,
    maxCompletionTokens: 8192,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: false,
    },
    isActive: true,
    apiEndpoint: '/api/chat/openrouter',
    ownedBy: 'Google',
    created: 1719532800,
  },
  
  // Perplexity Models
  {
    id: 'r1-1776',
    name: 'r1-1776',
    displayName: 'R1-1776',
    serviceProvider: 'perplexity',
    description: 'A version of DeepSeek R1 post-trained for uncensored, unbiased, and factual information. Perfect for creative content generation, tasks not requiring up-to-date web information, scenarios favoring traditional LLM techniques, and maintaining conversation context without search interference. Unsuitable for queries needing current web information, tasks benefiting from search-augmented generation, or research projects requiring integration of multiple external sources.',
    contextWindow: 128000,
    maxCompletionTokens: 4096,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: false,
    },
    isActive: true,
    apiEndpoint: '/api/chat/perplexity',
    ownedBy: 'Perplexity',
  },
  {
    id: 'sonar-reasoning-pro',
    name: 'sonar-reasoning-pro',
    displayName: 'Sonar Reasoning Pro',
    serviceProvider: 'perplexity',
    description: 'Premier reasoning offering powered by DeepSeek R1 with Chain of Thought (CoT). Excellent for complex analyses requiring step-by-step thinking, tasks needing strict adherence to instructions, information synthesis across sources, and logical problem-solving that demands informed recommendations. Not recommended for simple factual queries, basic information retrieval, exhaustive research projects (use Research models instead), or when speed takes priority over reasoning quality.',
    contextWindow: 128000,
    maxCompletionTokens: 4096,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: true,
      isReasoningModel: true,
    },
    isActive: true,
    apiEndpoint: '/api/chat/perplexity',
    ownedBy: 'Perplexity',
  },
  
  // Cerebras Models
  {
    id: 'qwen-3-32b',
    name: 'qwen-3-32b',
    displayName: 'Qwen 3 32B',
    serviceProvider: 'cerebras',
    description: 'Alibaba\'s powerful 32B parameter model optimized for fast inference on Cerebras hardware. Excels at multilingual tasks, coding, mathematical reasoning, and general conversation with high performance and efficiency.',
    contextWindow: 131072,
    maxCompletionTokens: 32768,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: false,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: false,
      searchSupport: false,
      isReasoningModel: true,
    },
    isActive: true,
    apiEndpoint: '/api/chat/cerebras',
    ownedBy: 'Alibaba',
    created: 1735689600,
  },

  // Gemini Models
  {
    id: 'gemini-2.5-flash',
    name: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    serviceProvider: 'gemini',
    description: 'Google\'s fastest multimodal model with excellent performance across text, image, and code tasks. Optimized for speed while maintaining high quality responses and supporting large context windows.',
    contextWindow: 1000000,
    maxCompletionTokens: 8192,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: true,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: true,
      searchSupport: false,
      isReasoningModel: false,
    },
    isActive: true,
    apiEndpoint: '/api/chat/gemini',
    ownedBy: 'Google',
    created: 1735689600,
  },
];

// Helper functions
export const getActiveModels = (): ModelConfig[] => {
  return MODEL_CONFIGS.filter(model => model.isActive);
};

export const getModelById = (id: string): ModelConfig | undefined => {
  return MODEL_CONFIGS.find(model => model.id === id);
};

export const getModelsByProvider = (provider: ServiceProvider): ModelConfig[] => {
  return MODEL_CONFIGS.filter(model => model.serviceProvider === provider && model.isActive);
};

export const getModelsByCapability = (capability: keyof ModelCapabilities): ModelConfig[] => {
  return MODEL_CONFIGS.filter(model => model.capabilities[capability] && model.isActive);
};

export const getReasoningModels = (): ModelConfig[] => {
  return getModelsByCapability('isReasoningModel');
};

export const getMultimodalModels = (): ModelConfig[] => {
  return MODEL_CONFIGS.filter(model => 
    (model.capabilities.imageInput || model.capabilities.audioInput) && model.isActive
  );
};

export const getSearchCapableModels = (): ModelConfig[] => {
  return getModelsByCapability('searchSupport');
};

// Default model selection
export const DEFAULT_MODEL_ID = 'llama-3.3-70b-versatile'; 