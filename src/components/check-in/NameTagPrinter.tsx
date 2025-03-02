
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
            </style>
          </head>
          <body>
            <div class="name-tag">
              <div class="header">ChurchCheck - Children's Ministry</div>
              <div class="name">${childName}</div>
              <div class="info">
                <div>Class: ${className}</div>
                <div>ID: ${childId.substring(0, 6)}</div>
              </div>
              ${allergies ? `<div class="allergies">Allergies: ${allergies}</div>` : ''}
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
