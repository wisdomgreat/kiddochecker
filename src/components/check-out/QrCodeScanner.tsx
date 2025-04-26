
import { useState, useEffect } from "react";
import { QrCode, ArrowRight, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { checkoutChild } from "@/services/checkoutService";

interface QrCodeScannerProps {
  onScanComplete: (attendanceId: string) => void;
  onSuccess?: (data: any) => void;
}

const QrCodeScanner = ({ onScanComplete, onSuccess }: QrCodeScannerProps) => {
  const [manualCode, setManualCode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // This would typically be integrated with a real scanner library
  // For demonstration purposes, we'll simulate a successful scan after a short delay
  useEffect(() => {
    let scanTimeout: NodeJS.Timeout;
    
    if (scanning) {
      // Simulate a scan after 3 seconds
      scanTimeout = setTimeout(() => {
        // Generate a random ID for demo purposes
        const simulatedCode = `ATTEND-${Math.floor(Math.random() * 10000)}`;
        handleSuccessfulScan(simulatedCode);
        setScanning(false);
      }, 3000);
    }
    
    return () => {
      if (scanTimeout) clearTimeout(scanTimeout);
    };
  }, [scanning]);
  
  const handleStartScan = () => {
    // In a real implementation, this would initialize the camera
    // and QR code scanning library
    setScanning(true);
    setCameraError(null);
    
    // Simulate a potential camera error (20% chance for demo)
    if (Math.random() > 0.8) {
      setTimeout(() => {
        setCameraError("Could not access camera. Please check permissions.");
        setScanning(false);
      }, 1000);
    }
  };
  
  const handleStopScan = () => {
    setScanning(false);
  };
  
  const handleSuccessfulScan = (code: string) => {
    onScanComplete(code);
    if (onSuccess) onSuccess(code);
    
    toast({
      title: "QR Code Scanned",
      description: `Processing code: ${code}`,
    });
    
    // Process checkout
    processCheckout(code);
  };
  
  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      handleSuccessfulScan(manualCode.trim());
      setManualCode("");
    }
  };
  
  const processCheckout = async (attendanceId: string) => {
    try {
      const result = await checkoutChild(attendanceId);
      
      toast({
        title: "Check-out Successful",
        description: "Child has been successfully checked out",
      });
    } catch (error) {
      console.error("Check-out failed:", error);
      toast({
        title: "Check-out Failed",
        description: "Could not process check-out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="mb-8 shadow-md animate-fade-in">
      <CardHeader className="bg-purple-50 rounded-t-xl pb-4">
        <CardTitle className="text-xl font-bold flex items-center">
          <QrCode size={24} className="text-purple-600 mr-2" />
          Scan Parent QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-6">
        <p className="text-gray-600 mb-4">
          Please ask the parent to present their QR code for scanning to check out their child.
        </p>
        
        {scanning ? (
          <div className="space-y-4">
            <div className="bg-black relative rounded-lg w-full aspect-video flex items-center justify-center overflow-hidden">
              {/* This would be replaced by an actual camera feed in a real implementation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera size={64} className="text-white opacity-20" />
                <div className="mt-2 text-white">Scanning...</div>
                <div className="mt-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-white" />
              </div>
              <div className="absolute inset-0 border-2 border-white/20" />
              <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white" />
              </div>
            </div>
            <Button 
              onClick={handleStopScan}
              variant="outline"
              className="w-full"
            >
              <X size={16} className="mr-2" /> Cancel Scanning
            </Button>
          </div>
        ) : (
          <>
            {cameraError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                <p>{cameraError}</p>
              </div>
            )}
            
            {!showManualEntry ? (
              <div className="space-y-4">
                <Button 
                  onClick={handleStartScan}
                  className="w-full py-3"
                >
                  <Camera size={16} className="mr-2" /> Start Scanning
                </Button>
                <Button 
                  onClick={() => setShowManualEntry(true)}
                  variant="outline"
                  className="w-full py-3"
                >
                  Manual Override
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Enter the attendance ID or security code manually:</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleManualSubmit}
                    disabled={!manualCode.trim()}
                  >
                    <ArrowRight size={18} />
                  </Button>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setShowManualEntry(false)}
                  className="w-full"
                >
                  Cancel Manual Entry
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QrCodeScanner;
