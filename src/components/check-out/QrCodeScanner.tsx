
import { QrCode } from "lucide-react";

const QrCodeScanner = () => {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-4">
        <div className="rounded-full bg-purple-100 p-3">
          <QrCode size={24} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Scan Parent QR Code</h2>
          <p className="text-gray-600">
            Please ask the parent to present their QR code for scanning to check out their child.
          </p>
        </div>
      </div>
      
      <button className="btn-primary mt-4">Manual Override</button>
    </div>
  );
};

export default QrCodeScanner;
