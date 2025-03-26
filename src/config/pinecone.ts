
import { PineconeConfig } from '@/types';

// Pinecone configuration
export const PINECONE_CONFIG: PineconeConfig = {
  apiKey: localStorage.getItem('pinecone_api_key') || 'pcsk_5QU8c8_EmQCUdUQgJqD38Q42fYHygQrHtzjcVFDUvjHQcQHDpJGzqyUirbFp3mDapvwKEr',
  environment: localStorage.getItem('pinecone_environment') || 'gcp-starter',
  indexName: localStorage.getItem('pinecone_index_name') || 'darren-n8n',
  projectId: localStorage.getItem('pinecone_project_id') || '',
  namespace: localStorage.getItem('pinecone_namespace') || ''
};

export const setPineconeConfig = (config: Partial<PineconeConfig>): void => {
  if (config.apiKey) {
    localStorage.setItem('pinecone_api_key', config.apiKey);
    PINECONE_CONFIG.apiKey = config.apiKey;
  }
  if (config.environment) {
    localStorage.setItem('pinecone_environment', config.environment);
    PINECONE_CONFIG.environment = config.environment;
  }
  if (config.indexName) {
    localStorage.setItem('pinecone_index_name', config.indexName);
    PINECONE_CONFIG.indexName = config.indexName;
  }
  if (config.projectId) {
    localStorage.setItem('pinecone_project_id', config.projectId);
    PINECONE_CONFIG.projectId = config.projectId;
  }
  if (config.namespace) {
    localStorage.setItem('pinecone_namespace', config.namespace);
    PINECONE_CONFIG.namespace = config.namespace;
  }
};
