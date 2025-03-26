
import { PINECONE_CONFIG } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';
import { toast } from '@/components/ui/use-toast';

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // Validate Pinecone configuration
    if (!PINECONE_CONFIG.apiKey) {
      throw new Error('Pinecone API key is missing. Please set it in the settings.');
    }
    
    if (!PINECONE_CONFIG.indexName || !PINECONE_CONFIG.projectId) {
      throw new Error('Pinecone index name or project ID is missing. Please configure in settings.');
    }
    
    // Convert query to embedding
    const embedding = await queryToEmbedding(query);
    
    // Prepare the request to Pinecone
    const url = `https://${PINECONE_CONFIG.indexName}-${PINECONE_CONFIG.projectId}.svc.${PINECONE_CONFIG.environment}.pinecone.io/query`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: embedding,
        topK: topK,
        includeMetadata: true,
        includeValues: false,
        namespace: PINECONE_CONFIG.namespace || ''
      }),
    });
    
    if (!response.ok) {
      // Handle 401 Unauthorized error specifically
      if (response.status === 401) {
        console.error('Pinecone authorization failed: Invalid API key or permissions');
        throw new Error('Pinecone authorization failed: Invalid API key or permissions');
      }
      
      // Try to parse error if possible
      let errorMessage = `Pinecone API error: ${response.status} ${response.statusText}`;
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
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Pinecone response:', data);
    
    // Transform Pinecone results into Source objects
    const results: Source[] = data.matches
      .filter((match: any) => match.score >= similarityThreshold)
      .map((match: any) => ({
        id: match.id,
        title: match.metadata.title || 'Document ' + match.id.substring(0, 8),
        content: match.metadata.content || match.metadata.text || 'No content available',
        similarity: match.score,
        url: match.metadata.url || null
      }));
    
    return results;
      
  } catch (error: any) {
    console.error('Error searching Pinecone:', error);
    
    // Display toast with error message
    toast({
      title: "Pinecone Search Error",
      description: error.message || "Failed to search vector database",
      variant: "destructive",
      duration: 5000,
    });
    
    throw {
      message: `Failed to search vector database: ${error.message}`,
      status: error.status || 500
    } as ApiError;
  }
};
