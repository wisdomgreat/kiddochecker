import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, Check, HeartHandshake, Vibrate, Volume2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Gentle Web Audio Synthesizer chime - friendly, calm, non-jarring.
 */
function playFriendlyChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Soft two-tone chime (D5 -> A5)
    playTone(587.33, 0, 0.45);
    playTone(880.0, 0.25, 0.65);
  } catch (e) {
    // AudioContext blocked by browser policy until interaction
  }
}

/**
 * Triggers physical vibration on supported mobile devices (PWA / Android / Mobile browsers)
 */
export function triggerHapticPaging(pattern: number[] = [400, 180, 400, 180, 600]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
      return true;
    } catch (e) {
      console.warn("Vibration failed:", e);
    }
  }
  return false;
}

interface SanctuaryPageReceiverProps {
  familyCode?: string;
}

export const SanctuaryPageReceiver: React.FC<SanctuaryPageReceiverProps> = ({ familyCode }) => {
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(() => new Set());
  const [activeAlert, setActiveAlert] = useState<any>(null);

  const cleanCode = familyCode?.trim().toUpperCase();

  const { data } = useQuery({
    queryKey: ["sanctuary-active-page", cleanCode],
    queryFn: async () => {
      if (!cleanCode) return null;
      try {
        const res = await apiFetch(`/api/sanctuary/active?family_code=${encodeURIComponent(cleanCode)}`);
        return res?.active_page || null;
      } catch (e) {
        return null;
      }
    },
    enabled: !!cleanCode,
    refetchInterval: 8000, // Poll every 8 seconds
  });

  useEffect(() => {
    if (data && data.id && !acknowledgedIds.has(data.id) && !data.acknowledged) {
      setActiveAlert(data);
      // Trigger physical mobile vibration!
      triggerHapticPaging([450, 180, 450, 180, 700]);
      // Gentle chime
      playFriendlyChime();
    }
  }, [data, acknowledgedIds]);

  const handleAcknowledge = async () => {
    if (!activeAlert) return;
    const pageId = activeAlert.id;
    setAcknowledgedIds((prev) => new Set(prev).add(pageId));
    setActiveAlert(null);

    // Stop vibration immediately
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(0);
    }

    try {
      await apiFetch("/api/sanctuary/acknowledge", {
        method: "POST",
        body: JSON.stringify({ family_code: cleanCode }),
      });
      toast.success("Thank you! Staff have been notified that you're on your way.");
    } catch (e) {
      // Non-blocking
    }
  };

  if (!activeAlert) return null;

  return (
    <>
      {/* Sticky top alert bar */}
      <div className="fixed top-12 md:top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-bounce duration-1000 shadow-xl rounded-xl border border-primary/30 bg-card p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">
              {activeAlert.child_name ? `${activeAlert.child_name} Needs You` : "Family Callout"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {activeAlert.reason || "Attention requested in children area"}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleAcknowledge} className="h-7 px-2.5 text-xs shrink-0">
          On My Way
        </Button>
      </div>

      {/* Main Friendly Modal */}
      <Dialog open={!!activeAlert} onOpenChange={(open) => !open && handleAcknowledge()}>
        <DialogContent className="max-w-md p-5 sm:p-6">
          <DialogHeader>
            <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 shadow-sm">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg sm:text-xl font-bold">
              Children Ministry Assistance Requested
            </DialogTitle>
            <DialogDescription className="text-center text-xs sm:text-sm text-muted-foreground mt-1">
              {activeAlert.child_name ? (
                <>
                  Our staff is requesting your attention for <strong>{activeAlert.child_name}</strong>.
                </>
              ) : (
                "Our childcare team has requested your attention."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/40 rounded-xl p-3.5 space-y-2 border border-border/60 my-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sanctuary Code:</span>
              <span className="font-mono font-bold tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded">
                #{activeAlert.family_code}
              </span>
            </div>
            <div className="text-xs">
              <span className="text-muted-foreground">Reason:</span>
              <p className="font-medium text-foreground mt-0.5">{activeAlert.reason}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <Vibrate className="h-3 w-3 text-primary shrink-0" />
              <span>Your phone vibrated to discreetly alert you during service.</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              className="w-full sm:w-auto flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={handleAcknowledge}
            >
              <Check className="h-4 w-4" />
              I'm On My Way (Acknowledge)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SanctuaryPageReceiver;
