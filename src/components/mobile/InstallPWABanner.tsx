import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Monitor, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const InstallPWABanner = () => {
    const { isInstallable, isInstalled, installPWA } = usePWAInstall();
    const [isVisible, setIsVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Show banner 3 seconds after load if installable and not already installed/dismissed
        if (isInstallable && !isInstalled && !dismissed) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isInstallable, isInstalled, dismissed]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[9999]"
            >
                <div className="relative group overflow-hidden rounded-[2.5rem] bg-card/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 shadow-2xl p-6 shadow-indigo-500/10">
                    {/* Background Glow */}
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/20 blur-[40px] rounded-full animate-pulse" />
                    
                    <button 
                        onClick={() => {
                            setIsVisible(false);
                            setDismissed(true);
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X className="h-4 w-4 text-slate-400" />
                    </button>

                    <div className="flex gap-4 items-center">
                        <div className="h-16 w-16 min-w-[64px] rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-[2px] shadow-lg shadow-indigo-500/20">
                            <div className="h-full w-full rounded-2xl bg-card dark:bg-slate-950 flex items-center justify-center p-2 overflow-hidden">
                                <img src="/pwa-icon-512.png" alt="App Icon" className="h-full w-full object-contain" />
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="font-bold text-foreground dark:text-white uppercase tracking-tight text-sm">
                                Terminal App
                            </h3>
                            <p className="text-[11px] font-bold text-slate-500 leading-tight mt-1">
                                Install <span className="text-indigo-600">KiddoChecker</span> to your desktop or home screen for a full-screen terminal experience.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button 
                            onClick={installPWA}
                            className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.2rem] font-bold italic tracking-widest text-[10px] uppercase shadow-lg shadow-indigo-100"
                        >
                            <Download className="h-3 w-3 mr-2" />
                            Install Now
                        </Button>
                        <Button 
                            variant="ghost" 
                            onClick={() => {
                                setIsVisible(false);
                                setDismissed(true);
                            }}
                            className="h-12 px-6 rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600"
                        >
                            Later
                        </Button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InstallPWABanner;

