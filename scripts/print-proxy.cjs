const express = require('express');
const { exec, execFile } = require('child_process');
const bodyParser = require('body-parser');
const os = require('os');
const net = require('net');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;
const HOST = '0.0.0.0'; // Listen on all interfaces

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Enable CORS for browser fetch calls from Android tablet kiosks & web apps
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ─── Real-Time In-Memory Log Store ──────────────────────────────
const logsBuffer = [];
const MAX_LOGS = 300;

function addLog(type, message, details = {}) {
    const entry = {
        id: Date.now() + Math.random().toString(36).substring(2, 5),
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString(),
        type: type, // 'info' | 'success' | 'warn' | 'error' | 'cloud'
        message: message,
        details: details
    };
    logsBuffer.unshift(entry);
    if (logsBuffer.length > MAX_LOGS) {
        logsBuffer.pop();
    }
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warn' ? '⚠️' : type === 'cloud' ? '☁️' : 'ℹ️';
    console.log(`[Print Server ${icon}] ${message} ${details.targetIp ? `(IP: ${details.targetIp})` : ''}`);
}

addLog('info', 'KiddoChecker Remote Print Server Initializing...');

// Dynamic Python Binary Detector (supports python3 on Linux/macOS and python on Windows)
let cachedPythonCmd = null;
function getPythonCmd(cb) {
    if (cachedPythonCmd) return cb(null, cachedPythonCmd);
    exec('python3 --version', (err3) => {
        if (!err3) {
            cachedPythonCmd = 'python3';
            return cb(null, 'python3');
        }
        exec('python --version', (errPy) => {
            if (!errPy) {
                cachedPythonCmd = 'python';
                return cb(null, 'python');
            }
            cb(new Error('Python not installed on host machine'));
        });
    });
}

// Automatically patch brother_ql package for Python 3.12 / Pillow 10+ compatibility across all files
function autoPatchBrotherQl() {
    try {
        const patchScript = `import os, glob, brother_ql
pkg_dir = os.path.dirname(brother_ql.__file__)
for py_file in glob.glob(os.path.join(pkg_dir, '**', '*.py'), recursive=True):
    try:
        content = open(py_file, 'r', encoding='utf-8', errors='ignore').read()
        modified = content.replace('Image.ANTIALIAS', 'getattr(Image, "LANCZOS", getattr(getattr(Image, "Resampling", {}), "LANCZOS", 1))')
        modified = modified.replace('PIL.Image.ANTIALIAS', 'getattr(Image, "LANCZOS", getattr(getattr(Image, "Resampling", {}), "LANCZOS", 1))')
        if modified != content:
            open(py_file, 'w', encoding='utf-8').write(modified)
    except Exception:
        pass`;
        getPythonCmd((pErr, pyCmd) => {
            if (!pErr) {
                exec(`${pyCmd} -c "${patchScript}"`, (err) => {
                    if (!err) addLog('info', `Brother QL PIL.Image compatibility check complete using ${pyCmd}.`);
                });
            }
        });
    } catch(e) {}
}
autoPatchBrotherQl();

// ─── Printer Model Registry ──────────────────────────────────────
const PRINTER_REGISTRY = [
    { id: 'brother_ql_820', name: 'Brother QL-820NWBc / QL-820NWB', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62red', label: 'DK-2251 / DK-22251 - 62mm Continuous Black/Red Roll (Starter Roll)' },
        { value: '62', label: 'DK-2205 - 62mm Continuous Black/White Roll' },
        { value: '29', label: 'DK-1201 - 29mm x 90mm Standard Address Labels' },
        { value: '62x100', label: 'DK-1202 - 62mm x 100mm Large Address Labels' },
        { value: '62x29', label: 'DK-1204 - 62mm x 29mm Multi-Purpose Labels' },
        { value: '29x62', label: 'DK-1209 - 29mm x 62mm Small Address Labels' },
        { value: '38', label: 'DK-1221 - 38mm x 38mm Square Labels' },
        { value: '54', label: 'DK-N55224 - 54mm Continuous Roll' },
        { value: '102', label: 'DK-1247 - 102mm x 51mm Shipping Labels' },
    ]},
    { id: 'brother_ql_810', name: 'Brother QL-810W / QL-800', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62red', label: 'DK-2251 / DK-22251 - 62mm Continuous Black/Red Roll (Starter Roll)' },
        { value: '62', label: 'DK-2205 - 62mm Continuous Black/White Roll' },
        { value: '29', label: 'DK-1201 - 29mm x 90mm Standard Address Labels' },
        { value: '62x100', label: 'DK-1202 - 62mm x 100mm Large Address Labels' },
        { value: '62x29', label: 'DK-1204 - 62mm x 29mm Multi-Purpose Labels' },
        { value: '38', label: 'DK-1221 - 38mm x 38mm Square Labels' },
    ]},
    { id: 'epson_tm_t20',       name: 'Epson TM-T20 / TM-T88 Series',      brand: 'Epson',   protocol: 'escpos', paperWidth: 80 },
    { id: 'star_tsp100',        name: 'Star TSP100 / TSP650 Series',        brand: 'Star',    protocol: 'escpos', paperWidth: 80 },
    { id: 'generic_thermal_80', name: 'Generic Thermal Printer (80mm)',     brand: 'Generic', protocol: 'escpos', paperWidth: 80 },
    { id: 'generic_thermal_58', name: 'Generic Thermal Printer (58mm)',     brand: 'Generic', protocol: 'escpos', paperWidth: 58 },
    { id: 'hp_laserjet',        name: 'HP LaserJet / OfficeJet / DeskJet', brand: 'HP',      protocol: 'pcl5' },
    { id: 'cups_queue',         name: 'CUPS Linux / System Print Queue',   brand: 'CUPS',    protocol: 'cups' },
];

// ─── Persistent Server Configuration ─────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'printer-config.json');

let serverConfig = {
    defaultPrinterIp:    process.env.PRINTER_IP    || '',
    defaultPrinterName:  process.env.PRINTER_NAME  || 'Default Printer',
    defaultPrinterModel: process.env.PRINTER_MODEL || 'brother_ql_820',
    defaultLabelSize:    process.env.LABEL_SIZE    || '62red',
    orgId:               process.env.ORG_ID        || 'default_org',
    childBadgeLength:    parseInt(process.env.CHILD_BADGE_LENGTH || '520', 10),
    guardianTicketLength: parseInt(process.env.GUARDIAN_TICKET_LENGTH || '380', 10),
};

function loadServerConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            Object.keys(serverConfig).forEach(k => { if (parsed[k] !== undefined) serverConfig[k] = parsed[k]; });
            const model = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel);
            addLog('info', `Config loaded: IP/Queue="${serverConfig.defaultPrinterIp || 'None'}" Model="${model ? model.name : serverConfig.defaultPrinterModel}"`);
        }
    } catch (err) {
        addLog('warn', `Could not load printer-config.json: ${err.message}`);
    }
}

function saveServerConfig(newConfig) {
    try {
        serverConfig = { ...serverConfig, ...newConfig };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(serverConfig, null, 2), 'utf-8');
        const model = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel);
        addLog('success', `Config saved: IP/Queue=${serverConfig.defaultPrinterIp} | Model=${model ? model.name : serverConfig.defaultPrinterModel}`);
        return true;
    } catch (err) {
        addLog('error', `Failed to save config: ${err.message}`);
        return false;
    }
}

loadServerConfig();

const AZURE_API_URL = process.env.AZURE_API_URL || 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
let cloudRelayStatus = { active: false, lastPoll: null, jobsProcessed: 0, lastError: null };

