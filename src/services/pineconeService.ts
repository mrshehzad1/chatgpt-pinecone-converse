
import { PINECONE_CONFIG } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';
import { toast } from 'sonner';

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // Validate Pinecone configuration
    if (!PINECONE_CONFIG.apiKey || PINECONE_CONFIG.apiKey.trim() === '') {
      const error = new Error('Pinecone API key is missing. Please configure it in settings.');
      console.error(error);
      toast.error("Pinecone API key is missing", {
        description: "Please configure it in settings."
      });
      throw error;
    }
    
    if (!PINECONE_CONFIG.indexName || !PINECONE_CONFIG.projectId) {
      const error = new Error('Pinecone index name or project ID is missing. Please configure in settings.');
      console.error(error);
      toast.error("Pinecone configuration incomplete", {
        description: "Index name or project ID is missing."
      });
      throw error;
    }
    
    // Convert query to embedding
    const embedding = await queryToEmbedding(query);
    
    // Clean and prepare API key
    const apiKey = PINECONE_CONFIG.apiKey.trim();
    
    // Prepare the request to Pinecone
    const url = `https://${PINECONE_CONFIG.indexName}-${PINECONE_CONFIG.projectId}.svc.${PINECONE_CONFIG.environment}.pinecone.io/query`;
    console.log(`Making request to Pinecone at: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: embedding,
        topK: topK,
        includeMetadata: true,
        includeValues: false,
        namespace: PINECONE_CONFIG.namespace ? PINECONE_CONFIG.namespace.trim() : ''
      }),
    });
    
    if (!response.ok) {
      let errorMessage = `Pinecone API error: ${response.status} ${response.statusText}`;
      
      // Handle 401 Unauthorized error specifically
      if (response.status === 401) {
        errorMessage = 'Pinecone authorization failed: Invalid API key or permissions';
        console.error(errorMessage);
        toast.error("Pinecone authorization failed", {
          description: "Invalid API key or permissions. Please check your API key in settings."
        });
        throw new Error(errorMessage);
      }
      
      // Try to parse error if possible
      try {
        const errorData = await response.json();
        console.error('Pinecone API error:', errorData);
        if (errorData.message) {
          errorMessage = `Pinecone API error: ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse JSON, use the text response if available
        try {
          const errorText = await response.text();
          errorMessage = `Pinecone API error: ${errorText}`;
        } catch (textError) {
          // Fallback to status
          console.error('Could not parse error response:', textError);
        }
      }
      
      toast.error("Pinecone API Error", {
        description: errorMessage
      });
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Pinecone response:', data);
    
    // Transform Pinecone results into Source objects
    if (!data.matches || !Array.isArray(data.matches)) {
      console.warn('Unexpected Pinecone response format:', data);
      return [];
    }
    
    const results: Source[] = data.matches
      .filter((match: any) => match.score >= similarityThreshold)
      .map((match: any) => ({
        id: match.id,
        title: match.metadata?.title || 'Document ' + match.id.substring(0, 8),
        content: match.metadata?.content || match.metadata?.text || 'No content available',
        similarity: match.score,
        url: match.metadata?.url || null
      }));
    
    return results;
      
  } catch (error: any) {
    console.error('Error searching Pinecone:', error);
    
    // We'll use sonner toast instead of the older toast component
    toast.error("Pinecone Search Error", {
      description: error.message || "Failed to search vector database"
    });
    
    throw {
      message: `Failed to search vector database: ${error.message}`,
      status: error.status || 500
    } as ApiError;
  }
};
