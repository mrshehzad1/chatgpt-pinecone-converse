
export interface OpenAIConfig {
  apiKey: string;
}

// OpenAI configuration
export const OPENAI_CONFIG: OpenAIConfig = {
  apiKey: localStorage.getItem('openai_api_key') || ''
};

export const setOpenAIApiKey = (apiKey: string): void => {
  localStorage.setItem('openai_api_key', apiKey);
  OPENAI_CONFIG.apiKey = apiKey;
};

export const getOpenAIApiKey = (): string => {
  return OPENAI_CONFIG.apiKey;
};