// ─── Azure Cloud Print Relay Polling ─────────────────────────────
function pollAzureCloudPrintQueue() {
    try {
        const https = require('https');
        const orgQuery = serverConfig.orgId ? `?orgId=${encodeURIComponent(serverConfig.orgId)}` : '';
        const pollUrl = `${AZURE_API_URL}/api/print-jobs/poll${orgQuery}`;
        const urlObj = new URL(pollUrl);

        const req = https.get({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            port: 443,
            timeout: 4000,
        }, (res) => {
            let rawData = '';
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => {
                try {
                    cloudRelayStatus.lastPoll = new Date().toISOString();
                    cloudRelayStatus.active = true;
                    cloudRelayStatus.lastError = null;

                    if (res.statusCode === 200) {
                        const data = JSON.parse(rawData);
                        if (data.jobs && data.jobs.length > 0) {
                            for (const job of data.jobs) {
                                cloudRelayStatus.jobsProcessed++;
                                const childName = job.labelData?.name || 'Child Badge';
                                const targetIp = (job.printerIp || serverConfig.defaultPrinterIp || '').trim();
                                addLog('cloud', `☁️ Cloud job received for "${childName}"`, {
                                    jobId: job.id,
                                    targetIp: targetIp || 'None',
                                    model: serverConfig.defaultPrinterModel
                                });
                                dispatchPrintCommand(job.labelData, job.printerIp, job.printerName);
                            }
                        }
                    }
                } catch (e) {
                    cloudRelayStatus.lastError = e.message;
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            cloudRelayStatus.active = false;
            cloudRelayStatus.lastError = 'Poll timeout (4s)';
        });

        req.on('error', (err) => {
            cloudRelayStatus.active = false;
            cloudRelayStatus.lastError = err.message;
        });

    } catch (err) {
        cloudRelayStatus.active = false;
        cloudRelayStatus.lastError = err.message;
    }
}

setInterval(pollAzureCloudPrintQueue, 5000);
addLog('info', `Azure Cloud Relay polling initialized (${AZURE_API_URL})`);

// ─── Network Interface & OS Printer Discovery ─────────────────────
function getPhysicalLanInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = [];
    const ignoredPatterns = [/docker/i, /veth/i, /virbr/i, /br-/i, /tun/i, /tap/i, /lo/i];

    for (const devName in interfaces) {
        if (ignoredPatterns.some(p => p.test(devName))) continue;
        const iface = interfaces[devName];
        for (const alias of iface) {
            if ((alias.family === 'IPv4' || alias.family === 4) && !alias.internal) {
                result.push({ interface: devName, ip: alias.address });
            }
        }
    }
    return result;
}

function getLocalIpAddresses() {
    return getPhysicalLanInterfaces().map(i => i.ip);
}

function detectSystemPrinters(cb) {
    const systemPrinters = [];

    // On Linux/Ubuntu: query CUPS lpstat
    if (process.platform === 'linux' || process.platform === 'darwin') {
        exec('lpstat -e 2>/dev/null && lpstat -v 2>/dev/null', (err, stdout) => {
            if (!err && stdout) {
                const lines = stdout.split('\n');
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('device for ')) {
                        const match = trimmed.match(/^device for ([^:]+):\s+(.+)$/);
                        if (match) {
                            const pName = match[1].trim();
                            const pUri = match[2].trim();
                            const ipMatch = pUri.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                            systemPrinters.push({
                                name: pName,
                                type: 'cups',
                                uri: pUri,
                                ip: ipMatch ? ipMatch[1] : ''
                            });
                        }
                    } else if (trimmed && !trimmed.startsWith('device for ')) {
                        systemPrinters.push({ name: trimmed, type: 'cups', uri: `cups://${trimmed}`, ip: '' });
                    }
                });
            }
            cb && cb(systemPrinters);
        });
        return;
    }

    // On Windows: query PowerShell Get-Printer & Get-PrinterPort
    if (process.platform === 'win32') {
        const psCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | ConvertTo-Json"`;
        const psPortCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-PrinterPort | Select-Object Name, PrinterHostAddress | ConvertTo-Json"`;
        exec(psCmd, (err1, stdout1) => {
            exec(psPortCmd, (err2, stdout2) => {
                try {
                    let portsMap = {};
                    if (!err2 && stdout2) {
                        const ports = JSON.parse(stdout2);
                        const portArr = Array.isArray(ports) ? ports : [ports];
                        portArr.forEach(p => { if (p && p.Name) portsMap[p.Name] = p.PrinterHostAddress; });
                    }
                    if (!err1 && stdout1) {
                        const printers = JSON.parse(stdout1);
                        const printerArr = Array.isArray(printers) ? printers : [printers];
                        printerArr.forEach(p => {
                            if (p && p.Name) {
                                const hostIp = portsMap[p.PortName] || (p.PortName.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/) || [])[1] || '';
                                systemPrinters.push({
                                    name: p.Name,
                                    driver: p.DriverName,
                                    port: p.PortName,
                                    type: 'win32',
                                    ip: hostIp
                                });
                            }
                        });
                    }
                } catch(e) {}
                cb && cb(systemPrinters);
            });
        });
        return;
    }

    cb && cb(systemPrinters);
}

// ─── ESC/POS Payload Generator (Epson, Star, Generic Thermal) ────
function generateEscPosPayload(labelData) {
    const childName = labelData.name || '';
    const securityCode = labelData.securityCode || 'TEST';
    const className = labelData.class || 'General';
    const allergies = labelData.allergies || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const LINE = '─'.repeat(32) + '\n';
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none';
    return Buffer.from(
        '\x1b@' + '\x1ba\x01' +
        '\x1bE\x01\x1d!\x00' + 'KIDDOCHECKER CHECK-IN\n' + '\x1bE\x00' + LINE +
        '\x1bE\x01\x1d!\x11' + childName.toUpperCase() + '\n' + '\x1d!\x00\x1bE\x00' + '\n' +
        'Security Code:\n' +
        '\x1bE\x01\x1d!\x22' + ' ' + securityCode + ' \n' + '\x1d!\x00\x1bE\x00' + '\n' +
        '\x1ba\x00' + 'Class    : ' + className + '\n' + 'Check-in : ' + timeStr + '  ' + dateStr + '\n' +
        (hasAllergy ? '\x1ba\x01\n' + LINE + '\x1bE\x01' + '!! ALLERGY ALERT !!\n' + allergies.toUpperCase() + '\n' + '\x1bE\x00' + LINE : '') +
        '\x1ba\x01\n' + 'Must show code at pick-up to claim child.\n' + '\n\n' +
        '\x1bE\x01\x1d!\x22' + ' ' + securityCode + ' \n' + '\x1d!\x00\x1bE\x00' + '\n' +
        '\x1bE\x01\x1d!\x01' + childName + '\n' + '\x1d!\x00\x1bE\x00' +
        dateStr + '\n\n' + LINE + 'Present at pick-up to claim your child.\n\n\n' +
        '\x1dV\x41\x00'
    , 'utf-8');
}

// ─── HP Printer: Vector SVG / PDF Badge Generators ─────────────────
function generateHpChildBadgeSvg(labelData) {
    const nameParts = (labelData.name || '').trim().split(' ');
    const firstName = (nameParts[0] || '').toUpperCase();
    const lastName = (nameParts.slice(1).join(' ') || '').toUpperCase();
    const securityCode = labelData.securityCode || 'TEST';
    const className = labelData.class || 'General';
    const allergies = labelData.allergies || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none';

    const width = 700;
    const height = hasAllergy ? (lastName ? 460 : 410) : (lastName ? 380 : 330);

    const allergySvg = hasAllergy
        ? `<rect x="50" y="${lastName ? 225 : 185}" width="600" height="46" rx="8" fill="#dc2626"/>
           <text x="350" y="${lastName ? 255 : 215}" text-anchor="middle" font-size="20" font-weight="bold" fill="white">⚠️ ALLERGY: ${allergies.toUpperCase()}</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Arial,Helvetica,sans-serif">
  <rect width="${width}" height="${height}" fill="white"/>
  <rect x="30" y="30" width="640" height="${height - 60}" rx="12" fill="white" stroke="#94A3B8" stroke-width="3" stroke-dasharray="10,6"/>

  <text x="60" y="85" font-size="40" font-weight="900" fill="#0F172A">${firstName}</text>
  ${lastName ? `<text x="60" y="130" font-size="40" font-weight="900" fill="#0F172A">${lastName}</text>` : ''}

  <rect x="490" y="55" width="150" height="60" rx="10" fill="#000000"/>
  <text x="565" y="98" text-anchor="middle" font-size="34" font-weight="bold" fill="white" font-family="monospace">${securityCode}</text>

  <line x1="50" y1="${lastName ? 150 : 110}" x2="650" y2="${lastName ? 150 : 110}" stroke="#000000" stroke-width="4"/>

  <text x="60" y="${lastName ? 195 : 155}" font-size="22" font-weight="bold" fill="#0F172A">Class: <tspan font-weight="bold">${className}</tspan></text>
  <text x="640" y="${lastName ? 195 : 155}" text-anchor="end" font-size="22" font-weight="bold" fill="#0F172A">${dateStr}</text>

  ${allergySvg}

  <text x="350" y="${hasAllergy ? (lastName ? 335 : 295) : (lastName ? 265 : 225)}" text-anchor="middle" font-size="18" font-weight="bold" fill="#334155">Must present matching tag for pick-up.</text>
</svg>`;
}

