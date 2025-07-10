export interface ImageAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface GitHubAttachment {
  type: 'github';
  url?: string;
  filename?: string;
  repoUrl?: string;
  branch?: string;
  totalFiles?: number;
  totalSize?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: ImageAttachment[];
  githubAttachment?: GitHubAttachment;
  useSearchGrounding?: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  useSearchGrounding?: boolean;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: ImageAttachment[];
  githubAttachment?: GitHubAttachment;
  isStreaming?: boolean;
  reasoningContent?: string;
  mainContent?: string;
  hasActiveReasoning?: boolean;
  useSearchGrounding?: boolean;
} 