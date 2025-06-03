
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Square } from 'lucide-react';

interface QRCodeScannerProps {
  onScanComplete: (data: string) => void;
  isScanning?: boolean;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onScanComplete, 
  isScanning = false 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasPermission(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  const handleManualInput = () => {
    const input = prompt('Enter attendance ID manually:');
    if (input) {
      onScanComplete(input.trim());
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPermission === false && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Camera access denied</p>
            <Button onClick={handleManualInput} variant="outline">
              Enter Code Manually
            </Button>
          </div>
        )}

        {hasPermission === null && (
          <div className="text-center py-8">
            <Button onClick={startScanning}>
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}

        {isActive && (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Square className="h-32 w-32 text-white opacity-50" strokeWidth={2} />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                Stop Scanning
              </Button>
              <Button onClick={handleManualInput} variant="outline" className="flex-1">
                Manual Entry
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Position the QR code within the square to scan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
