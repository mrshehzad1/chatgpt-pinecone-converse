
import React, { useState } from 'react';
import { resetConversation } from '@/services/api';
import { RotateCcw, Gavel, Settings } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import SettingsDialog from './SettingsDialog';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onResetConversation: () => void;
}

const Header: React.FC<HeaderProps> = ({ onResetConversation }) => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isMobile = useIsMobile();
  
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
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border py-4 px-4 sm:px-6">
      <div className="container max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Gavel className="h-5 w-5 text-primary animate-pulse-subtle" />
          <h1 className="text-xl font-medium truncate">Construction Law Advisor</h1>
          {!isMobile && (
            <div className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              Legal RAG
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button 
            onClick={() => setSettingsOpen(true)}
            className="floating-button flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
            {!isMobile && <span>Settings</span>}
          </button>
          
          <button 
            onClick={handleReset}
            className="floating-button flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
            aria-label="New Chat"
          >
            <RotateCcw className="h-4 w-4" />
            {!isMobile && <span>New Chat</span>}
          </button>
        </div>
      </div>
      
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
};

export default Header;
