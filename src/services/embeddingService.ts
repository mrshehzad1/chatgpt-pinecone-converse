
// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate converting query to vector embedding
export const queryToEmbedding = async (query: string): Promise<number[]> => {
  console.log(`Converting query to embedding: ${query}`);
  await delay(300); // Simulate embedding generation time
  
  // In a real implementation, this would call OpenAI's embedding API
  // For simulation, we'll return a mock embedding
  return Array(1536).fill(0).map(() => Math.random() - 0.5);
};