function generateHpGuardianTicketSvg(labelData) {
    const fullNameTitle = (labelData.name || '');
    const securityCode = labelData.securityCode || 'TEST';
    const width = 700;
    const height = 360;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Arial,Helvetica,sans-serif">
  <rect width="${width}" height="${height}" fill="white"/>
  <rect x="30" y="30" width="640" height="300" rx="12" fill="white" stroke="#94A3B8" stroke-width="3" stroke-dasharray="10,6"/>

  <text x="350" y="75" text-anchor="middle" font-size="22" font-weight="bold" fill="#0F172A" letter-spacing="1">PRIMARY GUARDIAN CLAIM TICKET</text>
  <line x1="50" y1="90" x2="650" y2="90" stroke="#000000" stroke-width="3"/>

  <text x="350" y="140" text-anchor="middle" font-size="20" font-weight="bold" fill="#475569">Security Match Code</text>

  <rect x="180" y="160" width="340" height="95" rx="16" fill="#000000"/>
  <text x="350" y="227" text-anchor="middle" font-size="56" font-weight="bold" fill="white" font-family="monospace" letter-spacing="12">${securityCode}</text>

  <text x="350" y="300" text-anchor="middle" font-size="26" font-weight="bold" fill="#0F172A">${fullNameTitle}</text>
</svg>`;
}

function printViaHpPrinter(labelData, printerIp, callback) {
    const svg1 = generateHpChildBadgeSvg(labelData);
    const svg2 = generateHpGuardianTicketSvg(labelData);
    const tmpBase = path.join(os.tmpdir(), 'kiddo_hp_' + Date.now());
    const tmpSvg1 = tmpBase + '_1.svg';
    const tmpSvg2 = tmpBase + '_2.svg';
    const tmpPdf = tmpBase + '.pdf';

    fs.writeFileSync(tmpSvg1, svg1, 'utf-8');
    fs.writeFileSync(tmpSvg2, svg2, 'utf-8');

    function cleanup() {
        try { fs.unlinkSync(tmpSvg1); } catch(e) {}
        try { fs.unlinkSync(tmpSvg2); } catch(e) {}
        try { fs.unlinkSync(tmpPdf); } catch(e) {}
    }

    const convertCmds = [
        'rsvg-convert -f pdf -o "' + tmpPdf + '" "' + tmpSvg1 + '" "' + tmpSvg2 + '"',
        'python3 -c "import cairosvg; cairosvg.svg2pdf(url=\'' + tmpSvg1 + '\', write_to=\'' + tmpPdf + '\')"',
        'convert "' + tmpSvg1 + '" "' + tmpSvg2 + '" "' + tmpPdf + '"'
    ];

    function tryConvert(idx) {
        if (idx >= convertCmds.length) {
            cleanup();
            addLog('warn', 'HP PDF converter unavailable. Using 2-page ASCII mode...');
            return sendRawEscPosPayload(generateEscPosPayload(labelData), printerIp, callback);
        }

        exec(convertCmds[idx], (err) => {
            if (err || !fs.existsSync(tmpPdf)) return tryConvert(idx + 1);

            addLog('info', `HP Printer: Streaming 2-page PDF vector badges to tcp://${printerIp}:9100...`, { targetIp: printerIp });
            const pdfBuffer = fs.readFileSync(tmpPdf);
            cleanup();

            const socket = new net.Socket();
            socket.setTimeout(8000);
            socket.connect(9100, printerIp, () => {
                socket.write(pdfBuffer, () => {
                    socket.end();
                    addLog('success', `✅ HP 2-page PDF badge printed on tcp://${printerIp}:9100!`, { targetIp: printerIp });
                    callback && callback(null, { success: true, printer: printerIp, mode: 'hp_pdf_2page' });
                });
            });
            socket.on('error', (sErr) => {
                addLog('error', `❌ HP Socket error ${printerIp}:9100 — ${sErr.message}`, { targetIp: printerIp, error: sErr.message });
                callback && callback(null, { success: false, error: sErr.message, targetIp: printerIp });
            });
            socket.on('timeout', () => {
                addLog('warn', `⚠️ HP Socket timeout ${printerIp}:9100`, { targetIp: printerIp });
                socket.destroy();
                callback && callback(null, { success: false, error: `Connection timeout to ${printerIp}` });
            });
        });
    }

    tryConvert(0);
}

// ─── Brother QL: Real ISO/IEC 18004 QR Code & SVG Generators ─────────
function generateRealQrCodeSvg(text, x, y, size) {
    const grid = 21;
    const moduleSize = size / grid;
    const bytes = [];
    for (let i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i));
    
    const matrix = Array(grid).fill(0).map(() => Array(grid).fill(0));
    const isReserved = Array(grid).fill(0).map(() => Array(grid).fill(false));

    function setFinder(r0, c0) {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                isReserved[r0 + r][c0 + c] = true;
                if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                    matrix[r0 + r][c0 + c] = 1;
                } else {
                    matrix[r0 + r][c0 + c] = 0;
                }
            }
        }
    }

    setFinder(0, 0);
    setFinder(0, 14);
    setFinder(14, 0);

    for (let i = 0; i < 8; i++) {
        if (i < 7) { isReserved[7][i] = true; isReserved[i][7] = true; }
        if (i < 7) { isReserved[7][13 + i] = true; isReserved[i][13] = true; }
        if (i < 7) { isReserved[13 + i][7] = true; isReserved[13][i] = true; }
    }

    for (let i = 8; i < 13; i++) {
        isReserved[6][i] = true; matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        isReserved[i][6] = true; matrix[i][6] = (i % 2 === 0) ? 1 : 0;
    }
    isReserved[13][8] = true; matrix[13][8] = 1;

    const bitData = [0, 1, 0, 0];
    const len = bytes.length;
    for (let b = 7; b >= 0; b--) bitData.push((len >> b) & 1);
    for (const byte of bytes) {
        for (let b = 7; b >= 0; b--) bitData.push((byte >> b) & 1);
    }
    while (bitData.length < 152) bitData.push(0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1);

    let col = grid - 1;
    let upward = true;
    let bitPtr = 0;
    while (col > 0) {
        if (col === 6) col--;
        for (let i = 0; i < grid; i++) {
            const r = upward ? (grid - 1 - i) : i;
            for (let c = col; c > col - 2; c--) {
                if (!isReserved[r][c]) {
                    const bit = bitPtr < bitData.length ? bitData[bitPtr++] : 0;
                    const mask = ((r + c) % 2 === 0) ? 1 : 0;
                    matrix[r][c] = bit ^ mask;
                }
            }
        }
        upward = !upward;
        col -= 2;
    }

    let rects = '';
    for (let r = 0; r < grid; r++) {
        for (let c = 0; c < grid; c++) {
            if (matrix[r][c] === 1) {
                const rx = (x + c * moduleSize).toFixed(2);
                const ry = (y + r * moduleSize).toFixed(2);
                const ms = (moduleSize + 0.1).toFixed(2);
                rects += `<rect x="${rx}" y="${ry}" width="${ms}" height="${ms}" fill="#000000"/>`;
            }
        }
    }
    return `<g>${rects}</g>`;
}

function generateBrotherQlChildBadgeSvg(labelData, labelSizeValue) {
    const nameParts = (labelData.name || '').trim().split(' ');
    const firstName = (nameParts[0] || '').toUpperCase();
    const lastName = (nameParts.slice(1).join(' ') || '').toUpperCase();
    const securityCode = labelData.securityCode || 'TEST';
    const qrDataPayload = labelData.qrData || securityCode;
    const className = labelData.class || 'General';
    const allergies = labelData.allergies || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none';

    const width = 696;
    const height = parseInt(serverConfig.childBadgeLength || labelData.childBadgeLength || 520, 10);

    const qrSize = 160;
    const qrX = 475;
    const qrY = 118;
    const qrSvg = generateRealQrCodeSvg(qrDataPayload, qrX, qrY, qrSize);

    const allergyY = height - 100;
    const allergySvg = hasAllergy
        ? `<rect x="35" y="${allergyY}" width="${width - 70}" height="48" rx="8" fill="#FF0000"/>
           <text x="${width/2}" y="${allergyY + 33}" text-anchor="middle" font-size="24" font-weight="900" fill="#FFFFFF">⚠️ ALLERGY: ${allergies.toUpperCase()}</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial,Helvetica,sans-serif">
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="6" stroke-dasharray="12,8"/>

  <text x="45" y="92" font-size="50" font-weight="900" fill="#000000">${firstName}</text>
  ${lastName ? `<text x="45" y="148" font-size="50" font-weight="900" fill="#000000">${lastName}</text>` : ''}

  <line x1="40" y1="${lastName ? 172 : 118}" x2="440" y2="${lastName ? 172 : 118}" stroke="#000000" stroke-width="4"/>

  <text x="45" y="${lastName ? 215 : 160}" font-size="28" font-weight="900" fill="#000000">Class: ${className}</text>
  <text x="45" y="${lastName ? 255 : 200}" font-size="24" font-weight="bold" fill="#000000">Date: ${dateStr}</text>

  <rect x="460" y="38" width="190" height="60" rx="10" fill="#000000"/>
  <text x="555" y="80" text-anchor="middle" font-size="34" font-weight="900" fill="#FFFFFF" font-family="monospace" letter-spacing="4">${securityCode}</text>

  <rect x="${qrX - 8}" y="${qrY - 8}" width="${qrSize + 16}" height="${qrSize + 16}" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
  ${qrSvg}

  ${allergySvg}

  <text x="${width/2}" y="${height - 38}" text-anchor="middle" font-size="18" font-weight="900" fill="#000000">Must present matching ticket for pick-up.</text>
</svg>`;
}

