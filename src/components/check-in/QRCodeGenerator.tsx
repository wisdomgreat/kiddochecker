import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  userId: string;
  userName?: string;
}

export const QRCodeGenerator = ({ userId, userName }: QRCodeGeneratorProps) => {
  const [qrValue, setQrValue] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const generateQRData = async () => {
      try {
        setLoading(true);
        
        // We need to handle this differently since the qr_code_data column was just added
        // First, generate a new QR code
        const qrData = `churchcheck:parent:${userId}:${Date.now()}`;
        
        try {
          // Try to update with the new QR code
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ qr_code_data: qrData })
            .eq('id', userId);
            
          if (updateError) throw updateError;
          
          setQrValue(qrData);
        } catch (updateError) {
          console.error("Error updating profile with QR code:", updateError);
          // If we can't update, still set the QR value for display
          setQrValue(qrData);
        }
      } catch (error: any) {
        console.error("Error generating QR code:", error);
        toast({
          title: "Failed to generate QR code",
          description: error.message,
          variant: "destructive",
        });
        
        // Set a fallback QR code if we can't get/save one
        setQrValue(`churchcheck:parent:${userId}:fallback`);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      generateQRData();
    }
  }, [userId, toast]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const qrCodeElement = document.getElementById('qr-code-container');
      if (qrCodeElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>ChurchCheck QR Code</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .container { max-width: 400px; margin: 0 auto; }
                h2 { color: #4A5568; }
                p { color: #718096; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>ChurchCheck QR Code</h2>
                <p>Scan this code for quick check-in</p>
                ${qrCodeElement.innerHTML}
                <p>${userName || 'Parent'}</p>
                <p>ID: ${userId.substring(0, 8)}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-svg')?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `churchcheck-qrcode-${userId.substring(0, 8)}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } else {
      toast({
        title: "Download failed",
        description: "Could not generate QR code image",
        variant: "destructive",
      });
    }
  };

  const shareQRCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My ChurchCheck QR Code',
          text: 'Use this QR code for quick check-in at church',
        });
      } catch (error: any) {
        console.error('Error sharing:', error);
      }
    } else {
      toast({
        title: "Sharing not supported",
        description: "Your browser doesn't support the Web Share API",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-pulse bg-gray-200 h-40 w-40 rounded-lg"></div>
          <p className="mt-4 text-gray-500">Generating your QR code...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4">Your Check-In QR Code</h3>
          <div id="qr-code-container" className="bg-white p-4 rounded-lg">
            <div id="qr-code-svg">
              <QRCodeSVG 
                value={qrValue}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"M"}
                includeMargin={true}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Show this QR code at the church check-in desk for quick check-in
          </p>
          
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={downloadQRCode}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {navigator.share && (
              <Button variant="outline" size="sm" onClick={shareQRCode}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
