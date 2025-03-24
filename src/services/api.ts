
import { ChatMessage, ChatResponse, ApiError, PineconeConfig } from '@/types';

// Pinecone configuration with the provided credentials
const PINECONE_CONFIG: PineconeConfig = {
  apiKey: 'pcsk_5QU8c8_EmQCUdUQgJqD38Q42fYHygQrHtzjcVFDUvjHQcQHDpJGzqyUirbFp3mDapvwKEr',
  environment: 'gcp-starter',  // Default environment, will be updated if needed
  indexName: 'darren-n8n'
};

// API endpoint for chat requests
const API_ENDPOINT = '/api/chat';

// Store conversation state locally
let conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const messageHistory: ChatMessage[] = [];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate vector search in Pinecone
const searchPinecone = async (query: string): Promise<any[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // In a real implementation, this would use the Pinecone JS SDK to query the vector database
    // For simulation, we'll return mock results based on the query
    await delay(1000); // Simulate network latency
    
    // For demonstration, return different mock results based on query keywords
    if (query.toLowerCase().includes('vector') || query.toLowerCase().includes('database')) {
      return [
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
        }
      ];
    } else if (query.toLowerCase().includes('pinecone')) {
      return [
        {
          id: '2',
          title: 'Pinecone Documentation',
          content: 'Pinecone is a vector database designed for machine learning applications, offering fast vector similarity search.',
          similarity: 0.95,
          url: 'https://docs.pinecone.io'
        },
        {
          id: '3',
          title: 'Building with Pinecone',
          content: 'Learn how to use Pinecone with various language models and frameworks.',
          similarity: 0.87,
          url: 'https://docs.pinecone.io/guides'
        }
      ];
    } else if (query.toLowerCase().includes('embedding') || query.toLowerCase().includes('openai')) {
      return [
        {
          id: '3',
          title: 'OpenAI Embeddings',
          content: 'OpenAI embeddings convert text into numerical vectors that capture semantic meaning.',
          similarity: 0.91,
          url: 'https://platform.openai.com/docs/guides/embeddings'
        }
      ];
    } else {
      // Return generic results for other queries
      return [
        {
          id: '4',
          title: 'AI and Vector Search',
          content: 'Modern AI applications use vector search to find semantically similar content.',
          similarity: 0.75,
          url: 'https://example.com/ai-search'
        }
      ];
    }
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    throw {
      message: 'Failed to search vector database.',
      status: 500
    } as ApiError;
  }
};

// Simulate generating a response with a language model
const generateResponse = async (query: string, sources: any[]): Promise<string> => {
  console.log(`Generating response for query: ${query} with ${sources.length} sources`);
  
  try {
    // In a real implementation, this would use OpenAI API or similar to generate a response
    await delay(1000); // Simulate LLM processing time
    
    if (sources.length > 0) {
      // Use the source content to create a more informative response
      let baseResponse = '';
      
      if (query.toLowerCase().includes('vector') || query.toLowerCase().includes('database')) {
        baseResponse = "Vector databases like Pinecone store data as high-dimensional vectors, enabling semantic search based on meaning rather than keywords. When you query a vector database, it finds the most similar vectors to your query vector using distance metrics like cosine similarity. This is particularly useful for natural language processing, image recognition, and recommendation systems.";
      } else if (query.toLowerCase().includes('pinecone')) {
        baseResponse = "Pinecone is a vector database optimized for machine learning applications. It provides fast similarity search for vectors with high dimensionality, making it ideal for applications like semantic search, recommendation systems, and AI chatbots. Pinecone handles the infrastructure complexities of scaling vector search, allowing developers to focus on building applications.";
      } else if (query.toLowerCase().includes('embedding') || query.toLowerCase().includes('openai')) {
        baseResponse = "OpenAI's embeddings convert text into numerical vectors that capture semantic meaning. These embeddings can then be stored in vector databases like Pinecone for efficient retrieval. When a user asks a question, the query is converted to an embedding and used to search for the most similar vectors in the database, providing context for generating accurate answers.";
      } else {
        baseResponse = "Based on your question, I found some relevant information in the vector database. Vector databases like Pinecone help store and retrieve information semantically, allowing AI systems to find relevant context for answering questions more accurately.";
      }
      
      return baseResponse;
    } else {
      return "I don't have specific information about that in my knowledge base. Could you clarify your question or ask about vector databases, Pinecone, or how they work with language models?";
    }
  } catch (error) {
    console.error('Error generating response:', error);
    throw {
      message: 'Failed to generate a response.',
      status: 500
    } as ApiError;
  }
};

// Send a message to the API
export const sendMessage = async (message: string): Promise<ChatResponse> => {
  try {
    console.log(`Sending message to API with Pinecone index "${PINECONE_CONFIG.indexName}"`);
    
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    messageHistory.push(userMessage);
    
    // Step 1: Search for relevant documents in Pinecone
    const sources = await searchPinecone(message);
    
    // Step 2: Generate a response using the sources
    const answer = await generateResponse(message, sources);
    
    // Calculate confidence based on the highest similarity score from sources
    const highestSimilarity = sources.length > 0 
      ? Math.max(...sources.map(s => s.similarity))
      : 0.5;
    
    // Add assistant message to history
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
      sources: sources,
      confidence: highestSimilarity
    };
    messageHistory.push(assistantMessage);
    
    return {
      answer,
      confidence: highestSimilarity,
      sources,
      conversationId
    };
  } catch (error: any) {
    console.error('Error in sendMessage:', error);
    throw {
      message: error.message || 'Failed to send message. Please try again.',
      status: error.status || 500
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
