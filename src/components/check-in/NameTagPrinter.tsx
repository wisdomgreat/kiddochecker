
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle, QrCode, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

interface NameTagPrinterProps {
  childName: string;
  childId: string;
  className: string;
  allergies?: string;
  securityCode: string;
}

export const NameTagPrinter = ({
  childName,
  childId,
  className,
  allergies,
  securityCode,
}: NameTagPrinterProps) => {
  const [printed, setPrinted] = useState(false);
  const { toast } = useToast();

  // Create a unique identifier for the QR code
  const qrCodeValue = `CHILD:${childId}|CODE:${securityCode}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Name Tag - ${childName}</title>
            <style>
              @page { size: 4in 3in; margin: 0; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 10px;
                box-sizing: border-box;
                width: 4in;
                height: 3in;
                display: flex;
                flex-direction: column;
              }
              .name-tag {
                border: 2px solid #ccc;
                border-radius: 10px;
                padding: 10px;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
              }
              .header {
                text-align: center;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
                margin-bottom: 5px;
                font-weight: bold;
              }
              .name {
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin: 10px 0;
              }
              .info {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
              }
              .allergies {
                color: red;
                font-weight: bold;
                margin-top: 5px;
                text-align: center;
              }
              .security-code {
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                border: 1px dashed #ccc;
                padding: 5px;
                background-color: #f9f9f9;
                margin-top: 10px;
              }
              .footer {
                text-align: center;
                font-size: 10px;
                color: #666;
                margin-top: 10px;
              }
              .qr-container {
                display: flex;
                justify-content: center;
                margin: 10px 0;
              }
              .qr-code {
                width: 80px;
                height: 80px;
              }
              .flex-row {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
              }
              .barcode {
                width: 100%;
                text-align: center;
                margin: 8px 0;
                font-family: 'Libre Barcode 39', cursive;
                font-size: 42px;
                line-height: 1;
              }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
          </head>
          <body>
            <div class="name-tag">
              <div class="header">Children's Ministry Check-in</div>
              <div class="name">${childName}</div>
              <div class="flex-row">
                <div>
                  <div class="info">
                    <div>Class: ${className}</div>
                    <div>ID: ${childId.substring(0, 6)}</div>
                  </div>
                  ${allergies ? `<div class="allergies">Allergies: ${allergies}</div>` : ''}
                </div>
                <div class="qr-container">
                  <img class="qr-code" src="data:image/svg+xml;base64,${btoa(
                    new XMLSerializer().serializeToString(
                      document.getElementById('qr-code-to-print')
                    )
                  )}" alt="QR Code" />
                </div>
              </div>
              <div class="barcode">*${childId.substring(0, 10)}*</div>
              <div class="security-code">Security Code: ${securityCode}</div>
              <div class="footer">Parents: Please keep your security code for pickup</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      
      // Wait for content to load before printing
      printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
          setPrinted(true);
          toast({
            title: "Name tag printed successfully",
            description: "Remember the security code for child pickup",
          });
        };
      };
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Print Name Tag</h3>
          <p className="text-sm text-gray-600">Print name tag for {childName}</p>
        </div>
        
        <Button 
          onClick={handlePrint} 
          variant={printed ? "outline" : "default"}
          className={printed ? "bg-green-50 text-green-600 border-green-200" : ""}
        >
          {printed ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Printed
            </>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" />
              Print Name Tag
            </>
          )}
        </Button>
      </div>

      {/* Hidden QR code for printing */}
      <div className="hidden">
        <QRCodeSVG
          id="qr-code-to-print"
          value={qrCodeValue}
          size={80}
          level="H"
        />
      </div>
      
      <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex flex-row items-center justify-between">
          <div>
            <div className="text-lg font-bold">{childName}</div>
            <div className="text-sm">Class: {className}</div>
            {allergies && (
              <div className="text-sm font-medium text-red-600">
                Allergies: {allergies}
              </div>
            )}
          </div>
          <div className="border border-gray-200 p-2 rounded bg-gray-50">
            <QRCodeSVG
              value={qrCodeValue}
              size={80}
              level="H"
            />
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-center">
          <Tag className="h-4 w-4 mr-1 text-gray-500" />
          <div className="text-xs font-mono bg-gray-50 px-2 py-1 rounded">{childId.substring(0, 10)}</div>
        </div>
        {securityCode && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium">Security Code: {securityCode}</p>
          </div>
        )}
      </div>
      
      {securityCode && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 text-center">
          <p className="text-sm font-medium">Security Code: {securityCode}</p>
          <p className="text-xs text-gray-600">Keep this code for pickup</p>
        </div>
      )}
    </div>
  );
};

export default NameTagPrinter;
