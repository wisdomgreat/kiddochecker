
import React, { Component, ErrorInfo, ReactNode } from 'react';
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
    // Clear stale auth state before reloading
    try {
      localStorage.removeItem('session_backup');
      // Clear any supabase auth tokens that might be corrupted
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // Ignore storage errors
    }
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  private handleLogout = () => {
    // Nuclear option: clear ALL auth data
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      // Ignore
    }
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-lg">
            {/* Top accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-indigo-500 to-emerald-400 rounded-t-2xl" />
            
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                <AlertTriangle className="h-8 w-8 text-rose-500" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  Session <span className="text-rose-500">Interrupted</span>
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We've encountered an authentication issue. This usually happens when your session has expired or your connection was interrupted.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left">
                <p className="text-xs font-mono text-slate-600 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                onClick={this.handleRetry} 
                variant="outline" 
                className="h-12 rounded-xl gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              
              <Button 
                onClick={this.handleLogout} 
                className="h-12 rounded-xl gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Re-Login
              </Button>
            </div>

            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              If issues persist, clear your browser cache or contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
