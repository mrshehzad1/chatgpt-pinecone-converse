
import { PineconeConfig } from '@/types';
import { toast } from 'sonner';

// Helper function to safely get and trim localStorage values with browser check
const getLocalStorageItem = (key: string, defaultValue: string = ''): string => {
  try {
    // Check if we're in a browser environment first
    if (typeof window !== 'undefined' && window.localStorage) {
      const value = localStorage.getItem(key);
      return value ? value.trim() : defaultValue;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error accessing localStorage for ${key}:`, error);
    return defaultValue;
  }
};

// Initialize with empty values first, then populate in useEffect
export const PINECONE_CONFIG: PineconeConfig = {
  apiKey: getLocalStorageItem('pinecone_api_key'),
  environment: getLocalStorageItem('pinecone_environment', 'gcp-starter'),
  indexName: getLocalStorageItem('pinecone_index_name'),
  projectId: getLocalStorageItem('pinecone_project_id'),
  namespace: getLocalStorageItem('pinecone_namespace')
};

// Log the initialization (without revealing full API key)
console.log('Pinecone config initialized:', { 
  apiKeyPresent: !!PINECONE_CONFIG.apiKey, 
  environment: PINECONE_CONFIG.environment,
  indexName: PINECONE_CONFIG.indexName,
  projectId: PINECONE_CONFIG.projectId,
  namespace: PINECONE_CONFIG.namespace || 'Not set'
});

export const setPineconeConfig = (config: Partial<PineconeConfig>): void => {
  try {
    // Check if we're in a browser environment first
    if (typeof window === 'undefined' || !window.localStorage) {
      console.error('Attempted to set Pinecone config outside of browser environment');
      return;
    }
    
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
  } catch (error) {
    console.error('Error setting Pinecone config:', error);
    toast.error('Failed to save settings', {
      description: 'There was an error saving your Pinecone settings',
      duration: 5000,
    });
  }
};

// Validate Pinecone configuration
export const isPineconeConfigValid = (): boolean => {
  const apiKey = PINECONE_CONFIG.apiKey?.trim() || '';
  const indexName = PINECONE_CONFIG.indexName?.trim() || '';
  
  return (
    apiKey !== '' && 
    indexName !== ''
  );
};

// Get a helpful error message if config is invalid
export const getPineconeConfigError = (): string | null => {
  const apiKey = PINECONE_CONFIG.apiKey?.trim() || '';
  const indexName = PINECONE_CONFIG.indexName?.trim() || '';
  
  if (apiKey === '') {
    return 'Pinecone API key is missing. Please configure it in settings.';
  }
  if (indexName === '') {
    return 'Pinecone index name is missing. Please configure it in settings.';
  }
  return null;
};

// Export a function to get a sanitized API key - All whitespace and invisible characters removed
export const getSanitizedPineconeApiKey = (): string => {
  const apiKey = PINECONE_CONFIG.apiKey || '';
  // Remove ANY whitespace or invisible characters that could cause auth failures
  return apiKey.replace(/\s+/g, '').trim();
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
      
      console.log(`Testing Pinecone connection (attempt ${attempt + 1}/${retries})`);
      
      // Check if we're running in Vercel environment and need to use a proxy
      const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
      let response;
      
      if (isVercel) {
        // Use a proxy endpoint for Vercel environment
        console.log('Using Vercel-compatible proxy for connection test');
        response = await fetch(`/api/pinecone-describe?index=${PINECONE_CONFIG.indexName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ apiKey })
        });
      } else {
        // Use direct API call for local development
        console.log('Using direct API call for connection test');
        response = await fetch(`https://api.pinecone.io/indexes/${PINECONE_CONFIG.indexName}`, {
          method: 'GET',
          headers: {
            'Api-Key': apiKey,
            'Accept': 'application/json'
          }
        });
      }
      
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
      
      // Validate that the host field exists in the response
      if (!data.host) {
        return {
          success: false,
          message: 'Pinecone API response did not include host information',
          details: data
        };
      }
      
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
