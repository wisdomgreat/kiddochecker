
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
  const [errorMessage, setErrorMessage] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [lastScanned, setLastScanned] = useState('');
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
    if (mountedRef.current) { setIsActive(false); setLastScanned(''); }
  }, []);

  const startScanning = useCallback(async () => {
    if (isActive || isStarting) return;
    setIsStarting(true);
    setErrorMessage('');

    try {
      await stopScanning();

      // Make the container visible and give it proper dimensions first
      const el = document.getElementById('kiosk-qr-reader');
      if (!el) throw new Error('Scanner container not found');
      
      // Ensure the element is visible and has dimensions
      el.style.display = 'block';
      el.style.width = '100%';
      el.style.minHeight = '300px';

      // Wait for layout to settle
      await new Promise(r => setTimeout(r, 400));

      const html5QrCode = new Html5Qrcode('kiosk-qr-reader');
      scannerRef.current = html5QrCode;

      // Enumerate cameras
      let devices: any[] = [];
      try { devices = await Html5Qrcode.getCameras(); } catch {}

      let cameraConfig: any = { facingMode: 'environment' };
      if (devices.length > 0) {
        const back = devices.find((d: any) => /back|rear|environment/i.test(d.label || ''));
        if (back) cameraConfig = { deviceId: { exact: back.id } };
      }

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          if (decodedText !== lastScanned) {
            setLastScanned(decodedText);
            if ('vibrate' in navigator) navigator.vibrate(200);
            onScanComplete(decodedText);
          }
        },
        undefined
      );

      if (mountedRef.current) setIsActive(true);
    } catch (error: any) {
      console.error('[QR] Camera error:', error);
      const msg = error?.message || String(error);
      let userMsg = 'Camera failed to start.';
      if (/NotAllowed|Permission/i.test(msg)) userMsg = 'Camera permission denied. Allow camera in your browser settings.';
      else if (/NotFound|No cameras/i.test(msg)) userMsg = 'No camera found on this device.';
      else if (/NotReadable|in use/i.test(msg)) userMsg = 'Camera in use by another app.';
      else if (/size.*50px|qrbox/i.test(msg)) userMsg = 'Camera display too small. Try rotating your device or using fullscreen mode.';
      else userMsg = msg.substring(0, 120);
      if (mountedRef.current) {
        setErrorMessage(userMsg);
        // Hide the container again on error
        const el = document.getElementById('kiosk-qr-reader');
        if (el) el.style.display = 'none';
      }
    } finally {
      if (mountedRef.current) setIsStarting(false);
    }
  }, [isActive, isStarting, lastScanned, onScanComplete, stopScanning]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) { onScanComplete(manualInput.trim()); setManualInput(''); }
  };

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
      {/* Scanner container — always in DOM, starts hidden, made visible by startScanning */}
      <div
        id="kiosk-qr-reader"
        style={{ display: isActive ? 'block' : 'none', width: '100%', minHeight: isActive ? '300px' : '0' }}
        className="rounded-2xl overflow-hidden"
      />

      {isActive && (
        <Button onClick={stopScanning} variant="outline" size="sm" className={`w-full rounded-xl ${dm ? 'border-white/15 text-white/60 hover:bg-white/5' : ''}`}>
          <X className="h-4 w-4 mr-1.5" /> Stop Camera
        </Button>
      )}

      {!isActive && (
        <>
          {errorMessage ? (
            <div className={`flex items-start gap-2.5 p-3 rounded-xl ${dm ? 'bg-red-500/10 border border-red-500/15' : 'bg-red-50 border border-red-200'}`}>
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${dm ? 'text-red-400' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className={`text-xs ${dm ? 'text-red-300' : 'text-red-700'}`}>{errorMessage}</p>
                <Button size="sm" variant="ghost" onClick={() => { setErrorMessage(''); }} className="mt-1.5 text-xs h-7 px-2">Dismiss</Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={startScanning}
              disabled={isStarting}
              className={`w-full h-14 rounded-xl text-base font-semibold ${dm ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : ''}`}
            >
              {isStarting ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Starting Camera...</> : <><Camera className="h-5 w-5 mr-2" />Start Camera</>}
            </Button>
          )}
        </>
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
