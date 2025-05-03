
import { ChatMessage, ChatResponse, ApiError } from '@/types';
import { searchPinecone } from './pineconeService';
import { generateResponseWithOpenAI } from './openaiService';
import { getConversationHistory, addMessageToHistory, resetConversation, getConversationId } from './conversationService';
import { toast } from 'sonner';

// Send a message directly to RAG system
export const sendMessage = async (message: string): Promise<ChatResponse> => {
  try {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    addMessageToHistory(userMessage);
    
    // Step 1: Search for relevant documents in Pinecone (top 5 results with similarity >= 0.35)
    // Add a try/catch block specifically for the Pinecone search to prevent complete failure
    let retrievedChunks = [];
    try {
      retrievedChunks = await searchPinecone(message, 5, 0.35);
      console.log(`Retrieved ${retrievedChunks.length} chunks from Pinecone`);
    } catch (error: any) {
      console.error('Error in Pinecone search, continuing with empty sources:', error);
      toast.error("Source Retrieval Issue", {
        description: "Unable to retrieve sources from Pinecone, but continuing with the conversation.",
        duration: 5000,
      });
      // Continue with empty sources rather than failing completely
      retrievedChunks = [];
    }
    
    // Step 2: Generate a response using OpenAI with the retrieved chunks and conversation context
    const answer = await generateResponseWithOpenAI(message, retrievedChunks, getConversationHistory());
    
    // Calculate confidence based on the highest similarity score from sources or default to 0.5
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
    addMessageToHistory(assistantMessage);
    
    // Return the response
    return {
      answer,
      confidence: highestSimilarity,
      sources: retrievedChunks,
      conversationId: getConversationId()
    };
  } catch (error: any) {
    console.error('Error in sendMessage:', error);
    throw {
      message: error.message || 'Failed to send message. Please try again.',
      status: error.status || 500
    } as ApiError;
  }
};

// Re-export functions from conversationService for ease of use
export { getConversationHistory, resetConversation };
