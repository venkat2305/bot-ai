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
    id: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    name: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    displayName: 'Llama 4 Maverick 17B Instruct',
    serviceProvider: 'groq',
    description: 'Meta\'s new Llama 4 Maverick model, optimized for instruction following and general-purpose tasks.',
    contextWindow: 131072,
    maxCompletionTokens: 8192,
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: true,
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
    created: Date.now(),
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
    id: 'openrouter/cypher-alpha:free',
    name: 'openrouter/cypher-alpha:free',
    displayName: 'Cypher Alpha',
    serviceProvider: 'openrouter',
    description: 'OpenRouter\'s Cypher Alpha model, designed for advanced reasoning and problem-solving tasks with high performance and efficiency.',
    contextWindow: 131072,
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
    ownedBy: 'OpenRouter',
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'deepseek/deepseek-r1-0528:free',
    displayName: 'R1 0528',
    serviceProvider: 'openrouter',
    description: 'DeepSeek R1 model from May 28th, featuring advanced reasoning capabilities and optimized performance for complex problem-solving tasks.',
    contextWindow: 163840,
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
      isReasoningModel: true,
    },
    isActive: true,
    apiEndpoint: '/api/chat/openrouter',
    ownedBy: 'DeepSeek',
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'deepseek/deepseek-chat-v3-0324:free',
    displayName: 'V3 0324',
    serviceProvider: 'openrouter',
    description: 'DeepSeek Chat V3 model from March 24th, optimized for conversational AI with enhanced dialogue capabilities and natural language understanding.',
    contextWindow: 16384,
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
    ownedBy: 'DeepSeek',
  },
  {
    id: 'agentica-org/deepcoder-14b-preview:free',
    name: 'agentica-org/deepcoder-14b-preview:free',
    displayName: 'Deepcoder 14B',
    serviceProvider: 'openrouter',
    description: 'Agentica\'s Deepcoder 14B preview model, specialized for code generation, analysis, and programming tasks with enhanced understanding of multiple programming languages.',
    contextWindow: 96000,
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
    ownedBy: 'Agentica',
  },
  {
    id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    name: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
    displayName: 'Venice: Uncensored',
    serviceProvider: 'openrouter',
    description: 'An uncensored model by Cognitive Computations, optimized for open-ended conversations and creative text generation.',
    contextWindow: 32768,
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
    ownedBy: 'Cognitive Computations',
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
      isReasoningModel: true,
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
      searchSupport: false,
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
      searchSupport: true,
      isReasoningModel: false,
    },
    isActive: true,
    apiEndpoint: '/api/chat/gemini',
    ownedBy: 'Google',
    created: 1735689600,
  },
  {
    id: 'gemini-2.5-pro',
    name: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    serviceProvider: 'gemini',
    description: 'Google’s advanced Gemini 2.5 Pro multimodal model with enhanced reasoning, larger context, and premium capabilities.',
    contextWindow: 1000000,        // adjust as needed
    maxCompletionTokens: 16384,     // adjust as needed
    capabilities: {
      textInput: true,
      textOutput: true,
      imageInput: true,
      imageOutput: false,
      audioInput: false,
      audioOutput: false,
      transcription: false,
      pdfSupport: true,
      searchSupport: true,
      isReasoningModel: true,
    },
    isActive: true,
    apiEndpoint: '/api/chat/gemini',
    ownedBy: 'Google',
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
export const DEFAULT_MODEL_ID = 'gemini-2.5-flash'; 