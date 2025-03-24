
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
    const embedding = await queryToEmbedding(query);
    
    // Step 2: In a real implementation, this would use the Pinecone JS SDK to query the vector database
    await delay(1000); // Simulate Pinecone search latency
    
    // For now, we'll simulate varied results based on the query to make it appear more realistic
    // In a real implementation, this would be the actual results from Pinecone
    const mockResults = [];
    
    // Generate 5 mock results with varying similarity scores
    for (let i = 0; i < 5; i++) {
      const similarity = 0.95 - (i * 0.05); // Simulate decreasing similarity scores
      
      if (similarity >= similarityThreshold) {
        mockResults.push({
          id: `result-${i}`,
          title: `Result ${i+1} for "${query}"`,
          content: `This is simulated content for the query "${query}". In a real implementation, this would be the actual content from your vector database.`,
          similarity: similarity,
          url: `https://example.com/result-${i}`
        });
      }
    }
    
    // Return top results limited by topK
    return mockResults.slice(0, topK);
      
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
    const context = chunks.map((chunk, index) => `Context ${index+1}: ${chunk.content}`).join('\n\n');
    
    console.log(`Using context:\n${context}`);
    
    // Create a simulated response based on the chunks and query
    if (chunks.length > 0) {
      const response = `Based on your query "${query}", I found the following information:\n\n`;
      
      // In a real implementation, this would be the actual response from OpenAI
      // For now, we'll create a simple response that references the chunks
      const chunkSummaries = chunks.map((chunk, index) => {
        return `Information source ${index+1} (${Math.round(chunk.similarity * 100)}% match): ${chunk.content}`;
      }).join('\n\n');
      
      return `${response}${chunkSummaries}\n\nIs there anything specific about this topic you'd like to know more about?`;
    } else {
      return `I couldn't find any relevant information for your query "${query}" in the vector database. Could you please rephrase your question or ask about something else?`;
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
