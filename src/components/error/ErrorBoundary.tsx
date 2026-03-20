
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="min-h-screen w-full flex items-center justify-center bg-[#fef2f2] p-6 relative overflow-hidden font-sans">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-100/20 rounded-full blur-[120px]" />
           
           <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white shadow-[0_48px_80px_-16px_rgba(225,29,72,0.1)] rounded-[4rem] p-12 text-center space-y-10 relative z-10"
          >
             <div className="relative group mx-auto w-24 h-24">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-rose-400/20 rounded-3xl blur-xl group-hover:bg-rose-400/30 transition-colors" 
               />
               <div className="w-24 h-24 bg-rose-50 rounded-3xl flex items-center justify-center relative border border-rose-100 shadow-inner">
                  <AlertTriangle className="h-12 w-12 text-rose-500" />
               </div>
             </div>
             
             <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">System <span className="text-rose-600">Exception</span></h2>
                <p className="text-slate-500 font-bold leading-relaxed max-w-sm mx-auto uppercase text-[10px] tracking-widest bg-slate-50 py-2 rounded-full border border-slate-100">
                  Critical Runtime Collision Detected
                </p>
                <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 text-left">
                  <p className="text-xs font-mono text-rose-700 break-words opacity-80">
                    {this.state.error?.message || 'An unexpected runtime error occurred while processing your request.'}
                  </p>
                </div>
             </div>

             <div className="space-y-4">
               <Button onClick={this.handleRetry} className="h-16 w-full rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-3">
                 <RefreshCw className="h-4 w-4" />
                 Restart Interface
               </Button>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                 Session UUID <span className="text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md font-mono">{Math.random().toString(36).substring(7).toUpperCase()}</span>
               </p>
             </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
