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

// ─── Azure Cloud Print Relay Polling ────────────────────────────
const AZURE_API_URL = process.env.AZURE_API_URL || 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';

async function pollAzureCloudPrintQueue() {
    try {
        const response = await fetch(`${AZURE_API_URL}/api/print-jobs/poll`);
        if (response.ok) {
            const data = await response.json();
            if (data.jobs && data.jobs.length > 0) {
                for (const job of data.jobs) {
                    console.log(`[Cloud Relay] Received job ${job.id} for ${job.labelData?.name}`);
                    dispatchPrintCommand(job.labelData, job.printerIp, job.printerName);
                }
            }
        }
    } catch (err) {
        // Silent catch for network hiccups
    }
}

function dispatchPrintCommand(labelData, printerIp, printerName, callback) {
    if (!labelData || !labelData.name) {
        if (callback) callback(new Error('Invalid label data'));
        return;
    }
    
    const childName = labelData.name;
    const securityCode = labelData.securityCode || '';
    const className = labelData.class || '';
    const allergies = labelData.allergies ? `ALLERGIES: ${labelData.allergies}` : '';
    
    const targetPrinterIp = printerIp || labelData.printerIp || DEFAULT_PRINTER_IP;
    const targetPrinterName = printerName || labelData.printerName || DEFAULT_PRINTER_NAME;

    console.log(`[Print Server] Dispatching job for ${childName} -> Target Printer: ${targetPrinterIp || targetPrinterName}`);

    let command = '';
    const isWindows = process.platform === 'win32';

    if (targetPrinterIp) {
        command = `echo "KIDDOCHECKER BADGE: ${childName} | Code: ${securityCode} | Class: ${className} ${allergies}" | nc -w 2 ${targetPrinterIp} 9100`;
    } else if (isWindows) {
        const printText = `--- KIDDOCHECKER NAME TAG ---\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}\n-----------------------------`;
        command = `powershell -Command "Out-Printer -Name '${targetPrinterName}' -InputObject '${printText}'"`;
    } else {
        const printText = `KIDDOCHECKER NAME TAG\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}`;
        command = `echo "${printText}" | lp -d "${targetPrinterName}"`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.warn(`[Print Server] System print warning: ${error.message}`);
            if (callback) callback(null, { success: true, warning: error.message });
            return;
        }
        console.log(`[Print Server] Print job dispatched successfully to ${targetPrinterIp || targetPrinterName}`);
        if (callback) callback(null, { success: true, printer: targetPrinterIp || targetPrinterName });
    });
}

// Start polling Azure Cloud Print Queue every 2 seconds
setInterval(pollAzureCloudPrintQueue, 2000);

app.post('/print', (req, res) => {
    const { labelData, printerIp, printerName } = req.body || {};
    dispatchPrintCommand(labelData, printerIp, printerName, (err, result) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json(result);
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
    Cloud Relay : Polling Azure API (${AZURE_API_URL})
    
    📌 TECH DESK SERVER IP ADDRESS(ES) TO ENTER ON ANDROID TABLETS:
    ${localIps.map(ip => `   👉 http://${ip}:${PORT}`).join('\n')}

    Multi-Printer Support:
    - Wireless Printer 1 IP : Send printerIp: "192.168.1.101"
    - Wireless Printer 2 IP : Send printerIp: "192.168.1.102"
    ===================================================================
    `);
});
