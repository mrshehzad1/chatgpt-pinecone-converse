
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
    
    // Use a proxy approach for production environments
    let queryUrl;
    const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
    
    if (isVercel) {
      // If on Vercel, use the Pinecone API as an intermediary to avoid CORS
      // This makes the request to api.pinecone.io which properly handles CORS
      queryUrl = `https://api.pinecone.io/vectors/query`;
      console.log(`Using proxy approach for Vercel deployment with url: ${queryUrl}`);
    } else {
      // For local development, continue using the direct host URL
      queryUrl = `https://${host}/query`;
      console.log(`Making direct request to Pinecone at: ${queryUrl}`);
    }
    
    // Prepare request body following the official Pinecone format
    const requestBody: any = {
      vector: embedding,
      topK: topK,
      includeMetadata: true,
      includeValues: false
    };
    
    // For Vercel proxy approach, add additional parameters
    if (isVercel) {
      requestBody.indexName = PINECONE_CONFIG.indexName;
    }
    
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
      namespace: PINECONE_CONFIG.namespace || undefined,
      indexName: isVercel ? PINECONE_CONFIG.indexName : undefined
    }));
    
    // Make the query request with proper headers
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      mode: 'cors',
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
        
        toast.error("Pinecone Authorization Failed", {
          description: "Double check that your API key is correct, hasn't expired, and has query permissions for this index.",
          duration: 10000,
        });
        
        throw new Error(errorMessage);
      }
      
      // Try to parse error response
      let errorMessage = `Pinecone API error: ${response.status} ${response.statusText}`;
      try {
        if (errorBody.trim().startsWith('{')) {
          const errorData = JSON.parse(errorBody);
          console.error('Pinecone API error data:', errorData);
          if (errorData && errorData.message) {
            errorMessage = `Pinecone API error: ${errorData.message}`;
          }
        }
      } catch (parseError) {
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
      .map((match: any) => ({
        id: match.id,
        title: match.metadata?.category || match.metadata?.title || 'Document ' + match.id.substring(0, 8),
        content: match.metadata?.chunk_text || match.metadata?.text || match.metadata?.content || 'No content available',
        similarity: match.score,
        url: match.metadata?.url || null,
        metadata: match.metadata || {}
      }));
    
    console.log(`Found ${results.length} results from Pinecone, scores:`, results.map(r => r.similarity));
    
    // Return at least one result even if below threshold
    if (results.length === 0 && data.matches && data.matches.length > 0) {
      console.log('No results above threshold, but returning the best match anyway');
      const bestMatch = data.matches[0];
      return [{
        id: bestMatch.id,
        title: bestMatch.metadata?.category || bestMatch.metadata?.title || 'Document ' + bestMatch.id.substring(0, 8),
        content: bestMatch.metadata?.chunk_text || bestMatch.metadata?.text || bestMatch.metadata?.content || 'No content available',
        similarity: bestMatch.score,
        url: bestMatch.metadata?.url || null,
        metadata: bestMatch.metadata || {}
      }];
    }
    
    return results;
      
  } catch (error: any) {
    console.error('Error searching Pinecone:', error);
    
    toast.error("Pinecone Search Error", {
      description: error.message || "Failed to search vector database",
      duration: 8000,
    });
    
    // Return an empty array instead of throwing
    return [];
  }
};
