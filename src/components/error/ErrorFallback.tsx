
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  message?: string;
}

export const ErrorFallback = ({ error, resetError, message }: ErrorFallbackProps) => {
  return (
    <div className="flex items-center justify-center p-8">
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className="font-semibold">Error</p>
            <p className="text-sm text-gray-600">
              {message || error?.message || 'Something went wrong'}
            </p>
            {resetError && (
              <Button onClick={resetError} size="sm" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorFallback;

