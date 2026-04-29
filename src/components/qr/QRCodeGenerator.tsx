
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QRCodeGeneratorProps {
  attendanceId: string;
  childName: string;
  className?: string;
  size?: number;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  attendanceId, 
  childName, 
  className = "",
  size = 200 
}) => {
  // Create QR code data with attendance ID for checkout
  const qrCodeValue = `ATTENDANCE:${attendanceId}|CHILD:${childName}|CLASS:${className}`;
  
  return (
    <Card className="w-fit">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-sm">Checkout QR Code</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="bg-card inline-block p-4 border rounded-lg">
          <QRCodeSVG 
            value={qrCodeValue} 
            size={size} 
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Scan this code for checkout
        </p>
        <p className="text-xs font-mono bg-gray-50 inline-block px-2 py-1 rounded mt-1">
          {attendanceId.substring(0, 8)}...
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;

