
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-8 shadow-lg">
             <div className="mx-auto w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
               <AlertTriangle className="h-10 w-10 text-rose-500" />
             </div>
             
             <div className="space-y-3">
                <h2 className="text-3xl font-bold text-slate-900">
                  Something went wrong
                </h2>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left">
                  <p className="text-xs font-mono text-slate-600 break-words">
                    {this.state.error?.message || 'An unexpected error occurred.'}
                  </p>
                </div>
             </div>

             <div className="space-y-3">
               <Button 
                 onClick={this.handleRetry} 
                 className="h-12 w-full rounded-xl gap-2"
               >
                 <RefreshCw className="h-4 w-4" />
                 Try Again
               </Button>
               <Button 
                 variant="outline"
                 onClick={() => window.location.reload()} 
                 className="h-12 w-full rounded-xl gap-2"
               >
                 <RefreshCw className="h-4 w-4" />
                 Reload Page
               </Button>
             </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
