
import { OPENAI_CONFIG } from '@/config/openai';
import { ApiError } from '@/types';
import { toast } from 'sonner';

export const queryToEmbedding = async (query: string): Promise<number[]> => {
  console.log(`Converting query to embedding: ${query}`);
  
  try {
    // First check if we have an OpenAI API key
    if (!OPENAI_CONFIG.apiKey || OPENAI_CONFIG.apiKey.trim() === '') {
      const errorMessage = 'OpenAI API key is missing or invalid';
      toast.error("OpenAI API Key Required", {
        description: "Please configure your OpenAI API key in the settings",
        duration: 8000,
      });
      throw new Error(errorMessage);
    }
    
    // Make request to OpenAI - matching the working example format
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_CONFIG.apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small', // Using newer model as in the example
        input: query
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      const errorMessage = errorData?.error?.message || `OpenAI API error: ${response.status} ${response.statusText}`;
      toast.error("OpenAI API Error", {
        description: errorMessage,
        duration: 8000,
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data?.data?.[0]?.embedding) {
      throw new Error('Invalid response from OpenAI: embedding is missing');
    }
    
    return data.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error);
    
    // Only show toast if not already shown above
    if (!error.message.includes('API key is missing')) {
      toast.error("Embedding Generation Failed", {
        description: error.message || "Failed to convert query to vector embedding",
        duration: 8000,
      });
    }
    
    throw {
      message: `Failed to generate embedding: ${error.message}`,
      status: error.status || 500
    } as ApiError;
  }
};
