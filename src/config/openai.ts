
export interface OpenAIConfig {
  apiKey: string;
}

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

// OpenAI configuration
export const OPENAI_CONFIG: OpenAIConfig = {
  apiKey: getLocalStorageItem('openai_api_key', '')
};

// Log initialization (without revealing full API key)
console.log('OpenAI config initialized:', {
  apiKeyPresent: !!OPENAI_CONFIG.apiKey
});

export const setOpenAIApiKey = (apiKey: string): void => {
  try {
    // Check if we're in a browser environment first
    if (typeof window === 'undefined' || !window.localStorage) {
      console.error('Attempted to set OpenAI API key outside of browser environment');
      return;
    }
    
    // Clean the API key of any whitespace
    const cleanKey = apiKey.trim();
    localStorage.setItem('openai_api_key', cleanKey);
    OPENAI_CONFIG.apiKey = cleanKey;
    console.log('OpenAI API key set:', `${cleanKey.substring(0, 5)}...${cleanKey.substring(cleanKey.length - 3)}`);
  } catch (error) {
    console.error('Error setting OpenAI API key:', error);
  }
};

export const getOpenAIApiKey = (): string => {
  return OPENAI_CONFIG.apiKey;
};
