
import { PineconeConfig } from '@/types';

// Pinecone configuration with the provided credentials
export const PINECONE_CONFIG: PineconeConfig = {
  apiKey: 'pcsk_5QU8c8_EmQCUdUQgJqD38Q42fYHygQrHtzjcVFDUvjHQcQHDpJGzqyUirbFp3mDapvwKEr',
  environment: 'gcp-starter',  // Default environment, will be updated if needed
  indexName: 'darren-n8n'
};

// API endpoint for chat requests
export const API_ENDPOINT = '/api/chat';
