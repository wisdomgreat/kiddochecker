import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

    useEffect(() => {
        if (pin.length === correctPin.length) {
            if (pin === correctPin) {
                onSuccess();
                setPin('');
                setError(false);
            } else {
                setError(true);
                setPin('');
                // Shake animation could be added here
                setTimeout(() => setError(false), 500);
            }
        }
    }, [pin, correctPin, onSuccess]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${error ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                            <Shield className="h-8 w-8" />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Security PIN Required</h2>
                        <p className="text-slate-500 mt-1">Please enter your 6-digit access code</p>
                    </div>

                    <div className="flex justify-center gap-3">
                        {[...Array(correctPin.length)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pin.length > i
                                    ? 'bg-indigo-600 border-indigo-600 scale-110'
                                    : error
                                        ? 'border-red-400 bg-red-50'
                                        : 'border-slate-300'
                                    } ${error ? 'animate-bounce' : ''}`}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                            <Button
                                key={num}
                                variant="outline"
                                className="h-16 text-2xl font-bold rounded-2xl hover:bg-slate-50 hover:border-indigo-300 active:scale-95 transition-all"
                                onClick={() => handleNumberClick(num)}
                            >
                                {num}
                            </Button>
                        ))}
                        <Button
                            variant="ghost"
                            className="h-16 rounded-2xl text-slate-400"
                            onClick={onClose}
                        >
                            <X className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-16 text-2xl font-bold rounded-2xl hover:bg-slate-50 active:scale-95 transition-all"
                            onClick={() => handleNumberClick('0')}
                        >
                            0
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-16 rounded-2xl text-slate-400"
                            onClick={handleDelete}
                        >
                            <Delete className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PINDialog;
