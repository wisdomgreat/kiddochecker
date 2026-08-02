import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DeviceLogin = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signInWithPassword } = useAuth();

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

    const { user, isKiosk } = useAuth();

    // --- REDIRECT IF ALREADY AUTHED ---
    React.useEffect(() => {
        if (user && isKiosk) {
            navigate("/check-in", { replace: true });
        }
    }, [user, isKiosk, navigate]);

    // --- SILENT RE-AUTH ---
    React.useEffect(() => {
        const attemptSilentReauth = async () => {
            if (user && isKiosk) return; // Already there
            
            setLoading(true);
            // Wait for potential session recovery from Supabase
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try silent re-auth
            await executeLogin(false, true); 
        };
        attemptSilentReauth();
    }, []);

    const getDeviceForensics = () => {
        const ua = navigator.userAgent;
        const platform = navigator.platform;
        const screen = `${window.screen.width}x${window.screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const language = navigator.language;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        let fingerprint = '';
        if (ctx) {
            ctx.fillText('KiddoChecker-Secure-Device-ID', 2, 2);
            fingerprint = canvas.toDataURL();
        }

        // --- PERSISTENCE LOGIC ---
        // We use a stored ID if available to prevent re-auth failures when browser fingerprints drift
        let hardwareId = localStorage.getItem('kiosk_hardware_id');
        
        if (!hardwareId) {
            const rawId = `${ua}|${platform}|${screen}|${timezone}|${language}|${fingerprint.slice(-50)}`;
            hardwareId = 'kc-id-';
            for (let i = 0; i < rawId.length; i++) {
                const char = rawId.charCodeAt(i);
                const bit = (char.toString(16));
                if (i % 8 === 0) hardwareId += bit;
            }
            hardwareId = hardwareId.slice(0, 32);
        }

        return {
            combined: hardwareId,
            hardwareId,
            os: platform,
            browser: ua,
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

    const executeLogin = async (withPin: boolean, silent: boolean = false) => {
        if (!silent) setLoading(true);
        try {
            const forensics = getDeviceForensics();
            const body: any = {
                code: silent ? undefined : code.trim(),
                forensics
            };
            if (withPin) body.pin = pin.trim();

            const baseUrl = import.meta.env.VITE_API_URL || "https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io";
            let data: any = null;
            let error: any = null;

            try {
                const response = await fetch(`${baseUrl}/api/functions/device-login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const resJson = await response.json();
                if (resJson.error) {
                    error = new Error(resJson.error);
                } else {
                    data = resJson;
                }
            } catch (fetchErr: any) {
                console.error("[DeviceLogin] Direct Azure fetch error:", fetchErr);
                error = new Error(fetchErr?.message || "Unable to connect to Azure API server. Please check your network connection.");
            }

            if (error) {
                if (silent) {
                    setLoading(false);
                    return;
                }
                if (error.message === "Master PIN required") {
                    setNeedPin(true);
                    setLoading(false);
                    return;
                }
                throw error;
            }

            if (!data || data.error) {
                const errMsg = data?.error || "Invalid response from authorization server";
                if (silent) {
                    setLoading(false);
                    return;
                }
                if (errMsg === "Master PIN required") {
                    setNeedPin(true);
                    setLoading(false);
                    return;
                }
                throw new Error(errMsg);
            }

            if (!data.success || !data.email || !data.password) {
                throw new Error("Invalid response from authorization server");
            }

            if (data.token) {
                localStorage.setItem('bridge_token', data.token);
            }

            try {
                await signInWithPassword(data.email, data.password);
            } catch (aErr) {
                console.warn("[DeviceLogin] Supabase auth fallback notice (non-fatal):", aErr);
            }

            toast({
                title: "Device Activated!",
                description: `Successfully locked to ${data.device?.name || 'Device'}.`,
            });

            // Store the hardware ID for future silent re-auth
            if (forensics.hardwareId) {
                localStorage.setItem('kiosk_hardware_id', forensics.hardwareId);
            }

            navigate("/check-in", { replace: true });

        } catch (error: any) {
            console.error("Device Authentication Error:", error);
            if (!silent) {
                toast({
                    title: "Access Denied",
                    description: error.message || "Invalid reference code or PIN.",
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="bg-card border rounded-lg p-8 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="p-2 bg-primary/10 rounded border border-primary/20">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-foreground text-lg tracking-tight">Terminal Activation</span>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h1 className="text-2xl font-bold tracking-tight">Setup Terminal</h1>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Enter your device reference code to securely lock this terminal to your organization.
                        </p>
                    </div>

                    {!needPin ? (
                        <form onSubmit={handleCodeSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="code" className="text-xs uppercase font-bold text-muted-foreground">Reference Code</label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="e.g. U57-XFR9C"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="h-12 font-mono tracking-widest text-lg"
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={loading || !code.trim()}
                                className="w-full h-12"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Activate Terminal
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    ) : (
                        <form
                            onSubmit={handlePinSubmit}
                            className="space-y-4"
                        >
                            <div className="p-3 bg-primary/10 text-primary text-xs font-bold rounded border border-primary/20 flex items-center gap-2 mb-2">
                                PIN verification required to proceed.
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="pin" className="text-xs uppercase font-bold text-muted-foreground">Security PIN</label>
                                <Input
                                    id="pin"
                                    type="password"
                                    pattern="[0-9]*"
                                    inputMode="numeric"
                                    placeholder="••••••"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="h-12 font-mono tracking-[0.5em] text-center text-xl"
                                    autoFocus
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setNeedPin(false)}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading || !pin.trim()}
                                    className="flex-[2]"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify PIN"}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="text-center space-y-2">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        Terminal Security Protocol &bull; AES-256
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Codes can be managed in the <span className="font-bold text-foreground">Device Enrollment</span> tab.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeviceLogin;

