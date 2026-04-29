
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseFunctionsReturn {
  executeFunction: <T>(
    functionName: string, 
    params?: Record<string, any>
  ) => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
}

export function useDatabaseFunctions(): DatabaseFunctionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const executeFunction = async <T>(
    functionName: string, 
    params?: Record<string, any>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Executing RPC function: ${functionName}`, params);
      
      const { data, error } = await supabase.rpc(functionName as any, params || {});
      
      if (error) {
        console.error(`Error executing ${functionName}:`, error);
        setError(error);
        toast({
          title: 'Database Error',
          description: error.message || `Failed to execute ${functionName}`,
          variant: 'destructive',
        });
        return null;
      }
      
      return data as T;
    } catch (err: any) {
      console.error(`Exception executing ${functionName}:`, err);
      setError(err);
      toast({
        title: 'Error',
        description: err.message || `An error occurred while executing ${functionName}`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { executeFunction, isLoading, error };
}

export default useDatabaseFunctions;

