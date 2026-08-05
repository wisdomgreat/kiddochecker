
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Scan, X, Loader2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScanComplete: (data: string) => void;
  darkMode?: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanComplete, darkMode = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showContainer, setShowContainer] = useState(false); // Controls div visibility BEFORE camera starts
  const [errorMessage, setErrorMessage] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const lastScannedRef = useRef('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { }
      try { scannerRef.current.clear(); } catch { }
      scannerRef.current = null;
    }
    if (mountedRef.current) {
      setIsActive(false);
      setShowContainer(false);
      lastScannedRef.current = '';
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (isActive || isStarting) return;
    setIsStarting(true);
    setErrorMessage('');

    // Step 1: Make container visible
    setShowContainer(true);

    // Step 2: Give React extra time to mount the DOM element
    await new Promise(r => setTimeout(r, 800));

    try {
      // Cleanup previous instances properly
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (e) { }
        try { scannerRef.current.clear(); } catch (e) { }
        scannerRef.current = null;
      }

      const el = document.getElementById('kiosk-qr-reader');
      if (!el) {
        console.error('[QR] DOM element not found after 800ms');
        throw new Error('Scanner display area failed to initialize. Please try restarting your browser.');
      }

      const html5QrCode = new Html5Qrcode('kiosk-qr-reader');
      scannerRef.current = html5QrCode;

      // Camera selection logic
      const devices = await Html5Qrcode.getCameras().catch(() => []);
      setAvailableCameras(devices);
      console.log('[QR] Available cameras:', devices.length);

      const cameraConfig = { facingMode: facingMode };

      const containerWidth = el.offsetWidth || 300;
      const qrboxSize = Math.max(120, Math.min(280, Math.floor(containerWidth * 0.7)));

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
        },
        (decodedText: string) => {
          if (decodedText !== lastScannedRef.current) {
            lastScannedRef.current = decodedText;
            if ('vibrate' in navigator) {
              try { navigator.vibrate(100); } catch (e) { }
            }
            onScanComplete(decodedText);
          }
        },
        () => { }
      );

      if (mountedRef.current) {
        setIsActive(true);
      }
    } catch (error: any) {
      console.error('[QR] Start error:', error);
      const msg = error?.message || String(error);
      let userMsg = 'Camera initialization failed.';

      if (/NotAllowed|Permission/i.test(msg)) userMsg = 'Camera permission denied. Please allow access in settings.';
      else if (/NotFound|No cameras/i.test(msg)) userMsg = 'No camera hardware detected.';
      else if (/NotReadable|in use/i.test(msg)) userMsg = 'Camera is currently being used by another application.';
      else if (/size.*50|qrbox/i.test(msg)) userMsg = 'Browser window is too small for the scanner.';
      else userMsg = `Error: ${msg.split('\n')[0].substring(0, 100)}`;

      if (mountedRef.current) {
        setErrorMessage(userMsg);
        setShowContainer(false);
      }
    } finally {
      if (mountedRef.current) setIsStarting(false);
    }
  }, [isActive, isStarting, onScanComplete, facingMode]);

  const handleFlipCamera = async () => {
    const wasActive = isActive;
    await stopScanning();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    // If it was already active, restart it with the new mode
    if (wasActive) {
      // Need a small timeout for state to propagate
      setTimeout(() => startScanning(), 100);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) { onScanComplete(manualInput.trim()); setManualInput(''); }
  };

  // Cleanup & auto-start on mount
  useEffect(() => {
    startScanning();
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch { }
        try { scannerRef.current.clear(); } catch { }
        scannerRef.current = null;
      }
    };
  }, [startScanning]);

  const dm = darkMode;

  return (
    <div className="space-y-3">
      {/* 
        Scanner container — MUST be visible with real dimensions BEFORE html5-qrcode starts.
        We use showContainer (set before camera starts) to make it visible,
        and isActive (set after camera starts) for the stop button.
      */}
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 group shadow-2xl bg-black">
        <div
          id="kiosk-qr-reader"
          className="w-full"
          style={{
            display: showContainer ? 'block' : 'none',
            minHeight: showContainer ? '320px' : '0',
          }}
        />

        {/* Professional Overlay */}
        {(isActive || isStarting) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative pointer-events-auto">
              {/* Corners */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl" />

              {/* Scan Line */}
              {isActive && (
                <div className="absolute top-0 left-2 right-2 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-[scan_2s_linear_infinite] shadow-[0_0_15px_rgba(129,140,248,0.8)]" />
              )}

              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-3xl">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Initializing...</span>
                  </div>
                </div>
              )}

              {/* Flip Button - Only if more than 1 camera */}
              {availableCameras.length > 1 && (
                <button
                  onClick={(e) => { e.preventDefault(); handleFlipCamera(); }}
                  className="absolute bottom-4 right-4 h-10 w-10 bg-black/40 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center text-white/80 transition-all hover:bg-black/60 active:scale-90"
                  title="Switch Camera"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* No active scanner view */}
        {!isActive && !isStarting && !showContainer && (
          <div className={`h-80 flex flex-col items-center justify-center gap-6 p-8 text-center ${dm ? 'bg-card/[0.02]' : 'bg-slate-50'}`}>
            <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center ${dm ? 'bg-card/5 text-white/20' : 'bg-card text-slate-200 shadow-sm'}`}>
              <Camera className="h-8 w-8" />
            </div>
            <div>
              <p className={`text-sm font-bold uppercase tracking-widest ${dm ? 'text-white/40' : 'text-slate-400'}`}>Camera Offline</p>
              <p className={`text-xs mt-1 font-medium ${dm ? 'text-white/20' : 'text-slate-400'}`}>Tap the button below to reactivate scanning</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        #kiosk-qr-reader video {
          object-fit: cover !important;
          border-radius: 2rem !important;
        }
        #kiosk-qr-reader img { display: none !important; }
        #kiosk-qr-reader__dashboard { display: none !important; }
        #kiosk-qr-reader__header { display: none !important; }
        #kiosk-qr-reader__status_span { display: none !important; }
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>

      {/* Controls */}
      <div className="space-y-3 mt-4">
        {(isActive || isStarting) ? (
          <Button
            onClick={stopScanning}
            variant="outline"
            className={`w-full h-12 rounded-2xl ${dm ? 'border-white/10 text-white/50 bg-card/5 hover:bg-card/10' : 'bg-card shadow-sm'}`}
          >
            <X className="h-4 w-4 mr-2" /> Stop Scanning
          </Button>
        ) : (
          <>
            {errorMessage ? (
              <div className={`flex items-start gap-4 p-5 rounded-3xl ${dm ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${dm ? 'text-red-400' : 'text-red-500'}`} />
                <div className="flex-1">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${dm ? 'text-red-400/60' : 'text-red-600/60'}`}>Hardware Alert</p>
                  <p className={`text-sm font-bold ${dm ? 'text-white/80' : 'text-foreground'}`}>{errorMessage}</p>
                  <Button size="sm" variant="ghost" onClick={() => setErrorMessage('')} className="mt-3 text-[10px] h-8 px-4 font-bold uppercase tracking-widest bg-black/5 hover:bg-black/10 rounded-full">Re-Attempt</Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={startScanning}
                className={`w-full h-16 rounded-[1.5rem] text-lg font-bold uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${dm ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20' : 'bg-slate-900 hover:bg-black text-white'}`}
              >
                <Scan className="h-6 w-6 mr-3" /> Initialize Camera
              </Button>
            )}
          </>
        )}

        <div className="relative group">
          <Input
            placeholder="Manual Authentication Code"
            value={manualInput}
            onChange={e => setManualInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            className={`h-12 pl-12 pr-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all ${dm ? 'bg-card/5 border-white/10 text-white placeholder:text-white/20 focus:ring-indigo-500/20' : 'bg-card border-slate-200'}`}
          />
          <Scan className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${dm ? 'text-white/20' : 'text-slate-300'}`} />
          <Button
            onClick={handleManualSubmit}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeScanner;

