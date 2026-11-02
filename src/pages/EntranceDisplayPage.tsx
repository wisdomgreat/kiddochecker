import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Sparkles, Maximize2, Minimize2, RefreshCw, Church } from "lucide-react";

export const EntranceDisplayPage = () => {
  const [token, setToken] = useState("");
  const [qrData, setQrData] = useState("");
  const [expiresInMs, setExpiresInMs] = useState(30000);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [churchName, setChurchName] = useState("Green Valley Alliance Church");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchToken = async () => {
    try {
      const baseUrl = import.meta.env.VITE_LOCAL_BACKEND_URL || "";
      const res = await fetch(`${baseUrl}/api/entrance-code/current`);
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setQrData(data.qrData || `KIDDO-DOOR:default_org:${data.token}`);
        setExpiresInMs(data.expiresInMs || 30000);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.warn("[EntranceDisplay] Fetch code error:", err);
    }
  };

  useEffect(() => {
    fetchToken();
    const interval = setInterval(fetchToken, 10000); // Poll/resync every 10s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer for countdown ring
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - lastRefreshed.getTime();
      const remaining = Math.max(0, Math.ceil((expiresInMs - elapsed) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        fetchToken();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRefreshed, expiresInMs]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden relative font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">{churchName}</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">Lobby Entrance Verification Display</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Security Sync</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Central QR Code Stage */}
      <main className="flex-1 flex flex-col items-center justify-center my-6 z-10 text-center">
        <div className="max-w-md w-full flex flex-col items-center p-8 sm:p-10 rounded-3xl bg-[#0c1322]/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-extrabold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mobile Express Check-In</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Scan to Check In
          </h2>
          <p className="text-sm text-slate-400 mb-6 max-w-xs font-medium">
            Open your camera or the church app on your phone to check in your children now.
          </p>

          {/* QR Container with High Contrast & Soft Corner Radius */}
          <div className="p-5 bg-white rounded-3xl shadow-2xl relative group">
            {qrData ? (
              <QRCodeSVG
                value={qrData}
                size={240}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div className="w-60 h-60 flex items-center justify-center bg-slate-100 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Dynamic Refresh Bar & Backup Code */}
          <div className="w-full mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                <span>Security Token Rotates</span>
              </span>
              <span className="font-mono text-blue-400">{secondsRemaining}s</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(secondsRemaining / 30) * 100}%` }}
              />
            </div>

            {/* Backup Manual Code */}
            {token && (
              <div className="pt-2 text-center">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  Manual Entrance Code:
                </p>
                <p className="text-xl font-mono font-black tracking-widest text-emerald-400 mt-0.5">
                  {token}
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer Info */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 z-10 border-t border-slate-800/80 pt-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Physical entrance verified • Encrypted 30s rotating cryptographic nonces</span>
        </div>
        <p className="font-mono text-[11px] text-slate-600">
          Terminal Mode • Auto-refreshes continuously
        </p>
      </footer>
    </div>
  );
};

export default EntranceDisplayPage;

