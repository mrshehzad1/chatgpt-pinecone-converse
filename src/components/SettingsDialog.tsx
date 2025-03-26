
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setPineconeConfig, PINECONE_CONFIG } from '@/config/pinecone';
import { setOpenAIApiKey, getOpenAIApiKey } from '@/config/openai';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange, onSave }) => {
  const [pineconeApiKey, setPineconeApiKey] = useState(PINECONE_CONFIG.apiKey);
  const [pineconeEnvironment, setPineconeEnvironment] = useState(PINECONE_CONFIG.environment);
  const [pineconeIndexName, setPineconeIndexName] = useState(PINECONE_CONFIG.indexName);
  const [pineconeProjectId, setPineconeProjectId] = useState(PINECONE_CONFIG.projectId);
  const [pineconeNamespace, setPineconeNamespace] = useState(PINECONE_CONFIG.namespace || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(getOpenAIApiKey());
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Update form fields when config changes externally
  useEffect(() => {
    setPineconeApiKey(PINECONE_CONFIG.apiKey);
    setPineconeEnvironment(PINECONE_CONFIG.environment);
    setPineconeIndexName(PINECONE_CONFIG.indexName);
    setPineconeProjectId(PINECONE_CONFIG.projectId);
    setPineconeNamespace(PINECONE_CONFIG.namespace || '');
    setOpenaiApiKey(getOpenAIApiKey());
  }, [open]);

  const validateForm = (): boolean => {
    if (!openaiApiKey) {
      setValidationError("OpenAI API key is required");
      return false;
    }
    
    if (!pineconeApiKey) {
      setValidationError("Pinecone API key is required");
      return false;
    }
    
    if (!pineconeIndexName) {
      setValidationError("Pinecone index name is required");
      return false;
    }
    
    if (!pineconeProjectId) {
      setValidationError("Pinecone project ID is required");
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    
    // Save Pinecone config
    setPineconeConfig({
      apiKey: pineconeApiKey,
      environment: pineconeEnvironment,
      indexName: pineconeIndexName,
      projectId: pineconeProjectId,
      namespace: pineconeNamespace
    });
    
    // Save OpenAI API key
    setOpenAIApiKey(openaiApiKey);
    
    // Show success toast
    toast({
      title: "Settings saved",
      description: "Your API keys and configurations have been saved.",
      duration: 3000,
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
            <h3 className="text-lg font-medium">OpenAI</h3>
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
            <h3 className="text-lg font-medium">Pinecone</h3>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pineconeApiKey" className="col-span-1">API Key</Label>
              <Input
                id="pineconeApiKey"
                type="password"
                value={pineconeApiKey}
                onChange={(e) => setPineconeApiKey(e.target.value)}
                placeholder="pcsk_..."
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pineconeEnvironment" className="col-span-1">Environment</Label>
              <Input
                id="pineconeEnvironment"
                value={pineconeEnvironment}
                onChange={(e) => setPineconeEnvironment(e.target.value)}
                placeholder="gcp-starter"
                className="col-span-3"
              />
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
              <Label htmlFor="pineconeProjectId" className="col-span-1">Project ID</Label>
              <Input
                id="pineconeProjectId"
                value={pineconeProjectId}
                onChange={(e) => setPineconeProjectId(e.target.value)}
                placeholder="abc123def"
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
        </div>
        
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
