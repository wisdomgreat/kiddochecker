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

// ─── Printer Model Registry ──────────────────────────────────────
// All supported printer models. Select once from the web console;
// the server auto-generates the correct protocol payload.
const PRINTER_REGISTRY = [
    { id: 'brother_ql_820', name: 'Brother QL-820NWBc / QL-820NWB', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62', label: 'DK-2205 - 62mm Continuous Roll (Recommended for Name Badges)' },
        { value: '29', label: 'DK-1201 - 29mm x 90mm Address Labels' },
        { value: '38', label: 'DK-1221 - 38mm x 38mm Square Labels' },
        { value: '54', label: 'DK-N55224 - 54mm x 29mm Labels' },
        { value: '102', label: 'DK-1247 - 102mm x 51mm Shipping Labels' },
    ]},
    { id: 'brother_ql_810', name: 'Brother QL-810W / QL-800', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62', label: 'DK-2205 - 62mm Continuous Roll (Recommended)' },
        { value: '29', label: 'DK-1201 - 29mm x 90mm Address Labels' },
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

        https.get(pollUrl, (res) => {
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
        }).on('error', (err) => {
            cloudRelayStatus.active = false;
            cloudRelayStatus.lastError = err.message;
        });
    } catch (err) {
        cloudRelayStatus.active = false;
        cloudRelayStatus.lastError = err.message;
    }
}

// Start polling Azure Cloud Queue every 1.5 seconds
setInterval(pollAzureCloudPrintQueue, 1500);
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
        DBL_LINE + '\x1bE\x01' + 'PRIMARY GUARDIAN CLAIM TICKET\n' + '\x1bE\x00' + DBL_LINE + '\n' +
        'Security Match Code\n\n' +
        '\x1bE\x01\x1d!\x22' + ' ' + securityCode + ' \n' + '\x1d!\x00\x1bE\x00' + '\n' +
        '\x1bE\x01\x1d!\x01' + childName + '\n' + '\x1d!\x00\x1bE\x00' +
        dateStr + '\n\n' + LINE + 'Present at pick-up to claim your child.\n\n\n' +
        '\x1dV\x41\x00'
    , 'utf-8');
}

// ─── HP Printer: Vector SVG / PDF Badge Generator ─────────────────
function generateHpBadgeSvg(labelData) {
    const childName = labelData.name || '';
    const securityCode = labelData.securityCode || 'TEST';
    const className = labelData.class || 'General';
    const allergies = labelData.allergies || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none';

    const width = 800;
    const height = hasAllergy ? 640 : 580;

    const allergyBlock = hasAllergy
        ? `<rect x="40" y="500" width="${width - 80}" height="56" rx="10" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
           <text x="${width/2}" y="536" text-anchor="middle" font-size="24" font-weight="bold" fill="#dc2626">ALLERGY ALERT: ${(allergies || '').toUpperCase()}</text>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="Arial,Helvetica,sans-serif">
  <!-- Card Outline -->
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="16" fill="white" stroke="#334155" stroke-width="3"/>

  <!-- Top Header Bar -->
  <rect x="10" y="10" width="${width - 20}" height="64" rx="14" fill="#0F172A"/>
  <text x="${width/2}" y="50" text-anchor="middle" font-size="22" font-weight="bold" fill="white" letter-spacing="2">KIDDOCHECKER CHILD CHECK-IN</text>

  <!-- Child Name -->
  <text x="${width/2}" y="130" text-anchor="middle" font-size="46" font-weight="bold" fill="#0F172A">${childName.toUpperCase()}</text>

  <!-- Security Code Box (Child) -->
  <rect x="${width/2 - 130}" y="155" width="260" height="84" rx="14" fill="#0F172A"/>
  <text x="${width/2}" y="214" text-anchor="middle" font-size="52" font-weight="bold" fill="white" letter-spacing="10">${securityCode}</text>

  <!-- Details -->
  <text x="50" y="280" font-size="22" font-weight="bold" fill="#334155">Class: <tspan font-weight="normal">${className}</tspan></text>
  <text x="50" y="312" font-size="22" font-weight="bold" fill="#334155">Check-in: <tspan font-weight="normal">${timeStr}  |  ${dateStr}</tspan></text>

  <text x="${width/2}" y="348" text-anchor="middle" font-size="16" fill="#64748B">Must present matching code at pick-up to claim child.</text>

  <!-- Perforated Cut Line -->
  <line x1="30" y1="368" x2="${width - 30}" y2="368" stroke="#475569" stroke-width="3" stroke-dasharray="10,6"/>

  <!-- Guardian Claim Ticket Header -->
  <text x="${width/2}" y="400" text-anchor="middle" font-size="18" font-weight="bold" fill="#334155">-- PRIMARY GUARDIAN CLAIM TICKET --</text>
  <text x="${width/2}" y="425" text-anchor="middle" font-size="16" fill="#64748B">Security Match Code</text>

  <!-- Security Code Box (Guardian) -->
  <rect x="${width/2 - 140}" y="435" width="280" height="76" rx="14" fill="#0F172A"/>
  <text x="${width/2}" y="490" text-anchor="middle" font-size="54" font-weight="bold" fill="white" letter-spacing="12">${securityCode}</text>

  ${allergyBlock}

  <!-- Footer -->
  <text x="${width/2}" y="${hasAllergy ? 590 : 542}" text-anchor="middle" font-size="15" fill="#94A3B8">Present this ticket at pick-up | ${childName} | ${dateStr}</text>
</svg>`;
}

