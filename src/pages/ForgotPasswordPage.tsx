import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Request Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setIsSent(true);
        toast({
          title: "Email Sent",
          description: "Check your inbox for password reset instructions."
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-slate-900 text-xl tracking-tighter">KiddoChecker</span>
          </div>

          {!isSent ? (
            <>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Forgot Password?</h2>
              <p className="text-slate-500 mb-8 font-medium">
                Enter your registered email address and we'll send you a link to reset your password.
              </p>

              <form onSubmit={handleResetRequest} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-900 font-black text-sm ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all font-medium"
                      placeholder="name@organization.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
                </Button>

                <Link 
                  to="/login"
                  className="flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors py-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Check your Email</h2>
              <p className="text-slate-500 mb-8 font-medium">
                We've sent a password reset link to <span className="text-slate-900 font-bold">{email}</span>. Please check your inbox and spam folder.
              </p>
              
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                className="w-full h-14 rounded-2xl font-black border-slate-200"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-8 font-bold uppercase tracking-widest px-4">
          Secure identity management powered by KiddoChecker Auth
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
