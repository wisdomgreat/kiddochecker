
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { Printer, Check, X } from 'lucide-react';

import { PrintService } from '@/services/printService';

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
      const result = await PrintService.printChildLabel({
        name: childName,
        class: className,
        securityCode: Math.random().toString(36).substring(2, 6).toUpperCase()
      });

      if (result.success) {
        setPrintStatus('success');
        toast({
          title: "Print Job Dispatched ✅",
          description: `Name tag for ${childName} queued via ${result.method}`,
        });
        onPrintComplete?.();
      } else {
        throw new Error('Print dispatch failed');
      }
    } catch (error: any) {
      console.error('Print error:', error);
      setPrintStatus('error');
      toast({
        title: "Print Failed",
        description: error.message || "Unable to print name tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
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

