
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
}

export interface Source {
  id: string;
  title: string;
  content: string;
  similarity: number;
  url?: string;
}

export interface ChatResponse {
  answer: string;
  confidence: number;
  sources: Source[];
  conversationId: string;
}

export interface PineconeConfig {
  apiKey: string;
  environment: string;
  indexName: string;
  projectId: string;
  namespace?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
