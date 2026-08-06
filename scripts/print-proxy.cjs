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

// Automatically patch brother_ql's conversion module for Python 3.12 / Pillow 10+ compatibility
function autoPatchBrotherQl() {
    try {
        const patchScript = `import brother_ql.conversion as c, inspect; p=inspect.getfile(c); txt=open(p).read(); txt=txt.replace('getattr(Image, LANCZOS, getattr(getattr(Image, Resampling, {}), LANCZOS, 1))', 'getattr(Image, "LANCZOS", getattr(getattr(Image, "Resampling", {}), "LANCZOS", 1))'); txt=txt.replace('Image.ANTIALIAS', 'getattr(Image, "LANCZOS", getattr(getattr(Image, "Resampling", {}), "LANCZOS", 1))'); open(p,'w').write(txt)`;
        exec(`python3 -c "${patchScript}"`, (err) => {
            if (!err) addLog('info', 'Brother QL PIL.Image compatibility check complete.');
        });
    } catch(e) {}
}
autoPatchBrotherQl();

// ─── Printer Model Registry ──────────────────────────────────────
// All supported printer models. Select once from the web console;
// the server auto-generates the correct protocol payload.
const PRINTER_REGISTRY = [
    { id: 'brother_ql_820', name: 'Brother QL-820NWBc / QL-820NWB', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62', label: 'DK-2205 - 62mm Continuous Black/White Roll' },
        { value: '62red', label: 'DK-2251 / DK-22251 - 62mm Continuous Black/Red Roll (Starter Roll)' },
        { value: '29', label: 'DK-1201 - 29mm x 90mm Standard Address Labels' },
        { value: '62x100', label: 'DK-1202 - 62mm x 100mm Large Address Labels' },
        { value: '62x29', label: 'DK-1204 - 62mm x 29mm Multi-Purpose Labels' },
        { value: '29x62', label: 'DK-1209 - 29mm x 62mm Small Address Labels' },
        { value: '38', label: 'DK-1221 - 38mm x 38mm Square Labels' },
        { value: '54', label: 'DK-N55224 - 54mm Continuous Roll' },
        { value: '102', label: 'DK-1247 - 102mm x 51mm Shipping Labels' },
    ]},
    { id: 'brother_ql_810', name: 'Brother QL-810W / QL-800', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62', label: 'DK-2205 - 62mm Continuous Black/White Roll' },
        { value: '62red', label: 'DK-2251 / DK-22251 - 62mm Continuous Black/Red Roll (Starter Roll)' },
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
];

// ─── Persistent Server Configuration ─────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'printer-config.json');

let serverConfig = {
    defaultPrinterIp:    process.env.PRINTER_IP    || '',
    defaultPrinterName:  process.env.PRINTER_NAME  || 'Default Printer',
    defaultPrinterModel: process.env.PRINTER_MODEL || 'brother_ql_820',
    defaultLabelSize:    process.env.LABEL_SIZE    || '62',
    childBadgeLength:    parseInt(process.env.CHILD_BADGE_LENGTH || '520', 10),
    guardianTicketLength: parseInt(process.env.GUARDIAN_TICKET_LENGTH || '380', 10),
};

function loadServerConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            Object.keys(serverConfig).forEach(k => { if (parsed[k] !== undefined) serverConfig[k] = parsed[k]; });
            const model = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel);
            addLog('info', `Config loaded: IP="${serverConfig.defaultPrinterIp || 'None'}" Model="${model ? model.name : serverConfig.defaultPrinterModel}"`);
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
        addLog('success', `Config saved: IP=${serverConfig.defaultPrinterIp} | Model=${model ? model.name : serverConfig.defaultPrinterModel}`);
        return true;
    } catch (err) {
        addLog('error', `Failed to save config: ${err.message}`);
        return false;
    }
}

loadServerConfig();

const AZURE_API_URL = process.env.AZURE_API_URL || 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
let cloudRelayStatus = { active: false, lastPoll: null, jobsProcessed: 0, lastError: null };

