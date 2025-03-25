
import React from 'react';
import { ChatMessage as ChatMessageType, Source } from '@/types';
import { User, Bot, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  return (
    <div 
      className={cn(
        "message-wrapper flex items-start gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          "message",
          isUser ? "message-user" : "message-assistant"
        )}
      >
        <div className="flex flex-col">
          <div className="prose prose-sm max-w-none">
            {message.content}
          </div>
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-2 border-t border-primary/10">
              <details className="text-sm">
                <summary className="cursor-pointer font-medium flex items-center gap-1 text-xs">
                  <span>Sources ({message.sources.length})</span>
                </summary>
                <div className="mt-2 space-y-2">
                  {message.sources.map((source: Source) => (
                    <div key={source.id} className="p-2 rounded bg-background/50 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-medium">{source.title}</div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs bg-primary/10 px-1.5 py-0.5 rounded-full flex items-center">
                              <span>{Math.round(source.similarity * 100)}%</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Similarity score</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{source.content}</p>
                      {source.url && (
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-1 text-primary flex items-center gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View source</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
          
          <div className="mt-1 text-xs text-muted-foreground/70 flex justify-end">
            {formatTimestamp(message.timestamp)}
            
            {message.confidence && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-2 flex items-center">
                    <Info className="h-3 w-3 mr-0.5" />
                    <span>{Math.round(message.confidence * 100)}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Confidence score</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
