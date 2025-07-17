
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, QrCode } from "lucide-react";

interface QRCodeGeneratorProps {
  attendanceId: string;
  childName: string;
  className?: string;
  checkInTime?: string;
  onPrint?: () => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  attendanceId, 
  childName, 
  className = "",
  checkInTime,
  onPrint
}) => {
  const qrCodeValue = JSON.stringify({
    type: "CHECKOUT",
    attendanceId,
    childName,
    className,
    timestamp: new Date().toISOString()
  });
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Check-out QR Code - ${childName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .qr-container {
                text-align: center;
                border: 2px solid #333;
                padding: 20px;
                border-radius: 10px;
              }
              .child-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .class-name {
                font-size: 16px;
                color: #666;
                margin-bottom: 20px;
              }
              .instructions {
                font-size: 14px;
                margin-top: 20px;
                color: #333;
              }
              .time-info {
                font-size: 12px;
                color: #666;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="child-name">${childName}</div>
              ${className ? `<div class="class-name">${className}</div>` : ''}
              <div style="background: white; padding: 20px; display: inline-block;">
                <div id="qr-placeholder" style="width: 200px; height: 200px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center;">
                  QR Code
                </div>
              </div>
              <div class="instructions">
                <strong>Check-out Instructions:</strong><br>
                1. Scan this QR code at check-out<br>
                2. Verify child identity<br>
                3. Confirm authorized pickup person
              </div>
              ${checkInTime ? `<div class="time-info">Checked in: ${checkInTime}</div>` : ''}
              <div class="time-info">Generated: ${new Date().toLocaleString()}</div>
            </div>
          </body>
        </html>
      `);
      
      // Get the QR code SVG and insert it
      const qrCodeElement = document.querySelector('.qr-code-svg');
      if (qrCodeElement) {
        const svgContent = qrCodeElement.outerHTML;
        printWindow.document.close();
        
        // Wait a moment for the document to load, then replace placeholder
        setTimeout(() => {
          const placeholder = printWindow.document.getElementById('qr-placeholder');
          if (placeholder) {
            placeholder.innerHTML = svgContent;
          }
          printWindow.print();
        }, 100);
      } else {
        printWindow.document.close();
        printWindow.print();
      }
    }
    
    if (onPrint) {
      onPrint();
    }
  };
  
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5" />
          Check-out QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{childName}</span>
          </div>
          {className && (
            <Badge variant="outline" className="mb-2">
              {className}
            </Badge>
          )}
          {checkInTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Checked in: {checkInTime}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white inline-block p-4 border rounded-lg">
          <QRCodeSVG 
            value={qrCodeValue} 
            size={180} 
            level="H"
            includeMargin={true}
            className="qr-code-svg"
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Scan this code at check-out time
          </p>
          <div className="text-xs font-mono bg-gray-50 inline-block px-2 py-1 rounded">
            ID: {attendanceId.substring(0, 8)}...
          </div>
        </div>
        
        <button
          onClick={handlePrint}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Print QR Code
        </button>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
