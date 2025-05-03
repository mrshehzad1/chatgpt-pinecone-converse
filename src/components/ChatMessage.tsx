
import React, { useState } from 'react';
import { ChatMessage as ChatMessageType, Source } from '@/types';
import { User, Bot, ExternalLink, Info, ChevronDown, ChevronUp, FileText, AlertCircle, AlertTriangle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessageProps {
  message: ChatMessageType;
}

const SourceItem = ({ source }: { source: Source }) => {
  const [showFullText, setShowFullText] = useState(false);
  
  // Extract the filename from metadata - look in different possible locations
  const getDocumentName = () => {
    // First check for the "file" field which contains the original PDF name
    if (source.metadata?.file) return source.metadata.file;
    
    // Try to get the original filename from other common fields
    if (source.metadata?.filename) return source.metadata.filename;
    if (source.metadata?.file_name) return source.metadata.file_name;
    if (source.metadata?.document_name) return source.metadata.document_name;
    if (source.metadata?.original_filename) return source.metadata.original_filename;
    
    // If no filename found, fall back to title or category fields
    if (source.title) return source.title;
    
    // Last resort: use the ID to create a placeholder name
    return 'Document ' + source.id.substring(0, 8);
  };
  
  return (
    <div key={source.id} className="p-2 rounded bg-background/50 text-xs mb-2 border border-primary/10">
      <div className="flex justify-between items-start mb-1">
        <div className="font-medium flex items-center gap-1">
          <FileText className="h-3 w-3" />
          <span>{getDocumentName()}</span>
        </div>
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
      
      <div className="mt-1">
        <p className={cn(
          "text-muted-foreground text-xs",
          showFullText ? "" : "line-clamp-2"
        )}>
          {source.content || "No content available"}
        </p>
        
        <button 
          onClick={() => setShowFullText(!showFullText)}
          className="mt-1 text-primary flex items-center gap-1 text-xs hover:underline"
        >
          {showFullText ? (
            <>
              <ChevronUp className="h-3 w-3" />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              <span>Show Full Text</span>
            </>
          )}
        </button>
      </div>
      
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
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [showAllSources, setShowAllSources] = useState(false);
  
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Get sources count for display
  const sourcesCount = message.sources?.length || 0;
  // Limit initially displayed sources to 2, but allow expanding
  const displayedSources = showAllSources 
    ? message.sources || [] 
    : (message.sources || []).slice(0, 2);
    
  // Check if this message is the thinking/loading message
  const isThinkingMessage = message.content.includes('Searching vector database and generating response');
  
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
          
          {message.sources && message.sources.length > 0 ? (
            <div className="mt-3 pt-2 border-t border-primary/10">
              <details className="text-sm" open>
                <summary className="cursor-pointer font-medium flex items-center gap-1 text-xs mb-2">
                  <span>Sources ({message.sources.length})</span>
                </summary>
                <div className="space-y-1">
                  {displayedSources.map((source: Source) => (
                    <SourceItem key={source.id} source={source} />
                  ))}
                  
                  {sourcesCount > 2 && (
                    <button 
                      onClick={() => setShowAllSources(!showAllSources)}
                      className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                    >
                      {showAllSources ? (
                        <>
                          <ChevronUp className="h-3 w-3" /> 
                          <span>Show Fewer Sources</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" /> 
                          <span>Show All {sourcesCount} Sources</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </details>
            </div>
          ) : message.role === 'assistant' && !isThinkingMessage ? (
            <div className="mt-3 pt-2 border-t border-primary/10 text-xs text-muted-foreground">
              {message.sourceError ? (
                <div className="flex items-center gap-1 text-amber-500">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Could not access knowledge base. Response generated from general knowledge.</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>No relevant sources found for this response</span>
                </div>
              )}
            </div>
          ) : null}
          
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
