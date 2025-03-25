
import { ChatMessage, Source } from '@/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate response using OpenAI with retrieved content
export const generateResponseWithOpenAI = async (query: string, chunks: Source[], conversationContext: ChatMessage[]): Promise<string> => {
  console.log(`Generating OpenAI response for query: "${query}" with ${chunks.length} chunks`);
  
  try {
    // Simulate OpenAI processing time
    await delay(1500);
    
    // If no chunks found, return a fallback response
    if (chunks.length === 0) {
      return `I couldn't find any relevant information about "${query}" in the knowledge base. Could you please rephrase your question or ask about something related to n8n automation workflows?`;
    }
    
    // Generate a contextual response based on the retrieved chunks
    const topicMentions = new Set<string>();
    let mainPoints = '';
    
    // Extract key information from chunks
    chunks.forEach((chunk, i) => {
      const content = chunk.content;
      const similarity = Math.round(chunk.similarity * 100);
      
      // Extract potential topics from content
      const words = content.split(' ');
      for (let j = 0; j < words.length; j++) {
        if (words[j].length > 4 && /^[A-Za-z]+$/.test(words[j])) {
          topicMentions.add(words[j].toLowerCase());
        }
      }
      
      // Add the key point from this chunk
      const sentences = content.split('.');
      if (sentences.length > 0) {
        const relevantSentence = sentences[0];
        mainPoints += `• ${relevantSentence}.\n`;
      }
    });
    
    // Format response to include information from the chunks
    let response = `Based on the documents in the n8n knowledge base, I can tell you that:\n\n${mainPoints}\n`;
    
    // Add a contextual follow-up based on the query
    if (query.toLowerCase().includes('how') || query.toLowerCase().includes('?')) {
      response += `\nWould you like me to provide more specific details about any part of this information?`;
    } else if (query.toLowerCase().includes('example') || query.toLowerCase().includes('workflow')) {
      response += `\nI can provide examples of workflows if you're interested in seeing how this works in practice.`;
    } else {
      response += `\nDo you have any specific questions about this information or would you like to know more about another aspect of n8n?`;
    }
    
    return response;
  } catch (error) {
    console.error('Error generating response with OpenAI:', error);
    throw {
      message: 'Failed to generate a response.',
      status: 500
    };
  }
};
