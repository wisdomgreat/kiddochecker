
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Scan, X, Loader2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScanComplete: (data: string) => void;
  darkMode?: boolean;
  compact?: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanComplete, darkMode = false, compact = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showContainer, setShowContainer] = useState(false);
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
    setShowContainer(true);

    await new Promise(r => setTimeout(r, 400));

    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (e) { }
        try { scannerRef.current.clear(); } catch (e) { }
        scannerRef.current = null;
      }

      const el = document.getElementById('kiosk-qr-reader');
      if (!el) {
        throw new Error('Scanner display area failed to initialize.');
      }

      const html5QrCode = new Html5Qrcode('kiosk-qr-reader');
      scannerRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras().catch(() => []);
      setAvailableCameras(devices);

      const containerWidth = el.offsetWidth || 240;
      const qrboxSize = Math.max(100, Math.min(220, Math.floor(containerWidth * 0.75)));

      await html5QrCode.start(
        { facingMode: facingMode },
        {
          fps: 15,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0,
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

      if (/NotAllowed|Permission/i.test(msg)) userMsg = 'Camera permission denied.';
      else if (/NotFound|No cameras/i.test(msg)) userMsg = 'No camera detected.';
      else if (/NotReadable|in use/i.test(msg)) userMsg = 'Camera in use by another app.';
      else userMsg = `Camera error: ${msg.split('\n')[0].substring(0, 60)}`;

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
    if (wasActive) {
      setTimeout(() => startScanning(), 100);
    }
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) { onScanComplete(manualInput.trim()); setManualInput(''); }
  };

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
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="relative w-full h-full min-h-[160px] max-h-[220px] overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
        <div
          id="kiosk-qr-reader"
          className="w-full h-full flex items-center justify-center"
          style={{
            display: showContainer ? 'flex' : 'none',
          }}
        />

        {/* Professional Overlay */}
        {(isActive || isStarting) && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-36 h-36 border-2 border-white/20 rounded-2xl relative pointer-events-auto shadow-2xl">
              {/* Corners */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-blue-500 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-blue-500 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-blue-500 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-blue-500 rounded-br-lg" />

              {/* Laser Scan Line */}
              {isActive && (
                <div className="absolute top-0 left-1 right-1 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scan_1.8s_linear_infinite] shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
              )}

              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs rounded-2xl">
                  <div className="flex flex-col items-center gap-1.5">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">Starting...</span>
                  </div>
                </div>
              )}

              {/* Flip Button */}
              {availableCameras.length > 1 && (
                <button
                  onClick={(e) => { e.preventDefault(); handleFlipCamera(); }}
                  className="absolute bottom-2 right-2 h-7 w-7 bg-black/60 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center text-white/90 hover:bg-black active:scale-90"
                  title="Switch Camera"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* No active scanner / Error view */}
        {!isActive && !isStarting && !showContainer && (
          <div className="h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-slate-900 text-slate-400">
            <Camera className="h-6 w-6 text-slate-500" />
            <p className="text-xs font-bold text-slate-400">{errorMessage || 'Camera Offline'}</p>
            <Button size="sm" variant="ghost" onClick={startScanning} className="h-7 text-[10px] uppercase font-bold text-blue-400 hover:text-white">
              Try Again
            </Button>
          </div>
        )}
      </div>

      <style>{`
        #kiosk-qr-reader {
          overflow: hidden !important;
        }
        #kiosk-qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0.75rem !important;
        }
        #kiosk-qr-reader img { display: none !important; }
        #kiosk-qr-reader__dashboard { display: none !important; }
        #kiosk-qr-reader__header { display: none !important; }
        #kiosk-qr-reader__status_span { display: none !important; }
        #kiosk-qr-reader__scan_region { display: flex !important; align-items: center !important; justify-content: center !important; }
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}</style>

      {/* Optional Extra Controls (Only if not in compact mode) */}
      {!compact && (
        <div className="w-full space-y-2 mt-2">
          <div className="relative">
            <Input
              placeholder="Or type pass code..."
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
              className="h-9 pl-9 pr-3 rounded-xl text-xs bg-slate-100 border-slate-200 text-slate-800"
            />
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Button
              onClick={handleManualSubmit}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;

