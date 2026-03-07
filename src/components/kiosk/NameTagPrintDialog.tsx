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
}

const NameTagPrintDialog: React.FC<NameTagPrintDialogProps> = ({
  open,
  onClose,
  child,
  qrData,
  className,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const safeFirstName = DOMPurify.sanitize(child.first_name);
    const safeLastName = DOMPurify.sanitize(child.last_name);
    const safeAllergies = child.allergies ? DOMPurify.sanitize(child.allergies) : '';
    const safeClassName = className ? DOMPurify.sanitize(className) : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;

    const content = printRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Name Tag - ${safeFirstName} ${safeLastName}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .name-tag {
              width: 4in;
              height: 3in;
              border: 2px solid #000;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              page-break-after: always;
            }
            .child-name {
              font-size: 36px;
              font-weight: bold;
              margin-bottom: 10px;
              text-align: center;
            }
            .child-details {
              font-size: 18px;
              margin-bottom: 15px;
              text-align: center;
            }
            .allergy-warning {
              background-color: #fee;
              color: #c00;
              padding: 10px;
              border-radius: 5px;
              font-weight: bold;
              margin-bottom: 15px;
              text-align: center;
              border: 2px solid #c00;
            }
            .qr-code {
              margin-top: 15px;
            }
            @media print {
              body { padding: 0; }
              .name-tag { margin: 0 auto; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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

        <div ref={printRef}>
          <div className="border-4 border-primary rounded-lg p-8 bg-white">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-primary">
                {child.first_name} {child.last_name}
              </h2>

              {child.age && (
                <p className="text-xl text-muted-foreground">
                  Age: {child.age}
                </p>
              )}

              {className && (
                <p className="text-lg font-semibold">
                  Class: {className}
                </p>
              )}

              {child.allergies && (
                <div className="bg-destructive/10 border-2 border-destructive text-destructive px-4 py-3 rounded-lg">
                  <p className="font-bold text-lg">⚠️ ALLERGY ALERT</p>
                  <p className="font-semibold">{child.allergies}</p>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
                  <QRCodeSVG
                    value={qrData}
                    size={150}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString()}
              </p>
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