// ─── Azure Cloud Print Relay Polling (Universal Node https) ───────
function pollAzureCloudPrintQueue() {
    try {
        const https = require('https');
        const pollUrl = `${AZURE_API_URL}/api/print-jobs/poll`;
        const urlObj = new URL(pollUrl);

        const req = https.get({
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            port: 443,
            timeout: 4000,  // 4-second hard timeout — prevents blocking the event loop
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

// Poll every 5 seconds (was 1.5s — reduced to prevent network saturation)
setInterval(pollAzureCloudPrintQueue, 5000);
addLog('info', `Azure Cloud Relay polling initialized (${AZURE_API_URL})`);


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
    const DBL_LINE = '═'.repeat(32) + '\n';
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

// Strict 7-bit ASCII PCL5 2-page fallback (Page 1 = Child Badge, Page 2 = Guardian Ticket)
function generatePcl5Payload(labelData) {
    const childName = labelData.name || '';
    const securityCode = labelData.securityCode || 'TEST';
    const className = labelData.class || 'General';
    const allergies = labelData.allergies || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const div = '-'.repeat(46) + '\r\n';
    const dDiv = '='.repeat(46) + '\r\n';
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none';
    return Buffer.from(
        // PAGE 1: CHILD BADGE
        '\x1bE' +               // Reset printer
        '\x1b&l2A' +            // Letter size
        '\x1b&l0O' +            // Portrait
        '\x1b&l6D' +            // 6 lines per inch
        '\x1b&l0E' +            // Top margin 0
        '\x1b&a5L' +            // Left margin 5
        `KIDDOCHECKER CHILD CHECK-IN\r\n` + div +
        `NAME  : ${childName.toUpperCase()}\r\n` +
        `CODE  : [ ${securityCode} ]\r\n` +
        `CLASS : ${className}\r\n` +
        `TIME  : ${timeStr}  ${dateStr}\r\n` +
        (hasAllergy ? `\r\n!! ALLERGY ALERT: ${allergies.toUpperCase()} !!\r\n` : '') +
        div +
        `Must present matching code at pick-up to claim child.\r\n\r\n` +
        '\x0C' +                  // Eject Page 1

        // PAGE 2: PRIMARY GUARDIAN CLAIM TICKET
        dDiv +
        `        PRIMARY GUARDIAN CLAIM TICKET\r\n` +
        dDiv +
        `Security Code : [ ${securityCode} ]\r\n` +
        `Child Name    : ${childName}\r\n` +
        `Date          : ${dateStr}\r\n` +
        div +
        `Present this ticket at pick-up to claim child.\r\n\r\n` +
        '\x0C'                  // Eject Page 2
    , 'ascii');
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
            addLog('warn', 'HP PDF converter unavailable. Using 2-page 7-bit ASCII PCL5 mode...');
            sendRawPcl5(generatePcl5Payload(labelData), printerIp, callback);
            return;
        }

        exec(convertCmds[idx], (err) => {
            if (err || !fs.existsSync(tmpPdf)) return tryConvert(idx + 1);

            addLog('info', `HP Printer: Streaming 2-page PDF vector badges (Page 1: Child Badge, Page 2: Guardian Ticket) to tcp://${printerIp}:9100...`, { targetIp: printerIp });
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

function sendRawPcl5(payload, printerIp, callback) {
    addLog('info', `TCP Socket → ${printerIp}:9100 [PCL5 STRICT ASCII]...`, { targetIp: printerIp });
    const socket = new net.Socket();
    socket.setTimeout(8000);
    socket.connect(9100, printerIp, () => {
        socket.write(payload, () => {
            socket.end();
            addLog('success', `✅ PCL5 2-page ASCII label printed on ${printerIp}!`, { targetIp: printerIp });
            callback && callback(null, { success: true, printer: printerIp, mode: 'pcl5_ascii_2page' });
        });
    });
    socket.on('error', (err) => {
        addLog('error', `❌ Socket error ${printerIp}:9100 — ${err.message}`, { targetIp: printerIp, error: err.message });
        callback && callback(null, { success: false, error: err.message, targetIp: printerIp });
    });
    socket.on('timeout', () => {
        addLog('warn', `⚠️ Socket timeout ${printerIp}:9100`, { targetIp: printerIp });
        socket.destroy();
        callback && callback(null, { success: false, error: `Connection timeout to ${printerIp}` });
    });
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

    // Large 220px x 220px QR Code with Quiet Zone
    const qrSize = 220;
    const qrX = width - qrSize - 35;
    const qrY = 100;
    const qrSvg = generateRealQrCodeSvg(qrDataPayload, qrX, qrY, qrSize);

    const allergyY = height - 110;
    const allergySvg = hasAllergy
        ? `<rect x="35" y="${allergyY}" width="${width - 70}" height="55" rx="10" fill="#dc2626"/>
           <text x="${width/2}" y="${allergyY + 38}" text-anchor="middle" font-size="28" font-weight="900" fill="white">⚠️ ALLERGY: ${allergies.toUpperCase()}</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial,Helvetica,sans-serif">
  <rect width="${width}" height="${height}" fill="white"/>
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="16" fill="white" stroke="#000000" stroke-width="6" stroke-dasharray="12,8"/>

  <!-- Child First & Last Name (HUGE & BOLD - 56pt) -->
  <text x="45" y="105" font-size="56" font-weight="900" fill="#0F172A">${firstName}</text>
  ${lastName ? `<text x="45" y="165" font-size="56" font-weight="900" fill="#0F172A">${lastName}</text>` : ''}

  <!-- Security Code Black Box (Top Right) -->
  <rect x="${width - 200}" y="35" width="165" height="58" rx="10" fill="#000000"/>
  <text x="${width - 118}" y="77" text-anchor="middle" font-size="34" font-weight="900" fill="white" font-family="monospace" letter-spacing="4">${securityCode}</text>

  <!-- Divider Line -->
  <line x1="40" y1="${lastName ? 190 : 130}" x2="${width - 250}" y2="${lastName ? 190 : 130}" stroke="#000000" stroke-width="4"/>

  <!-- Class Name & Date -->
  <text x="45" y="${lastName ? 238 : 178}" font-size="30" font-weight="900" fill="#0F172A">Class: ${className}</text>
  <text x="45" y="${lastName ? 282 : 222}" font-size="26" font-weight="bold" fill="#475569">Date: ${dateStr}</text>

  <!-- White Quiet-Zone Background Box for QR Code -->
  <rect x="${qrX - 10}" y="${qrY - 10}" width="${qrSize + 20}" height="${qrSize + 20}" rx="12" fill="white" stroke="#000000" stroke-width="3"/>
  <!-- Prominent 220px Real Scannable ISO QR Code -->
  ${qrSvg}

  <!-- Allergy Alert Box -->
  ${allergySvg}

  <!-- Footer Claim Note -->
  <text x="${width/2}" y="${height - 40}" text-anchor="middle" font-size="20" font-weight="900" fill="#334155">Must present matching ticket for pick-up.</text>
</svg>`;
}

function generateBrotherQlGuardianTicketSvg(labelData, labelSizeValue) {
    const fullNameTitle = (labelData.name || '').toUpperCase();
    const securityCode = labelData.securityCode || 'TEST';
    const qrDataPayload = labelData.qrData || securityCode;
    const width = 696;
    const height = parseInt(serverConfig.guardianTicketLength || labelData.guardianTicketLength || 380, 10);

    // Large 210px x 210px QR Code with Quiet Zone
    const qrSize = 210;
    const qrX = width - qrSize - 35;
    const qrY = 100;
    const qrSvg = generateRealQrCodeSvg(qrDataPayload, qrX, qrY, qrSize);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="Arial,Helvetica,sans-serif">
  <rect width="${width}" height="${height}" fill="white"/>
  <rect x="25" y="25" width="${width - 50}" height="${height - 50}" rx="16" fill="white" stroke="#000000" stroke-width="6" stroke-dasharray="12,8"/>

  <!-- Title Header -->
  <text x="${width/2}" y="70" text-anchor="middle" font-size="28" font-weight="900" fill="#0F172A" letter-spacing="1">PRIMARY GUARDIAN CLAIM TICKET</text>
  <line x1="40" y1="86" x2="${width - 40}" y2="86" stroke="#000000" stroke-width="4"/>

  <!-- Security Code Header -->
  <text x="45" y="135" font-size="24" font-weight="bold" fill="#475569">Security Match Code:</text>

  <!-- Security Code Black Box -->
  <rect x="45" y="155" width="370" height="100" rx="16" fill="#000000"/>
  <text x="230" y="225" text-anchor="middle" font-size="58" font-weight="900" fill="white" font-family="monospace" letter-spacing="8">${securityCode}</text>

  <!-- White Quiet-Zone Background Box for QR Code -->
  <rect x="${qrX - 10}" y="${qrY - 10}" width="${qrSize + 20}" height="${qrSize + 20}" rx="12" fill="white" stroke="#000000" stroke-width="3"/>
  <!-- Prominent 210px Real Scannable ISO QR Code -->
  ${qrSvg}

  <!-- Child Name Footer -->
  <text x="${width/2}" y="${height - 65}" text-anchor="middle" font-size="30" font-weight="900" fill="#0F172A">Child: ${fullNameTitle}</text>
  <text x="${width/2}" y="${height - 35}" text-anchor="middle" font-size="18" font-weight="bold" fill="#64748B">Keep this ticket until child is picked up.</text>
</svg>`;
}

// ─── Brother QL: Print via Python CLI (Prints 2 Labels & Cuts Each) ──────
function printViaBrotherQl(labelData, printerIp, callback) {
    const labelSize = (serverConfig.defaultLabelSize || labelData.labelSize || '62red').trim();
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
        const cmds = [
            `rsvg-convert -o "${pngPath}" "${svgPath}"`,
            `cairosvg "${svgPath}" -o "${pngPath}"`,
            `python3 -c "import cairosvg; cairosvg.svg2png(url='${svgPath}', write_to='${pngPath}')"`,
            `convert "${svgPath}" "${pngPath}"`
        ];

        function tryCmd(idx) {
            if (idx >= cmds.length) return cb(new Error('SVG to PNG conversion unavailable'));
            exec(cmds[idx], (err) => {
                if (!err && fs.existsSync(pngPath) && fs.statSync(pngPath).size > 0) return cb(null);
                tryCmd(idx + 1);
            });
        }
        tryCmd(0);
    }

    convertSvgToPng(tmpSvg1, tmpPng1, (err1) => {
        convertSvgToPng(tmpSvg2, tmpPng2, (err2) => {
            if (err1 || err2) {
                cleanup();
                addLog('warn', 'Brother QL: SVG→PNG tools unavailable. Falling back to direct TCP socket payload...');
                return sendRawEscPosPayload(generateEscPosPayload(labelData), printerIp, callback);
            }

            const modelId = serverConfig.defaultPrinterModel || 'brother_ql_820';
            const qlModel = (modelId === 'brother_ql_810' ? 'QL-810W' : 'QL-820NWB');
            const isRed = (labelSize === '62red' || labelSize.includes('red'));
            const redFlag = isRed ? ' --red' : '';

            const getQlCmd = (pngFile) => {
                return `(brother_ql --model ${qlModel} --backend network --printer tcp://${printerIp}:9100 print --label ${labelSize}${redFlag} --rotate auto "${pngFile}" || /usr/local/bin/brother_ql --model ${qlModel} --backend network --printer tcp://${printerIp}:9100 print --label ${labelSize}${redFlag} --rotate auto "${pngFile}" || ~/.local/bin/brother_ql --model ${qlModel} --backend network --printer tcp://${printerIp}:9100 print --label ${labelSize}${redFlag} --rotate auto "${pngFile}" || python3 -m brother_ql --model ${qlModel} --backend network --printer tcp://${printerIp}:9100 print --label ${labelSize}${redFlag} --rotate auto "${pngFile}")`;
            };

            const qlCmd1 = getQlCmd(tmpPng1);
            const qlCmd2 = getQlCmd(tmpPng2);

            addLog('info', `Brother QL: Printing Label 1 (Child Badge) on tcp://${printerIp}:9100...`);
            exec(qlCmd1, (pErr1) => {
                addLog('info', `Brother QL: Printing Label 2 (Guardian Ticket) on tcp://${printerIp}:9100...`);
                exec(qlCmd2, (pErr2) => {
                    cleanup();
                    if (pErr1 || pErr2) {
                        const msg = (pErr1 ? pErr1.message : '') + ' ' + (pErr2 ? pErr2.message : '');
                        addLog('warn', `Brother QL CLI warning (${msg.substring(0, 100)}...). Streaming direct TCP socket fallback to ${printerIp}:9100...`);
                        return sendRawEscPosPayload(generateEscPosPayload(labelData), printerIp, callback);
                    }
                    addLog('success', `✅ Brother QL: 2 labels (Child Badge + Guardian Ticket) printed on ${printerIp}!`);
                    callback && callback(null, { success: true, printer: printerIp, mode: 'brother_ql_2label' });
                });
            });
        });
    });
}

// ─── Print Job History & Reprint Queue ────────────────────────────
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

// ─── Core Dispatcher ─────────────────────────────
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
        jobRecord.error = 'No printer IP configured';
        addLog('warn', `No Printer IP set for "${labelData.name}". Set one in the web console.`);
        return callback && callback(null, { success: false, error: 'No printer IP configured. Set one in the web console.' });
    }

    // Route to correct handler based on protocol
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
        os: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        cloudRelay: cloudRelayStatus,
        serverConfig: serverConfig,
        localIps: getLocalIpAddresses()
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
    const { defaultPrinterIp, defaultPrinterName, defaultPrinterModel, defaultLabelSize, childBadgeLength, guardianTicketLength } = req.body || {};
    const updated = saveServerConfig({ 
        defaultPrinterIp, 
        defaultPrinterName, 
        defaultPrinterModel, 
        defaultLabelSize,
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
    addLog('info', 'Scanning local network subnet for active printers on Port 9100...');
    const localIps = getLocalIpAddresses();
    if (localIps.length === 0) return res.json({ printers: [] });
    
    const subnet = localIps[0].substring(0, localIps[0].lastIndexOf('.'));
    const foundPrinters = [];
    
    const scanPromises = [];
    for (let i = 1; i <= 254; i++) {
        const testIp = `${subnet}.${i}`;
        scanPromises.push(new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(400);
            socket.connect(9100, testIp, () => {
                foundPrinters.push(testIp);
                socket.destroy();
                resolve(true);
            });
            socket.on('error', () => { socket.destroy(); resolve(false); });
            socket.on('timeout', () => { socket.destroy(); resolve(false); });
        }));
    }
    
    await Promise.all(scanPromises);
    addLog('success', `Network scan finished! Found ${foundPrinters.length} printer(s) on ${subnet}.x: ${foundPrinters.join(', ') || 'None'}`);
    res.json({ subnet, printers: foundPrinters });
});

