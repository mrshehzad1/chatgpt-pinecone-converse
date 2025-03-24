
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

// Simulate converting query to vector embedding
const queryToEmbedding = async (query: string): Promise<number[]> => {
  console.log(`Converting query to embedding: ${query}`);
  await delay(300); // Simulate embedding generation time
  
  // In a real implementation, this would call OpenAI's embedding API
  // For simulation, we'll return a mock embedding
  return Array(1536).fill(0).map(() => Math.random() - 0.5);
};

// Simulate vector search in Pinecone
const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<any[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // Step 1: Convert query to embedding
    await queryToEmbedding(query);
    
    // Step 2: In a real implementation, this would use the Pinecone JS SDK to query the vector database
    await delay(1000); // Simulate Pinecone search latency
    
    // For demonstration, return different mock results based on query keywords
    let results = [];
    
    if (query.toLowerCase().includes('vector') || query.toLowerCase().includes('database')) {
      results = [
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
          title: 'Vector Search Applications',
          content: 'Common applications of vector search include recommendation systems, semantic search, and natural language understanding.',
          similarity: 0.81,
          url: 'https://example.com/applications'
        }
      ];
    } else if (query.toLowerCase().includes('pinecone')) {
      results = [
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
        },
        {
          id: '4',
          title: 'Pinecone Index Management',
          content: 'Create, configure, and manage Pinecone indexes to optimize for your specific use case.',
          similarity: 0.82,
          url: 'https://docs.pinecone.io/reference'
        }
      ];
    } else if (query.toLowerCase().includes('embedding') || query.toLowerCase().includes('openai')) {
      results = [
        {
          id: '5',
          title: 'OpenAI Embeddings',
          content: 'OpenAI embeddings convert text into numerical vectors that capture semantic meaning.',
          similarity: 0.91,
          url: 'https://platform.openai.com/docs/guides/embeddings'
        },
        {
          id: '6',
          title: 'Integrating OpenAI with Pinecone',
          content: 'Learn how to use OpenAI embeddings with Pinecone for advanced semantic search capabilities.',
          similarity: 0.85,
          url: 'https://example.com/openai-pinecone'
        },
        {
          id: '7',
          title: 'Vector Embedding Models',
          content: 'Comparison of different embedding models and their performance characteristics.',
          similarity: 0.78,
          url: 'https://example.com/embedding-models'
        }
      ];
    } else {
      // Return generic results for other queries
      results = [
        {
          id: '8',
          title: 'AI and Vector Search',
          content: 'Modern AI applications use vector search to find semantically similar content.',
          similarity: 0.75,
          url: 'https://example.com/ai-search'
        },
        {
          id: '9',
          title: 'Semantic Search Fundamentals',
          content: 'Understanding the basics of semantic search and how it differs from traditional keyword search.',
          similarity: 0.73,
          url: 'https://example.com/semantic-search'
        }
      ];
    }
    
    // Filter by similarity threshold and limit to topK results
    return results
      .filter(result => result.similarity >= similarityThreshold)
      .slice(0, topK);
      
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    throw {
      message: 'Failed to search vector database.',
      status: 500
    } as ApiError;
  }
};

// Simulate sending chunks to OpenAI and generating a response
const generateResponseWithOpenAI = async (query: string, chunks: any[], conversationContext: ChatMessage[]): Promise<string> => {
  console.log(`Generating OpenAI response for query: "${query}" with ${chunks.length} chunks`);
  
  try {
    // In a real implementation, this would use OpenAI API to generate a response
    await delay(1500); // Simulate OpenAI processing time
    
    // Extract content from chunks to use as context
    const context = chunks.map(chunk => `${chunk.title}: ${chunk.content}`).join('\n\n');
    
    console.log(`Using context:\n${context}`);
    
    // Create a simulated response based on the chunks and query
    if (chunks.length > 0) {
      // Simulate a response that incorporates information from the chunks
      const highestSimilarityChunk = chunks.reduce((prev, current) => 
        (prev.similarity > current.similarity) ? prev : current
      );
      
      let baseResponse = '';
      
      if (query.toLowerCase().includes('vector') || query.toLowerCase().includes('database')) {
        baseResponse = "Vector databases like Pinecone store data as high-dimensional vectors, enabling semantic search based on meaning rather than keywords. When you query a vector database, it finds the most similar vectors to your query vector using distance metrics like cosine similarity. This is particularly useful for natural language processing, image recognition, and recommendation systems.";
      } else if (query.toLowerCase().includes('pinecone')) {
        baseResponse = "Pinecone is a vector database optimized for machine learning applications. It provides fast similarity search for vectors with high dimensionality, making it ideal for applications like semantic search, recommendation systems, and AI chatbots. Pinecone handles the infrastructure complexities of scaling vector search, allowing developers to focus on building applications.";
      } else if (query.toLowerCase().includes('embedding') || query.toLowerCase().includes('openai')) {
        baseResponse = "OpenAI's embeddings convert text into numerical vectors that capture semantic meaning. These embeddings can then be stored in vector databases like Pinecone for efficient retrieval. When a user asks a question, the query is converted to an embedding and used to search for the most similar vectors in the database, providing context for generating accurate answers.";
      } else {
        baseResponse = `Based on the information I found, ${highestSimilarityChunk.content} This allows for more contextually relevant responses compared to traditional keyword-based search methods.`;
      }
      
      // Add citation to make it look more realistic
      const responseParts = baseResponse.split('.');
      if (responseParts.length > 2) {
        const citationIndex = Math.floor(responseParts.length / 2);
        responseParts[citationIndex] += ` [${highestSimilarityChunk.title}]`;
      }
      
      return responseParts.join('.');
    } else {
      return "I don't have specific information about that in my knowledge base. Could you clarify your question or ask about vector databases, Pinecone, or how they work with language models?";
    }
  } catch (error) {
    console.error('Error generating response with OpenAI:', error);
    throw {
      message: 'Failed to generate a response.',
      status: 500
    } as ApiError;
  }
};

// Send a message to the API
export const sendMessage = async (message: string): Promise<ChatResponse> => {
  try {
    console.log(`Processing message with Pinecone index "${PINECONE_CONFIG.indexName}"`);
    
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    messageHistory.push(userMessage);
    
    // Step 1: Search for relevant documents in Pinecone (top 3 results with similarity >= 0.7)
    const retrievedChunks = await searchPinecone(message, 3, 0.7);
    
    // Step 2: Generate a response using OpenAI with the retrieved chunks and conversation context
    const answer = await generateResponseWithOpenAI(message, retrievedChunks, messageHistory);
    
    // Calculate confidence based on the highest similarity score from sources
    const highestSimilarity = retrievedChunks.length > 0 
      ? Math.max(...retrievedChunks.map(s => s.similarity))
      : 0.5;
    
    // Add assistant message to history
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
      sources: retrievedChunks,
      confidence: highestSimilarity
    };
    messageHistory.push(assistantMessage);
    
    // Return the response
    return {
      answer,
      confidence: highestSimilarity,
      sources: retrievedChunks,
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
