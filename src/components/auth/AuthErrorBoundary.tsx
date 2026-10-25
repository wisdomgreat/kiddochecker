
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

    // Auto-reload once when a stale deploy/dynamic chunk import error occurs
    const isChunkLoadError = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('dynamically imported module') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadError) {
      const storageKey = 'kiddo_chunk_retry_timestamp';
      const lastRetry = sessionStorage.getItem(storageKey);
      const now = Date.now();
      // If we haven't auto-reloaded in the last 15 seconds, reload cleanly
      if (!lastRetry || now - parseInt(lastRetry, 10) > 15000) {
        sessionStorage.setItem(storageKey, String(now));
        window.location.reload();
        return;
      }
    }
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

            <div className="flex flex-col gap-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  className="h-12 rounded-xl gap-2 font-bold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
                
                <Button 
                  onClick={this.handleLogout} 
                  className="h-12 rounded-xl gap-2 font-bold"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-Login
                </Button>
              </div>
              
              <Button 
                variant="ghost"
                size="sm"
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest"
                onClick={() => {
                  console.group('Auth Diagnostic Report');
                  console.error('Caught Error:', this.state.error);
                  console.log('LocalStorage State:', { ...localStorage });
                  console.log('Session Backup:', localStorage.getItem('session_backup'));
                  console.log('Current URL:', window.location.href);
                  console.groupEnd();
                  alert('Diagnostic data logged to browser console (F12)');
                }}
              >
                View Diagnostic Data
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
