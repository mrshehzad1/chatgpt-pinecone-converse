
import { PINECONE_CONFIG, getSanitizedPineconeApiKey, getPineconeHostUrl, testPineconeConnection } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';
import { toast } from 'sonner';

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // First test the connection to Pinecone
    const testResult = await testPineconeConnection();
    if (!testResult.success) {
      console.error('Pinecone connection test failed:', testResult.message);
      toast.error("Pinecone Connection Failed", {
        description: testResult.message,
        duration: 10000,
      });
      throw new Error(`Pinecone connection failed: ${testResult.message}`);
    }
    
    // Convert query to embedding
    const embedding = await queryToEmbedding(query);
    
    // Get sanitized API key with ALL whitespace removed - CRITICAL for authorization
    const apiKey = getSanitizedPineconeApiKey();
    console.log('Using Pinecone API key:', `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`);
    
    // Get the host URL
    const host = getPineconeHostUrl();
    const queryUrl = `${host}/query`;
    console.log(`Making request to Pinecone at: ${queryUrl}`);
    
    // Prepare request body following the official Pinecone format from the example
    const requestBody: any = {
      vector: embedding,
      topK: topK,
      includeMetadata: true,
      includeValues: false
    };
    
    // Add namespace only if it exists and isn't empty
    if (PINECONE_CONFIG.namespace && PINECONE_CONFIG.namespace.trim() !== '') {
      requestBody.namespace = PINECONE_CONFIG.namespace.trim();
    }
    
    // Log request info (without actual API key)
    console.log('Request body structure:', JSON.stringify({
      vector: "[embedding vector]", 
      topK, 
      includeMetadata: true,
      includeValues: false,
      namespace: PINECONE_CONFIG.namespace || undefined
    }));
    
    // Make the query request with proper headers - using exact same format as the working example
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey, // Use EXACTLY 'Api-Key' as header name (case sensitive)
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });
    
    // Handle errors
    if (!response.ok) {
      console.error('Pinecone error response status:', response.status, response.statusText);
      
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error('Pinecone error response body:', errorBody);
      } catch (e) {
        console.error('Could not read error response body');
      }
      
      // Handle 401 Unauthorized error specifically
      if (response.status === 401) {
        const errorMessage = 'Pinecone authorization failed: Invalid API key or permissions';
        console.error(errorMessage);
        
        // Show detailed toast with helpful instructions
        toast.error("Pinecone Authorization Failed", {
          description: "Double check that your API key is correct, hasn't expired, and has query permissions for this index. Make sure it has no extra spaces or invisible characters.",
          duration: 10000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Try to parse error response
      let errorMessage = `Pinecone API error: ${response.status} ${response.statusText}`;
      try {
        // Only try to parse as JSON if the response looks like JSON
        if (errorBody.trim().startsWith('{')) {
          const errorData = JSON.parse(errorBody);
          console.error('Pinecone API error data:', errorData);
          if (errorData && errorData.message) {
            errorMessage = `Pinecone API error: ${errorData.message}`;
          }
        }
      } catch (parseError) {
        // If we can't parse JSON, log and continue with the status error
        console.error('Could not parse error response as JSON:', parseError);
      }
      
      toast.error("Pinecone API Error", {
        description: errorMessage,
        duration: 8000,
      });
      
      throw new Error(errorMessage);
    }
    
    // Parse and return successful response
    const data = await response.json();
    console.log('Pinecone response matches count:', data.matches?.length || 0);
    
    // Transform Pinecone results into Source objects - using same format as example
    if (!data.matches || !Array.isArray(data.matches)) {
      console.warn('Unexpected Pinecone response format:', data);
      return [];
    }
    
    const results: Source[] = data.matches
      .filter((match: any) => match.score >= similarityThreshold)
      .map((match: any) => ({
        id: match.id,
        title: match.metadata?.category || match.metadata?.title || 'Document ' + match.id.substring(0, 8),
        content: match.metadata?.chunk_text || match.metadata?.text || match.metadata?.content || 'No content available',
        similarity: match.score,
        url: match.metadata?.url || null
      }));
    
    console.log(`Found ${results.length} relevant results above threshold ${similarityThreshold}`);
    return results;
      
  } catch (error: any) {
    console.error('Error searching Pinecone:', error);
    
    toast.error("Pinecone Search Error", {
      description: error.message || "Failed to search vector database",
      duration: 8000,
    });
    
    throw {
      message: `Failed to search vector database: ${error.message}`,
      status: error.status || 500
    } as ApiError;
  }
};
