
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Create a new QueryClient with retry options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3, // Retry 3 times when requests fail
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff capped at 30 seconds
      staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
    },
    mutations: {
      retry: 2, // Retry mutations twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000), // Exponential backoff capped at 15 seconds
    },
  },
});

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
        duration={10000}
        toastOptions={{
          style: { 
            zIndex: 9999999, // Ensure visibility above everything
            maxWidth: '500px',
            wordBreak: 'break-word'
          }
        }}
      />
      <Toaster />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
