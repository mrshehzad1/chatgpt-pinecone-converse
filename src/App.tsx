
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      {/* Sonner toast must be outside of any container with z-index, and have a very high z-index */}
      <Sonner 
        position="top-center" 
        expand={true} 
        closeButton={true} 
        richColors 
        duration={8000}
        toastOptions={{
          style: { 
            zIndex: 100000,
            maxWidth: '450px',
            wordBreak: 'break-word'
          }
        }}
      />
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
