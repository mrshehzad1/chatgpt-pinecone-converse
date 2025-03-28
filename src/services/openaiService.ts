
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
        context += `Document ${i+1} (Similarity: ${Math.round(chunk.similarity * 100)}%): ${chunk.content}\n\n`;
      });
    } else {
      context = "No relevant documents were found in the knowledge base for this query.";
    }
    
    console.log("Context length:", context.length);
    
    // Prepare conversation history
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant that answers questions based on the provided context. 
                  IMPORTANT: Even if the context doesn't seem directly relevant, try to extract useful information and answer the query as best you can.
                  If the context contains partial information, use it to provide a partial answer.
                  Only state that you don't have information if the context is completely unrelated or empty.
                  Be concise but informative in your answers. Always tell what you do know based on the context.`
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

    console.log("Sending request to OpenAI with messages:", JSON.stringify(messages.map(m => ({ role: m.role, contentLength: m.content.length }))));

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