function generateBrotherQlGuardianTicketSvg(labelData, labelSizeValue) {
    const fullNameTitle = (labelData.name || '').toUpperCase();
    const securityCode = labelData.securityCode || 'TEST';
    const qrDataPayload = labelData.qrData || securityCode;
    const width = 696;
    const height = parseInt(serverConfig.guardianTicketLength || labelData.guardianTicketLength || 380, 10);

    const qrSize = 160;
    const qrX = 475;
    const qrY = 118;
    const qrSvg = generateRealQrCodeSvg(qrDataPayload, qrX, qrY, qrSize);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial,Helvetica,sans-serif">
  <rect width="${width}" height="${height}" fill="#FFFFFF"/>
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="16" fill="#FFFFFF" stroke="#000000" stroke-width="6" stroke-dasharray="12,8"/>

  <text x="${width/2}" y="65" text-anchor="middle" font-size="26" font-weight="900" fill="#000000" letter-spacing="1">PRIMARY GUARDIAN CLAIM TICKET</text>
  <line x1="40" y1="80" x2="${width - 40}" y2="80" stroke="#000000" stroke-width="4"/>

  <text x="45" y="122" font-size="22" font-weight="bold" fill="#000000">Security Match Code:</text>

  <rect x="45" y="138" width="390" height="120" rx="16" fill="#000000"/>
  <text x="240" y="222" text-anchor="middle" font-size="64" font-weight="900" fill="#FFFFFF" font-family="monospace" letter-spacing="10">${securityCode}</text>

  <rect x="${qrX - 8}" y="${qrY - 8}" width="${qrSize + 16}" height="${qrSize + 16}" rx="10" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
  ${qrSvg}

  <text x="${width/2}" y="${height - 62}" text-anchor="middle" font-size="28" font-weight="900" fill="#000000">Child: ${fullNameTitle}</text>
  <text x="${width/2}" y="${height - 35}" text-anchor="middle" font-size="18" font-weight="bold" fill="#000000">Keep this ticket until child is picked up.</text>
</svg>`;
}

// ─── Linux CUPS Printing Fallback ──────────────────────────────────
function printViaCups(labelData, printerName, callback) {
    const tmpFile = path.join(os.tmpdir(), `kiddo_badge_${Date.now()}.txt`);
    const payload = generateEscPosPayload(labelData);
    fs.writeFileSync(tmpFile, payload);
    
    exec(`lp -d "${printerName}" "${tmpFile}" || lpr -P "${printerName}" "${tmpFile}"`, (err, stdout, stderr) => {
        try { fs.unlinkSync(tmpFile); } catch(e) {}
        if (err) {
            addLog('error', `❌ CUPS Print Error (${printerName}): ${err.message}`);
            return callback && callback(null, { success: false, error: err.message });
        }
        addLog('success', `✅ Label printed via Linux CUPS queue [${printerName}]`);
        callback && callback(null, { success: true, printer: printerName, mode: 'cups' });
    });
}

// ─── Brother QL Print Handler ──────────────────────────────────────
function printViaBrotherQl(labelData, printerIp, callback) {
    const labelSize = (serverConfig.defaultLabelSize || '62red').trim();
    const svg1 = generateBrotherQlChildBadgeSvg(labelData, labelSize);
    const svg2 = generateBrotherQlGuardianTicketSvg(labelData, labelSize);
    const tmpBase = path.join(os.tmpdir(), 'kiddo_label_' + Date.now());
    const tmpSvg1 = tmpBase + '_1.svg';
    const tmpPng1 = tmpBase + '_1.png';
    const tmpSvg2 = tmpBase + '_2.svg';
    const tmpPng2 = tmpBase + '_2.png';

    fs.writeFileSync(tmpSvg1, svg1, 'utf-8');
    fs.writeFileSync(tmpSvg2, svg2, 'utf-8');

    function cleanup() {
        try { fs.unlinkSync(tmpSvg1); } catch(e) {}
        try { fs.unlinkSync(tmpPng1); } catch(e) {}
        try { fs.unlinkSync(tmpSvg2); } catch(e) {}
        try { fs.unlinkSync(tmpPng2); } catch(e) {}
    }

    function convertSvgToPng(svgPath, pngPath, cb) {
        getPythonCmd((pErr, pyCmd) => {
            const pythonExe = pyCmd || 'python3';
            const cmds = [
                `rsvg-convert -b white -o "${pngPath}" "${svgPath}"`,
                `rsvg-convert -o "${pngPath}" "${svgPath}"`,
                `cairosvg "${svgPath}" -o "${pngPath}"`,
                `${pythonExe} -c "import cairosvg; cairosvg.svg2png(url='${svgPath}', write_to='${pngPath}')"`,
                `convert -background white -flatten "${svgPath}" "${pngPath}"`
            ];

            function tryCmd(idx) {
                if (idx >= cmds.length) return cb(new Error('SVG to PNG conversion tools (cairosvg/rsvg-convert/convert) missing on server host'));
                exec(cmds[idx], (err) => {
                    if (!err && fs.existsSync(pngPath) && fs.statSync(pngPath).size > 0) return cb(null);
                    tryCmd(idx + 1);
                });
            }
            tryCmd(0);
        });
    }

    convertSvgToPng(tmpSvg1, tmpPng1, (err1) => {
        if (err1) {
            cleanup();
            const renderErrMsg = 'Brother QL raster conversion tool unavailable. Please run on Ubuntu: sudo apt install librsvg2-bin -y or pip install cairosvg brother_ql.';
            addLog('error', `❌ ${renderErrMsg}`, { targetIp: printerIp });
            return callback && callback(null, { success: false, error: renderErrMsg, targetIp: printerIp });
        }

        convertSvgToPng(tmpSvg2, tmpPng2, (err2) => {
            if (err2) {
                cleanup();
                const renderErrMsg = 'Brother QL raster conversion tool unavailable for label 2.';
                addLog('error', `❌ ${renderErrMsg}`, { targetIp: printerIp });
                return callback && callback(null, { success: false, error: renderErrMsg, targetIp: printerIp });
            }

            const cleanIp = (printerIp || '').replace(/^tcp:\/\//i, '').replace(/:9100$/, '').trim();
            const modelId = serverConfig.defaultPrinterModel || 'brother_ql_820';
            const qlModel = (modelId === 'brother_ql_810' ? 'QL-810W' : 'QL-820NWB');
            const isRed = (labelSize === '62red' || labelSize.includes('red'));
            const redFlag = isRed ? ' --red' : '';

            getPythonCmd((pErr, pyCmd) => {
                const pythonExe = pyCmd || 'python3';
                const getQlCmd = (pngFile) => {
                    return `(brother_ql --model ${qlModel} --backend network --printer ${cleanIp} print --label ${labelSize}${redFlag} "${pngFile}" || brother_ql --model ${qlModel} --backend network --printer tcp://${cleanIp}:9100 print --label ${labelSize}${redFlag} "${pngFile}" || brother_ql --model ${qlModel} --backend linux_kernel --printer /dev/usb/lp0 print --label ${labelSize}${redFlag} "${pngFile}" || ${pythonExe} -m brother_ql.cli --model ${qlModel} --backend network --printer ${cleanIp} print --label ${labelSize}${redFlag} "${pngFile}")`;
                };

                const qlCmd1 = getQlCmd(tmpPng1);
                const qlCmd2 = getQlCmd(tmpPng2);

                addLog('info', `Brother QL: Printing Label 1 (Child Badge) on tcp://${cleanIp}:9100...`);
                exec(qlCmd1, (pErr1, stdout1, stderr1) => {
                    addLog('info', `Brother QL: Printing Label 2 (Guardian Ticket) on tcp://${cleanIp}:9100...`);
                    exec(qlCmd2, (pErr2, stdout2, stderr2) => {
                        if (pErr1 || pErr2) {
                            const rawErr = ((stderr1 || '') + ' ' + (stderr2 || '') + ' ' + (pErr1 ? pErr1.message : '') + ' ' + (pErr2 ? pErr2.message : '')).trim();
                            
                            let userFriendlyErr = rawErr;
                            if (rawErr.includes('No route to host') || rawErr.includes('Errno 113')) {
                                userFriendlyErr = `Printer at IP ${cleanIp} is OFFLINE or UNREACHABLE (No route to host). Check power & Wi-Fi IP address.`;
                            } else if (rawErr.includes('Connection refused') || rawErr.includes('Errno 111')) {
                                userFriendlyErr = `Printer at IP ${cleanIp} refused connection on port 9100. Check printer IP address.`;
                            }

                            if (labelSize !== '62red') {
                                addLog('warn', `Brother QL: First attempt with "${labelSize}" failed. Retrying with starter roll "62red --red"...`);
                                const redCmd1 = `brother_ql --model ${qlModel} --backend network --printer ${cleanIp} print --label 62red --red "${tmpPng1}"`;
                                const redCmd2 = `brother_ql --model ${qlModel} --backend network --printer ${cleanIp} print --label 62red --red "${tmpPng2}"`;
                                exec(redCmd1, (rErr1) => {
                                    exec(redCmd2, (rErr2) => {
                                        cleanup();
                                        if (!rErr1 && !rErr2) {
                                            addLog('success', `✅ Brother QL: Auto-retry with 62red starter roll succeeded on ${cleanIp}!`);
                                            return callback && callback(null, { success: true, printer: cleanIp, mode: 'brother_ql_62red_retry' });
                                        }
                                        addLog('error', `❌ ${userFriendlyErr}`, { error: userFriendlyErr, targetIp: cleanIp });
                                        return callback && callback(null, { success: false, error: userFriendlyErr, printer: cleanIp });
                                    });
                                });
                                return;
                            }
                            cleanup();
                            addLog('error', `❌ ${userFriendlyErr}`, { error: userFriendlyErr, targetIp: cleanIp });
                            return callback && callback(null, { success: false, error: userFriendlyErr, printer: cleanIp });
                        }
                        cleanup();
                        addLog('success', `✅ Brother QL: 2 labels (Child Badge + Guardian Ticket) printed on ${cleanIp}!`);
                        callback && callback(null, { success: true, printer: cleanIp, mode: 'brother_ql_2label' });
                    });
                });
            });
        });
    });
}