app.post('/api/test-print', (req, res) => {
    const { printerIp, childName } = req.body || {};
    const targetIp = (printerIp || serverConfig.defaultPrinterIp || '').trim();
    if (!targetIp) {
        return res.status(400).json({ success: false, error: 'Printer IP is required' });
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

// ─── Interactive Web Dashboard & Live Log Console (`GET /` & `GET /logs`) ───
app.get(['/', '/logs'], (req, res) => {
    const localIps = getLocalIpAddresses();
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

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🖨️ KiddoChecker Print Server Console</title>
        <style>
            :root {
                --bg: #0f172a;
                --card: #1e293b;
                --border: #334155;
                --text: #f8fafc;
                --muted: #94a3b8;
                --primary: #6366f1;
                --success: #10b981;
                --danger: #ef4444;
                --warning: #f59e0b;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            body { background: var(--bg); color: var(--text); padding: 24px; max-width: 1200px; margin: 0 auto; }
            header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 24px; }
            h1 { font-size: 24px; display: flex; items-center; gap: 10px; }
            .badge { background: var(--success); color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; }
            @media(max-width: 850px) { .grid { grid-template-columns: 1fr; } }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .card h2 { font-size: 15px; margin-bottom: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
            .log-box { background: #090d16; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: monospace; font-size: 13px; height: 520px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
            .log-entry { padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--border); background: #131b2e; word-break: break-all; margin-bottom: 6px; }
            .log-entry.success { border-color: var(--success); }
            .log-entry.error { border-color: var(--danger); }
            .log-entry.warn { border-color: var(--warning); }
            .log-entry.cloud { border-color: var(--primary); }
            .time { color: var(--muted); font-size: 11px; margin-right: 8px; }
            input, select, button { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); background: #090d16; color: #fff; margin-bottom: 10px; font-size: 14px; }
            button { background: var(--primary); font-weight: bold; cursor: pointer; border: none; }
            button:hover { opacity: 0.9; }
            .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
            .ip-tag { background: #334155; padding: 3px 8px; border-radius: 4px; font-family: monospace; }
            .note-box { background: #1e3a5f; border: 1px solid #2563eb; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #93c5fd; margin-bottom: 10px; line-height: 1.6; }
            .hidden { display: none !important; }
        </style>
    </head>
    <body>
        <header>
            <h1>🖨️ KiddoChecker Print Server <span class="badge">ONLINE</span></h1>
            <div>
                <button onclick="fetchLogs()" style="width: auto; padding: 8px 16px;">🔄 Refresh Logs</button>
            </div>
        </header>

        <div class="grid">
            <div>
                <div class="card">
                    <h2>Live Activity & Print Logs</h2>
                    <div id="log-box" class="log-box">Loading server logs...</div>
                </div>

                <!-- Recent Print Jobs & Quick Reprint Card -->
                <div class="card" style="border-color: #3b82f6;">
                    <h2 style="color: #60a5fa;">📋 Recent Print Jobs (One-Click Reprint)</h2>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">If a print job fails due to paper out or network disconnect, click <strong>Reprint</strong> below to retry immediately.</p>
                    <div id="jobs-box" style="background:#090d16; border:1px solid var(--border); border-radius:8px; padding:10px; max-height:280px; overflow-y:auto;">
                        <div style="color:#94a3b8; font-size:12px; padding:8px;">No print jobs in memory buffer yet.</div>
                    </div>
                </div>
            </div>

            <div>
                <!-- Printer Configuration Card -->
                <div class="card" style="border-color: var(--primary);">
                    <h2 style="color: var(--primary);">⚙️ Printer Configuration</h2>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Select your printer model. The server auto-generates the correct payload format.</p>

                    <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">PRINTER MODEL:</label>
                    <select id="printerModelSelect" onchange="onModelChange(this.value)">
                        ${printerOptionsHtml}
                    </select>

                    <div id="labelSizeRow" class="${isBrother ? '' : 'hidden'}">
                        <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">BROTHER DK LABEL ROLL SIZE:</label>
                        <select id="labelSizeSelect">
                            ${labelSizeOptionsHtml}
                        </select>
                    </div>

                    <div id="brotherQlNote" class="note-box ${isBrother ? '' : 'hidden'}">
                        ⚠️ <strong>Brother QL Requirement:</strong><br>
                        Run once on your print server:<br>
                        <code>apt install librsvg2-bin -y</code><br>
                        <code>pip3 install brother_ql cairosvg "Pillow<10" --break-system-packages</code>
                    </div>

                    <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">DEFAULT PRINTER IP ADDRESS:</label>
                    <input type="text" id="defaultIpInput" placeholder="e.g. 192.168.2.13" value="${serverConfig.defaultPrinterIp}" />

                    <div style="display:flex; gap:12px; margin-top:8px;">
                        <div style="flex:1;">
                            <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">CHILD BADGE LENGTH (PX):</label>
                            <input type="number" id="childBadgeLengthInput" placeholder="520" value="${serverConfig.childBadgeLength || 520}" />
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">GUARDIAN TICKET LENGTH (PX):</label>
                            <input type="number" id="guardianTicketLengthInput" placeholder="380" value="${serverConfig.guardianTicketLength || 380}" />
                        </div>
                    </div>

                    <button onclick="saveDefaultConfig()" style="background: var(--success); margin-top:12px;">💾 Save Printer Configuration</button>
                    <div id="configResult" style="font-size: 12px; font-weight: bold; margin-top: 4px;"></div>
                </div>

                <!-- Direct Printer Tester Card -->
                <div class="card">
                    <h2>Direct Printer Tester</h2>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Test network printer connectivity directly from server to target IP.</p>
                    <input type="text" id="testIp" placeholder="Printer IP (e.g. 192.168.2.13)" value="${serverConfig.defaultPrinterIp || '192.168.2.13'}" />
                    <input type="text" id="testName" placeholder="Test Child Name" value="Test Child Badge" />
                    <button onclick="sendTestPrint()">🚀 Send Test Print to IP</button>
                    <button onclick="scanNetworkPrinters()" style="background:#475569; margin-top:4px;">🔍 Auto-Scan Subnet for Printers</button>
                    <div id="testResult" style="font-size: 12px; font-weight: bold; margin-top: 8px;"></div>
                </div>

                <!-- Server Info Card -->
                <div class="card">
                    <h2>Server Info</h2>
                    <div class="stat-row"><span>Platform:</span> <strong>${process.platform}</strong></div>
                    <div class="stat-row"><span>Uptime:</span> <strong id="uptime">Loading...</strong></div>
                    <div class="stat-row"><span>Port:</span> <strong>${PORT}</strong></div>
                    <div class="stat-row"><span>Active Model:</span> <strong id="activeModel">${currentModel.name}</strong></div>
                    <div class="stat-row"><span>Azure Cloud Relay:</span> <strong style="color: var(--success);">Polling Active</strong></div>
                    <div style="margin-top: 14px;">
                        <p style="font-size: 12px; color: var(--muted); margin-bottom: 6px;">Server LAN IP Addresses:</p>
                        ${localIps.map(ip => `<div style="margin-bottom:4px;"><span class="ip-tag">http://${ip}:${PORT}</span></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <script>
            async function fetchLogs() {
                try {
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);
                    const res = await fetch('/api/logs', { signal: controller.signal });
                    clearTimeout(timeout);

                    if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
                    const data = await res.json();
                    
                    document.getElementById('uptime').innerText = Math.floor(data.uptimeSeconds / 60) + ' mins ' + (data.uptimeSeconds % 60) + ' secs';
                    if (data.serverConfig && data.serverConfig.defaultPrinterIp) {
                        const currentInput = document.getElementById('defaultIpInput');
                        if (document.activeElement !== currentInput) {
                            currentInput.value = data.serverConfig.defaultPrinterIp;
                        }
                    }

                    const box = document.getElementById('log-box');
                    if (!data.logs || data.logs.length === 0) {
                        box.innerHTML = '<div style="color:#94a3b8; padding:12px;">✅ Server connected. No print jobs yet — waiting for activity...</div>';
                    } else {
                        box.innerHTML = data.logs.map(log => {
                            const jobId = log.details && log.details.jobId ? log.details.jobId : '';
                            const isFail = log.type === 'error' || log.type === 'warn';
                            const retryBtn = (jobId && isFail) ? '<button onclick="reprintJob(&quot;' + jobId + '&quot;)" style="background:#ef4444; width:auto; padding:3px 8px; font-size:11px; margin-left:8px; display:inline-block;">🔁 Retry Print</button>' : '';
                            return '<div class="log-entry ' + log.type + '">' +
                                '<span class="time">' + log.time + '</span>' +
                                '<strong>' + log.message + '</strong>' + retryBtn +
                                (log.details && log.details.targetIp ? '<div style="font-size:11px; color:#94a3b8; margin-top:2px;">Target IP: ' + log.details.targetIp + '</div>' : '') +
                                (log.details && log.details.model ? '<div style="font-size:11px; color:#6366f1;">Model: ' + log.details.model + '</div>' : '') +
                            '</div>';
                        }).join('');
                    }

                    const jobsBox = document.getElementById('jobs-box');
                    if (data.printJobsHistory && data.printJobsHistory.length > 0) {
                        jobsBox.innerHTML = data.printJobsHistory.map(job => {
                            const statusColor = job.status === 'success' ? '#10b981' : (job.status === 'failed' ? '#ef4444' : '#f59e0b');
                            const statusBadge = '<span style="color:' + statusColor + '; font-weight:bold;">' + job.status.toUpperCase() + '</span>';
                            return '<div style="display:flex; justify-content:space-between; align-items:center; background:#131b2e; border:1px solid var(--border); padding:8px 12px; border-radius:6px; margin-bottom:6px; font-size:12px;">' +
                                '<div>' +
                                    '<strong style="font-size:14px; color:#fff;">' + job.childName + '</strong> ' +
                                    '<span style="color:#94a3b8; font-size:11px;">[' + job.securityCode + ']</span>' +
                                    '<div style="color:#64748b; font-size:11px;">' + job.time + ' | ' + (job.className || 'General') + ' | IP: ' + job.targetIp + ' | ' + statusBadge + '</div>' +
                                '</div>' +
                                '<div>' +
                                    '<button onclick="reprintJob(&quot;' + job.id + '&quot;)" style="background:#2563eb; width:auto; padding:6px 12px; font-size:12px; margin:0;">🔁 Reprint Badge</button>' +
                                '</div>' +
                            '</div>';
                        }).join('');
                    }
                } catch(e) {
                    const box = document.getElementById('log-box');
                    if (box) {
                        box.innerHTML = '<div style="color:#ef4444; padding:12px; font-size:12px; border:1px solid #ef4444; border-radius:6px;">' +
                            '<strong>⚠️ Failed to load server logs:</strong> ' + e.message +
                            '<br><br><span style="color:#64748b;">Retrying automatically every 3 seconds...</span>' +
                        '</div>';
                    }
                }
            }

            async function reprintJob(jobId) {
                const customIp = prompt('Enter Printer IP to reprint badge (or leave default):', document.getElementById('defaultIpInput').value);
                if (customIp === null) return; // User cancelled
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
                } catch(e) {
                    alert('❌ Error requesting reprint: ' + e.message);
                }
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
                if (isBrother && model.labelSizes) {
                    const sel = document.getElementById('labelSizeSelect');
                    if (sel) sel.innerHTML = model.labelSizes.map(s => '<option value="' + s.value + '">' + s.label + '</option>').join('');
                }
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
                resDiv.innerText = 'Saving...';
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
                        resDiv.innerText = 'Saved! IP: ' + ip + ' | Model: ' + model + ' | Lengths: Badge=' + badgeLen + 'px Ticket=' + ticketLen + 'px';
                        resDiv.style.color = '#10b981';
                        document.getElementById('testIp').value = ip;
                    } else {
                        resDiv.innerText = 'Failed to save config';
                        resDiv.style.color = '#ef4444';
                    }
                } catch(e) {
                    resDiv.innerText = 'Error saving: ' + e.message;
                    resDiv.style.color = '#ef4444';
                }
                setTimeout(fetchLogs, 1000);
            }

            async function sendTestPrint() {
                const ip = document.getElementById('testIp').value;
                const name = document.getElementById('testName').value;
                const resDiv = document.getElementById('testResult');
                resDiv.innerText = 'Sending print request to ' + ip + '...';
                resDiv.style.color = '#f59e0b';

                try {
                    const res = await fetch('/api/test-print', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ printerIp: ip, childName: name })
                    });
                    const data = await res.json();
                    if (data.success) {
                        resDiv.innerText = 'Test Print Dispatched to ' + ip;
                        resDiv.style.color = '#10b981';
                    } else {
                        resDiv.innerText = 'Failed: ' + (data.error || 'Unknown error');
                        resDiv.style.color = '#ef4444';
                    }
                } catch(e) {
                    resDiv.innerText = 'Error: ' + e.message;
                    resDiv.style.color = '#ef4444';
                }
                setTimeout(fetchLogs, 1000);
            }

            async function scanNetworkPrinters() {
                const resDiv = document.getElementById('testResult');
                resDiv.innerText = 'Scanning local subnet for printers on port 9100...';
                resDiv.style.color = '#f59e0b';
                try {
                    const res = await fetch('/api/scan-printers');
                    const data = await res.json();
                    if (data.printers && data.printers.length > 0) {
                        resDiv.innerText = 'Found ' + data.printers.length + ' printer(s): ' + data.printers.join(', ');
                        resDiv.style.color = '#10b981';
                        document.getElementById('testIp').value = data.printers[0];
                    } else {
                        resDiv.innerText = 'No printers found on Port 9100 in ' + data.subnet + '.x subnet.';
                        resDiv.style.color = '#f59e0b';
                    }
                } catch(e) {
                    resDiv.innerText = 'Scan error: ' + e.message;
                    resDiv.style.color = '#ef4444';
                }
                setTimeout(fetchLogs, 1000);
            }

            fetchLogs();
            setInterval(fetchLogs, 3000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

const server = app.listen(PORT, HOST, () => {
    const localIps = getLocalIpAddresses();
    const model = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel);
    addLog('info', `Server listening on http://${HOST}:${PORT}`);
    console.log(`
    ===================================================================
    KiddoChecker Multi-Printer Server & Web Dashboard
    ===================================================================
    OS Platform  : ${process.platform} (${os.release()})
    Status       : Listening on http://${HOST}:${PORT}
    Cloud Relay  : Polling Azure API (${AZURE_API_URL})
    Active Model : ${model ? model.name : serverConfig.defaultPrinterModel} [${model ? model.protocol : '?'}]
    Default IP   : ${serverConfig.defaultPrinterIp || 'None (Set via Web Console)'}
    
    Open Web Console in browser:
    ${localIps.map(ip => `   http://${ip}:${PORT}`).join('\n')}

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
