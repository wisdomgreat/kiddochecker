
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle, QrCode, Tag, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

interface NameTagPrinterProps {
  childName: string;
  childId: string;
  className: string;
  allergies?: string;
  securityCode: string;
  onPrintComplete?: () => void;
  onBack?: () => void;
}

export const NameTagPrinter = ({
  childName,
  childId,
  className,
  allergies,
  securityCode,
  onPrintComplete,
  onBack,
}: NameTagPrinterProps) => {
  const [printed, setPrinted] = useState(false);
  const { toast } = useToast();

  const qrCodeValue = `CHILD:${childId}|CODE:${securityCode}`;

  const generateNameTagHTML = () => {
    return `
      <html>
        <head>
          <title>Name Tag - ${childName}</title>
          <style>
            @page { 
              size: 4in 3in; 
              margin: 0.1in; 
            }
            * {
              box-sizing: border-box;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              margin: 0; 
              padding: 8px;
              width: 4in;
              height: 3in;
              background: white;
              overflow: hidden;
            }
            .name-tag {
              border: 3px solid #4F46E5;
              border-radius: 12px;
              padding: 8px;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              position: relative;
            }
            .header {
              text-align: center;
              background: #4F46E5;
              color: white;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 6px;
            }
            .name {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 8px 0;
              color: #1e293b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .content {
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex: 1;
              gap: 8px;
            }
            .info {
              flex: 1;
              font-size: 11px;
              line-height: 1.3;
            }
            .info-item {
              margin: 3px 0;
              padding: 2px 4px;
              background: rgba(255,255,255,0.8);
              border-radius: 3px;
              border-left: 3px solid #4F46E5;
            }
            .allergies {
              color: #dc2626;
              font-weight: bold;
              background: #fee2e2;
              border-left-color: #dc2626;
            }
            .qr-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 4px;
            }
            .qr-code {
              width: 60px;
              height: 60px;
              border: 2px solid #4F46E5;
              border-radius: 4px;
              background: white;
              padding: 2px;
            }
            .security-section {
              text-align: center;
              background: #fef3c7;
              border: 2px dashed #f59e0b;
              border-radius: 6px;
              padding: 4px;
              margin-top: 6px;
            }
            .security-code {
              font-size: 16px;
              font-weight: bold;
              color: #92400e;
              margin: 2px 0;
            }
            .footer {
              text-align: center;
              font-size: 8px;
              color: #64748b;
              margin-top: 4px;
            }
            .barcode {
              text-align: center;
              font-family: 'Libre Barcode 39', monospace;
              font-size: 24px;
              line-height: 1;
              margin: 4px 0;
            }
            @media print {
              body { 
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="name-tag">
            <div class="header">CHILDREN'S MINISTRY</div>
            <div class="name">${childName}</div>
            <div class="content">
              <div class="info">
                <div class="info-item">
                  <strong>Class:</strong> ${className}
                </div>
                <div class="info-item">
                  <strong>ID:</strong> ${childId.substring(0, 8)}
                </div>
                ${allergies ? `<div class="info-item allergies">
                  <strong>⚠️ ALLERGIES:</strong><br>${allergies}
                </div>` : ''}
              </div>
              <div class="qr-container">
                <div class="qr-code">
                  ${document.getElementById('qr-code-svg')?.outerHTML || ''}
                </div>
                <div style="font-size: 8px; color: #64748b;">Scan for checkout</div>
              </div>
            </div>
            <div class="barcode">*${childId.substring(0, 10)}*</div>
            <div class="security-section">
              <div style="font-size: 10px; font-weight: bold;">PICKUP CODE</div>
              <div class="security-code">${securityCode}</div>
            </div>
            <div class="footer">Keep this code for child pickup • ${new Date().toLocaleDateString()}</div>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrint = () => {
    // Create a temporary QR code for the print
    const qrContainer = document.createElement('div');
    qrContainer.innerHTML = `
      <svg id="qr-code-svg" width="56" height="56" viewBox="0 0 56 56">
        ${document.querySelector('#print-qr-code svg')?.innerHTML || ''}
      </svg>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateNameTagHTML());
      printWindow.document.close();
      
      printWindow.onload = function() {
        // Replace QR code placeholder with actual QR code
        const qrPlaceholder = printWindow.document.querySelector('.qr-code');
        if (qrPlaceholder) {
          qrPlaceholder.innerHTML = qrContainer.innerHTML;
        }
        
        setTimeout(() => {
          printWindow.print();
          printWindow.onafterprint = function() {
            setPrinted(true);
            toast({
              title: "Name tag printed successfully",
              description: "Remember the security code for child pickup",
            });
            if (onPrintComplete) onPrintComplete();
            printWindow.close();
          };
        }, 500);
      };
    }
  };

  const handleDownloadPDF = () => {
    // For PDF download, we'd need a library like jsPDF or Puppeteer
    toast({
      title: "PDF Download",
      description: "PDF download functionality coming soon. Use print for now.",
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-lg">Print Name Tag</h3>
          <p className="text-sm text-gray-600">Print name tag for {childName}</p>
        </div>
        
        <div className="space-x-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={handleDownloadPDF}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
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
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <div className="text-center mb-2">
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold inline-block">
            CHILDREN'S MINISTRY
          </div>
        </div>
        
        <div className="text-xl font-bold text-center mb-3 text-gray-800 uppercase tracking-wide">
          {childName}
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm space-y-1">
            <div className="bg-gray-50 px-2 py-1 rounded border-l-3 border-blue-500">
              <strong>Class:</strong> {className}
            </div>
            <div className="bg-gray-50 px-2 py-1 rounded border-l-3 border-blue-500">
              <strong>ID:</strong> {childId.substring(0, 8)}
            </div>
            {allergies && (
              <div className="bg-red-50 text-red-700 px-2 py-1 rounded border-l-3 border-red-500 text-xs">
                <strong>⚠️ ALLERGIES:</strong><br />{allergies}
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="border-2 border-blue-500 rounded p-1 bg-white" id="print-qr-code">
              <QRCodeSVG
                value={qrCodeValue}
                size={56}
                level="H"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">Scan for checkout</div>
          </div>
        </div>

        <div className="text-center font-mono text-lg mb-3">
          *{childId.substring(0, 10)}*
        </div>

        <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 rounded p-2 text-center">
          <div className="text-xs font-bold text-yellow-800">PICKUP CODE</div>
          <div className="text-lg font-bold text-yellow-900">{securityCode}</div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-2">
          Keep this code for child pickup • {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {securityCode && (
        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
          <p className="text-sm font-medium">Security Code: <span className="font-bold text-lg">{securityCode}</span></p>
          <p className="text-xs text-gray-600 mt-1">Keep this code for pickup - required for child checkout</p>
        </div>
      )}
    </div>
  );
};

export default NameTagPrinter;