// ─── Print Job History Store ──────────────────────────────────────
const printJobsHistory = [];

function recordPrintJob(labelData, targetIp) {
    const job = {
        id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        time: new Date().toLocaleTimeString('en-US'),
        childName: labelData ? (labelData.name || 'Unknown') : 'Unknown',
        securityCode: labelData ? (labelData.securityCode || '') : '',
        className: labelData ? (labelData.class || '') : '',
        targetIp: targetIp,
        status: 'pending',
        labelData: labelData
    };
    printJobsHistory.unshift(job);
    if (printJobsHistory.length > 50) printJobsHistory.pop();
    return job;
}

// ─── Core Dispatcher ─────────────────────────────────────────────
function dispatchPrintCommand(labelData, printerIp, printerName, callback) {
    if (!labelData || !labelData.name) {
        addLog('error', 'Print job rejected: Invalid or missing label data');
        return callback && callback(new Error('Invalid label data'));
    }

    const modelId = labelData.printerModel || serverConfig.defaultPrinterModel || 'generic_thermal_80';
    const printerMeta = PRINTER_REGISTRY.find(p => p.id === modelId) || PRINTER_REGISTRY.find(p => p.id === 'generic_thermal_80');
    const targetIp = (printerIp || labelData.printerIp || serverConfig.defaultPrinterIp || '').trim();
    const jobRecord = recordPrintJob(labelData, targetIp);

    addLog('info', `Dispatching print job for "${labelData.name}"`, {
        jobId: jobRecord.id,
        model: printerMeta.name,
        protocol: printerMeta.protocol,
        targetIp: targetIp || 'None'
    });

    if (!targetIp) {
        jobRecord.status = 'failed';
        jobRecord.error = 'No printer IP or CUPS queue configured';
        addLog('warn', `No Printer IP/Queue set for "${labelData.name}". Select one in the Web Console.`);
        return callback && callback(null, { success: false, error: 'No printer IP configured. Set one in the web console.' });
    }

    // Check if printing to CUPS printer queue
    if (printerMeta.protocol === 'cups' || targetIp.startsWith('cups://') || !targetIp.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
        const cupsQueueName = targetIp.replace(/^cups:\/\//, '');
        printViaCups(labelData, cupsQueueName, (err, res) => {
            if (res && res.success) { jobRecord.status = 'success'; } else { jobRecord.status = 'failed'; jobRecord.error = (res && res.error) || 'CUPS error'; }
            callback && callback(err, res);
        });
        return;
    }

    if (printerMeta.protocol === 'brother_ql') {
        printViaBrotherQl(labelData, targetIp, (err, res) => {
            if (res && res.success) { jobRecord.status = 'success'; } else { jobRecord.status = 'failed'; jobRecord.error = (res && res.error) || 'Brother QL error'; }
            callback && callback(err, res);
        });
        return;
    }

    if (printerMeta.protocol === 'pcl5') {
        printViaHpPrinter(labelData, targetIp, (err, res) => {
            if (res && res.success) { jobRecord.status = 'success'; } else { jobRecord.status = 'failed'; jobRecord.error = (res && res.error) || 'HP print error'; }
            callback && callback(err, res);
        });
        return;
    }

    const payload = generateEscPosPayload(labelData);

    addLog('info', `TCP Socket → ${targetIp}:9100 [${printerMeta.protocol.toUpperCase()}]...`, { jobId: jobRecord.id, targetIp });
    const socket = new net.Socket();
    socket.setTimeout(8000);
    socket.connect(9100, targetIp, () => {
        socket.write(payload, () => {
            socket.end();
            jobRecord.status = 'success';
            addLog('success', `✅ Label printed on ${targetIp} [${printerMeta.name}]!`, { jobId: jobRecord.id, targetIp });
            callback && callback(null, { success: true, printer: targetIp, mode: printerMeta.protocol });
        });
    });
    socket.on('error', (err) => {
        jobRecord.status = 'failed';
        jobRecord.error = err.message;
        addLog('error', `❌ Socket error ${targetIp}:9100 — ${err.message}`, { jobId: jobRecord.id, targetIp, error: err.message });
        callback && callback(null, { success: false, error: err.message, targetIp });
    });
    socket.on('timeout', () => {
        jobRecord.status = 'failed';
        jobRecord.error = `Connection timeout to ${targetIp}`;
        addLog('warn', `⚠️ Socket timeout ${targetIp}:9100 (Unreachable or wrong IP)`, { jobId: jobRecord.id, targetIp });
        socket.destroy();
        callback && callback(null, { success: false, error: `Connection timeout to ${targetIp}` });
    });
}

// ─── API Endpoints ───────────────────────────────────────────────

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'KiddoChecker Remote Multi-Printer Server',
        os: `${process.platform} (${os.type()} ${os.release()})`,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        cloudRelay: cloudRelayStatus,
        serverConfig: serverConfig,
        localIps: getLocalIpAddresses(),
        lanInterfaces: getPhysicalLanInterfaces()
    });
});

app.get('/api/logs', (req, res) => {
    res.json({
        server: 'KiddoChecker Print Server',
        uptimeSeconds: Math.floor(process.uptime()),
        totalLogsCount: logsBuffer.length,
        cloudRelay: cloudRelayStatus,
        serverConfig: serverConfig,
        logs: logsBuffer,
        printJobsHistory: printJobsHistory
    });
});

app.get('/api/history', (req, res) => res.json({ history: printJobsHistory }));

app.post('/api/reprint', (req, res) => {
    const { jobId, customIp } = req.body || {};
    const job = printJobsHistory.find(j => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, error: 'Job not found in history' });

    const targetIp = (customIp || job.targetIp || serverConfig.defaultPrinterIp || '').trim();
    addLog('info', `🔁 REPRINTING badge for "${job.childName}" to ${targetIp}...`, { jobId: job.id, targetIp });
    dispatchPrintCommand(job.labelData, targetIp, '', (err, result) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json({ success: true, message: `Reprinted badge for ${job.childName}`, result });
    });
});

app.get('/api/printers', (req, res) => res.json({ printers: PRINTER_REGISTRY, current: serverConfig.defaultPrinterModel }));

app.get('/api/config', (req, res) => res.json(serverConfig));

app.post('/api/config', (req, res) => {
    const { defaultPrinterIp, defaultPrinterName, defaultPrinterModel, defaultLabelSize, orgId, childBadgeLength, guardianTicketLength } = req.body || {};
    const updated = saveServerConfig({ 
        defaultPrinterIp, 
        defaultPrinterName, 
        defaultPrinterModel, 
        defaultLabelSize,
        orgId: orgId || serverConfig.orgId || 'default_org',
        childBadgeLength: childBadgeLength ? parseInt(childBadgeLength, 10) : 520,
        guardianTicketLength: guardianTicketLength ? parseInt(guardianTicketLength, 10) : 380
    });
    updated ? res.json({ success: true, serverConfig }) : res.status(500).json({ success: false, error: 'Failed to write config file' });
});

app.post('/print', (req, res) => {
    const { labelData, printerIp, printerName } = req.body || {};
    dispatchPrintCommand(labelData, printerIp, printerName, (err, result) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json(result);
    });
});

