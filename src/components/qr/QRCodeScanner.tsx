
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Scan, X, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const lastScannedRef = useRef('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const { toast } = useToast();

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
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

    // Step 1: Make the container visible FIRST so it gets dimensions
    setShowContainer(true);

    // Step 2: Wait for React to render & layout to settle
    await new Promise(r => setTimeout(r, 600));

    try {
      await stopScanning();

      // Re-show after stopScanning may have hidden it
      setShowContainer(true);
      await new Promise(r => setTimeout(r, 300));

      const el = document.getElementById('kiosk-qr-reader');
      if (!el) throw new Error('Scanner container not found');

      console.log('[QR] Container dimensions:', el.offsetWidth, 'x', el.offsetHeight);

      const html5QrCode = new Html5Qrcode('kiosk-qr-reader');
      scannerRef.current = html5QrCode;

      // Enumerate cameras
      let devices: any[] = [];
      try { devices = await Html5Qrcode.getCameras(); } catch (e) { console.warn('[QR] getCameras:', e); }
      console.log('[QR] Found cameras:', devices.length);

      let cameraConfig: any = { facingMode: 'environment' };
      if (devices.length > 0) {
        const back = devices.find((d: any) => /back|rear|environment/i.test(d.label || ''));
        if (back) {
          cameraConfig = { deviceId: { exact: back.id } };
          console.log('[QR] Using back camera:', back.label);
        }
      }

      // Use a fixed qrbox that's guaranteed > 50px
      const containerWidth = el.offsetWidth || 300;
      const qrboxSize = Math.max(100, Math.min(250, Math.floor(containerWidth * 0.6)));

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: qrboxSize, height: qrboxSize },
        },
        (decodedText: string) => {
          if (decodedText !== lastScannedRef.current) {
            lastScannedRef.current = decodedText;
            if ('vibrate' in navigator) navigator.vibrate(200);
            onScanComplete(decodedText);
          }
        },
        undefined
      );

      if (mountedRef.current) {
        setIsActive(true);
        console.log('[QR] Camera started successfully, preview should be visible');
      }
    } catch (error: any) {
      console.error('[QR] Camera error:', error);
      const msg = error?.message || String(error);
      let userMsg = 'Camera failed to start.';
      if (/NotAllowed|Permission/i.test(msg)) userMsg = 'Camera permission denied. Allow camera in browser settings and reload.';
      else if (/NotFound|No cameras/i.test(msg)) userMsg = 'No camera found on this device.';
      else if (/NotReadable|in use/i.test(msg)) userMsg = 'Camera in use by another app.';
      else if (/size.*50|qrbox/i.test(msg)) userMsg = 'Camera display area too small. Try fullscreen or landscape mode.';
      else userMsg = msg.substring(0, 150);
      if (mountedRef.current) {
        setErrorMessage(userMsg);
        setShowContainer(false);
      }
    } finally {
      if (mountedRef.current) setIsStarting(false);
    }
  }, [isActive, isStarting, onScanComplete, stopScanning]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) { onScanComplete(manualInput.trim()); setManualInput(''); }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  const dm = darkMode;

  return (
    <div className="space-y-3">
      {/* 
        Scanner container — MUST be visible with real dimensions BEFORE html5-qrcode starts.
        We use showContainer (set before camera starts) to make it visible,
        and isActive (set after camera starts) for the stop button.
      */}
      <div
        id="kiosk-qr-reader"
        className="rounded-2xl overflow-hidden bg-black"
        style={{
          display: showContainer ? 'block' : 'none',
          width: '100%',
          minHeight: showContainer ? '320px' : '0',
        }}
      />

      {(isActive || isStarting) && (
        <Button
          onClick={stopScanning}
          variant="outline"
          size="sm"
          className={`w-full rounded-xl ${dm ? 'border-white/15 text-white/60 hover:bg-white/5' : ''}`}
        >
          <X className="h-4 w-4 mr-1.5" /> Stop Camera
        </Button>
      )}

      {!isActive && !isStarting && (
        <>
          {errorMessage ? (
            <div className={`flex items-start gap-2.5 p-3 rounded-xl ${dm ? 'bg-red-500/10 border border-red-500/15' : 'bg-red-50 border border-red-200'}`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${dm ? 'text-red-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className={`text-xs ${dm ? 'text-red-300' : 'text-red-700'}`}>{errorMessage}</p>
                <Button size="sm" variant="ghost" onClick={() => setErrorMessage('')} className="mt-1.5 text-xs h-7 px-2">Dismiss</Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={startScanning}
              className={`w-full h-14 rounded-xl text-base font-semibold ${dm ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
            >
              <Camera className="h-5 w-5 mr-2" />Start Camera
            </Button>
          )}
        </>
      )}

      {isStarting && (
        <div className={`text-center py-2 ${dm ? 'text-white/40' : 'text-muted-foreground'} text-xs flex items-center justify-center gap-2`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Starting camera, please allow access if prompted...
        </div>
      )}

      {/* Manual / Bluetooth entry */}
      <div className="flex gap-2">
        <Input
          placeholder="Manual / Bluetooth scan..."
          value={manualInput}
          onChange={e => setManualInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
          className={`text-sm rounded-xl ${dm ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-white/25' : ''}`}
        />
        <Button onClick={handleManualSubmit} variant="outline" size="icon" className={`rounded-xl shrink-0 ${dm ? 'border-white/10 text-white/50' : ''}`}>
          <Scan className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QRCodeScanner;
