
import React from 'react';
import { resetConversation } from '@/services/api';
import { Sparkles, Menu, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface HeaderProps {
  onResetConversation: () => void;
}

const Header: React.FC<HeaderProps> = ({ onResetConversation }) => {
  const { toast } = useToast();
  
  const handleReset = () => {
    resetConversation();
    onResetConversation();
    toast({
      title: "Conversation reset",
      description: "Starting a new conversation.",
      duration: 3000,
    });
  };
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border py-4 px-6">
      <div className="container max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary animate-pulse-subtle" />
          <h1 className="text-xl font-medium">Pinecone Chat</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleReset}
            className="floating-button flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