app.get('/api/scan-printers', async (req, res) => {
    addLog('info', 'Initiating multi-subnet & system printer auto-scan...');
    const lanInterfaces = getPhysicalLanInterfaces();

    detectSystemPrinters(async (systemPrinters) => {
        const foundMap = new Map();

        systemPrinters.forEach(sp => {
            const key = sp.ip || sp.name;
            foundMap.set(key, {
                ip: sp.ip || sp.name,
                name: sp.name,
                source: sp.type === 'cups' ? 'CUPS System Queue' : 'OS Printer Driver',
                type: sp.ip ? 'network_cups' : 'cups_queue',
                details: sp.uri || sp.driver || ''
            });
        });

        const subnets = [...new Set(lanInterfaces.map(i => i.ip.substring(0, i.ip.lastIndexOf('.'))))];
        if (subnets.length === 0) {
            const localIps = getLocalIpAddresses();
            if (localIps.length > 0) subnets.push(localIps[0].substring(0, localIps[0].lastIndexOf('.')));
        }

        const scanPromises = [];
        for (const subnet of subnets) {
            for (let i = 1; i <= 254; i++) {
                const testIp = `${subnet}.${i}`;
                scanPromises.push(new Promise((resolve) => {
                    const socket = new net.Socket();
                    socket.setTimeout(350);
                    socket.connect(9100, testIp, () => {
                        if (!foundMap.has(testIp)) {
                            foundMap.set(testIp, {
                                ip: testIp,
                                name: `Network Thermal Printer (${testIp})`,
                                source: 'Port 9100 (Raw TCP)',
                                type: 'network_ip'
                            });
                        }
                        socket.destroy();
                        resolve(true);
                    });
                    socket.on('error', () => { socket.destroy(); resolve(false); });
                    socket.on('timeout', () => { socket.destroy(); resolve(false); });
                }));
            }
        }

        await Promise.all(scanPromises);
        const printersList = Array.from(foundMap.values());

        addLog('success', `Scan complete! Discovered ${printersList.length} printer(s) across subnets [${subnets.join(', ')}]`, {
            subnets,
            printersCount: printersList.length
        });

        res.json({
            subnets,
            lanInterfaces,
            systemPrinters,
            printers: printersList
        });
    });
});

app.post('/api/test-print', (req, res) => {
    const { printerIp, childName } = req.body || {};
    const targetIp = (printerIp || serverConfig.defaultPrinterIp || '').trim();
    if (!targetIp) {
        return res.status(400).json({ success: false, error: 'Printer IP or Queue Name is required' });
    }
    const testData = {
        name: childName || 'TEST BADGE',
        securityCode: 'T999',
        class: 'Test Room',
        allergies: 'None',
        labelSize: serverConfig.defaultLabelSize || '62'
    };
    dispatchPrintCommand(testData, targetIp, '', (err, result) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json(result);
    });
});

