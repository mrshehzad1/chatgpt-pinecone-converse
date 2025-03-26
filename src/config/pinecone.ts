
import { PineconeConfig } from '@/types';

// Pinecone configuration
export const PINECONE_CONFIG: PineconeConfig = {
  apiKey: localStorage.getItem('pinecone_api_key')?.trim() || '',
  environment: localStorage.getItem('pinecone_environment')?.trim() || 'gcp-starter',
  indexName: localStorage.getItem('pinecone_index_name')?.trim() || '',
  projectId: localStorage.getItem('pinecone_project_id')?.trim() || '',
  namespace: localStorage.getItem('pinecone_namespace')?.trim() || ''
};

export const setPineconeConfig = (config: Partial<PineconeConfig>): void => {
  if (config.apiKey !== undefined) {
    const trimmedKey = config.apiKey.trim();
    localStorage.setItem('pinecone_api_key', trimmedKey);
    PINECONE_CONFIG.apiKey = trimmedKey;
  }
  if (config.environment !== undefined) {
    const trimmedEnv = config.environment.trim();
    localStorage.setItem('pinecone_environment', trimmedEnv);
    PINECONE_CONFIG.environment = trimmedEnv;
  }
  if (config.indexName !== undefined) {
    const trimmedIndex = config.indexName.trim();
    localStorage.setItem('pinecone_index_name', trimmedIndex);
    PINECONE_CONFIG.indexName = trimmedIndex;
  }
  if (config.projectId !== undefined) {
    const trimmedProject = config.projectId.trim();
    localStorage.setItem('pinecone_project_id', trimmedProject);
    PINECONE_CONFIG.projectId = trimmedProject;
  }
  if (config.namespace !== undefined) {
    const trimmedNamespace = config.namespace.trim();
    localStorage.setItem('pinecone_namespace', trimmedNamespace);
    PINECONE_CONFIG.namespace = trimmedNamespace;
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
