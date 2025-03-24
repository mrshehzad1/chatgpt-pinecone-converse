
import React, { useState, useEffect, useRef } from 'react';
import { sendMessage, getConversationHistory } from '@/services/api';
import { ChatMessage as ChatMessageType } from '@/types';
import ChatMessage from '@/components/ChatMessage';
import ChatInput from '@/components/ChatInput';
import Header from '@/components/Header';
import { Bot, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load conversation history
    const history = getConversationHistory();
    setMessages(history);
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    try {
      setIsLoading(true);
      
      // Optimistically add user message to UI
      const userMessage: ChatMessageType = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add thinking message
      const thinkingMessage: ChatMessageType = {
        id: `thinking-${Date.now()}`,
        role: 'assistant',
        content: 'Searching vector database and generating response...',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, thinkingMessage]);
      
      // Send to API
      const response = await sendMessage(message);
      
      // Remove thinking message and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== thinkingMessage.id);
        
        const assistantMessage: ChatMessageType = {
          id: `response-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
          sources: response.sources,
          confidence: response.confidence
        };
        
        return [...filtered, assistantMessage];
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      
      // Remove thinking message if there was an error
      setMessages(prev => 
        prev.filter(msg => !msg.id.startsWith('thinking-'))
      );
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConversation = () => {
    setMessages([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onResetConversation={handleResetConversation} />
      
      <main className="flex-1 py-6">
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-primary animate-pulse-subtle" />
              </div>
              <h2 className="text-2xl font-medium mb-2">Welcome to Pinecone Chat</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Ask me anything about vector databases, semantic search, or how to build AI applications with Pinecone.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  "What is a vector database?",
                  "How does Pinecone work?",
                  "Explain semantic search.",
                  "How to use OpenAI with Pinecone?"
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(suggestion)}
                    disabled={isLoading}
                    className="text-left p-3 rounded-xl border border-border hover:bg-secondary/50 transition-colors floating-button"
                  >
                    <span className="text-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-container">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
          
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Index;
