
export interface OpenAIConfig {
  apiKey: string;
}

// Helper function to safely get localStorage values
const getLocalStorageItem = (key: string, defaultValue: string = ''): string => {
  try {
    // Check if we're in a browser environment before accessing localStorage
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

// Safely initialize the OpenAI configuration
const getOpenAIApiKeyFromStorage = (): string => {
  try {
    return getLocalStorageItem('openai_api_key', '');
  } catch (error) {
    console.error('Error reading OpenAI API key from localStorage:', error);
    return '';
  }
};

// OpenAI configuration
export const OPENAI_CONFIG: OpenAIConfig = {
  apiKey: getOpenAIApiKeyFromStorage()
};

export const setOpenAIApiKey = (apiKey: string): void => {
  try {
    // Clean the API key and store it
    const cleanKey = apiKey.trim();
    localStorage.setItem('openai_api_key', cleanKey);
    OPENAI_CONFIG.apiKey = cleanKey;
    console.log('OpenAI API key set successfully');
  } catch (error) {
    console.error('Error saving OpenAI API key:', error);
  }
};

export const getOpenAIApiKey = (): string => {
  return OPENAI_CONFIG.apiKey;
};
