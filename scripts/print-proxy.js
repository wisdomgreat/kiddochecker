const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3003;
const HOST = '0.0.0.0'; // Listen on all interfaces for Android tablet requests

app.use(bodyParser.json());

// Enable CORS for browser fetch calls from Android tablet kiosks
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Health check endpoint for tablet connectivity testing
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'KiddoChecker Remote Multi-Printer Server',
        os: process.platform,
        timestamp: new Date().toISOString(),
        host: req.headers.host
    });
});

// Default Printer Configurations (Environment Fallbacks)
const DEFAULT_PRINTER_NAME = process.env.PRINTER_NAME || 'Default Printer';
const DEFAULT_PRINTER_IP = process.env.PRINTER_IP || '';

app.post('/print', (req, res) => {
    const { labelData, printerIp, printerName } = req.body;
    
    if (!labelData || !labelData.name) {
        return res.status(400).json({ success: false, error: 'Invalid label data' });
    }
    
    const childName = labelData.name;
    const securityCode = labelData.securityCode || '';
    const className = labelData.class || '';
    const allergies = labelData.allergies ? `ALLERGIES: ${labelData.allergies}` : '';
    
    // Resolve target wireless printer IP / Name dynamically for multi-printer setups
    const targetPrinterIp = printerIp || labelData.printerIp || DEFAULT_PRINTER_IP;
    const targetPrinterName = printerName || labelData.printerName || DEFAULT_PRINTER_NAME;

    console.log(`[Print Server] Received job from ${req.ip} for ${childName} -> Target Printer: ${targetPrinterIp || targetPrinterName}`);

    // Determine OS & build print command
    let command = '';
    const isWindows = process.platform === 'win32';

    if (targetPrinterIp) {
        // Direct TCP Raw Socket (Port 9100 for Wireless Brother QL, Zebra, DYMO network printers)
        command = `echo "KIDDOCHECKER BADGE: ${childName} | Code: ${securityCode} | Class: ${className} ${allergies}" | nc -w 2 ${targetPrinterIp} 9100`;
    } else if (isWindows) {
        // Windows OS printing via PowerShell Out-Printer
        const printText = `--- KIDDOCHECKER NAME TAG ---\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}\n-----------------------------`;
        command = `powershell -Command "Out-Printer -Name '${targetPrinterName}' -InputObject '${printText}'"`;
    } else {
        // Linux / macOS POSIX lp printing (CUPS printer queue)
        const printText = `KIDDOCHECKER NAME TAG\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}`;
        command = `echo "${printText}" | lp -d "${targetPrinterName}"`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.warn(`[Print Server] System print warning: ${error.message}`);
            // Return success true so kiosk check-in workflow completes cleanly
            return res.json({ success: true, warning: error.message });
        }
        console.log(`[Print Server] Print job dispatched successfully to ${targetPrinterIp || targetPrinterName}`);
        res.json({ success: true, printer: targetPrinterIp || targetPrinterName });
    });
});

// Helper to resolve Local LAN IP Addresses for display
function getLocalIpAddresses() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                ips.push(alias.address);
            }
        }
    }
    return ips;
}

app.listen(PORT, HOST, () => {
    const localIps = getLocalIpAddresses();
    console.log(`
    ===================================================================
    🖨️  KiddoChecker Remote Multi-Printer Server (Active)
    ===================================================================
    OS Platform : ${process.platform} (${os.release()})
    Status      : Listening on http://${HOST}:${PORT}
    
    📌 TECH DESK SERVER IP ADDRESS(ES) TO ENTER ON ANDROID TABLETS:
    ${localIps.map(ip => `   👉 http://${ip}:${PORT}`).join('\n')}

    Multi-Printer Support:
    - Wireless Printer 1 IP : Send printerIp: "192.168.1.101"
    - Wireless Printer 2 IP : Send printerIp: "192.168.1.102"
    ===================================================================
    `);
});
