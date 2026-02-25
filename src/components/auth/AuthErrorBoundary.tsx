
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
        <div className="min-h-screen flex items-start justify-start p-10 bg-background">
          <Alert className="max-w-2xl border-red-200 bg-red-50 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-2xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-red-900">Authentication Error</h2>
                  <p className="text-red-700 mt-2">
                    There was a problem loading your account. This usually happens due to connection issues or corrupted session data.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={this.handleRetry} size="lg" variant="outline" className="flex-1 bg-white hover:bg-red-50 border-red-200 text-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </Button>
                  <Button onClick={this.handleLogout} size="lg" className="flex-1 bg-red-600 hover:bg-red-700">
                    Login Again
                  </Button>
                </div>
              </div>
            </div>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
