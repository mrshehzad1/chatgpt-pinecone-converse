import { PineconeConfig } from '@/types';

// Helper function to safely get and trim localStorage values
const getLocalStorageItem = (key: string, defaultValue: string = ''): string => {
  try {
    const value = localStorage.getItem(key);
    return value ? value.trim() : defaultValue;
  } catch (error) {
    console.error(`Error accessing localStorage for ${key}:`, error);
    return defaultValue;
  }
};

// Pinecone configuration
export const PINECONE_CONFIG: PineconeConfig = {
  apiKey: getLocalStorageItem('pinecone_api_key'),
  environment: getLocalStorageItem('pinecone_environment', 'gcp-starter'),
  indexName: getLocalStorageItem('pinecone_index_name'),
  projectId: getLocalStorageItem('pinecone_project_id'),
  namespace: getLocalStorageItem('pinecone_namespace')
};

export const setPineconeConfig = (config: Partial<PineconeConfig>): void => {
  if (config.apiKey !== undefined) {
    // IMPORTANT: Remove ALL whitespace from API key
    const cleanKey = config.apiKey.replace(/\s+/g, '');
    localStorage.setItem('pinecone_api_key', cleanKey);
    PINECONE_CONFIG.apiKey = cleanKey;
    console.log('Pinecone API key set:', `${cleanKey.substring(0, 5)}...${cleanKey.substring(cleanKey.length - 3)}`);
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
  const apiKey = PINECONE_CONFIG.apiKey?.trim() || '';
  const indexName = PINECONE_CONFIG.indexName?.trim() || '';
  const projectId = PINECONE_CONFIG.projectId?.trim() || '';
  
  return (
    apiKey !== '' && 
    indexName !== '' && 
    projectId !== ''
  );
};

// Get a helpful error message if config is invalid
export const getPineconeConfigError = (): string | null => {
  const apiKey = PINECONE_CONFIG.apiKey?.trim() || '';
  const indexName = PINECONE_CONFIG.indexName?.trim() || '';
  const projectId = PINECONE_CONFIG.projectId?.trim() || '';
  
  if (apiKey === '') {
    return 'Pinecone API key is missing. Please configure it in settings.';
  }
  if (indexName === '') {
    return 'Pinecone index name is missing. Please configure it in settings.';
  }
  if (projectId === '') {
    return 'Pinecone project ID is missing. Please configure it in settings.';
  }
  return null;
};

// Export a function to get a sanitized API key - All whitespace removed
export const getSanitizedPineconeApiKey = (): string => {
  const apiKey = PINECONE_CONFIG.apiKey || '';
  // Remove ANY whitespace or invisible characters
  return apiKey.replace(/\s+/g, '');
};

// Get the full Pinecone host URL
export const getPineconeHostUrl = (): string => {
  const { indexName, projectId, environment } = PINECONE_CONFIG;
  return `https://${indexName}-${projectId}.svc.${environment}.pinecone.io`;
};
