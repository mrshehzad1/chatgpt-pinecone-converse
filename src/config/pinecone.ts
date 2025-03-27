
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
    // CRITICAL: Remove ALL whitespace, newlines, and invisible characters from API key
    // This handles all possible whitespace characters in Unicode
    const cleanKey = config.apiKey.replace(/\s+/g, '').trim();
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

// Export a function to get a sanitized API key - All whitespace and invisible characters removed
export const getSanitizedPineconeApiKey = (): string => {
  const apiKey = PINECONE_CONFIG.apiKey || '';
  // Remove ANY whitespace or invisible characters that could cause auth failures
  return apiKey.replace(/\s+/g, '').trim();
};

// Get the full Pinecone host URL formatted according to Pinecone documentation
export const getPineconeHostUrl = (): string => {
  const { indexName, projectId, environment } = PINECONE_CONFIG;
  return `https://${indexName}-${projectId}.svc.${environment}.pinecone.io`;
};

// Add a function to test Pinecone connection with retry logic
export const testPineconeConnection = async (retries = 3, delay = 1000): Promise<{success: boolean; message: string; details?: any}> => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Verify we have the required configuration
      if (!isPineconeConfigValid()) {
        const error = getPineconeConfigError();
        return {
          success: false,
          message: error || 'Invalid Pinecone configuration',
        };
      }
      
      // Get sanitized API key with ALL whitespace removed
      const apiKey = getSanitizedPineconeApiKey();
      
      // Get the host URL
      const host = getPineconeHostUrl();
      const statsUrl = `${host}/describe_index_stats`;
      
      console.log(`Testing Pinecone connection to: ${statsUrl} (attempt ${attempt + 1}/${retries})`);
      
      // Make a describe index stats request to test connection
      const response = await fetch(statsUrl, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({}) // Empty body for describe_index_stats
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Pinecone connection test failed (attempt ${attempt + 1}):`, response.status, errorText);
        
        // If we have more retries, wait and try again
        if (attempt < retries - 1) {
          console.log(`Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          // Exponential backoff
          delay *= 2;
          continue;
        }
        
        return {
          success: false,
          message: `Connection failed: ${response.status} ${response.statusText}`,
          details: errorText
        };
      }
      
      const data = await response.json();
      console.log('Pinecone connection test succeeded:', data);
      
      return {
        success: true,
        message: 'Successfully connected to Pinecone',
        details: data
      };
    } catch (error: any) {
      console.error(`Pinecone connection test error (attempt ${attempt + 1}):`, error);
      
      // If we have more retries, wait and try again
      if (attempt < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 2;
        continue;
      }
      
      return {
        success: false,
        message: `Connection error: ${error.message}`,
        details: error
      };
    }
  }
  
  // This should never be reached but TypeScript requires a return
  return {
    success: false,
    message: `Failed to connect after ${retries} attempts`,
  };
};
