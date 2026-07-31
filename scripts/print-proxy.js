const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3003;
const HOST = '0.0.0.0'; // Listen on all network interfaces for Android tablet requests

app.use(bodyParser.json());

// Enable CORS headers for browser fetch calls from Android tablet kiosks
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
        server: 'KiddoChecker Remote Print Server',
        timestamp: new Date().toISOString(),
        host: req.headers.host
    });
});

// Printer Configuration
const PRINTER_NAME = process.env.PRINTER_NAME || 'Default Printer';
const PRINTER_IP = process.env.PRINTER_IP || '';

app.post('/print', (req, res) => {
    const { labelData } = req.body;
    
    if (!labelData || !labelData.name) {
        return res.status(400).json({ success: false, error: 'Invalid label data' });
    }
    
    const childName = labelData.name;
    const securityCode = labelData.securityCode || '';
    const className = labelData.class || '';
    const allergies = labelData.allergies ? `ALLERGIES: ${labelData.allergies}` : '';
    
    console.log(`[Print Server] Received job from ${req.ip} for: ${childName} (${securityCode})`);

    // Determine OS & build print command
    let command = '';
    const isWindows = process.platform === 'win32';

    if (PRINTER_IP) {
        // Direct TCP Raw Socket (Port 9100 for Brother / Zebra / DYMO network printers)
        command = `echo "KIDDOCHECKER BADGE: ${childName} | Code: ${securityCode} | Class: ${className} ${allergies}" | nc -w 2 ${PRINTER_IP} 9100`;
    } else if (isWindows) {
        // Windows OS printing via PowerShell Out-Printer
        const printText = `--- KIDDOCHECKER NAME TAG ---\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}\n-----------------------------`;
        command = `powershell -Command "Out-Printer -InputObject '${printText}'"`;
    } else {
        // macOS / Linux POSIX lp printing
        const printText = `KIDDOCHECKER NAME TAG\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}`;
        command = `echo "${printText}" | lp`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.warn(`[Print Server] System print warning: ${error.message}`);
            // Return success true so kiosk workflow completes even if physical printer driver warns
            return res.json({ success: true, warning: error.message });
        }
        console.log(`[Print Server] Print job completed successfully for ${childName}`);
        res.json({ success: true });
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
    🖨️  KiddoChecker Remote Print Server (Active)
    ===================================================================
    Server Status: Listening on http://${HOST}:${PORT}
    
    📌 LOCAL IP ADDRESS(ES) TO ENTER ON YOUR ANDROID TABLET:
    ${localIps.map(ip => `   👉 http://${ip}:${PORT}`).join('\n')}

    Instruction for Android Tablet Kiosk:
    1. Connect Android Tablet to the same Wi-Fi network as this PC.
    2. In KiddoChecker Kiosk > Check-In Setup, enter your PC IP above:
       e.g. ${localIps[0] || '192.168.1.150'}
    3. Click "Test IP" to confirm connection!
    ===================================================================
    `);
});
