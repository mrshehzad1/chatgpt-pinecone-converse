
import { PINECONE_CONFIG, getSanitizedPineconeApiKey, getPineconeHostUrl } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';
import { toast } from 'sonner';

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // Validate Pinecone configuration
    if (!PINECONE_CONFIG.apiKey || PINECONE_CONFIG.apiKey.trim() === '') {
      throw new Error('Pinecone API key is missing. Please configure it in settings.');
    }
    
    if (!PINECONE_CONFIG.indexName || !PINECONE_CONFIG.projectId) {
      throw new Error('Pinecone index name or project ID is missing. Please configure in settings.');
    }
    
    // Convert query to embedding
    const embedding = await queryToEmbedding(query);
    
    // Get sanitized API key - MUST have no whitespace
    const apiKey = getSanitizedPineconeApiKey();
    console.log('Using Pinecone API key:', `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`);
    
    // Get the host URL
    const host = getPineconeHostUrl();
    const queryUrl = `${host}/query`;
    console.log(`Making request to Pinecone at: ${queryUrl}`);
    
    // Prepare request body - following the official Pinecone format
    const requestBody = {
      vector: embedding,
      topK: topK,
      includeMetadata: true,
      includeValues: false
    };
    
    // Add namespace only if it exists and isn't empty
    if (PINECONE_CONFIG.namespace && PINECONE_CONFIG.namespace.trim() !== '') {
      requestBody['namespace'] = PINECONE_CONFIG.namespace.trim();
    }
    
    // Log request info (without actual API key)
    console.log('Request body structure:', JSON.stringify({
      vector: "[embedding vector]", 
      topK, 
      includeMetadata: true,
      includeValues: false,
      namespace: PINECONE_CONFIG.namespace || undefined
    }));
    
    // Make the query request
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });
    
    // Handle errors
    if (!response.ok) {
      console.error('Pinecone error response status:', response.status, response.statusText);
      
      // Handle 401 Unauthorized error specifically
      if (response.status === 401) {
        const errorMessage = 'Pinecone authorization failed: Invalid API key or permissions';
        console.error(errorMessage);
        
        // Show detailed toast with helpful instructions
        toast.error("Pinecone Authorization Failed", {
          description: "Please check that your API key is correct, hasn't expired, and has query permissions for this index.",
          duration: 8000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Try to parse error response
      let errorMessage = `Pinecone API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('Pinecone API error data:', errorData);
        if (errorData && errorData.message) {
          errorMessage = `Pinecone API error: ${errorData.message}`;
        }
      } catch (parseError) {
        // If we can't parse JSON, log and continue with the status error
        console.error('Could not parse error response as JSON:', parseError);
      }
      
      toast.error("Pinecone API Error", {
        description: errorMessage,
        duration: 5000,
      });
      
      throw new Error(errorMessage);
    }
    
    // Parse and return successful response
    const data = await response.json();
    console.log('Pinecone response matches count:', data.matches?.length || 0);
    
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
        content: match.metadata?.content || match.metadata?.text || match.metadata?.chunk_text || 'No content available',
        similarity: match.score,
        url: match.metadata?.url || null
      }));
    
    console.log(`Found ${results.length} relevant results above threshold ${similarityThreshold}`);
    return results;
      
  } catch (error: any) {
    console.error('Error searching Pinecone:', error);
    
    toast.error("Pinecone Search Error", {
      description: error.message || "Failed to search vector database",
      duration: 6000,
    });
    
    throw {
      message: `Failed to search vector database: ${error.message}`,
      status: error.status || 500
    } as ApiError;
  }
};
