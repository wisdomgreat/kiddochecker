import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Shield, Delete, X } from 'lucide-react';

interface PINDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

const PINDialog = ({ open, onClose, onSuccess, correctPin }: PINDialogProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (lockoutUntil) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) setLockoutUntil(null);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutUntil]);

  useEffect(() => {
    if (pin.length === correctPin.length) {
      if (pin === correctPin) {
        onSuccess();
        setPin('');
        setError(false);
        setAttempts(0);
      } else {
        setError(true);
        setPin('');
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          const lockoutTime = 30; // 30 seconds lockout
          setLockoutUntil(Date.now() + lockoutTime * 1000);
          setAttempts(0);
        }

        setTimeout(() => setError(false), 500);
      }
    }
  }, [pin, correctPin, onSuccess, attempts]);

  if (!open) return null;

  const handleNumberClick = (num: string) => {
    if (pin.length < correctPin.length) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-lg w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-5">
          <div className="flex justify-between items-start">
            <div className="w-6" />
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-colors ${error ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-primary/10 border-primary/20 text-primary'}`}>
              <Shield className="h-6 w-6" />
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Security PIN Required</h2>
            {lockoutUntil ? (
              <p className="text-destructive font-medium text-xs">
                Too many attempts. Try again in {timeLeft}s
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">Please enter your authorized terminal access code</p>
            )}
          </div>

          <div className="flex justify-center gap-2.5 py-1">
            {[...Array(correctPin.length)].map((_, i) => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                  pin.length > i
                    ? 'bg-primary border-primary'
                    : 'bg-muted border-border'
                }`}
              />
            ))}
          </div>

          {/* Tactile Keypad Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumberClick(num.toString())}
                disabled={!!lockoutUntil}
                className="h-12 rounded-xl font-semibold text-lg bg-muted/40 hover:bg-muted text-foreground border border-border/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 rounded-xl font-medium text-xs text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleNumberClick('0')}
              disabled={!!lockoutUntil}
              className="h-12 rounded-xl font-semibold text-lg bg-muted/40 hover:bg-muted text-foreground border border-border/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Backspace"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PINDialog;