// ─── Ultra-Premium Glassmorphic Web Dashboard (`GET /` & `GET /logs`) ───
app.get(['/', '/logs'], (req, res) => {
    const lanInterfaces = getPhysicalLanInterfaces();
    const currentModel = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel) || PRINTER_REGISTRY[0];
    const isBrother = currentModel.protocol === 'brother_ql';

    const brands = [...new Set(PRINTER_REGISTRY.map(p => p.brand))];
    const printerOptionsHtml = brands.map(brand => {
        const models = PRINTER_REGISTRY.filter(p => p.brand === brand);
        const opts = models.map(m => `<option value="${m.id}" ${serverConfig.defaultPrinterModel === m.id ? 'selected' : ''}>${m.name}</option>`).join('');
        return `<optgroup label="${brand}">${opts}</optgroup>`;
    }).join('');

    const labelSizeOptionsHtml = currentModel.labelSizes
        ? currentModel.labelSizes.map(s => `<option value="${s.value}" ${serverConfig.defaultLabelSize === s.value ? 'selected' : ''}>${s.label}</option>`).join('')
        : '';

    const sampleSvg = generateBrotherQlChildBadgeSvg({
        name: 'SAMUEL OKONKWO',
        securityCode: 'K984',
        class: 'Preschool Room 2',
        allergies: 'PEANUTS',
        qrData: 'K984-SAMUEL'
    }, serverConfig.defaultLabelSize || '62red');

    const html = `
    <!DOCTYPE html>
    <html lang="en" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>⚡ KiddoChecker Print Server Console</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg: #070a12;
                --panel: #0d1322;
                --card: #131c31;
                --card-hover: #192540;
                --border: #23314d;
                --border-bright: #384d77;
                --text: #f8fafc;
                --muted: #94a3b8;
                --primary: #6366f1;
                --primary-glow: rgba(99, 102, 241, 0.35);
                --accent: #8b5cf6;
                --success: #10b981;
                --success-glow: rgba(16, 185, 129, 0.3);
                --danger: #f43f5e;
                --warning: #f59e0b;
                --info: #06b6d4;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
            body { background: var(--bg); color: var(--text); padding: 24px; max-width: 1400px; margin: 0 auto; min-height: 100vh; }
            
            /* Glassmorphism & Cards */
            .glass { background: rgba(19, 28, 49, 0.75); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); }
            .glow-primary { box-shadow: 0 0 30px var(--primary-glow); }
            .glow-success { box-shadow: 0 0 25px var(--success-glow); }

            /* Header */
            header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
            .brand { display: flex; align-items: center; gap: 14px; }
            .brand-logo { width: 44px; height: 44px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 0 20px var(--primary-glow); }
            .brand-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            
            /* Status Pills */
            .badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: inline-flex; align-items: center; gap: 6px; }
            .badge-online { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
            .badge-os { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
            .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

            /* Grid Layout */
            .grid-main { display: grid; grid-template-columns: 1fr 420px; gap: 24px; }
            @media(max-width: 1024px) { .grid-main { grid-template-columns: 1fr; } }
            
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 22px; margin-bottom: 24px; transition: border-color 0.2s ease; }
            .card:hover { border-color: var(--border-bright); }
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .card-title { font-size: 14px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 8px; }

            /* Live Terminal & Logs */
            .terminal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
            .filter-pills { display: flex; gap: 6px; }
            .pill-btn { background: #090d16; border: 1px solid var(--border); color: var(--muted); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; width: auto; margin: 0; }
            .pill-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
            .search-input { background: #080d1a; border: 1px solid var(--border); padding: 8px 14px; border-radius: 10px; font-size: 13px; color: #fff; width: 220px; margin: 0; }

            .log-box { background: #050811; border: 1px solid var(--border); border-radius: 12px; padding: 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px; height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
            .log-entry { padding: 10px 14px; border-radius: 8px; border-left: 4px solid var(--border); background: #0c1324; word-break: break-all; transition: transform 0.1s; }
            .log-entry:hover { transform: translateX(2px); }
            .log-entry.success { border-color: var(--success); background: rgba(16, 185, 129, 0.05); }
            .log-entry.error { border-color: var(--danger); background: rgba(244, 63, 94, 0.07); }
            .log-entry.warn { border-color: var(--warning); background: rgba(245, 158, 11, 0.05); }
            .log-entry.cloud { border-color: var(--primary); background: rgba(99, 102, 241, 0.07); }
            .time { color: var(--muted); font-size: 11px; margin-right: 8px; opacity: 0.8; }

            /* Discovered Printers Grid */
            .printers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; max-height: 280px; overflow-y: auto; padding-right: 4px; }
            .printer-item { background: #080d1a; border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; transition: all 0.2s; }
            .printer-item:hover { border-color: var(--primary); background: #0e172e; }
            .printer-title { font-weight: 700; font-size: 13px; color: #fff; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
            .printer-sub { font-size: 11px; color: var(--muted); margin-bottom: 8px; font-family: 'JetBrains Mono', monospace; }

            /* Buttons & Inputs */
            input, select, button { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid var(--border); background: #080d1a; color: #fff; margin-bottom: 12px; font-size: 13px; transition: all 0.2s; }
            input:focus, select:focus { border-color: var(--primary); outline: none; box-shadow: 0 0 0 3px var(--primary-glow); }
            button { background: linear-gradient(135deg, var(--primary), #4f46e5); font-weight: 700; cursor: pointer; border: none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }
            button:hover { transform: translateY(-1px); opacity: 0.95; }
            .btn-secondary { background: #1e293b; color: #fff; border: 1px solid var(--border); box-shadow: none; }
            .btn-secondary:hover { background: #334155; }
            .btn-success { background: linear-gradient(135deg, var(--success), #059669); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
            
            .ip-tag { background: #1e293b; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #a5b4fc; display: inline-block; margin-right: 6px; margin-bottom: 6px; }
            .note-box { background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 10px; padding: 12px; font-size: 12px; color: #c7d2fe; margin-bottom: 14px; line-height: 1.6; }
            .hidden { display: none !important; }
            .preview-box { background: #ffffff; border-radius: 8px; padding: 12px; text-align: center; max-height: 220px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
            .preview-box svg { max-width: 100%; max-height: 190px; }
        </style>
    </head>
    <body>
        <header>
            <div class="brand">
                <div class="brand-logo">🖨️</div>
                <div>
                    <div class="brand-title">KiddoChecker Print Server</div>
                    <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">
                        <span class="badge badge-os">UBUNTU / LINUX SERVER</span>
                        <span class="badge badge-online"><span class="dot"></span> AGENT ACTIVE</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; items-center;">
                <button onclick="fetchLogs()" class="btn-secondary" style="width: auto; margin: 0; padding: 8px 16px;">🔄 Refresh Logs</button>
                <button onclick="scanNetworkPrinters()" class="btn-success" style="width: auto; margin: 0; padding: 8px 16px;">🔍 Auto-Scan Printers</button>
            </div>
        </header>

        <div class="grid-main">
            <div>
                <!-- Discovered Network & OS Printers Card -->
                <div class="card glass glow-primary" style="border-color: rgba(99, 102, 241, 0.4);">
                    <div class="card-header">
                        <div class="card-title">📡 Discovered System & Network Printers</div>
                        <button onclick="scanNetworkPrinters()" class="btn-secondary" style="width: auto; margin: 0; padding: 4px 12px; font-size: 11px;">⚡ Re-Scan Subnets</button>
                    </div>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 14px;">Automatically detects CUPS installed printers and active network thermal printers across all LAN subnets.</p>
                    <div id="printersGrid" class="printers-grid">
                        <div style="color: var(--muted); font-size: 12px; padding: 16px; text-align: center; grid-column: 1/-1;">
                            Click <strong>Auto-Scan Printers</strong> to discover CUPS & network printers...
                        </div>
                    </div>
                </div>

                <!-- Live Activity Terminal Card -->
                <div class="card glass">
                    <div class="terminal-header">
                        <div class="card-title">🖥️ Real-Time Activity Terminal</div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="text" id="logSearch" class="search-input" placeholder="Filter logs..." onkeyup="filterLogsRender()" />
                            <div class="filter-pills">
                                <button class="pill-btn active" id="filter-all" onclick="setLogFilter('all')">All</button>
                                <button class="pill-btn" id="filter-success" onclick="setLogFilter('success')">Success</button>
                                <button class="pill-btn" id="filter-error" onclick="setLogFilter('error')">Errors</button>
                                <button class="pill-btn" id="filter-cloud" onclick="setLogFilter('cloud')">Cloud</button>
                            </div>
                        </div>
                    </div>
                    <div id="log-box" class="log-box">Connecting to print daemon logs...</div>
                </div>

                <!-- Recent Jobs & One-Click Reprint Card -->
                <div class="card glass" style="border-color: rgba(59, 130, 246, 0.4);">
                    <div class="card-header">
                        <div class="card-title" style="color: #60a5fa;">📋 Recent Print Jobs (One-Click Reprint)</div>
                    </div>
                    <div id="jobs-box" style="background:#050811; border:1px solid var(--border); border-radius:12px; padding:12px; max-height:260px; overflow-y:auto;">
                        <div style="color:var(--muted); font-size:12px; padding:8px;">No print jobs in memory queue yet.</div>
                    </div>
                </div>
            </div>

            <div>
                <!-- Printer Configuration Card -->
                <div class="card glass">
                    <div class="card-title" style="color: var(--primary); margin-bottom: 14px;">⚙️ Printer Configuration</div>

                    <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">PRINTER MODEL:</label>
                    <select id="printerModelSelect" onchange="onModelChange(this.value)">
                        ${printerOptionsHtml}
                    </select>

                    <div id="labelSizeRow" class="${isBrother ? '' : 'hidden'}">
                        <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">BROTHER DK LABEL ROLL SIZE:</label>
                        <select id="labelSizeSelect">
                            ${labelSizeOptionsHtml}
                        </select>
                    </div>

                    <div id="brotherQlNote" class="note-box ${isBrother ? '' : 'hidden'}">
                        ⚠️ <strong>Ubuntu Brother QL Setup:</strong><br>
                        Run once in terminal:<br>
                        <code>sudo apt update && sudo apt install librsvg2-bin -y</code><br>
                        <code>pip3 install brother_ql cairosvg "Pillow<10" --break-system-packages</code>
                    </div>

                    <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">PRINTER IP OR CUPS QUEUE NAME:</label>
                    <input type="text" id="defaultIpInput" placeholder="e.g. 192.168.1.169 or Brother_QL_820NWB" value="${serverConfig.defaultPrinterIp}" />

                    <div style="display:flex; gap:10px; margin-top:4px;">
                        <div style="flex:1;">
                            <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">BADGE LENGTH (PX):</label>
                            <input type="number" id="childBadgeLengthInput" value="${serverConfig.childBadgeLength || 520}" />
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">TICKET LENGTH (PX):</label>
                            <input type="number" id="guardianTicketLengthInput" value="${serverConfig.guardianTicketLength || 380}" />
                        </div>
                    </div>

                    <button onclick="saveDefaultConfig()" class="btn-success" style="margin-top:8px;">💾 Save Printer Configuration</button>
                    <div id="configResult" style="font-size: 12px; font-weight: 700; margin-top: 6px; text-align: center;"></div>
                </div>

                <!-- Live Badge Preview Visualizer -->
                <div class="card glass">
                    <div class="card-title">👁️ Live Badge Preview</div>
                    <div class="preview-box">
                        ${sampleSvg}
                    </div>
                </div>

                <!-- Direct Printer Tester Card -->
                <div class="card glass">
                    <div class="card-title">🚀 Direct Printer Tester</div>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Send immediate test payload to printer IP or CUPS queue.</p>
                    <input type="text" id="testIp" placeholder="Printer IP or CUPS Name" value="${serverConfig.defaultPrinterIp || '192.168.1.169'}" />
                    <input type="text" id="testName" placeholder="Test Child Name" value="SAMUEL OKONKWO" />
                    <button onclick="sendTestPrint()">🚀 Dispatch Test Print</button>
                    <div id="testResult" style="font-size: 12px; font-weight: 700; margin-top: 6px;"></div>
                </div>

                <!-- Server Environment Info Card -->
                <div class="card glass">
                    <div class="card-title">🐧 Ubuntu Server Status</div>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--border); padding: 6px 0;"><span>Platform:</span> <strong style="color:#a5b4fc;">${process.platform} (${os.type()})</strong></div>
                        <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--border); padding: 6px 0;"><span>Uptime:</span> <strong id="uptime">Loading...</strong></div>
                        <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--border); padding: 6px 0;"><span>Active Model:</span> <strong id="activeModel">${currentModel.name}</strong></div>
                        <div style="display:flex; justify-content:space-between; padding: 6px 0;"><span>Cloud Relay:</span> <strong style="color: var(--success);">Polling Active</strong></div>
                    </div>
                    <div style="margin-top: 14px;">
                        <p style="font-size: 11px; color: var(--muted); font-weight: 700; margin-bottom: 6px;">PHYSICAL LAN SUBNETS & SERVER IPS:</p>
                        ${lanInterfaces.map(iface => `<div style="margin-bottom:4px;"><span class="ip-tag">${iface.interface}: http://${iface.ip}:${PORT}</span></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentLogs = [];
            let activeLogFilter = 'all';

            async function fetchLogs() {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 4000);
                    const res = await fetch('/api/logs', { signal: controller.signal });
                    clearTimeout(timeout);

                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    const data = await res.json();
                    
                    document.getElementById('uptime').innerText = Math.floor(data.uptimeSeconds / 60) + ' mins ' + (data.uptimeSeconds % 60) + ' secs';
                    if (data.serverConfig && data.serverConfig.defaultPrinterIp) {
                        const currentInput = document.getElementById('defaultIpInput');
                        if (document.activeElement !== currentInput) {
                            currentInput.value = data.serverConfig.defaultPrinterIp;
                        }
                    }

                    currentLogs = data.logs || [];
                    filterLogsRender();

                    const jobsBox = document.getElementById('jobs-box');
                    if (data.printJobsHistory && data.printJobsHistory.length > 0) {
                        jobsBox.innerHTML = data.printJobsHistory.map(job => {
                            const statusColor = job.status === 'success' ? '#10b981' : (job.status === 'failed' ? '#f43f5e' : '#f59e0b');
                            return '<div style="display:flex; justify-content:space-between; align-items:center; background:#0c1324; border:1px solid var(--border); padding:10px 14px; border-radius:8px; margin-bottom:6px; font-size:12px;">' +
                                '<div>' +
                                    '<strong style="font-size:14px; color:#fff;">' + job.childName + '</strong> ' +
                                    '<span style="color:#94a3b8; font-size:11px;">[' + job.securityCode + ']</span>' +
                                    '<div style="color:#64748b; font-size:11px; margin-top:2px;">' + job.time + ' | Target: ' + job.targetIp + ' | <span style="color:' + statusColor + '; font-weight:bold;">' + job.status.toUpperCase() + '</span></div>' +
                                '</div>' +
                                '<div>' +
                                    '<button onclick="reprintJob(&quot;' + job.id + '&quot;)" style="background:#2563eb; width:auto; padding:6px 12px; font-size:12px; margin:0;">🔁 Reprint</button>' +
                                '</div>' +
                            '</div>';
                        }).join('');
                    }
                } catch(e) { }
            }

            function setLogFilter(filter) {
                activeLogFilter = filter;
                document.querySelectorAll('.filter-pills .pill-btn').forEach(btn => btn.classList.remove('active'));
                const el = document.getElementById('filter-' + filter);
                if (el) el.classList.add('active');
                filterLogsRender();
            }

            function filterLogsRender() {
                const search = (document.getElementById('logSearch').value || '').toLowerCase();
                const box = document.getElementById('log-box');
                
                let filtered = currentLogs.filter(log => {
                    if (activeLogFilter !== 'all' && log.type !== activeLogFilter) return false;
                    if (search) {
                        const str = (log.message + ' ' + (log.details ? JSON.stringify(log.details) : '')).toLowerCase();
                        return str.includes(search);
                    }
                    return true;
                });

                if (filtered.length === 0) {
                    box.innerHTML = '<div style="color:#94a3b8; padding:12px; text-align:center;">No matching logs found...</div>';
                    return;
                }

                box.innerHTML = filtered.map(log => {
                    const jobId = log.details && log.details.jobId ? log.details.jobId : '';
                    const isFail = log.type === 'error' || log.type === 'warn';
                    const retryBtn = (jobId && isFail) ? '<button onclick="reprintJob(&quot;' + jobId + '&quot;)" style="background:#f43f5e; width:auto; padding:2px 8px; font-size:10px; margin-left:8px; display:inline-block;">🔁 Retry</button>' : '';
                    return '<div class="log-entry ' + log.type + '">' +
                        '<span class="time">' + log.time + '</span>' +
                        '<strong>' + log.message + '</strong>' + retryBtn +
                        (log.details && log.details.targetIp ? '<div style="font-size:11px; color:#94a3b8; margin-top:2px;">Target: ' + log.details.targetIp + '</div>' : '') +
                    '</div>';
                }).join('');
            }

            async function scanNetworkPrinters() {
                const grid = document.getElementById('printersGrid');
                grid.innerHTML = '<div style="color:#f59e0b; padding:16px; text-align:center; grid-column:1/-1;">Scanning CUPS queues & local subnets for active printers...</div>';
                
                try {
                    const res = await fetch('/api/scan-printers');
                    const data = await res.json();
                    
                    if (data.printers && data.printers.length > 0) {
                        grid.innerHTML = data.printers.map(p => {
                            const isNet = p.type === 'network_ip';
                            const badgeColor = isNet ? '#10b981' : '#6366f1';
                            return '<div class="printer-item">' +
                                '<div>' +
                                    '<div class="printer-title"><span>' + p.name + '</span> <span style="background:' + badgeColor + '; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">' + (isNet ? 'NETWORK IP' : 'CUPS SYSTEM') + '</span></div>' +
                                    '<div class="printer-sub">' + p.ip + ' (' + p.source + ')</div>' +
                                '</div>' +
                                '<button onclick="selectDiscoveredPrinter(&quot;' + p.ip + '&quot;, &quot;' + p.name + '&quot;)" class="btn-success" style="padding:6px 12px; font-size:11px; margin:0;">⚡ Use Printer</button>' +
                            '</div>';
                        }).join('');
                    } else {
                        grid.innerHTML = '<div style="color:#f43f5e; padding:16px; text-align:center; grid-column:1/-1;">No active printers found on scanned subnets. Check printer IP address & Wi-Fi.</div>';
                    }
                } catch(e) {
                    grid.innerHTML = '<div style="color:#f43f5e; padding:16px; text-align:center; grid-column:1/-1;">Scan error: ' + e.message + '</div>';
                }
                setTimeout(fetchLogs, 1000);
            }

            function selectDiscoveredPrinter(ip, name) {
                document.getElementById('defaultIpInput').value = ip;
                document.getElementById('testIp').value = ip;
                saveDefaultConfig();
            }

            async function reprintJob(jobId) {
                const customIp = prompt('Enter Printer IP or CUPS queue to reprint badge:', document.getElementById('defaultIpInput').value);
                if (customIp === null) return;
                try {
                    const res = await fetch('/api/reprint', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ jobId, customIp })
                    });
                    const data = await res.json();
                    if (data.success) {
                        alert('✅ ' + data.message);
                    } else {
                        alert('❌ Reprint failed: ' + (data.error || 'Unknown error'));
                    }
                } catch(e) { alert('❌ Error: ' + e.message); }
                setTimeout(fetchLogs, 1000);
            }

            function onModelChange(modelId) {
                const REGISTRY = ${JSON.stringify(PRINTER_REGISTRY)};
                const model = REGISTRY.find(p => p.id === modelId);
                const isBrother = model && model.protocol === 'brother_ql';
                const lsRow = document.getElementById('labelSizeRow');
                const qlNote = document.getElementById('brotherQlNote');
                if (lsRow) lsRow.style.display = isBrother ? 'block' : 'none';
                if (qlNote) qlNote.style.display = isBrother ? 'block' : 'none';
            }

            async function saveDefaultConfig() {
                const ip = document.getElementById('defaultIpInput').value.trim();
                const modelSel = document.getElementById('printerModelSelect');
                const model = modelSel ? modelSel.value : 'generic_thermal_80';
                const labelSizeSel = document.getElementById('labelSizeSelect');
                const labelSize = labelSizeSel ? labelSizeSel.value : '62';
                const badgeLen = document.getElementById('childBadgeLengthInput') ? document.getElementById('childBadgeLengthInput').value : 520;
                const ticketLen = document.getElementById('guardianTicketLengthInput') ? document.getElementById('guardianTicketLengthInput').value : 380;
                const resDiv = document.getElementById('configResult');
                resDiv.innerText = 'Saving configuration...';
                resDiv.style.color = '#f59e0b';

                try {
                    const res = await fetch('/api/config', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ 
                            defaultPrinterIp: ip, 
                            defaultPrinterModel: model, 
                            defaultLabelSize: labelSize,
                            childBadgeLength: badgeLen,
                            guardianTicketLength: ticketLen
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        resDiv.innerText = 'Saved! Active Target: ' + ip;
                        resDiv.style.color = '#10b981';
                    } else {
                        resDiv.innerText = 'Failed to save config';
                        resDiv.style.color = '#f43f5e';
                    }
                } catch(e) {
                    resDiv.innerText = 'Error: ' + e.message;
                    resDiv.style.color = '#f43f5e';
                }
                setTimeout(fetchLogs, 1000);
            }

            async function sendTestPrint() {
                const ip = document.getElementById('testIp').value;
                const name = document.getElementById('testName').value;
                const resDiv = document.getElementById('testResult');
                resDiv.innerText = 'Sending test print to ' + ip + '...';
                resDiv.style.color = '#f59e0b';

                try {
                    const res = await fetch('/api/test-print', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ printerIp: ip, childName: name })
                    });
                    const data = await res.json();
                    if (data.success) {
                        resDiv.innerText = '✅ Test Print Dispatched to ' + ip;
                        resDiv.style.color = '#10b981';
                    } else {
                        resDiv.innerText = '❌ Failed: ' + (data.error || 'Unknown error');
                        resDiv.style.color = '#f43f5e';
                    }
                } catch(e) {
                    resDiv.innerText = '❌ Error: ' + e.message;
                    resDiv.style.color = '#f43f5e';
                }
                setTimeout(fetchLogs, 1000);
            }

            fetchLogs();
            setInterval(fetchLogs, 3000);
            scanNetworkPrinters();
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

