import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import QRCodeScanner from "@/components/qr/QRCodeScanner";
import { 
  MapPin, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  Baby, 
  ArrowRight,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface MobileCheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childrenList: any[];
  onCheckInSuccess?: () => void;
}

export const MobileCheckInDialog: React.FC<MobileCheckInDialogProps> = ({
  open,
  onOpenChange,
  childrenList,
  onCheckInSuccess,
}) => {
  const [step, setStep] = useState<"gps" | "qr" | "children" | "completed">("gps");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  // Geolocation state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geofenceConfig, setGeofenceConfig] = useState<any>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  // Entrance code state
  const [entranceCode, setEntranceCode] = useState("");
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [entranceVerified, setEntranceVerified] = useState(false);

  // Child selection & notes
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  const [specialNotes, setSpecialNotes] = useState("");

  // Result state
  const [claimCode, setClaimCode] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [checkedInCount, setCheckedInCount] = useState(0);

  // Initialize selected children with all children by default
  useEffect(() => {
    if (childrenList.length > 0) {
      setSelectedChildIds(new Set(childrenList.map((c: any) => c.id)));
    }
  }, [childrenList]);

  // Fetch church geofence on dialog open
  useEffect(() => {
    if (open) {
      setStep("gps");
      setErrorMessage("");
      fetchGeofence();
    }
  }, [open]);

  const fetchGeofence = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL_BACKEND_URL || "https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io";
      const res = await fetch(`${baseUrl}/api/church/geofence`);
      if (res.ok) {
        const data = await res.json();
        setGeofenceConfig(data.geofence);
      }
    } catch (e) {
      console.warn("Could not fetch geofence config", e);
    }
  };

  // Step 1: Verify GPS
  const handleVerifyLocation = () => {
    setLoading(true);
    setErrorMessage("");

    if (!("geolocation" in navigator)) {
      setErrorMessage("Geolocation is not supported by your mobile browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(loc);

        // Calculate distance if church geofence coordinates are set
        if (geofenceConfig?.enabled && geofenceConfig?.latitude && geofenceConfig?.longitude) {
          const R = 6371e3;
          const phi1 = (loc.latitude * Math.PI) / 180;
          const phi2 = (geofenceConfig.latitude * Math.PI) / 180;
          const deltaPhi = ((geofenceConfig.latitude - loc.latitude) * Math.PI) / 180;
          const deltaLambda = ((geofenceConfig.longitude - loc.longitude) * Math.PI) / 180;

          const a =
            Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const dist = R * c;
          setDistanceMeters(dist);

          const maxRadius = geofenceConfig.radius_meters || 250;
          if (dist > maxRadius) {
            const distMiles = (dist / 1609.34).toFixed(1);
            setErrorMessage(
              `You are currently ${distMiles} miles from ${geofenceConfig.church_name || "church"}. Express Mobile Check-In activates once you arrive on church campus.`
            );
            setLoading(false);
            return;
          }
        }

        setLoading(false);
        // Advance to Entrance QR step
        setStep("qr");
      },
      (err) => {
        setLoading(false);
        setErrorMessage(
          err.code === 1
            ? "Location permission was denied. Please allow location access in your browser settings to verify you are at church."
            : "Unable to retrieve precise GPS coordinates. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Step 2: Verify Entrance QR
  const handleVerifyQrCode = async (codeToVerify: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const baseUrl = import.meta.env.VITE_LOCAL_BACKEND_URL || "";
      const res = await fetch(`${baseUrl}/api/entrance-code/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToVerify }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setErrorMessage(data.error || "Invalid or expired entrance code. Please scan the current code on the entrance screen.");
        setLoading(false);
        return;
      }

      setEntranceCode(codeToVerify);
      setEntranceVerified(true);
      setLoading(false);
      setStep("children");
    } catch (e: any) {
      setErrorMessage("Could not verify entrance code: " + e.message);
      setLoading(false);
    }
  };

  // Step 3: Execute Check-in & Auto-print
  const handleExecuteCheckIn = async () => {
    if (selectedChildIds.size === 0) {
      setErrorMessage("Please select at least one child to check in.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const selectedChildren = childrenList
        .filter((c: any) => selectedChildIds.has(c.id))
        .map((c: any) => ({
          child_id: c.id,
          class_id: c.class_id,
          special_instructions: specialNotes,
        }));

      const baseUrl = import.meta.env.VITE_LOCAL_BACKEND_URL || "";
      const token = localStorage.getItem("kiddo_token") || "";

      const res = await fetch(`${baseUrl}/api/mobile-checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          children: selectedChildren,
          entrance_code: entranceCode,
          location: userLocation,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.innerWidth}x${window.innerHeight}`,
          },
          notes: specialNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Mobile check-in failed. Please try at the lobby kiosk.");
        setLoading(false);
        return;
      }

      setClaimCode(data.claim_code || "");
      setFamilyCode(data.family_code || "");
      setCheckedInCount(data.checkins?.length || selectedChildren.length);
      setStep("completed");
      if (onCheckInSuccess) onCheckInSuccess();
    } catch (err: any) {
      setErrorMessage("Network error during mobile check-in: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleChild = (childId: string) => {
    const next = new Set(selectedChildIds);
    if (next.has(childId)) next.delete(childId);
    else next.add(childId);
    setSelectedChildIds(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[94vw] p-5 sm:p-6 rounded-3xl bg-[#0c1322] border border-slate-800 text-white shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[11px] font-black uppercase tracking-wider w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Express Mobile Check-In</span>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {step === "gps" && "Verify Church Location"}
            {step === "qr" && "Scan Entrance Display"}
            {step === "children" && "Select Children & Notes"}
            {step === "completed" && "Checked In & Tag Printed!"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-400 font-medium">
            {step === "gps" && "Ensure you are physically on church grounds before checking in."}
            {step === "qr" && "Point your camera at the rotating QR display at the church door."}
            {step === "children" && "Select which children are attending and add any drop-off notes."}
            {step === "completed" && "Your badges have been automatically queued to the Brother QL printer."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ─── Step 1: Geofence GPS ─── */}
        {step === "gps" && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Geofence Perimeter Security</h4>
                  <p className="text-xs text-slate-400">
                    {geofenceConfig?.church_name || "Green Valley Alliance Church"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                For child safety and audit compliance, mobile check-in is only available when you have arrived at the church address.
              </p>
            </div>

            <Button
              onClick={handleVerifyLocation}
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-950/50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MapPin className="w-4 h-4 mr-2" />}
              {loading ? "Verifying GPS..." : "Verify My Location & Continue"}
            </Button>
          </div>
        )}

        {/* ─── Step 2: Entrance QR Scan ─── */}
        {step === "qr" && (
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Location Verified: You are on church grounds.</span>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Scan Rotating Entrance Screen:
              </p>
              <QRCodeScanner
                onScanComplete={(data) => handleVerifyQrCode(data)}
                darkMode={true}
                compact={true}
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-500">Or Type Code</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g. 9A2F48B1"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-800 text-white font-mono uppercase text-sm tracking-widest h-10"
                maxLength={12}
              />
              <Button
                onClick={() => handleVerifyQrCode(manualCodeInput)}
                disabled={loading || manualCodeInput.length < 6}
                className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Select Children & Special Instructions ─── */}
        {step === "children" && (
          <div className="space-y-4 py-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select children to drop off:
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {childrenList.map((child: any) => {
                const isSelected = selectedChildIds.has(child.id);
                return (
                  <div
                    key={child.id}
                    onClick={() => toggleChild(child.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-950/40 border-blue-500/60"
                        : "bg-slate-950/60 border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleChild(child.id)}
                        className="rounded-md data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {child.first_name} {child.last_name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {child.age ? `Age ${child.age}` : "Child"} • {child.current_class_name || "General"}
                        </p>
                      </div>
                    </div>

                    {child.allergies && (
                      <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-300 bg-amber-950/40">
                        ⚠️ Allergy Alert
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400">
                Drop-off Notes / Special Instructions (Optional):
              </label>
              <Input
                placeholder="e.g., Diaper bag on shelf, Picked up by Grandma"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <Button
              onClick={handleExecuteCheckIn}
              disabled={loading || selectedChildIds.size === 0}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
              {loading ? "Processing Check-In..." : `Check In & Print Badges (${selectedChildIds.size})`}
            </Button>
          </div>
        )}

        {/* ─── Step 4: Digital Claim Pass ─── */}
        {step === "completed" && (
          <div className="space-y-5 py-2 text-center">
            {/* Success badge */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">Check-In Successful!</h3>
              <p className="text-xs text-slate-400">
                {checkedInCount} badge{checkedInCount > 1 ? "s" : ""} automatically sent to the Brother QL printer in the lobby.
              </p>
            </div>

            {/* Digital Claim Pass Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-3 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Digital Claim Pass
                </span>
                <span className="text-xs font-mono font-black text-blue-300">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Pickup Security Code</span>
                  <p className="text-2xl font-mono font-black text-emerald-400 tracking-widest mt-0.5">
                    {claimCode}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Sanctuary Pager</span>
                  <p className="text-2xl font-mono font-black text-blue-400 tracking-wider mt-0.5">
                    #{familyCode}
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-200 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Show this 4-character pickup code to the classroom teacher when picking up your child.</span>
              </div>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Done & Return to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

