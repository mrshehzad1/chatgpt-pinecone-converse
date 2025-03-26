
import { OPENAI_CONFIG } from '@/config/openai';
import { ApiError } from '@/types';

export const queryToEmbedding = async (query: string): Promise<number[]> => {
  console.log(`Converting query to embedding: ${query}`);
  
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-ada-002'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    throw {
      message: `Failed to generate embedding: ${error.message}`,
      status: 500
    } as ApiError;
  }
};
