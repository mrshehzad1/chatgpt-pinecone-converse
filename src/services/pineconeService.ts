
import { PINECONE_CONFIG } from '@/config/pinecone';
import { ApiError, Source } from '@/types';
import { queryToEmbedding } from './embeddingService';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Search Pinecone index for similar documents
export const searchPinecone = async (query: string, topK: number = 3, similarityThreshold: number = 0.7): Promise<Source[]> => {
  console.log(`Searching Pinecone index "${PINECONE_CONFIG.indexName}" for: ${query}`);
  
  try {
    // Convert query to embedding
    const embedding = await queryToEmbedding(query);
    
    // Simulate Pinecone search latency
    await delay(1000);
    
    // Generate dynamic mock results based on the query
    const mockResults: Source[] = [];
    const topics = ['workflow automation', 'integration', 'API', 'n8n', 'automation', 'data', 'trigger', 'action'];
    
    // Find potentially relevant topics in the query
    const relevantTopics = topics.filter(topic => 
      query.toLowerCase().includes(topic.toLowerCase())
    );
    
    // If no relevant topics found, use random ones to simulate semantic search
    const topicsToUse = relevantTopics.length > 0 ? relevantTopics : 
      topics.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    // Generate mock results with varying similarity based on query relevance
    for (let i = 0; i < 5; i++) {
      // Higher similarity for results mentioning topics from the query
      const topicFactor = topicsToUse.length > 0 ? 0.05 : 0;
      const similarity = Math.min(0.95 - (i * 0.07) + topicFactor, 0.97);
      
      if (similarity >= similarityThreshold) {
        // Generate content that includes the actual query terms to make it more realistic
        const topicMention = topicsToUse[i % topicsToUse.length] || '';
        const queryTerms = query.split(' ').filter(term => term.length > 3);
        const queryMention = queryTerms.length > 0 ? queryTerms[i % queryTerms.length] : '';
        
        mockResults.push({
          id: `doc-${i}-${Date.now()}`,
          title: `Document about ${topicMention || 'n8n'} ${i+1}`,
          content: `This document explains how to use ${topicMention || 'n8n'} for workflow automation. ${
            queryMention ? `It specifically covers ${queryMention} in detail.` : ''
          } You can create complex workflows connecting various services and APIs.`,
          similarity: similarity,
          url: `https://docs.n8n.io/example-${i+1}`
        });
      }
    }
    
    // Return sorted results (highest similarity first), limited by topK
    return mockResults.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
      
  } catch (error) {
    console.error('Error searching Pinecone:', error);
    throw {
      message: 'Failed to search vector database.',
      status: 500
    } as ApiError;
  }
};
