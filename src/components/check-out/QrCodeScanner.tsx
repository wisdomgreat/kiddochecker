
import { useState } from "react";
import { QrCode, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QrCodeScannerProps {
  onScanComplete: (attendanceId: string) => void;
  onSuccess?: (data: any) => void;
}

const QrCodeScanner = ({ onScanComplete, onSuccess }: QrCodeScannerProps) => {
  const [manualCode, setManualCode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScanComplete(manualCode.trim());
      if (onSuccess) onSuccess(manualCode.trim()); // Use onSuccess if provided
      setManualCode("");
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
        
        {!showManualEntry ? (
          <Button 
            onClick={() => setShowManualEntry(true)}
            className="w-full py-3"
          >
            Manual Override
          </Button>
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
      </CardContent>
    </Card>
  );
};

export default QrCodeScanner;