// Strict 7-bit ASCII PCL5 fallback (prevents UTF-8 page-break corruption)
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
        dDiv +
        `        PRIMARY GUARDIAN CLAIM TICKET\r\n` +
        dDiv +
        `Security Code : [ ${securityCode} ]\r\n` +
        `Child Name    : ${childName}\r\n` +
        `Date          : ${dateStr}\r\n` +
        div +
        `Present this ticket at pick-up to claim child.\r\n\r\n` +
        '\x0C'                  // Eject single page
    , 'ascii');
}

function printViaHpPrinter(labelData, printerIp, callback) {
    const svgContent = generateHpBadgeSvg(labelData);
    const tmpBase = path.join(os.tmpdir(), 'kiddo_hp_' + Date.now());
    const tmpSvg = tmpBase + '.svg';
    const tmpPdf = tmpBase + '.pdf';

    fs.writeFileSync(tmpSvg, svgContent, 'utf-8');

    function cleanup() {
        try { fs.unlinkSync(tmpSvg); } catch(e) {}
        try { fs.unlinkSync(tmpPdf); } catch(e) {}
    }

    const convertCmds = [
        'rsvg-convert -f pdf -o "' + tmpPdf + '" "' + tmpSvg + '"',
        'python3 -c "import cairosvg; cairosvg.svg2pdf(url=\'' + tmpSvg + '\', write_to=\'' + tmpPdf + '\')"',
        'convert "' + tmpSvg + '" "' + tmpPdf + '"'
    ];

    function tryConvert(idx) {
        if (idx >= convertCmds.length) {
            cleanup();
            addLog('warn', 'HP PDF converter unavailable. Using 1-page 7-bit ASCII PCL5 mode...');
            sendRawPcl5(generatePcl5Payload(labelData), printerIp, callback);
            return;
        }

        exec(convertCmds[idx], (err) => {
            if (err || !fs.existsSync(tmpPdf)) return tryConvert(idx + 1);

            addLog('info', `HP Printer: Streaming 1-page PDF vector badge to tcp://${printerIp}:9100...`, { targetIp: printerIp });
            const pdfBuffer = fs.readFileSync(tmpPdf);
            cleanup();

            const socket = new net.Socket();
            socket.setTimeout(8000);
            socket.connect(9100, printerIp, () => {
                socket.write(pdfBuffer, () => {
                    socket.end();
                    addLog('success', `✅ HP 1-page PDF badge printed on tcp://${printerIp}:9100!`, { targetIp: printerIp });
                    callback && callback(null, { success: true, printer: printerIp, mode: 'hp_pdf' });
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
            addLog('success', `✅ PCL5 1-page ASCII label printed on ${printerIp}!`, { targetIp: printerIp });
            callback && callback(null, { success: true, printer: printerIp, mode: 'pcl5_ascii' });
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


// ─── Brother QL: SVG Label Generator ─────────────────────────────
function generateBrotherQlSvg(labelData, labelSizeValue) {
    const childName = labelData.name || '';
    const securityCode = labelData.securityCode || 'TEST';
    const className = labelData.class || 'General';
    const allergies = labelData.allergies || '';
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none';
    // 62mm roll = 696px printable at 300dpi; 29mm = 341px
    const width = labelSizeValue === '29' ? 341 : 696;
    const allergyBlock = hasAllergy
        ? `<rect x="20" y="460" width="${width - 40}" height="52" rx="8" fill="#fee2e2"/>` +
          `<text x="${width/2}" y="492" text-anchor="middle" font-size="22" font-weight="bold" fill="#dc2626">ALLERGY: ${(allergies || '').toUpperCase()}</text>`
        : '';
    const svgH = hasAllergy ? 560 : 520;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${svgH}" font-family="Arial,Helvetica,sans-serif">
<rect width="${width}" height="${svgH}" fill="white"/>
<rect width="${width}" height="50" fill="#1e293b"/>
<text x="${width/2}" y="33" text-anchor="middle" font-size="18" font-weight="bold" fill="white">KIDDOCHECKER CHECK-IN</text>
<line x1="20" y1="60" x2="${width-20}" y2="60" stroke="#334155" stroke-width="2"/>
<text x="${width/2}" y="115" text-anchor="middle" font-size="42" font-weight="bold" fill="#0f172a">${childName.toUpperCase()}</text>
<rect x="${width/2-110}" y="130" width="220" height="80" rx="10" fill="#0f172a"/>
<text x="${width/2}" y="185" text-anchor="middle" font-size="48" font-weight="bold" fill="white" letter-spacing="8">${securityCode}</text>
<text x="30" y="252" font-size="20" fill="#374151">Class: ${className}</text>
<text x="30" y="278" font-size="20" fill="#374151">Check-in: ${timeStr}  |  ${dateStr}</text>
<text x="${width/2}" y="315" text-anchor="middle" font-size="15" fill="#6b7280">Must present code at pick-up to claim child.</text>
<line x1="20" y1="330" x2="${width-20}" y2="330" stroke="#334155" stroke-width="3" stroke-dasharray="8,4"/>
<text x="${width/2}" y="360" text-anchor="middle" font-size="16" font-weight="bold" fill="#374151">-- PRIMARY GUARDIAN CLAIM TICKET --</text>
<text x="${width/2}" y="390" text-anchor="middle" font-size="16" fill="#6b7280">Security Match Code</text>
<rect x="${width/2-120}" y="400" width="240" height="72" rx="10" fill="#0f172a"/>
<text x="${width/2}" y="454" text-anchor="middle" font-size="52" font-weight="bold" fill="white" letter-spacing="10">${securityCode}</text>
${allergyBlock}
<text x="${width/2}" y="${hasAllergy ? 535 : 498}" text-anchor="middle" font-size="14" fill="#9ca3af">Present at pick-up - ${childName}</text>
</svg>`;
}

// ─── Brother QL: Print via Python CLI ────────────────────────────
function printViaBrotherQl(labelData, printerIp, callback) {
    const labelSize = labelData.labelSize || serverConfig.defaultLabelSize || '62';
    const svgContent = generateBrotherQlSvg(labelData, labelSize);
    const tmpBase = path.join(os.tmpdir(), 'kiddo_label_' + Date.now());
    const tmpSvg = tmpBase + '.svg';
    const tmpPng = tmpBase + '.png';

    fs.writeFileSync(tmpSvg, svgContent, 'utf-8');

    function cleanup() {
        try { fs.unlinkSync(tmpSvg); } catch(e) {}
        try { fs.unlinkSync(tmpPng); } catch(e) {}
    }

    // Try multiple SVG→PNG converters in order of preference
    const convertCmds = [
        'rsvg-convert -o "' + tmpPng + '" "' + tmpSvg + '"',
        'python3 -c "import cairosvg; cairosvg.svg2png(url=\'' + tmpSvg + '\', write_to=\'' + tmpPng + '\')"',
        'convert "' + tmpSvg + '" "' + tmpPng + '"',
    ];

    function tryConvert(idx) {
        if (idx >= convertCmds.length) {
            cleanup();
            addLog('error', 'Brother QL: SVG→PNG failed. Run: apt install librsvg2-bin  OR  pip3 install cairosvg');
            return callback(null, { success: false, error: 'SVG to PNG conversion failed. Install librsvg2-bin or cairosvg.' });
        }
        exec(convertCmds[idx], (err) => {
            if (err || !fs.existsSync(tmpPng)) return tryConvert(idx + 1);
            const qlCmd = `brother_ql --backend network --printer tcp://${printerIp}:9100 print --label ${labelSize} --rotate auto "${tmpPng}"`;
            addLog('info', `Brother QL: Sending label to tcp://${printerIp}:9100 (${labelSize}mm)`, { targetIp: printerIp });
            exec(qlCmd, (qlErr) => {
                cleanup();
                if (qlErr) {
                    addLog('error', `Brother QL failed: ${qlErr.message}. Run: pip3 install brother_ql`);
                    return callback(null, { success: false, error: qlErr.message });
                }
                addLog('success', `✅ Brother QL label printed on ${printerIp} [${labelSize}mm]!`, { targetIp: printerIp });
                callback(null, { success: true, printer: printerIp, mode: 'brother_ql', labelSize });
            });
        });
    }
    tryConvert(0);
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

    addLog('info', `Dispatching print job for "${labelData.name}"`, {
        model: printerMeta.name,
        protocol: printerMeta.protocol,
        targetIp: targetIp || 'None'
    });

    if (!targetIp) {
        addLog('warn', `No Printer IP set for "${labelData.name}". Set one in the web console.`);
        return callback && callback(null, { success: false, error: 'No printer IP configured. Set one in the web console.' });
    }

    // Route to correct handler based on protocol
    if (printerMeta.protocol === 'brother_ql') {
        printViaBrotherQl(labelData, targetIp, callback);
        return;
    }

    if (printerMeta.protocol === 'pcl5') {
        printViaHpPrinter(labelData, targetIp, callback);
        return;
    }

    const payload = generateEscPosPayload(labelData);


    addLog('info', `TCP Socket → ${targetIp}:9100 [${printerMeta.protocol.toUpperCase()}]...`, { targetIp });
    const socket = new net.Socket();
    socket.setTimeout(8000);
    socket.connect(9100, targetIp, () => {
        socket.write(payload, () => {
            socket.end();
            addLog('success', `✅ Label printed on ${targetIp} [${printerMeta.name}]!`, { targetIp });
            callback && callback(null, { success: true, printer: targetIp, mode: printerMeta.protocol });
        });
    });
    socket.on('error', (err) => {
        addLog('error', `❌ Socket error ${targetIp}:9100 — ${err.message}`, { targetIp, error: err.message });
        callback && callback(null, { success: false, error: err.message, targetIp });
    });
    socket.on('timeout', () => {
        addLog('warn', `⚠️ Socket timeout ${targetIp}:9100 (Unreachable or wrong IP)`, { targetIp });
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
        logs: logsBuffer
    });
});

app.get('/api/printers', (req, res) => res.json({ printers: PRINTER_REGISTRY, current: serverConfig.defaultPrinterModel }));

app.get('/api/config', (req, res) => res.json(serverConfig));

app.post('/api/config', (req, res) => {
    const { defaultPrinterIp, defaultPrinterName, defaultPrinterModel, defaultLabelSize } = req.body || {};
    const updated = saveServerConfig({ defaultPrinterIp, defaultPrinterName, defaultPrinterModel, defaultLabelSize });
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
        allergies: 'None'
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
                        <code>pip3 install brother_ql</code>
                    </div>

                    <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">DEFAULT PRINTER IP ADDRESS:</label>
                    <input type="text" id="defaultIpInput" placeholder="e.g. 192.168.2.13" value="${serverConfig.defaultPrinterIp}" />

                    <button onclick="saveDefaultConfig()" style="background: var(--success);">💾 Save Printer Configuration</button>
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
                    const res = await fetch('/api/logs');
                    const data = await res.json();
                    
                    document.getElementById('uptime').innerText = Math.floor(data.uptimeSeconds / 60) + ' mins ' + (data.uptimeSeconds % 60) + ' secs';
                    if (data.serverConfig && data.serverConfig.defaultPrinterIp) {
                        const currentInput = document.getElementById('defaultIpInput');
                        if (document.activeElement !== currentInput) {
                            currentInput.value = data.serverConfig.defaultPrinterIp;
                        }
                    }

                    const box = document.getElementById('log-box');
                    if (data.logs.length === 0) {
                        box.innerHTML = '<div style="color:#94a3b8; padding:12px;">No logs recorded yet.</div>';
                        return;
                    }
                    
                    box.innerHTML = data.logs.map(log => \`
                        <div class="log-entry \${log.type}">
                            <span class="time">\${log.time}</span>
                            <strong>\${log.message}</strong>
                            \${log.details && log.details.targetIp ? '<div style="font-size:11px; color:#94a3b8; margin-top:2px;">Target IP: ' + log.details.targetIp + '</div>' : ''}
                            \${log.details && log.details.model ? '<div style="font-size:11px; color:#6366f1;">Model: ' + log.details.model + '</div>' : ''}
                        </div>
                    \`).join('');
                } catch(e) { }
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
                const resDiv = document.getElementById('configResult');
                resDiv.innerText = 'Saving...';
                resDiv.style.color = '#f59e0b';

                try {
                    const res = await fetch('/api/config', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ defaultPrinterIp: ip, defaultPrinterModel: model, defaultLabelSize: labelSize })
                    });
                    const data = await res.json();
                    if (data.success) {
                        resDiv.innerText = 'Saved! IP: ' + ip + ' | Model: ' + model;
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

app.listen(PORT, HOST, () => {
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
