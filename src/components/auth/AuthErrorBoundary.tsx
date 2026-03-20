
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-6 overflow-hidden relative">
          {/* Decorative background elements */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-50 rounded-full blur-[120px] opacity-60" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-xl relative z-10"
          >
            <div className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[3rem] p-12 text-center space-y-8 overflow-hidden relative group">
              {/* Subtle top accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-400 via-indigo-500 to-emerald-400 opacity-80" />
              
              <div className="flex flex-col items-center gap-6">
                <motion.div 
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    y: [0, -4, 0]
                  }}
                  transition={{ 
                    rotate: { duration: 0.5, delay: 0.2 },
                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center shadow-inner"
                >
                  <AlertTriangle className="h-12 w-12 text-rose-500" />
                </motion.div>
                
                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    Session <span className="text-rose-500">Interrupted</span>
                  </h2>
                  <p className="text-slate-500 font-bold leading-relaxed max-w-md mx-auto">
                    We've encountered a secure authentication sync issue. This usually happens when your connection is unstable or your session has stale data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  className="h-16 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RefreshCw className="h-4 w-4 text-indigo-500" />
                  Attempt Recovery
                </Button>
                
                <Button 
                  onClick={this.handleLogout} 
                  className="h-16 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RefreshCw className="h-4 w-4" />
                  Re-Authenticate
                </Button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  If issues persist, please contact <span className="text-indigo-600">Central Support</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;
