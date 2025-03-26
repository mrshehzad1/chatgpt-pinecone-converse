
import { OPENAI_CONFIG } from '@/config/openai';
import { ChatMessage, Source, ApiError } from '@/types';

export const generateResponseWithOpenAI = async (query: string, chunks: Source[], conversationContext: ChatMessage[]): Promise<string> => {
  console.log(`Generating OpenAI response for query: "${query}" with ${chunks.length} chunks`);
  
  try {
    // Prepare context from retrieved chunks
    let context = '';
    if (chunks.length > 0) {
      context = "Here are some relevant documents to help answer the query:\n\n";
      chunks.forEach((chunk, i) => {
        context += `Document ${i+1}: ${chunk.content}\n\n`;
      });
    } else {
      context = "No relevant documents were found in the knowledge base for this query.";
    }
    
    // Prepare conversation history
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the provided context. 
                  If the context doesn't contain relevant information to answer the question, 
                  acknowledge that and suggest that the user ask a different question. 
                  Don't make up information that isn't in the context.`
      },
      {
        role: "user",
        content: `Context: ${context}\n\nQuery: ${query}`
      }
    ];
    
    // Add recent conversation history (last 5 messages)
    const recentMessages = conversationContext
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .slice(-5);
    
    // Insert recent messages before the current query
    if (recentMessages.length > 0) {
      recentMessages.forEach(msg => {
        messages.splice(1, 0, {
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Make request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.5,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error generating response with OpenAI:', error);
    throw {
      message: `Failed to generate a response: ${error.message}`,
      status: 500
    } as ApiError;
  }
};
