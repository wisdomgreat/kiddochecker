import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Save, Loader2, Lock } from "lucide-react";

const KioskSettings = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [pin, setPin] = useState("");
    const [requirePin, setRequirePin] = useState(false);
    const [saving, setSaving] = useState(false);

    const { data: settings, isLoading } = useQuery({
        queryKey: ["kiosk-settings-admin"],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from('kiosk_settings' as any) as any)
                .select('*');

            if (error) throw error;
            return data as any[];
        },
    });

    useEffect(() => {
        if (settings) {
            const pinSetting = settings.find(s => s.setting_key === 'kiosk_pin');
            const requirePinSetting = settings.find(s => s.setting_key === 'require_pin');

            if (pinSetting) setPin(pinSetting.setting_value);
            if (requirePinSetting) setRequirePin(requirePinSetting.setting_value === 'true');
        }
    }, [settings]);

    const saveSettings = async () => {
        try {
            setSaving(true);

            // Upsert PIN
            const { error: pinError } = await (supabase
                .from('kiosk_settings' as any) as any)
                .upsert({
                    setting_key: 'kiosk_pin',
                    setting_value: pin
                } as any, { onConflict: 'setting_key' });

            if (pinError) throw pinError;

            // Upsert Require PIN
            const { error: requireError } = await (supabase
                .from('kiosk_settings' as any) as any)
                .upsert({
                    setting_key: 'require_pin',
                    setting_value: requirePin ? 'true' : 'false'
                } as any, { onConflict: 'setting_key' });

            if (requireError) throw requireError;

            toast({
                title: "Settings Saved",
                description: "Kiosk security settings have been updated.",
            });

            queryClient.invalidateQueries({ queryKey: ["kiosk-settings-admin"] });
            queryClient.invalidateQueries({ queryKey: ["kiosk-settings"] });
        } catch (error: any) {
            console.error("Error saving kiosk settings:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save settings.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm">
            <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded border border-primary/20">
                        <Monitor className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle>Kiosk Security</CardTitle>
                        <CardDescription>Configure access control for the check-in station.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-md bg-muted/30">
                    <div className="space-y-1">
                        <Label className="text-sm font-bold">Require PIN for Kiosk</Label>
                        <p className="text-xs text-muted-foreground">
                            Force staff to enter a PIN to access child data at the kiosk.
                        </p>
                    </div>
                    <Switch
                        checked={requirePin}
                        onCheckedChange={setRequirePin}
                    />
                </div>

                <div className={`space-y-3 ${!requirePin && 'opacity-50 pointer-events-none'}`}>
                    <div className="space-y-1.5">
                        <Label htmlFor="kiosk-pin" className="text-xs font-bold uppercase text-muted-foreground">Station Master PIN</Label>
                        <div className="relative max-w-xs">
                            <Input
                                id="kiosk-pin"
                                type="text"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                placeholder="6-digit PIN"
                                className="pl-9 font-mono tracking-widest h-10"
                            />
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            Shared across all kiosks. Use a unique 6-digit code.
                        </p>
                    </div>
                </div>

                <div className="pt-2">
                    <Button onClick={saveSettings} disabled={saving} className="min-w-[140px]">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Kiosk Settings
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default KioskSettings;

