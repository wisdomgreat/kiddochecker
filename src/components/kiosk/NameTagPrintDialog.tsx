import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import DOMPurify from 'dompurify';

interface NameTagPrintDialogProps {
  open: boolean;
  onClose: () => void;
  child: {
    first_name: string;
    last_name: string;
    age?: number;
    allergies?: string;
  };
  qrData: string;
  className?: string;
  securityCode?: string; // Optional passed code, otherwise we generate a random 4-char one
}

const NameTagPrintDialog: React.FC<NameTagPrintDialogProps> = ({
  open,
  onClose,
  child,
  qrData,
  className,
  securityCode,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Generate a matching security code for the session if not provided
  const generatedCode = useRef(Math.random().toString(36).substring(2, 6).toUpperCase());
  const displayCode = securityCode || generatedCode.current;

  const handlePrint = () => {
    const safeFirstName = DOMPurify.sanitize(child.first_name);
    const safeLastName = DOMPurify.sanitize(child.last_name);
    const safeAllergies = child.allergies ? DOMPurify.sanitize(child.allergies) : '';
    const safeClassName = className ? DOMPurify.sanitize(className) : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Label - ${safeFirstName} ${safeLastName}</title>
          <style>
            @page { margin: 0; size: auto; }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #000;
            }
            .print-container {
              display: flex;
              flex-direction: column;
              gap: 20px;
            }
            .label-box {
              width: 3.5in;
              height: 2.25in;
              border: 1px dashed #999;
              padding: 12px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .child-name {
              font-size: 26px;
              font-weight: 900;
              line-height: 1.1;
              margin: 0;
              text-transform: uppercase;
            }
            .security-code-box {
              background: #000;
              color: #fff;
              padding: 4px 8px;
              font-family: monospace;
              font-size: 20px;
              font-weight: bold;
              border-radius: 4px;
              text-align: center;
            }
            .allergy-alert {
              background: #000 !important;
              color: #fff !important;
              padding: 4px;
              font-weight: bold;
              text-align: center;
              font-size: 14px;
              margin: 4px 0;
              text-transform: uppercase;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .details-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .qr-area {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .qr-placeholder {
              width: 50px;
              height: 50px;
            }
            .ticket-title {
              font-size: 14px;
              font-weight: bold;
              text-align: center;
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <!-- CHILD LABEL -->
            <div class="label-box">
              <div>
                <div class="header">
                  <div>
                    <h1 class="child-name">${safeFirstName}</h1>
                    <h1 class="child-name">${safeLastName}</h1>
                  </div>
                  <div class="security-code-box">${displayCode}</div>
                </div>
                ${safeAllergies ? `<div class="allergy-alert">⚠️ ALLERGY: ${safeAllergies}</div>` : ''}
              </div>
              <div>
                <div class="details-row">
                  <span>Class: ${safeClassName || 'N/A'}</span>
                  <span>Date: ${new Date().toLocaleDateString()}</span>
                </div>
                <div class="qr-area">
                  <!-- The precise QR SVG will be injected from the React render if we use printRef, 
                       but we are constructing custom HTML. Let's just grab the QR svg from the DOM. -->
                  <div id="qr-inject"></div>
                  <div style="font-size:10px; line-height:1.2;">
                    <strong>Guardian Notice:</strong><br/>
                    Present matching tag for pick-up.
                  </div>
                </div>
              </div>
            </div>

            <!-- PARENT CLAIM TICKET -->
            <div class="label-box">
              <div class="ticket-title">PRIMARY GUARDIAN CLAIM TICKET</div>
              <div style="text-align:center; margin: auto 0;">
                <div style="font-size: 12px; margin-bottom: 10px;">Security Match Code</div>
                <div class="security-code-box" style="font-size: 32px; padding: 10px; display:inline-block;">${displayCode}</div>
                <div style="font-size: 16px; margin-top: 15px; font-weight:bold;">${safeFirstName} ${safeLastName}</div>
                <div style="font-size: 12px; margin-top: 5px;">Date: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <script>
            // Inject the QR code SVG from the parent window
            const qrSvg = window.opener.document.querySelector('.qr-rendered-svg');
            if (qrSvg) {
              document.getElementById('qr-inject').innerHTML = qrSvg.outerHTML;
              const injected = document.getElementById('qr-inject').querySelector('svg');
              if(injected) {
                injected.setAttribute('width', '50');
                injected.setAttribute('height', '50');
              }
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Print Name Tag</DialogTitle>
          <DialogDescription>
            Preview and print the name tag for {child.first_name} {child.last_name}
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-6 items-center">
            {/* Child Label Preview */}
            <div className="w-[3.5in] h-[2.25in] border-2 border-dashed border-gray-400 p-3 flex flex-col justify-between bg-white relative">
              <div>
                <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-2">
                  <div>
                    <h1 className="text-2xl font-black leading-tight uppercase m-0">{child.first_name}</h1>
                    <h1 className="text-2xl font-black leading-tight uppercase m-0">{child.last_name}</h1>
                  </div>
                  <div className="bg-black text-white px-2 py-1 font-mono text-xl font-bold rounded">
                    {displayCode}
                  </div>
                </div>
                {child.allergies && (
                  <div className="bg-red-600 text-white font-bold text-center text-xs py-1 rounded uppercase tracking-wider my-2">
                    ⚠️ Allergy: {child.allergies}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Class: {className || 'N/A'}</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <QRCodeSVG
                    value={qrData}
                    size={50}
                    level="H"
                    className="qr-rendered-svg"
                  />
                  <div className="text-[9px] leading-tight font-medium text-gray-700">
                    <strong>Guardian Notice:</strong><br />
                    Must present matching tag with code {displayCode} for pick-up.
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Ticket Preview */}
            <div className="w-[3.5in] h-[2.25in] border-2 border-dashed border-gray-400 p-3 flex flex-col bg-white">
              <div className="text-xs font-bold text-center border-b border-black pb-1 mb-2">
                PRIMARY GUARDIAN CLAIM TICKET
              </div>
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-xs mb-2 text-gray-600 font-medium">Security Match Code</div>
                <div className="bg-black text-white px-6 py-2 font-mono text-3xl font-bold rounded tracking-widest">
                  {displayCode}
                </div>
                <div className="text-sm font-bold mt-4">
                  {child.first_name} {child.last_name}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print Name Tag
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NameTagPrintDialog;
