
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
  sourceError?: boolean;
}

export interface Source {
  id: string;
  title: string;
  content: string;
  similarity: number;
  url?: string;
  metadata?: {
    [key: string]: any;
    filename?: string;
    file_name?: string;
    document_name?: string;
    original_filename?: string;
    file?: string; // Added the "file" field that contains original PDF name
  };
}

export interface ChatResponse {
  answer: string;
  confidence: number;
  sources: Source[];
  conversationId: string;
  sourceError?: boolean;
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
