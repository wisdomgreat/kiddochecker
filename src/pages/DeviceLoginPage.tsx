import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Shield, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const DeviceLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // Form state
    const [code, setCode] = useState("");
    const [pin, setPin] = useState("");
    const [needPin, setNeedPin] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial code submit
    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            toast({ title: "Reference Code Required", variant: "destructive" });
            return;
        }

        // We check if PIN is required by optimistically just trying to hit the edge function without PIN first. 
        // If it requires PIN, it returns 401 with "Master PIN required".
        await executeLogin(false);
    };

    // Subsequent PIN submit
    const handlePinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pin.trim()) {
            toast({ title: "Master PIN Required", variant: "destructive" });
            return;
        }
        await executeLogin(true);
    };

    const getDeviceForensics = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        const screen = `${window.screen.width}x${window.screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;

        // Generate a hardware ID fingerprint
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let fingerprint = '';
        if (ctx) {
            ctx.fillText('KiddoChecker-Secure-Device-ID', 2, 2);
            fingerprint = canvas.toDataURL();
        }

        const rawId = `${ua}|${platform}|${screen}|${timezone}|${language}|${fingerprint.slice(-50)}`;
        // Use a simple hash-like string instead of direct btoa which can fail on non-ASCII
        let hardwareId = 'kc-id-';
        for (let i = 0; i < rawId.length; i++) {
            const char = rawId.charCodeAt(i);
            const bit = (char.toString(16));
            if (i % 8 === 0) hardwareId += bit;
        }
        hardwareId = hardwareId.slice(0, 32);

        return {
            combined: hardwareId, // For logging
            hardwareId,
            os: platform,
            browser: ua, // Full string for backend parsing
            timezone,
            language,
            fingerprint: {
                userAgent: ua,
                resolution: screen,
                language: language,
                timezone,
                cores: (navigator as any).hardwareConcurrency || 'unknown',
                memory: (navigator as any).deviceMemory || 'unknown'
            }
        };
    };

    const executeLogin = async (withPin: boolean) => {
        setLoading(true);
        try {
            const forensics = getDeviceForensics();
            const body: any = {
                code: code.trim(),
                forensics
            };
            if (withPin) body.pin = pin.trim();

            const { data, error } = await supabase.functions.invoke('device-login', {
                body
            });

            if (error) {
                // Determine if it tells us we need a PIN
                if (error.message === "Master PIN required") {
                    setNeedPin(true);
                    setLoading(false);
                    return;
                }
                throw error;
            }

            if (data.error) {
                if (data.error === "Master PIN required") {
                    setNeedPin(true);
                    setLoading(false);
                    return;
                }
                throw new Error(data.error);
            }

            if (!data.success || !data.email || !data.password) {
                throw new Error("Invalid response from authorization server");
            }

            // We have the specific device's credentials, log them in securely
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) throw authError;

            toast({
                title: "Device Activated!",
                description: `Successfully locked to ${data.device.name}.`,
            });

            // Redirect to the kiosk check-in application
            navigate("/check-in", { replace: true });

        } catch (error: any) {
            console.error("Device Authentication Error:", error);
            toast({
                title: "Access Denied",
                description: error.message || "Invalid reference code or PIN.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 overflow-hidden relative">
                    {/* Decorative Background Graphic */}
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Zap className="w-64 h-64 text-indigo-600 transform translate-x-12 -translate-y-12" />
                    </div>

                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                            <Shield className="w-8 h-8 text-indigo-600" />
                        </div>

                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                            Terminal Setup
                        </h1>
                        <p className="text-slate-500 mt-2 mb-8 text-sm">
                            Enter the dedicated terminal reference code to securely lock this device to your organization.
                        </p>

                        {!needPin ? (
                            <form onSubmit={handleCodeSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                                        Device Reference Code
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. U57-XFR9C"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        className="h-14 font-mono tracking-widest text-lg bg-slate-50 border-slate-200 uppercase rounded-xl"
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading || !code.trim()}
                                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Activate Terminal <ArrowRight className="w-5 h-5" /></>}
                                </Button>
                            </form>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onSubmit={handlePinSubmit}
                                className="space-y-4"
                            >
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-2">
                                    <p className="text-xs text-amber-800 font-medium">This organization requires a Master PIN to activate terminals.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 block mb-1">
                                        Master Security PIN
                                    </label>
                                    <Input
                                        type="password"
                                        pattern="[0-9]*"
                                        inputMode="numeric"
                                        placeholder="••••••"
                                        maxLength={6}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        className="h-14 font-mono tracking-[0.5em] text-center text-2xl bg-slate-50 border-slate-200 rounded-xl"
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setNeedPin(false)}
                                        disabled={loading}
                                        className="h-14 flex-1 rounded-xl"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || !pin.trim()}
                                        className="h-14 flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg font-semibold flex items-center justify-center gap-2 shadow-md"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify PIN"}
                                    </Button>
                                </div>
                            </motion.form>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Support link */}
            <p className="mt-8 text-xs text-slate-400 font-medium tracking-wide">
                Where do I find my reference code? <br className="sm:hidden" />
                <span className="hidden sm:inline"> — </span>
                Check the <span className="text-indigo-500">Device Enrollment</span> tab in the Admin Portal.
            </p>
        </div>
    );
};

export default DeviceLogin;
