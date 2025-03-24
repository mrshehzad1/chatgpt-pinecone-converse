
import { ChatMessage } from '@/types';

// Store conversation state locally
let conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const messageHistory: ChatMessage[] = [];

// Get conversation history
export const getConversationHistory = (): ChatMessage[] => {
  return [...messageHistory];
};

// Add message to history
export const addMessageToHistory = (message: ChatMessage): void => {
  messageHistory.push(message);
};

// Reset conversation
export const resetConversation = (): void => {
  conversationId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  messageHistory.length = 0;
};

// Get current conversation ID
export const getConversationId = (): string => {
  return conversationId;
};
