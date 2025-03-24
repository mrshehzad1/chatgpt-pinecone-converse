
import { ChatMessage, ChatResponse, ApiError } from '@/types';

// This would be configured properly in a real environment
// For demo purposes, we're mocking the backend responses
const API_ENDPOINT = '/api/chat';

// Mock data for demonstration
const MOCK_SOURCES = [
  {
    id: '1',
    title: 'Understanding Vector Databases',
    content: 'Vector databases store data as high-dimensional vectors, allowing for semantic search based on meaning rather than keywords.',
    similarity: 0.92,
    url: 'https://example.com/vectors'
  },
  {
    id: '2',
    title: 'Pinecone Documentation',
    content: 'Pinecone is a vector database designed for machine learning applications, offering fast vector similarity search.',
    similarity: 0.88,
    url: 'https://docs.pinecone.io'
  },
  {
    id: '3',
    title: 'OpenAI Embeddings',
    content: 'OpenAI embeddings convert text into numerical vectors that capture semantic meaning.',
    similarity: 0.85,
    url: 'https://platform.openai.com/docs/guides/embeddings'
  }
];

// Store conversation state locally
let conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const messageHistory: ChatMessage[] = [];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate API call to the backend
export const sendMessage = async (message: string): Promise<ChatResponse> => {
  try {
    // In a real implementation, this would be a fetch call to your backend API
    // For now, we'll simulate the backend response
    
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    messageHistory.push(userMessage);
    
    // Simulate network delay
    await delay(1500);
    
    // Generate mock response based on user input
    let answer = '';
    let confidence = 0;
    let sources = [];
    
    if (message.toLowerCase().includes('vector') || message.toLowerCase().includes('database')) {
      answer = "Vector databases like Pinecone store data as high-dimensional vectors, enabling semantic search based on meaning rather than keywords. When you query a vector database, it finds the most similar vectors to your query vector using distance metrics like cosine similarity. This is particularly useful for natural language processing, image recognition, and recommendation systems.";
      confidence = 0.93;
      sources = MOCK_SOURCES.slice(0, 2);
    } else if (message.toLowerCase().includes('pinecone')) {
      answer = "Pinecone is a vector database optimized for machine learning applications. It provides fast similarity search for vectors with high dimensionality, making it ideal for applications like semantic search, recommendation systems, and AI chatbots. Pinecone handles the infrastructure complexities of scaling vector search, allowing developers to focus on building applications.";
      confidence = 0.95;
      sources = [MOCK_SOURCES[1]];
    } else if (message.toLowerCase().includes('embedding') || message.toLowerCase().includes('openai')) {
      answer = "OpenAI's embeddings convert text into numerical vectors that capture semantic meaning. These embeddings can then be stored in vector databases like Pinecone for efficient retrieval. When a user asks a question, the query is converted to an embedding and used to search for the most similar vectors in the database, providing context for generating accurate answers.";
      confidence = 0.91;
      sources = [MOCK_SOURCES[2]];
    } else {
      answer = "I can provide information about vector databases, Pinecone, and how they work with language models. Is there something specific you'd like to know about these technologies?";
      confidence = 0.75;
      sources = [];
    }
    
    // Add assistant message to history
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
      sources: sources,
      confidence: confidence
    };
    messageHistory.push(assistantMessage);
    
    return {
      answer,
      confidence,
      sources: sources as any,
      conversationId
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw {
      message: 'Failed to send message. Please try again.',
      status: 500
    } as ApiError;
  }
};

// Get conversation history
export const getConversationHistory = (): ChatMessage[] => {
  return [...messageHistory];
};

// Reset conversation
export const resetConversation = (): void => {
  conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  messageHistory.length = 0;
};
