
import { PINECONE_CONFIG, getSanitizedPineconeApiKey, testPineconeConnection } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';
import { toast } from 'sonner';

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.35): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // First test the connection to Pinecone with retry logic
    const testResult = await testPineconeConnection(3, 1000);
    if (!testResult.success) {
      console.error('Pinecone connection test failed:', testResult.message, testResult.details);
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
    
    // Get the host from the describe index result
    const indexInfo = testResult.details;
    if (!indexInfo || !indexInfo.host) {
      throw new Error('Could not get Pinecone index host information');
    }
    
    // Use the actual host from describe index response
    const host = indexInfo.host;
    
    // Check if we're running in Vercel production environment
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    console.log(`Environment detection - Running on Vercel: ${isVercel}`);
    
    let queryUrl;
    // For Vercel environments, add CORS headers via a proxy setup
    if (isVercel) {
      // Use a CORS proxy specifically for production environments
      queryUrl = `/api/pinecone-proxy?host=${encodeURIComponent(host)}`;
      console.log(`Using Vercel-compatible proxy URL: ${queryUrl}`);
    } else {
      queryUrl = `https://${host}/query`;
      console.log(`Making direct request to Pinecone at: ${queryUrl}`);
    }
    
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
    
    // Prepare headers for the request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Only add Api-Key header for direct requests (not for proxy requests)
    if (!isVercel) {
      headers['Api-Key'] = apiKey;
    }
    
    // Make the query request with proper headers
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(isVercel ? { 
        pineconeBody: requestBody,
        apiKey: apiKey  // Pass API key in request body for proxy
      } : requestBody),
    };
    
    // Add credentials for CORS if in browser environment
    if (typeof window !== 'undefined') {
      fetchOptions.credentials = 'same-origin';
    }
    
    // Log the request attempt
    console.log(`Attempting ${isVercel ? 'proxied' : 'direct'} request to Pinecone`);
    
    const response = await fetch(queryUrl, fetchOptions);
    
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
        
        toast.error("Pinecone Authorization Failed", {
          description: "Double check that your API key is correct, hasn't expired, and has query permissions for this index. Make sure it has no extra spaces or invisible characters.",
          duration: 10000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Handle CORS errors specially
      if (errorBody.includes('CORS') || errorBody.includes('cors')) {
        console.error('CORS error detected in Pinecone response');
        toast.error("CORS Error", {
          description: "The application can't access Pinecone directly due to CORS restrictions. Consider setting up a proxy on your server.",
          duration: 10000,
        });
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
    
    // Map the results to Source objects
    const results: Source[] = data.matches
      .map((match: any) => ({
        id: match.id,
        title: match.metadata?.category || match.metadata?.title || 'Document ' + match.id.substring(0, 8),
        content: match.metadata?.chunk_text || match.metadata?.text || match.metadata?.content || 'No content available',
        similarity: match.score,
        url: match.metadata?.url || null,
        metadata: match.metadata || {} // Include the full metadata object
      }));
    
    console.log(`Found ${results.length} results from Pinecone, returning all regardless of score threshold`);
    
    // Return at least some results even if they are below threshold
    if (results.length === 0 && data.matches && data.matches.length > 0) {
      console.log('No results above threshold, but returning the best match anyway');
      const bestMatch = data.matches[0];
      return [{
        id: bestMatch.id,
        title: bestMatch.metadata?.category || bestMatch.metadata?.title || 'Document ' + bestMatch.id.substring(0, 8),
        content: bestMatch.metadata?.chunk_text || bestMatch.metadata?.text || bestMatch.metadata?.content || 'No content available',
        similarity: bestMatch.score,
        url: bestMatch.metadata?.url || null,
        metadata: bestMatch.metadata || {} // Include the full metadata object
      }];
    }
    
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
