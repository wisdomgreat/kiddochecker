
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Printer, Check, X } from 'lucide-react';

interface NameTagPrinterProps {
  childName: string;
  className?: string;
  onPrintComplete?: () => void;
}

const NameTagPrinter = ({ childName, className = '', onPrintComplete }: NameTagPrinterProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handlePrint = async () => {
    setIsPrinting(true);
    setPrintStatus('printing');

    try {
      // Check if Web API printing is supported
      if ('print' in window) {
        // Create a printable name tag
        const nameTagContent = `
          <div style="
            width: 300px; 
            height: 150px; 
            border: 2px solid #000; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            font-family: Arial, sans-serif;
            background: white;
          ">
            <h2 style="margin: 0; font-size: 24px; font-weight: bold;">${childName}</h2>
            <p style="margin: 5px 0; font-size: 16px;">${className || 'General'}</p>
            <p style="margin: 0; font-size: 12px; color: #666;">${new Date().toLocaleDateString()}</p>
          </div>
        `;

        // Open print window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Name Tag - ${childName}</title>
                <style>
                  @media print {
                    body { margin: 0; }
                    @page { margin: 0; size: 4in 2in; }
                  }
                </style>
              </head>
              <body>
                ${nameTagContent}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }

        // Simulate print completion
        setTimeout(() => {
          setPrintStatus('success');
          toast({
            title: "Print Successful",
            description: `Name tag for ${childName} sent to printer`,
          });
          onPrintComplete?.();
        }, 2000);
      } else {
        throw new Error('Printing not supported in this browser');
      }
    } catch (error) {
      console.error('Print error:', error);
      setPrintStatus('error');
      toast({
        title: "Print Failed",
        description: "Unable to print name tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
      // Reset status after 3 seconds
      setTimeout(() => setPrintStatus('idle'), 3000);
    }
  };

  const getStatusIcon = () => {
    switch (printStatus) {
      case 'printing':
        return <Printer className="h-4 w-4 animate-pulse" />;
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Printer className="h-4 w-4" />;
    }
  };

  const getButtonText = () => {
    switch (printStatus) {
      case 'printing':
        return 'Printing...';
      case 'success':
        return 'Printed!';
      case 'error':
        return 'Print Failed';
      default:
        return 'Print Name Tag';
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Printer className="h-5 w-5 mr-2" />
          Name Tag Printer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-lg">{childName}</h3>
            {className && <p className="text-sm text-gray-600">{className}</p>}
            <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
          
          <Button 
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full"
            variant={printStatus === 'success' ? 'default' : printStatus === 'error' ? 'destructive' : 'default'}
          >
            {getStatusIcon()}
            <span className="ml-2">{getButtonText()}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NameTagPrinter;
