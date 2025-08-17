
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    // Force a page reload to reset auth state
    window.location.reload();
  };

  private handleLogout = () => {
    // Clear all auth data and redirect to login
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="mt-2">
              <div className="space-y-3">
                <p className="font-semibold text-red-800">Authentication Error</p>
                <p className="text-sm text-red-700">
                  There was a problem loading your account. This usually happens due to connection issues or corrupted session data.
                </p>
                <div className="flex gap-2">
                  <Button onClick={this.handleRetry} size="sm" variant="outline" className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                  <Button onClick={this.handleLogout} size="sm" className="flex-1">
                    Login Again
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
