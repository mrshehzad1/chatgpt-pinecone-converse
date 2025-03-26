
import { PineconeConfig } from '@/types';

// Pinecone configuration
export const PINECONE_CONFIG: PineconeConfig = {
  apiKey: localStorage.getItem('pinecone_api_key') || '',
  environment: localStorage.getItem('pinecone_environment') || 'gcp-starter',
  indexName: localStorage.getItem('pinecone_index_name') || '',
  projectId: localStorage.getItem('pinecone_project_id') || '',
  namespace: localStorage.getItem('pinecone_namespace') || ''
};

export const setPineconeConfig = (config: Partial<PineconeConfig>): void => {
  if (config.apiKey !== undefined) {
    const trimmedKey = config.apiKey.trim();
    localStorage.setItem('pinecone_api_key', trimmedKey);
    PINECONE_CONFIG.apiKey = trimmedKey;
  }
  if (config.environment !== undefined) {
    localStorage.setItem('pinecone_environment', config.environment.trim());
    PINECONE_CONFIG.environment = config.environment.trim();
  }
  if (config.indexName !== undefined) {
    localStorage.setItem('pinecone_index_name', config.indexName.trim());
    PINECONE_CONFIG.indexName = config.indexName.trim();
  }
  if (config.projectId !== undefined) {
    localStorage.setItem('pinecone_project_id', config.projectId.trim());
    PINECONE_CONFIG.projectId = config.projectId.trim();
  }
  if (config.namespace !== undefined) {
    localStorage.setItem('pinecone_namespace', config.namespace.trim());
    PINECONE_CONFIG.namespace = config.namespace.trim();
  }
};

// Validate Pinecone configuration
export const isPineconeConfigValid = (): boolean => {
  return (
    !!PINECONE_CONFIG.apiKey &&
    !!PINECONE_CONFIG.indexName &&
    !!PINECONE_CONFIG.projectId
  );
};

// Get a helpful error message if config is invalid
export const getPineconeConfigError = (): string | null => {
  if (!PINECONE_CONFIG.apiKey) {
    return 'Pinecone API key is missing. Please configure it in settings.';
  }
  if (!PINECONE_CONFIG.indexName) {
    return 'Pinecone index name is missing. Please configure it in settings.';
  }
  if (!PINECONE_CONFIG.projectId) {
    return 'Pinecone project ID is missing. Please configure it in settings.';
  }
  return null;
};
