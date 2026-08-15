import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import DOMPurify from 'dompurify';
import { useTranslation, Language } from '@/lib/i18n';

import { useLanguage } from '@/context/LanguageContext';
import { getPrintProxyUrl } from '@/services/printService';

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
  specialInstructions?: string;
  language?: Language;
}

const NameTagPrintDialog: React.FC<NameTagPrintDialogProps> = ({
  open,
  onClose,
  child,
  qrData,
  className,
  securityCode,
  specialInstructions,
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isEs = language === 'es';
  const printRef = useRef<HTMLDivElement>(null);
  
  // Generate a matching security code for the session if not provided
  const generatedCode = useRef(Math.random().toString(36).substring(2, 6).toUpperCase());
  const displayCode = securityCode || generatedCode.current;

  // Auto-print on mount if open
  React.useEffect(() => {
    if (open) {
      console.log('[Print] Auto-triggering print for child:', child.first_name);
      // Give it a moment to render the QR code in the DOM before printing
      const timer = setTimeout(() => {
        handlePrint();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handlePrint = async () => {
    const safeFirstName = DOMPurify.sanitize(child.first_name);
    const safeLastName = DOMPurify.sanitize(child.last_name);
    const safeAllergies = child.allergies ? DOMPurify.sanitize(child.allergies) : '';
    const safeClassName = className ? DOMPurify.sanitize(className) : '';
    const safeInstructions = specialInstructions ? DOMPurify.sanitize(specialInstructions) : '';

    const targetPrinterIp = localStorage.getItem('kiddochecker_target_printer_ip') || '';
    const targetPrinterName = localStorage.getItem('kiddochecker_target_printer_name') || '';

    // 1. Primary: Enqueue to Azure Cloud Relay (Immune to browser CORS / Mixed Content)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io";
      const orgId = localStorage.getItem('kiddochecker_org_id') || 'default_org';
      const cloudRes = await fetch(`${baseUrl}/api/print-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelData: {
            name: `${safeFirstName} ${safeLastName}`,
            allergies: safeAllergies,
            class: safeClassName,
            instructions: safeInstructions,
            securityCode: displayCode,
            qrData: qrData,
            orgId: orgId
          },
          printerIp: targetPrinterIp,
          printerName: targetPrinterName,
          orgId: orgId
        }),
      });

      if (cloudRes.ok) {
        console.log('[Printer] Silent print job enqueued via Azure Cloud Relay.');
        setTimeout(onClose, 1500);
        return;
      }
    } catch (cErr) {
      console.warn('[Printer] Azure Cloud Relay unreachable, trying direct local print proxy:', cErr);
    }

    // 2. Secondary: Direct Local Print Proxy
    console.log('[Printer] Attempting silent network printing via proxy...');
    try {
      const proxyUrl = getPrintProxyUrl();
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelData: {
            name: `${safeFirstName} ${safeLastName}`,
            allergies: safeAllergies,
            class: safeClassName,
            instructions: safeInstructions,
            securityCode: displayCode,
            qrData: qrData
          },
          printerIp: targetPrinterIp,
          printerName: targetPrinterName
        }),
      });

      if (response.ok) {
        console.log('[Printer] Silent print successful via local proxy.');
        setTimeout(onClose, 1500);
        return;
      }
    } catch (err) {
      console.warn('[Printer] Local print proxy unavailable. Falling back to browser print...');
    }

    // Use a hidden iframe for more reliable "silent" printing without popup blockers
    let printFrame = document.getElementById('silent-print-frame') as HTMLIFrameElement;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'silent-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (!frameDoc) return;

    const classTxt = isEs ? 'Clase' : 'Class';
    const noteTxt = isEs ? 'NOTA' : 'NOTE';
    const allergyTxt = isEs ? 'ALERGIA' : 'ALLERGY';
    const claimTxt = isEs ? 'BOLETO DE RETIRO DE TUTOR' : 'PRIMARY GUARDIAN CLAIM TICKET';
    const secTxt = isEs ? 'CÓDIGO DE SEGURIDAD' : 'SECURITY CODE';
    const validTxt = isEs ? 'Se requiere identificación válida para retirar.' : 'Valid identification required for pickup.';

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Security Label - ${safeFirstName} ${safeLastName}</title>
          <style>
            @page { margin: 0; size: auto; }
            body { margin: 0; padding: 0; font-family: sans-serif; color: #000; }
            .label-box {
              width: 3.5in; height: 2.25in;
              padding: 12px; box-sizing: border-box;
              display: flex; flex-direction: column; justify-content: space-between;
              page-break-after: always;
            }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 4px; }
            .child-name { font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .security-code { background: #000; color: #fff; padding: 4px 8px; font-size: 18px; font-weight: bold; border-radius: 4px; }
            .allergy { background: #000; color: #fff; padding: 4px; font-weight: bold; text-align: center; font-size: 12px; margin: 4px 0; text-transform: uppercase; }
            .qr-area { display: flex; align-items: center; gap: 10px; }
            .footer { display: flex; justify-content: space-between; font-size: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div>
              <div class="header">
                <div><div class="child-name">${safeFirstName}</div><div class="child-name">${safeLastName}</div></div>
                <div class="security-code">${displayCode}</div>
              </div>
              ${safeAllergies ? `<div class="allergy">⚠️ ${allergyTxt}: ${safeAllergies}</div>` : ''}
              ${safeInstructions ? `<div style="font-size:9px; border:1px solid #000; padding:3px; margin-top:3px;"><strong>${noteTxt}:</strong> ${safeInstructions}</div>` : ''}
            </div>
            <div>
              <div class="footer"><span>${classTxt}: ${safeClassName || 'N/A'}</span><span>${new Date().toLocaleDateString()}</span></div>
              <div class="qr-area">
                <div id="qr-target"></div>
                <div style="font-size:9px;"><strong>IMPORTANTE:</strong> ${validTxt}</div>
              </div>
            </div>
          </div>
          <div class="label-box">
            <div style="text-align:center; font-weight:bold; border-bottom:1px solid #000; margin-bottom:10px;">${claimTxt}</div>
            <div style="text-align:center; margin: auto 0;">
              <div style="font-size:10px;">${secTxt}</div>
              <div style="background:#000; color:#fff; font-size:32px; padding:10px; display:inline-block; font-family:monospace;">${displayCode}</div>
              <div style="font-size:14px; margin-top:10px; font-weight:bold;">${safeFirstName} ${safeLastName}</div>
            </div>
          </div>
          <script>
            const qrSvg = window.parent.document.querySelector('.qr-rendered-svg');
            if (qrSvg) {
              document.getElementById('qr-target').innerHTML = qrSvg.outerHTML;
              const injected = document.getElementById('qr-target').querySelector('svg');
              if(injected) { injected.setAttribute('width', '50'); injected.setAttribute('height', '50'); }
            }
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    frameDoc.close();
    
    setTimeout(onClose, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('printNameTag')}</DialogTitle>
          <DialogDescription>
            Preview and print the name tag for {child.first_name} {child.last_name}
          </DialogDescription>
        </DialogHeader>

        <div ref={printRef} className="max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col gap-6 items-center">
            {/* Child Label Preview */}
            <div className="w-[3.5in] h-[2.25in] border-2 border-dashed border-gray-400 p-3 flex flex-col justify-between bg-card relative">
              <div>
                <div className="flex justify-between items-start border-b-2 border-black pb-1 mb-2">
                  <div>
                    <h1 className="text-2xl font-bold leading-tight uppercase m-0">{child.first_name}</h1>
                    <h1 className="text-2xl font-bold leading-tight uppercase m-0">{child.last_name}</h1>
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
                {specialInstructions && (
                  <div className="border border-black text-black text-[10px] p-1 rounded mt-1 bg-gray-50/50 leading-tight">
                    <strong>NOTE:</strong> {specialInstructions}
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
                    <strong>{t('guardianNotice')}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Ticket Preview */}
            <div className="w-[3.5in] h-[2.25in] border-2 border-dashed border-gray-400 p-3 flex flex-col bg-card">
              <div className="text-xs font-bold text-center border-b border-black pb-1 mb-2">
                PRIMARY GUARDIAN CLAIM TICKET
              </div>
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="text-xs mb-2 text-gray-600 font-medium">{t('securityCode')}</div>
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

        <DialogFooter className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('cancel')}
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            {t('printNameTag')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NameTagPrintDialog;

