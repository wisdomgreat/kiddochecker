
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Scan, X, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';

interface QRCodeScannerProps {
  onScanComplete: (data: string) => void;
  isScanning?: boolean;
  /** If true, automatically start scanning on mount */
  autoStart?: boolean;
  /** Dark mode styling for kiosk */
  darkMode?: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanComplete,
  isScanning = false,
  autoStart = false,
  darkMode = false,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerDivRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const startScanning = useCallback(async () => {
    if (isActive || isStarting) return;
    setIsStarting(true);
    setErrorMessage('');

    try {
      // Wait for next frame to ensure the div is rendered
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      // Double-check the element exists
      const element = document.getElementById('qr-reader-container');
      if (!element) {
        throw new Error('Scanner container not found in DOM');
      }

      // Clean up any previous instance
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }

      const html5QrCode = new Html5Qrcode("qr-reader-container");
      scannerRef.current = html5QrCode;

      // Try to get available cameras first
      const devices = await Html5Qrcode.getCameras();
      console.log('[QR Scanner] Available cameras:', devices.length, devices);

      if (devices.length === 0) {
        throw new Error('No cameras found on this device. Try connecting an external camera or using a Bluetooth scanner instead.');
      }

      // Prefer back camera, fallback to first available
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );

      const cameraConfig = backCamera
        ? { deviceId: { exact: backCamera.id } }
        : { facingMode: "environment" };

      await html5QrCode.start(
        cameraConfig as any,
        {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minDim * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (decodedText !== lastScanned) {
            setLastScanned(decodedText);
            // Vibrate on successful scan
            if ('vibrate' in navigator) navigator.vibrate(200);
            onScanComplete(decodedText);
            toast({
              title: "✅ QR Code Scanned",
              description: "Processing check-in...",
            });
          }
        },
        undefined
      );

      setIsActive(true);
      setHasPermission(true);
      console.log('[QR Scanner] Camera started successfully');
    } catch (error: any) {
      console.error('[QR Scanner] Camera error:', error);
      setHasPermission(false);
      const msg = error?.message || String(error);
      
      let userMessage = 'Camera access failed.';
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        userMessage = 'Camera permission denied. Please allow camera access in your browser settings, then reload.';
      } else if (msg.includes('NotFoundError') || msg.includes('No cameras')) {
        userMessage = msg;
      } else if (msg.includes('NotReadableError') || msg.includes('in use')) {
        userMessage = 'Camera is being used by another application. Close other apps and try again.';
      } else if (msg.includes('OverconstrainedError')) {
        userMessage = 'Camera configuration error. Try a different camera.';
      } else {
        userMessage = msg;
      }
      
      setErrorMessage(userMessage);
      toast({
        title: "Camera Access Failed",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  }, [isActive, isStarting, lastScanned, onScanComplete, toast]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('[QR Scanner] Error stopping:', error);
      }
      scannerRef.current = null;
    }
    setIsActive(false);
    setLastScanned('');
  }, []);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanComplete(manualInput.trim());
      setManualInput('');
    }
  };

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => startScanning(), 300);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
          scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
    };
  }, []);

  const bgClass = darkMode ? 'bg-white/[0.05] border-white/10' : 'bg-white border-slate-200';
  const textClass = darkMode ? 'text-white' : 'text-slate-900';
  const mutedClass = darkMode ? 'text-white/50' : 'text-muted-foreground';

  return (
    <div className={`rounded-2xl border ${bgClass} overflow-hidden`}>
      {/* The scanner div MUST always be in the DOM, we use hidden to control visibility */}
      <div className={isActive ? 'block' : 'hidden'}>
        <div id="qr-reader-container" ref={readerDivRef} className="w-full" />
        <div className="p-3 flex gap-2">
          <Button
            onClick={stopScanning}
            variant="outline"
            className={`flex-1 ${darkMode ? 'border-white/20 text-white/70 hover:bg-white/10' : ''}`}
          >
            <X className="h-4 w-4 mr-2" />
            Stop Camera
          </Button>
        </div>
      </div>

      {!isActive && (
        <div className="p-4 space-y-4">
          {/* Error state */}
          {errorMessage && (
            <div className={`flex items-start gap-3 p-3 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>{errorMessage}</p>
                <Button size="sm" variant="outline" onClick={() => { setErrorMessage(''); setHasPermission(null); }} className="mt-2 text-xs">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Start camera button */}
          {!errorMessage && (
            <div className="text-center py-4">
              <Button
                onClick={startScanning}
                disabled={isStarting}
                size="lg"
                className={`h-12 px-6 rounded-xl ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
              >
                {isStarting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting Camera...</>
                ) : (
                  <><Camera className="h-4 w-4 mr-2" /> Start Camera</>
                )}
              </Button>
            </div>
          )}

          {/* Manual input always available */}
          <div className="space-y-1.5">
            <label className={`text-xs font-medium ${mutedClass}`}>Manual / Bluetooth Scanner Entry</label>
            <div className="flex gap-2">
              <Input
                placeholder="Scan or type QR code..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className={`${darkMode ? 'bg-white/10 border-white/20 text-white placeholder:text-white/30' : ''}`}
              />
              <Button onClick={handleManualSubmit} variant="outline" className={darkMode ? 'border-white/20 text-white/70' : ''}>
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
