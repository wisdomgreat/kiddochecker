
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Square, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [manualInput, setManualInput] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

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
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera access or use manual entry",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanComplete(manualInput.trim());
      setManualInput('');
    } else {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid attendance ID",
        variant: "destructive",
      });
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
        {/* Manual Input Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Manual Entry</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter attendance ID manually"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <Button onClick={handleManualSubmit} variant="outline">
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Camera Section */}
        {hasPermission === false && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Camera access denied</p>
            <p className="text-sm text-gray-600">Please use manual entry above</p>
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
