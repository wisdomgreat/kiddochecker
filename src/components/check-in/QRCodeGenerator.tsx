
import React from "react";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeGeneratorProps {
  userId: string;
  userName: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ userId, userName }) => {
  const qrCodeValue = `USER:${userId}|NAME:${userName}`;
  
  return (
    <div className="text-center">
      <div className="bg-white inline-block p-4 border rounded-lg">
        <QRCodeSVG 
          value={qrCodeValue} 
          size={180} 
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="mt-2 text-sm text-gray-600">Scan this code at check-out time</p>
      <div className="mt-2">
        <p className="text-xs font-mono bg-gray-50 inline-block px-2 py-1 rounded">{userId.substring(0, 10)}</p>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
