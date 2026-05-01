
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

/**
 * useNFC - Hook to handle Web NFC interactions in the Kiosk.
 * Supported in Chrome for Android.
 * 
 * @param onTagDetected - Callback when an NFC tag is read
 */
export const useNFC = (onTagDetected: (serialNumber: string) => void) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('NDEFReader' in window) {
      setIsSupported(true);
    }
  }, []);

  const startScanning = useCallback(async () => {
    if (!isSupported) return;

    try {
      const reader = new (window as any).NDEFReader();
      await reader.scan();
      setIsReading(true);
      console.log("[NFC] Scanning started...");

      reader.addEventListener("readingerror", () => {
        console.error("[NFC] Reading error. Is the tag formatted correctly?");
      });

      reader.addEventListener("reading", ({ serialNumber }: any) => {
        console.log(`[NFC] Tag detected: ${serialNumber}`);
        onTagDetected(serialNumber);
      });

    } catch (error: any) {
      console.warn("[NFC] Scan failed to start:", error.message);
      setIsReading(false);
    }
  }, [isSupported, onTagDetected]);

  return {
    isSupported,
    isReading,
    startScanning
  };
};
