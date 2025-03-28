
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setPineconeConfig, PINECONE_CONFIG, testPineconeConnection } from '@/config/pinecone';
import { setOpenAIApiKey, getOpenAIApiKey } from '@/config/openai';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, HelpCircle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [pineconeApiKey, setPineconeApiKey] = useState(PINECONE_CONFIG.apiKey);
  const [pineconeIndexName, setPineconeIndexName] = useState(PINECONE_CONFIG.indexName);
  const [pineconeNamespace, setPineconeNamespace] = useState(PINECONE_CONFIG.namespace || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(getOpenAIApiKey());
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>('untested');
  
  // Update form fields when config changes externally
  useEffect(() => {
    if (open) {
      setPineconeApiKey(PINECONE_CONFIG.apiKey);
      setPineconeIndexName(PINECONE_CONFIG.indexName);
      setPineconeNamespace(PINECONE_CONFIG.namespace || '');
      setOpenaiApiKey(getOpenAIApiKey());
      setValidationError(null);
      setConnectionStatus('untested');
    }
  }, [open]);

  const validateForm = (): boolean => {
    if (!openaiApiKey || openaiApiKey.trim() === '') {
      setValidationError("OpenAI API key is required");
      return false;
    }
    
    if (!pineconeApiKey || pineconeApiKey.trim() === '') {
      setValidationError("Pinecone API key is required");
      return false;
    }
    
    if (!pineconeIndexName || pineconeIndexName.trim() === '') {
      setValidationError("Pinecone index name is required");
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Save temporary settings for testing
    const tempPineconeConfig = {
      apiKey: pineconeApiKey.trim(),
      indexName: pineconeIndexName.trim(),
      namespace: pineconeNamespace.trim(),
      environment: '',  // No longer needed
      projectId: ''     // No longer needed
    };
    
    setPineconeConfig(tempPineconeConfig);
    
    setIsTesting(true);
    setConnectionStatus('untested');
    
    try {
      const result = await testPineconeConnection(2, 1000);
      
      if (result.success) {
        setConnectionStatus('success');
        toast.success("Pinecone Connection Successful", {
          description: "Successfully connected to your Pinecone index."
        });
      } else {
        setConnectionStatus('failed');
        setValidationError(result.message);
        toast.error("Pinecone Connection Failed", {
          description: result.message
        });
      }
    } catch (error: any) {
      setConnectionStatus('failed');
      setValidationError(error.message || "Connection test failed");
      toast.error("Connection Test Error", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    // Save Pinecone config - using simplified config that matches the working example
    setPineconeConfig({
      apiKey: pineconeApiKey.trim(),
      indexName: pineconeIndexName.trim(),
      namespace: pineconeNamespace.trim(),
      environment: '',  // No longer needed
      projectId: ''     // No longer needed
    });
    
    // Save OpenAI API key
    setOpenAIApiKey(openaiApiKey.trim());
    
    // Show success toast
    toast.success("Settings saved", {
      description: "Your API keys and configurations have been saved."
    });
    
    // Call onSave callback if provided
    if (onSave) {
      onSave();
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your Pinecone and OpenAI API settings. These are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        
        {validationError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">OpenAI</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Get your OpenAI API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a></p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="openaiApiKey" className="col-span-1">API Key</Label>
              <Input
                id="openaiApiKey"
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="col-span-3"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">Pinecone</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Find your Pinecone API key and index name in the Pinecone console.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pineconeApiKey" className="col-span-1">API Key</Label>
              <div className="col-span-3 relative">
                <Input
                  id="pineconeApiKey"
                  type="password"
                  value={pineconeApiKey}
                  onChange={(e) => setPineconeApiKey(e.target.value)}
                  placeholder="pc_..."
                  className="pr-8"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="max-w-[200px]">If you're getting authorization errors, check that your API key is correct and hasn't expired.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pineconeIndexName" className="col-span-1">Index Name</Label>
              <Input
                id="pineconeIndexName"
                value={pineconeIndexName}
                onChange={(e) => setPineconeIndexName(e.target.value)}
                placeholder="your-index-name"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pineconeNamespace" className="col-span-1">Namespace</Label>
              <Input
                id="pineconeNamespace"
                value={pineconeNamespace}
                onChange={(e) => setPineconeNamespace(e.target.value)}
                placeholder="(optional)"
                className="col-span-3"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : connectionStatus === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : null}
              Test Connection
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
