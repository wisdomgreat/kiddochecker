import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Square, Scan, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Html5Qrcode } from 'html5-qrcode';

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
  const [lastScanned, setLastScanned] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  const startScanning = async () => {
    try {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Prevent duplicate scans
          if (decodedText !== lastScanned) {
            setLastScanned(decodedText);
            onScanComplete(decodedText);
            toast({
              title: "QR Code Scanned",
              description: "Processing check-in...",
            });
          }
        },
        undefined
      );
      
      setIsActive(true);
      setHasPermission(true);
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

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setIsActive(false);
    setLastScanned('');
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScanComplete(manualInput.trim());
      setManualInput('');
    } else {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid QR code data",
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
              placeholder="Enter QR code data manually"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              disabled={isActive}
            />
            <Button onClick={handleManualSubmit} variant="outline" disabled={isActive}>
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Camera Section */}
        {hasPermission === false && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Camera access denied</p>
            <p className="text-sm text-muted-foreground">Please use manual entry above</p>
          </div>
        )}

        {!isActive && hasPermission !== false && (
          <div className="text-center py-8">
            <Button onClick={startScanning} size="lg">
              <Camera className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          </div>
        )}

        {isActive && (
          <div className="space-y-4">
            <div className="relative">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={stopScanning} variant="outline" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Stop Scanning
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              Position the QR code within the frame to scan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