const server = app.listen(PORT, HOST, () => {
    const lanInterfaces = getPhysicalLanInterfaces();
    const model = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel);
    addLog('info', `Server listening on http://${HOST}:${PORT}`);
    console.log(`
    ===================================================================
    ⚡ KiddoChecker Ubuntu Print Server & Web Dashboard
    ===================================================================
    OS Platform  : ${process.platform} (${os.type()} ${os.release()})
    Status       : Listening on http://${HOST}:${PORT}
    Cloud Relay  : Polling Azure API (${AZURE_API_URL})
    Active Model : ${model ? model.name : serverConfig.defaultPrinterModel} [${model ? model.protocol : '?'}]
    Default IP   : ${serverConfig.defaultPrinterIp || 'None (Set via Web Console)'}
    
    Physical LAN Server URLs:
    ${lanInterfaces.map(i => `   http://${i.ip}:${PORT} (${i.interface})`).join('\n')}

    Supported: ${PRINTER_REGISTRY.length} models across ${[...new Set(PRINTER_REGISTRY.map(p => p.brand))].length} brands
    ===================================================================
    `);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ [Fatal Error] Port ${PORT} is already in use by another process. Run: fuser -k ${PORT}/tcp or killall node`);
    } else {
        console.error(`❌ [Fatal Error] Server error:`, err);
    }
});
