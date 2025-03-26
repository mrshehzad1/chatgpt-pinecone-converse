
import { PINECONE_CONFIG } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
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
      const errorData = await response.json();
      console.error('Pinecone API error:', errorData);
      throw new Error(`Pinecone API error: ${response.status} ${response.statusText}`);
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
    throw {
      message: `Failed to search vector database: ${error.message}`,
      status: 500
    } as ApiError;
  }
};
