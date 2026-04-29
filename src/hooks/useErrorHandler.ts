
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseErrorHandlerReturn {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
  handleError: (error: unknown, customMessage?: string) => void;
  isError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error('Error handled:', error);
    
    let errorMessage = customMessage || 'An unexpected error occurred';
    let errorObj: Error;

    if (error instanceof Error) {
      errorObj = error;
      errorMessage = customMessage || error.message;
    } else if (typeof error === 'string') {
      errorObj = new Error(error);
      errorMessage = customMessage || error;
    } else {
      errorObj = new Error(errorMessage);
    }

    setError(errorObj);
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  return {
    error,
    setError,
    clearError,
    handleError,
    isError: error !== null,
  };
};

export default useErrorHandler;

