
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
  error?: {
    type: string;
    message: string;
  };
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
    file?: string; // Original PDF name
  };
}

export interface ChatResponse {
  answer: string;
  confidence: number;
  sources: Source[];
  conversationId: string;
  error?: {
    type: string;
    message: string;
  };
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
  type?: string;
}

export interface ProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Add state for tracking API calls
export interface ApiCallState {
  isLoading: boolean;
  isError: boolean;
  error?: ApiError;
}
