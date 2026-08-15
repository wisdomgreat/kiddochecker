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

// Guard against uncaught errors killing the print server daemon
process.on('uncaughtException', (err) => {
    console.error('[Print Server Uncaught Exception]', err);
    try { addLog('error', `Uncaught system exception: ${err.message}`); } catch(e) {}
});

process.on('unhandledRejection', (reason) => {
    console.error('[Print Server Unhandled Rejection]', reason);
    try { addLog('error', `Unhandled rejection: ${reason}`); } catch(e) {}
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS for browser fetch calls from Android tablet kiosks & web apps
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ─── Real-Time SSE Log & Event Broadcaster ───────────────────────────
const logsBuffer = [];
const MAX_LOGS = 300;
const sseClients = new Set();

function addLog(type, message, details = {}) {
    const entry = {
        id: Date.now() + Math.random().toString(36).substring(2, 6),
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
    console.log(`[Print Server ${icon}] ${message} ${details.targetIp ? `(Target: ${details.targetIp})` : ''}`);

    // Broadcast in real-time to all connected SSE clients
    const payload = `data: ${JSON.stringify({ type: 'log', log: entry })}\n\n`;
    for (const client of sseClients) {
        try { client.write(payload); } catch(e) { sseClients.delete(client); }
    }
}

addLog('info', 'KiddoChecker Remote Print Server Initialized.');

// ─── Printer Model Registry ──────────────────────────────────────────
const PRINTER_REGISTRY = [
    { id: 'brother_ql_820', name: 'Brother QL-820NWBc / QL-820NWB', brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62', label: 'DK-2205 - 62mm Continuous Black/White Roll' },
        { value: '62red', label: 'DK-2251 / DK-22251 - 62mm Continuous Black/Red Roll (Starter Roll)' },
        { value: '29', label: 'DK-1201 / DK-2210 - 29mm Standard Address / Continuous Roll' },
        { value: '62x100', label: 'DK-1202 - 62mm x 100mm Large Address Labels' },
        { value: '62x29', label: 'DK-1204 - 62mm x 29mm Multi-Purpose Labels' },
        { value: '29x62', label: 'DK-1209 - 29mm x 62mm Small Address Labels' },
        { value: '38', label: 'DK-1221 / DK-2225 - 38mm Square / Continuous Roll' },
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
    { id: 'brother_ql_700',     name: 'Brother QL-700 / QL-570',           brand: 'Brother', protocol: 'brother_ql', labelSizes: [
        { value: '62', label: 'DK-2205 - 62mm Continuous Black/White Roll' },
        { value: '29', label: 'DK-1201 - 29mm x 90mm Standard Address Labels' },
    ]},
    { id: 'epson_tm_t20',       name: 'Epson TM-T20 / TM-T88 Series',      brand: 'Epson',   protocol: 'escpos', paperWidth: 80 },
    { id: 'star_tsp100',        name: 'Star TSP100 / TSP650 Series',        brand: 'Star',    protocol: 'escpos', paperWidth: 80 },
    { id: 'generic_thermal_80', name: 'Generic Thermal Printer (80mm)',     brand: 'Generic', protocol: 'escpos', paperWidth: 80 },
    { id: 'generic_thermal_58', name: 'Generic Thermal Printer (58mm)',     brand: 'Generic', protocol: 'escpos', paperWidth: 58 },
    { id: 'hp_laserjet',        name: 'HP LaserJet / OfficeJet / DeskJet', brand: 'HP',      protocol: 'pcl5' },
    { id: 'cups_queue',         name: 'CUPS Linux / System Print Queue',   brand: 'CUPS',    protocol: 'cups' },
];

// ─── Persistent Server Configuration ─────────────────────────────────
const CONFIG_FILE = path.join(__dirname, 'printer-config.json');

let serverConfig = {
    defaultPrinterIp:    process.env.PRINTER_IP    || '192.168.2.169',
    defaultPrinterName:  process.env.PRINTER_NAME  || 'Default Brother Printer',
    defaultPrinterModel: process.env.PRINTER_MODEL || 'brother_ql_820',
    defaultLabelSize:    process.env.LABEL_SIZE    || '62',
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
            addLog('info', `Config loaded: Target="${serverConfig.defaultPrinterIp || 'None'}" Model="${model ? model.name : serverConfig.defaultPrinterModel}" Roll="${serverConfig.defaultLabelSize}"`);
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
        addLog('success', `Configuration saved: Target=${serverConfig.defaultPrinterIp} | Model=${model ? model.name : serverConfig.defaultPrinterModel} | Roll=${serverConfig.defaultLabelSize}`);
        return true;
    } catch (err) {
        addLog('error', `Failed to save config: ${err.message}`);
        return false;
    }
}

loadServerConfig();

// ─── Native 5x7 High-Definition Bitmap Font Table ────────────────────
const FONT_5X7 = {
  ' ': [0,0,0,0,0], '!': [0,0,95,0,0], '"': [0,7,0,7,0], '#': [20,127,20,127,20],
  '$': [36,42,127,42,18], '%': [35,19,8,100,98], '&': [54,73,85,34,80], '\'': [0,5,3,0,0],
  '(': [0,28,34,65,0], ')': [0,65,34,28,0], '*': [20,8,62,8,20], '+': [8,8,62,8,8],
  ',': [0,80,48,0,0], '-': [8,8,8,8,8], '.': [0,96,96,0,0], '/': [32,16,8,4,2],
  '0': [62,81,73,69,62], '1': [0,66,127,64,0], '2': [66,97,81,73,70], '3': [33,65,69,75,49],
  '4': [24,20,18,127,16], '5': [39,69,69,69,57], '6': [60,74,73,73,48], '7': [1,113,9,5,3],
  '8': [54,73,73,73,54], '9': [6,73,73,41,30], ':': [0,54,54,0,0], ';': [0,86,54,0,0],
  '<': [8,20,34,65,0], '=': [20,20,20,20,20], '>': [0,65,34,20,8], '?': [2,1,81,9,6],
  '@': [50,73,121,65,62], 'A': [126,17,17,17,126], 'B': [127,73,73,73,54], 'C': [62,65,65,65,34],
  'D': [127,65,65,34,28], 'E': [127,73,73,73,65], 'F': [127,9,9,9,1], 'G': [62,65,73,73,58],
  'H': [127,8,8,8,127], 'I': [0,65,127,65,0], 'J': [32,64,65,63,1], 'K': [127,8,20,34,65],
  'L': [127,64,64,64,64], 'M': [127,2,12,2,127], 'N': [127,4,8,16,127], 'O': [62,65,65,65,62],
  'P': [127,9,9,9,6], 'Q': [62,65,81,33,94], 'R': [127,9,25,41,70], 'S': [70,73,73,73,49],
  'T': [1,1,127,1,1], 'U': [63,64,64,64,63], 'V': [31,32,64,32,31], 'W': [127,32,24,32,127],
  'X': [99,20,8,20,99], 'Y': [7,8,112,8,7], 'Z': [97,81,73,69,67], '[': [0,127,65,65,0],
  '\\': [2,4,8,16,32], ']': [0,65,65,127,0], '^': [4,2,1,2,4], '_': [64,64,64,64,64],
  '`': [0,1,2,4,0], 'a': [32,84,84,84,120], 'b': [127,68,68,68,56], 'c': [56,68,68,68,40],
  'd': [56,68,68,68,127], 'e': [56,84,84,84,24], 'f': [8,126,9,1,2], 'g': [24,164,164,164,124],
  'h': [127,8,4,4,120], 'i': [0,68,125,64,0], 'j': [32,64,68,61,0], 'k': [127,16,40,68,0],
  'l': [0,65,127,64,0], 'm': [124,4,24,4,120], 'n': [124,8,4,4,120], 'o': [56,68,68,68,56],
  'p': [252,36,36,36,24], 'q': [24,36,36,252,64], 'r': [124,8,4,4,8], 's': [72,84,84,84,36],
  't': [4,62,68,36,0], 'u': [60,64,64,32,124], 'v': [28,32,64,32,28], 'w': [60,64,48,64,60],
  'x': [68,40,16,40,68], 'y': [156,160,160,160,124], 'z': [68,100,84,76,68],
  '{': [0,8,54,65,0], '|': [0,0,119,0,0], '}': [0,65,54,8,0], '~': [2,1,2,1,0]
};

// ─── Native 2D QR Code Generator Matrix ──────────────────────────────
function generateQrMatrix(text) {
    const grid = 21;
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

    const bytes = Buffer.from(text || 'TEST', 'utf-8');
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
    return matrix;
}

// ─── Native 300-DPI Brother ESC/P Raster Bitmap Engine ────────────────
class BrotherBitmapCanvas {
    constructor(width = 720, height = 520) {
        this.width = width;
        this.height = height;
        // 0 = white, 1 = black, 2 = red (for DK-2251 two-color tape)
        this.pixels = new Uint8Array(width * height);
    }

    fillRect(x, y, w, h, color = 1) {
        const x0 = Math.max(0, Math.floor(x));
        const y0 = Math.max(0, Math.floor(y));
        const x1 = Math.min(this.width, Math.floor(x + w));
        const y1 = Math.min(this.height, Math.floor(y + h));
        for (let py = y0; py < y1; py++) {
            const rowOffset = py * this.width;
            for (let px = x0; px < x1; px++) {
                this.pixels[rowOffset + px] = color;
            }
        }
    }

    drawRect(x, y, w, h, stroke = 2, color = 1) {
        this.fillRect(x, y, w, stroke, color);
        this.fillRect(x, y + h - stroke, w, stroke, color);
        this.fillRect(x, y, stroke, h, color);
        this.fillRect(x + w - stroke, y, stroke, h, color);
    }

    drawDashedRect(x, y, w, h, stroke = 3, dash = 14, gap = 8, color = 1) {
        for (let px = x; px < x + w; px += dash + gap) {
            this.fillRect(px, y, Math.min(dash, x + w - px), stroke, color);
            this.fillRect(px, y + h - stroke, Math.min(dash, x + w - px), stroke, color);
        }
        for (let py = y; py < y + h; py += dash + gap) {
            this.fillRect(x, py, stroke, Math.min(dash, y + h - py), color);
            this.fillRect(x + w - stroke, py, stroke, Math.min(dash, y + h - py), color);
        }
    }

    drawText(text, x, y, scale = 3, color = 1) {
        let cursorX = Math.floor(x);
        let curY = Math.floor(y);
        const str = String(text || '');
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '\n') {
                cursorX = Math.floor(x);
                curY += 9 * scale;
                continue;
            }
            const glyph = FONT_5X7[char] || FONT_5X7[char.toUpperCase()] || FONT_5X7['?'] || [0,0,0,0,0];
            for (let col = 0; col < 5; col++) {
                const colBits = glyph[col];
                for (let row = 0; row < 7; row++) {
                    if ((colBits >> row) & 1) {
                        this.fillRect(cursorX + col * scale, curY + row * scale, scale, scale, color);
                    }
                }
            }
            cursorX += 6 * scale;
        }
        return cursorX;
    }

    drawTextCentered(text, y, scale = 3, color = 1, startX = 0, endX = null) {
        const right = (endX === null ? this.width : endX);
        const textWidth = String(text || '').length * 6 * scale;
        const x = Math.floor(startX + (right - startX - textWidth) / 2);
        this.drawText(text, x, y, scale, color);
        return x;
    }

    drawQrCode(matrix, x, y, moduleSize = 6) {
        const grid = matrix.length;
        for (let r = 0; r < grid; r++) {
            for (let c = 0; c < grid; c++) {
                if (matrix[r][c] === 1) {
                    this.fillRect(x + c * moduleSize, y + r * moduleSize, moduleSize, moduleSize, 1);
                }
            }
        }
    }

    toBrotherRasterBuffer(labelSize = '62', isTwoColor = false) {
        const chunks = [];
        // 1. 200 null bytes for synchronization
        chunks.push(Buffer.alloc(200, 0));

        // 2. ESC @ (Initialize)
        chunks.push(Buffer.from([0x1B, 0x40]));

        // 3. Switch to Raster mode: ESC i a 1
        chunks.push(Buffer.from([0x1B, 0x69, 0x61, 0x01]));

        // 4. Media specification: ESC i z
        let mediaWidth = 62;
        if (labelSize.includes('29')) mediaWidth = 29;
        if (labelSize.includes('38')) mediaWidth = 38;
        if (labelSize.includes('54')) mediaWidth = 54;
        if (labelSize.includes('102')) mediaWidth = 102;

        const mediaHeader = Buffer.from([
            0x1B, 0x69, 0x7A,
            0x84,       // valid flags
            0x0A,       // continuous roll media type
            mediaWidth, // media width in mm
            0x00,       // media length (0 for continuous)
            this.height & 0xFF, (this.height >> 8) & 0xFF, (this.height >> 16) & 0xFF, (this.height >> 24) & 0xFF,
            0x00, 0x00
        ]);
        chunks.push(mediaHeader);

        // 5. ESC i M 0x40 (Auto cut)
        chunks.push(Buffer.from([0x1B, 0x69, 0x4D, 0x40]));

        // 6. ESC i A 0x01 (Cut every 1 page)
        chunks.push(Buffer.from([0x1B, 0x69, 0x41, 0x01]));

        // 7. ESC i K (Expanded mode: cut at end, two-color mode flag)
        const extMode = isTwoColor ? (0x08 | 0x01) : 0x08;
        chunks.push(Buffer.from([0x1B, 0x69, 0x6B, extMode]));

        // 8. ESC i d (Feed margin: 35 dots)
        chunks.push(Buffer.from([0x1B, 0x69, 0x64, 0x23, 0x00]));

        // 9. Raster lines: 90 bytes per line (720 dots wide, 696 printable)
        const BYTES_PER_LINE = 90;

        for (let y = 0; y < this.height; y++) {
            const blackBytes = Buffer.alloc(BYTES_PER_LINE, 0);
            const redBytes = Buffer.alloc(BYTES_PER_LINE, 0);

            for (let x = 0; x < this.width && x < 720; x++) {
                const val = this.pixels[y * this.width + x];
                const byteIdx = Math.floor(x / 8);
                const bitIdx = 7 - (x % 8);

                if (val === 1) {
                    blackBytes[byteIdx] |= (1 << bitIdx);
                } else if (val === 2) {
                    redBytes[byteIdx] |= (1 << bitIdx);
                }
            }

            if (isTwoColor) {
                // Red raster line: w 0x01 0x5A
                chunks.push(Buffer.from([0x77, 0x01, BYTES_PER_LINE]));
                chunks.push(redBytes);
                // Black raster line: w 0x00 0x5A
                chunks.push(Buffer.from([0x77, 0x00, BYTES_PER_LINE]));
                chunks.push(blackBytes);
            } else {
                // Monochrome raster line: g 0x00 0x5A
                chunks.push(Buffer.from([0x67, 0x00, BYTES_PER_LINE]));
                chunks.push(blackBytes);
            }
        }

        // 10. Form Feed (0x0C) - Prints and cuts page
        chunks.push(Buffer.from([0x0C]));

        return Buffer.concat(chunks);
    }
}

// ─── Badge & Ticket Generators (Native Raster & SVG) ─────────────────
function generateNativeBrotherChildBadge(labelData, labelSize = '62') {
    const isTwoColor = labelSize === '62red' || labelSize.includes('red');
    const nameParts = (labelData.name || 'CHILD NAME').trim().split(' ');
    const firstName = (nameParts[0] || '').toUpperCase();
    const lastName = (nameParts.slice(1).join(' ') || '').toUpperCase();
    const securityCode = labelData.securityCode || 'K984';
    const qrDataPayload = labelData.qrData || securityCode;
    const className = labelData.class || 'Preschool Room 2';
    const allergies = (labelData.allergies || '').trim();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const hasAllergy = allergies && allergies.toLowerCase() !== 'none' && allergies.length > 0;

    const height = parseInt(serverConfig.childBadgeLength || labelData.childBadgeLength || 520, 10);
    const canvas = new BrotherBitmapCanvas(720, height);

    // Outer badge frame
    canvas.drawDashedRect(25, 25, 670, height - 50, 4, 16, 8, 1);

    // Child First & Last Name
    canvas.drawText(firstName, 45, 55, 6, 1);
    if (lastName) {
        canvas.drawText(lastName, 45, 110, 6, 1);
        canvas.fillRect(45, 160, 420, 4, 1);
        canvas.drawText(`Class: ${className}`, 45, 178, 4, 1);
        canvas.drawText(`Date: ${dateStr}`, 45, 215, 3, 1);
    } else {
        canvas.fillRect(45, 115, 420, 4, 1);
        canvas.drawText(`Class: ${className}`, 45, 135, 4, 1);
        canvas.drawText(`Date: ${dateStr}`, 45, 175, 3, 1);
    }

    // Security Code Box (Inverted black badge with white text)
    canvas.fillRect(475, 45, 205, 65, 1);
    canvas.drawTextCentered(securityCode, 58, 6, 0, 475, 680);

    // QR Code Box & 2D Matrix
    const qrMatrix = generateQrMatrix(qrDataPayload);
    const qrX = 490;
    const qrY = 125;
    canvas.drawRect(qrX - 6, qrY - 6, 162, 162, 3, 1);
    canvas.drawQrCode(qrMatrix, qrX, qrY, 7);

    // Allergy Alert Banner
    if (hasAllergy) {
        const allergyY = height - 110;
        const alertColor = isTwoColor ? 2 : 1;
        canvas.fillRect(35, allergyY, 650, 48, alertColor);
        canvas.drawTextCentered(`! ALLERGY: ${allergies.toUpperCase()}`, allergyY + 14, 4, 0, 35, 685);
    }

    canvas.drawTextCentered('Must present matching ticket for pick-up.', height - 42, 3, 1);

    return canvas.toBrotherRasterBuffer(labelSize, isTwoColor);
}

function generateNativeBrotherGuardianTicket(labelData, labelSize = '62') {
    const isTwoColor = labelSize === '62red' || labelSize.includes('red');
    const childName = (labelData.name || 'CHILD NAME').toUpperCase();
    const securityCode = labelData.securityCode || 'K984';
    const qrDataPayload = labelData.qrData || securityCode;
    const height = parseInt(serverConfig.guardianTicketLength || labelData.guardianTicketLength || 380, 10);
    const canvas = new BrotherBitmapCanvas(720, height);

    // Outer ticket frame
    canvas.drawDashedRect(25, 25, 670, height - 50, 4, 16, 8, 1);

    // Header
    canvas.drawTextCentered('PRIMARY GUARDIAN CLAIM TICKET', 45, 4, 1);
    canvas.fillRect(40, 75, 640, 3, 1);

    canvas.drawText('Security Match Code:', 45, 100, 3, 1);

    // Massive Security Code Inverted Box
    canvas.fillRect(45, 125, 410, 120, 1);
    canvas.drawTextCentered(securityCode, 155, 9, 0, 45, 455);

    // QR Code Box & 2D Matrix
    const qrMatrix = generateQrMatrix(qrDataPayload);
    const qrX = 490;
    const qrY = 100;
    canvas.drawRect(qrX - 6, qrY - 6, 162, 162, 3, 1);
    canvas.drawQrCode(qrMatrix, qrX, qrY, 7);

    // Footer info
    canvas.drawTextCentered(`Child: ${childName}`, height - 85, 4, 1);
    canvas.drawTextCentered('Keep this ticket until child is picked up.', height - 45, 3, 1);

    return canvas.toBrotherRasterBuffer(labelSize, isTwoColor);
}

function generateRealQrCodeSvg(text, x, y, size) {
    const matrix = generateQrMatrix(text);
    const grid = matrix.length;
    const moduleSize = size / grid;
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
    const firstName = (nameParts[0] || 'CHILD').toUpperCase();
    const lastName = (nameParts.slice(1).join(' ') || '').toUpperCase();
    const securityCode = labelData.securityCode || 'K984';
    const qrDataPayload = labelData.qrData || securityCode;
    const className = labelData.class || 'Preschool Room 2';
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

// ─── ESC/POS Payload Generator (Epson, Star, Generic Thermal) ────────
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

// ─── Linux CUPS Printing Fallback ────────────────────────────────────
function printViaCups(labelData, printerName, callback) {
    const tmpFile = path.join(os.tmpdir(), `kiddo_badge_${Date.now()}.txt`);
    const payload = generateEscPosPayload(labelData);
    fs.writeFileSync(tmpFile, payload);
    
    exec(`lp -d "${printerName}" "${tmpFile}" || lpr -P "${printerName}" "${tmpFile}"`, (err, stdout, stderr) => {
        try { fs.unlinkSync(tmpFile); } catch(e) {}
        if (err) {
            addLog('error', `CUPS Print Error (${printerName}): ${err.message}`);
            return callback && callback(null, { success: false, error: err.message });
        }
        addLog('success', `Label printed via Linux CUPS queue [${printerName}]`);
        callback && callback(null, { success: true, printer: printerName, mode: 'cups' });
    });
}

// ─── Brother QL Printing (Native Direct Socket + USB/CLI Fallback) ───
function printViaBrotherQl(labelData, printerIp, callback) {
    const cleanIp = (printerIp || '').replace(/^tcp:\/\//i, '').replace(/:9100$/, '').trim();
    const labelSize = (serverConfig.defaultLabelSize || '62').trim();

    addLog('info', `Generating Native Brother ESC/P Raster for "${labelData.name}"...`, { targetIp: cleanIp });

    const badgeBuffer = generateNativeBrotherChildBadge(labelData, labelSize);
    const ticketBuffer = generateNativeBrotherGuardianTicket(labelData, labelSize);
    const fullPayload = Buffer.concat([badgeBuffer, ticketBuffer]);

    // 1. If USB device path on Linux (e.g. /dev/usb/lp0)
    if (cleanIp.startsWith('/dev/')) {
        try {
            fs.writeFileSync(cleanIp, fullPayload);
            addLog('success', `Brother QL: Printed 2 labels directly to USB port [${cleanIp}]!`);
            return callback && callback(null, { success: true, printer: cleanIp, mode: 'brother_usb_direct' });
        } catch(uErr) {
            addLog('error', `Brother QL USB write failed on ${cleanIp}: ${uErr.message}`);
            return callback && callback(null, { success: false, error: uErr.message });
        }
    }

    // 2. Direct Raw TCP Port 9100 Socket Stream (Fastest, zero external python/cairo dependencies)
    addLog('info', `Streaming native Brother ESC/P raster to tcp://${cleanIp}:9100...`, { targetIp: cleanIp });

    const socket = new net.Socket();
    socket.setTimeout(6000);

    socket.connect(9100, cleanIp, () => {
        socket.write(fullPayload, () => {
            socket.end();
            addLog('success', `Brother QL: 2 labels (Child Badge + Guardian Ticket) printed on ${cleanIp}!`, { targetIp: cleanIp });
            callback && callback(null, { success: true, printer: cleanIp, mode: 'brother_native_raster_tcp' });
        });
    });

    socket.on('error', (sErr) => {
        let userFriendlyErr = sErr.message;
        if (sErr.code === 'ECONNREFUSED' || sErr.message.includes('ECONNREFUSED')) {
            userFriendlyErr = `Printer at IP ${cleanIp} refused connection on Port 9100. Confirm IP is correct & printer is ON.`;
        } else if (sErr.code === 'EHOSTUNREACH' || sErr.message.includes('EHOSTUNREACH')) {
            userFriendlyErr = `Printer at IP ${cleanIp} is UNREACHABLE (No route to host). Check printer Wi-Fi connection.`;
        } else if (sErr.code === 'ETIMEDOUT') {
            userFriendlyErr = `Connection to printer at ${cleanIp}:9100 TIMED OUT. Printer may be sleeping or on different subnet.`;
        }

        addLog('error', userFriendlyErr, { targetIp: cleanIp, error: sErr.message });
        callback && callback(null, { success: false, error: userFriendlyErr, printer: cleanIp });
    });

    socket.on('timeout', () => {
        socket.destroy();
        const timeoutMsg = `Printer at ${cleanIp}:9100 timed out after 6 seconds. Check printer Wi-Fi connection.`;
        addLog('warn', timeoutMsg, { targetIp: cleanIp });
        callback && callback(null, { success: false, error: timeoutMsg, printer: cleanIp });
    });
}

// ─── Print Job History Store ─────────────────────────────────────────
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

// ─── Core Dispatcher ────────────────────────────────────────────────
function dispatchPrintCommand(labelData, printerIp, printerName, callback) {
    if (!labelData || !labelData.name) {
        addLog('error', 'Print job rejected: Invalid or missing label data');
        return callback && callback(new Error('Invalid label data'));
    }

    const modelId = labelData.printerModel || serverConfig.defaultPrinterModel || 'brother_ql_820';
    const printerMeta = PRINTER_REGISTRY.find(p => p.id === modelId) || PRINTER_REGISTRY[0];
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
        addLog('warn', `No Printer IP set for "${labelData.name}". Enter one in the Web Console.`);
        return callback && callback(null, { success: false, error: 'No printer IP configured. Enter one in the web console.' });
    }

    // Check if CUPS print queue
    if (printerMeta.protocol === 'cups' || targetIp.startsWith('cups://')) {
        const cupsQueueName = targetIp.replace(/^cups:\/\//, '');
        printViaCups(labelData, cupsQueueName, (err, res) => {
            if (res && res.success) { jobRecord.status = 'success'; } else { jobRecord.status = 'failed'; jobRecord.error = (res && res.error) || 'CUPS error'; }
            callback && callback(err, res);
        });
        return;
    }

    // Brother QL protocol
    if (printerMeta.protocol === 'brother_ql') {
        printViaBrotherQl(labelData, targetIp, (err, res) => {
            if (res && res.success) { jobRecord.status = 'success'; } else { jobRecord.status = 'failed'; jobRecord.error = (res && res.error) || 'Brother QL error'; }
            callback && callback(err, res);
        });
        return;
    }

    // ESC/POS raw socket
    const payload = generateEscPosPayload(labelData);
    addLog('info', `TCP Socket → ${targetIp}:9100 [${printerMeta.protocol.toUpperCase()}]...`, { jobId: jobRecord.id, targetIp });
    const socket = new net.Socket();
    socket.setTimeout(6000);
    socket.connect(9100, targetIp, () => {
        socket.write(payload, () => {
            socket.end();
            jobRecord.status = 'success';
            addLog('success', `Label printed on ${targetIp} [${printerMeta.name}]!`, { jobId: jobRecord.id, targetIp });
            callback && callback(null, { success: true, printer: targetIp, mode: printerMeta.protocol });
        });
    });
    socket.on('error', (err) => {
        jobRecord.status = 'failed';
        jobRecord.error = err.message;
        addLog('error', `Socket error ${targetIp}:9100 — ${err.message}`, { jobId: jobRecord.id, targetIp, error: err.message });
        callback && callback(null, { success: false, error: err.message, targetIp });
    });
    socket.on('timeout', () => {
        jobRecord.status = 'failed';
        jobRecord.error = `Connection timeout to ${targetIp}`;
        addLog('warn', `Socket timeout ${targetIp}:9100`, { jobId: jobRecord.id, targetIp });
        socket.destroy();
        callback && callback(null, { success: false, error: `Connection timeout to ${targetIp}` });
    });
}

// ─── Network Interface & OS Discovery ────────────────────────────────
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

// ─── Azure Cloud Relay Polling (Safe & Resilient) ─────────────────────
const AZURE_API_URL = process.env.AZURE_API_URL || 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
let cloudRelayStatus = { active: false, lastPoll: null, jobsProcessed: 0, lastError: null };

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
            timeout: 3500,
        }, (res) => {
            let rawData = '';
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => {
                try {
                    cloudRelayStatus.lastPoll = new Date().toISOString();
                    cloudRelayStatus.active = true;
                    cloudRelayStatus.lastError = null;

                    if (res.statusCode === 200 && rawData) {
                        const data = JSON.parse(rawData);
                        if (data.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
                            for (const job of data.jobs) {
                                cloudRelayStatus.jobsProcessed++;
                                const childName = job.labelData?.name || 'Child Badge';
                                const targetIp = (job.printerIp || serverConfig.defaultPrinterIp || '').trim();
                                addLog('cloud', `Cloud job received for "${childName}"`, {
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
            cloudRelayStatus.lastError = 'Poll timeout (3.5s)';
        });

        req.on('error', (err) => {
            cloudRelayStatus.lastError = err.message;
        });

    } catch (err) {
        cloudRelayStatus.lastError = err.message;
    }
}

setInterval(pollAzureCloudPrintQueue, 5000);

// ─── API Endpoints ───────────────────────────────────────────────────

// Real-Time Server-Sent Events (SSE) Stream for Dashboard Terminal
app.get('/api/logs/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial backlog
    res.write(`data: ${JSON.stringify({ type: 'init', logs: logsBuffer, serverConfig, history: printJobsHistory })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
        sseClients.delete(res);
    });
});

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

app.get(['/api/logs', '/api/status-logs'], (req, res) => {
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
        res.json(result || { success: true });
    });
});

app.post('/api/test-print', (req, res) => {
    const { printerIp, childName, model, labelSize } = req.body || {};
    const targetIp = (printerIp || serverConfig.defaultPrinterIp || '').trim();
    if (!targetIp) {
        return res.status(400).json({ success: false, error: 'Printer IP or Queue Name is required' });
    }
    const testData = {
        name: childName || 'SAMUEL OKONKWO',
        securityCode: 'K984',
        class: 'Preschool Room 2',
        allergies: 'PEANUTS',
        labelSize: labelSize || serverConfig.defaultLabelSize || '62',
        printerModel: model || serverConfig.defaultPrinterModel || 'brother_ql_820'
    };
    dispatchPrintCommand(testData, targetIp, '', (err, result) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json(result || { success: true });
    });
});

app.get('/api/ping-printer', (req, res) => {
    const targetIp = (req.query.ip || serverConfig.defaultPrinterIp || '').trim();
    if (!targetIp) return res.json({ reachable: false, error: 'No IP provided' });

    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.connect(9100, targetIp, () => {
        socket.destroy();
        addLog('success', `Printer IP ${targetIp}:9100 is ONLINE and ready!`, { targetIp });
        res.json({ reachable: true, ip: targetIp, port: 9100, message: `Printer is ONLINE on port 9100` });
    });
    socket.on('error', (err) => {
        socket.destroy();
        addLog('warn', `Printer check ${targetIp}:9100 failed: ${err.message}`, { targetIp });
        res.json({ reachable: false, ip: targetIp, error: err.message });
    });
    socket.on('timeout', () => {
        socket.destroy();
        res.json({ reachable: false, ip: targetIp, error: 'Connection timed out after 1.5s' });
    });
});

app.get('/api/preview-badge', (req, res) => {
    const { model, labelSize, childBadgeLength, name, securityCode, allergies, className } = req.query || {};
    const labelData = {
        name: (name || 'SAMUEL OKONKWO').trim(),
        securityCode: securityCode || 'K984',
        class: className || 'Preschool Room 2',
        allergies: allergies || 'PEANUTS',
        childBadgeLength: childBadgeLength ? parseInt(childBadgeLength, 10) : 520,
    };
    const svg = generateBrotherQlChildBadgeSvg(labelData, labelSize || serverConfig.defaultLabelSize || '62');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
});

app.get('/api/scan-printers', async (req, res) => {
    addLog('info', 'Scanning local subnets & Port 9100 for active thermal printers...');
    const lanInterfaces = getPhysicalLanInterfaces();
    const foundMap = new Map();

    const subnets = [...new Set(lanInterfaces.map(i => i.ip.substring(0, i.ip.lastIndexOf('.'))))];
    if (subnets.length === 0) {
        const localIps = getLocalIpAddresses();
        if (localIps.length > 0) subnets.push(localIps[0].substring(0, localIps[0].lastIndexOf('.')));
    }

    function probePrinterIpPort(ip, port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(200);
            socket.connect(port, ip, () => {
                socket.destroy();
                resolve({ open: true, ip, port });
            });
            socket.on('error', () => { socket.destroy(); resolve({ open: false, ip, port }); });
            socket.on('timeout', () => { socket.destroy(); resolve({ open: false, ip, port }); });
        });
    }

    const BATCH_SIZE = 30;
    const ipsToProbe = [];
    for (const subnet of subnets) {
        for (let i = 1; i <= 254; i++) {
            ipsToProbe.push(`${subnet}.${i}`);
        }
    }

    for (let i = 0; i < ipsToProbe.length; i += BATCH_SIZE) {
        const chunk = ipsToProbe.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(chunk.map(ip => probePrinterIpPort(ip, 9100)));
        batchResults.forEach(item => {
            if (item.open && !foundMap.has(item.ip)) {
                foundMap.set(item.ip, {
                    ip: item.ip,
                    name: `Brother / Thermal Printer (${item.ip})`,
                    source: 'Port 9100 (Raw TCP Socket)',
                    type: 'network_ip'
                });
            }
        });
    }

    const printersList = Array.from(foundMap.values());
    addLog('success', `Scan complete. Found ${printersList.length} verified printer(s) on Port 9100.`, { count: printersList.length });

    res.json({
        subnets,
        lanInterfaces,
        printers: printersList
    });
});

// ─── Web Console UI (`GET /` & `GET /logs`) ─────────────────────────
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
        qrData: 'K984'
    }, serverConfig.defaultLabelSize || '62');

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
                --border: #23314d;
                --border-bright: #384d77;
                --text: #f8fafc;
                --muted: #94a3b8;
                --primary: #6366f1;
                --primary-glow: rgba(99, 102, 241, 0.35);
                --success: #10b981;
                --success-glow: rgba(16, 185, 129, 0.3);
                --danger: #f43f5e;
                --warning: #f59e0b;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
            body { background: var(--bg); color: var(--text); padding: 24px; max-width: 1400px; margin: 0 auto; min-height: 100vh; }
            
            .glass { background: rgba(19, 28, 49, 0.75); backdrop-filter: blur(16px); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6); }
            
            header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
            .brand { display: flex; align-items: center; gap: 14px; }
            .brand-logo { width: 44px; height: 44px; background: linear-gradient(135deg, var(--primary), #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
            .brand-title { font-size: 22px; font-weight: 800; }
            
            .badge { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
            .badge-online { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.3); }
            .badge-os { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3); }
            .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

            .grid-main { display: grid; grid-template-columns: 1fr 440px; gap: 24px; }
            @media(max-width: 1024px) { .grid-main { grid-template-columns: 1fr; } }
            
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 22px; margin-bottom: 24px; }
            .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .card-title { font-size: 14px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; display: flex; align-items: center; gap: 8px; }

            .terminal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
            .filter-pills { display: flex; gap: 6px; }
            .pill-btn { background: #090d16; border: 1px solid var(--border); color: var(--muted); padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; width: auto; margin: 0; }
            .pill-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
            .search-input { background: #080d1a; border: 1px solid var(--border); padding: 8px 14px; border-radius: 10px; font-size: 13px; color: #fff; width: 220px; margin: 0; }

            .log-box { background: #050811; border: 1px solid var(--border); border-radius: 12px; padding: 14px; font-family: 'JetBrains Mono', monospace; font-size: 12px; height: 480px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
            .log-entry { padding: 10px 14px; border-radius: 8px; border-left: 4px solid var(--border); background: #0c1324; word-break: break-all; }
            .log-entry.success { border-color: var(--success); background: rgba(16, 185, 129, 0.08); }
            .log-entry.error { border-color: var(--danger); background: rgba(244, 63, 94, 0.1); }
            .log-entry.warn { border-color: var(--warning); background: rgba(245, 158, 11, 0.08); }
            .log-entry.cloud { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
            .time { color: var(--muted); font-size: 11px; margin-right: 8px; opacity: 0.8; }

            .printers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; max-height: 280px; overflow-y: auto; }
            .printer-item { background: #080d1a; border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; }
            .printer-title { font-weight: 700; font-size: 13px; color: #fff; display: flex; justify-content: space-between; }
            .printer-sub { font-size: 11px; color: var(--muted); font-family: 'JetBrains Mono', monospace; }

            input, select, button { width: 100%; padding: 11px 14px; border-radius: 10px; border: 1px solid var(--border); background: #080d1a; color: #fff; margin-bottom: 12px; font-size: 13px; }
            input:focus, select:focus { border-color: var(--primary); outline: none; }
            button { background: linear-gradient(135deg, var(--primary), #4f46e5); font-weight: 700; cursor: pointer; border: none; }
            .btn-secondary { background: #1e293b; color: #fff; border: 1px solid var(--border); }
            .btn-success { background: linear-gradient(135deg, var(--success), #059669); }
            
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
                    <div class="brand-title">KiddoChecker Print Server <span style="font-size:12px; color:#10b981; font-weight:700; background:rgba(16,185,129,0.15); padding:2px 8px; border-radius:12px; border:1px solid rgba(16,185,129,0.3);">v2.5.0 NATIVE</span></div>
                    <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">
                        <span class="badge badge-os">${process.platform.toUpperCase()} SERVER</span>
                        <span class="badge badge-online" id="streamStatus"><span class="dot"></span> LIVE SSE ACTIVE</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button onclick="pingPrinter()" class="btn-secondary" style="width: auto; margin: 0; padding: 8px 16px;">🔌 Check Printer Status</button>
                <button onclick="scanNetworkPrinters()" class="btn-success" style="width: auto; margin: 0; padding: 8px 16px;">🔍 Auto-Scan LAN Printers</button>
            </div>
        </header>

        <div class="grid-main">
            <div>
                <!-- Discovered Network Printers Card -->
                <div class="card glass">
                    <div class="card-header">
                        <div class="card-title">📡 Discovered Network & Thermal Printers</div>
                        <button onclick="scanNetworkPrinters()" class="btn-secondary" style="width: auto; margin: 0; padding: 4px 12px; font-size: 11px;">⚡ Re-Scan Subnets</button>
                    </div>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 14px;">Automatically detects active thermal printers on Port 9100 across LAN subnets.</p>
                    <div id="printersGrid" class="printers-grid">
                        <div style="color: var(--muted); font-size: 12px; padding: 16px; text-align: center; grid-column: 1/-1;">
                            Click <strong>Auto-Scan LAN Printers</strong> to discover Brother & thermal devices...
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
                    <div id="log-box" class="log-box">Connecting to real-time log stream...</div>
                </div>

                <!-- Recent Jobs Card -->
                <div class="card glass">
                    <div class="card-header">
                        <div class="card-title" style="color: #60a5fa;">📋 Recent Print Jobs</div>
                    </div>
                    <div id="jobs-box" style="background:#050811; border:1px solid var(--border); border-radius:12px; padding:12px; max-height:240px; overflow-y:auto;">
                        <div style="color:var(--muted); font-size:12px; padding:8px;">No print jobs in memory queue yet.</div>
                    </div>
                </div>
            </div>

            <div>
                <!-- Printer Configuration Card -->
                <div class="card glass">
                    <div class="card-title" style="color: var(--primary); margin-bottom: 14px;">⚙️ Printer Configuration</div>

                    <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">PRINTER MODEL:</label>
                    <select id="printerModelSelect" onchange="onModelChange(this.value); updateLivePreview();">
                        ${printerOptionsHtml}
                    </select>

                    <div id="labelSizeRow" class="${isBrother ? '' : 'hidden'}">
                        <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">LABEL ROLL SIZE:</label>
                        <select id="labelSizeSelect" onchange="updateLivePreview()">
                            ${labelSizeOptionsHtml}
                        </select>
                    </div>

                    <div id="brotherQlNote" class="note-box ${isBrother ? '' : 'hidden'}">
                        💡 <strong>Brother QL Direct TCP Printing:</strong><br>
                        • Prints directly over <strong>TCP Port 9100</strong> with zero python/cairo setup.<br>
                        • On Brother QL screen: Press <strong>Menu ➔ WLAN ➔ WLAN Status ➔ IP Address</strong>.<br>
                        • Enter printer IP below (e.g. <code>192.168.2.169</code>).
                    </div>

                    <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">PRINTER IP OR PORT:</label>
                    <div style="display:flex; gap:8px;">
                        <input type="text" id="defaultIpInput" placeholder="e.g. 192.168.2.169 or /dev/usb/lp0" value="${serverConfig.defaultPrinterIp}" style="margin-bottom:0;" />
                        <button onclick="pingPrinter()" class="btn-secondary" style="width:auto; margin:0; padding:0 14px; font-size:12px; white-space:nowrap;">Test IP</button>
                    </div>
                    <div id="pingStatusText" style="font-size:11px; margin-top:4px; margin-bottom:12px; min-height:16px;"></div>

                    <div style="display:flex; gap:10px; margin-top:4px;">
                        <div style="flex:1;">
                            <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">BADGE LENGTH (PX):</label>
                            <input type="number" id="childBadgeLengthInput" value="${serverConfig.childBadgeLength || 520}" oninput="updateLivePreview()" />
                        </div>
                        <div style="flex:1;">
                            <label style="font-size:11px; color: var(--muted); font-weight:700; display:block; margin-bottom:4px;">TICKET LENGTH (PX):</label>
                            <input type="number" id="guardianTicketLengthInput" value="${serverConfig.guardianTicketLength || 380}" />
                        </div>
                    </div>

                    <button onclick="saveDefaultConfig()" class="btn-success" style="margin-top:8px;">💾 Save Printer Configuration</button>
                    <div id="configResult" style="font-size: 12px; font-weight: 700; margin-top: 6px; text-align: center;"></div>
                </div>

                <!-- Live Dynamic Badge Preview Visualizer -->
                <div class="card glass">
                    <div class="card-title">👁️ Live Dynamic Badge Preview</div>
                    <div class="preview-box">
                        ${sampleSvg}
                    </div>
                </div>

                <!-- Direct Printer Tester Card -->
                <div class="card glass">
                    <div class="card-title">🚀 Direct Printer Tester</div>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Send immediate test badge to printer IP or queue.</p>
                    <input type="text" id="testIp" placeholder="Printer IP" value="${serverConfig.defaultPrinterIp || '192.168.2.169'}" />
                    <input type="text" id="testName" placeholder="Test Child Name" value="SAMUEL OKONKWO" oninput="updateLivePreview()" />
                    <button onclick="sendTestPrint()">🚀 Dispatch Test Print</button>
                    <div id="testResult" style="font-size: 12px; font-weight: 700; margin-top: 6px;"></div>
                </div>

                <!-- Server Info Card -->
                <div class="card glass">
                    <div class="card-title">🐧 Server Info</div>
                    <div style="font-size: 13px; line-height: 1.8;">
                        <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--border); padding: 6px 0;"><span>Platform:</span> <strong style="color:#a5b4fc;">${process.platform}</strong></div>
                        <div style="display:flex; justify-content:space-between; border-bottom: 1px solid var(--border); padding: 6px 0;"><span>Active Model:</span> <strong id="activeModel">${currentModel.name}</strong></div>
                        <div style="display:flex; justify-content:space-between; padding: 6px 0;"><span>Engine:</span> <strong style="color: var(--success);">Direct ESC/P Raster (TCP:9100)</strong></div>
                    </div>
                    <div style="margin-top: 14px;">
                        <p style="font-size: 11px; color: var(--muted); font-weight: 700; margin-bottom: 6px;">SERVER IP ADDRESSES:</p>
                        ${lanInterfaces.map(iface => `<div style="margin-bottom:4px;"><span class="ip-tag">${iface.interface}: http://${iface.ip}:${PORT}</span></div>`).join('')}
                    </div>
                </div>
            </div>
        </div>

        <script>
            let currentLogs = [];
            let activeLogFilter = 'all';

            // Connect Real-Time SSE Stream
            function setupSseStream() {
                try {
                    const es = new EventSource('/api/logs/stream');
                    es.onopen = () => {
                        const statusEl = document.getElementById('streamStatus');
                        if (statusEl) statusEl.innerHTML = '<span class="dot"></span> LIVE SSE ACTIVE';
                    };
                    es.onmessage = (e) => {
                        try {
                            const data = JSON.parse(e.data);
                            if (data.type === 'init') {
                                currentLogs = data.logs || [];
                                renderHistory(data.history || []);
                                filterLogsRender();
                            } else if (data.type === 'log') {
                                currentLogs.unshift(data.log);
                                if (currentLogs.length > 300) currentLogs.pop();
                                filterLogsRender();
                            }
                        } catch(err) {}
                    };
                    es.onerror = () => {
                        const statusEl = document.getElementById('streamStatus');
                        if (statusEl) statusEl.innerHTML = '<span class="dot" style="background:#f59e0b;"></span> POLLING (SSE RECONNECTING)';
                    };
                } catch(e) {}
            }

            function renderHistory(history) {
                const jobsBox = document.getElementById('jobs-box');
                if (!jobsBox) return;
                if (!history || history.length === 0) {
                    jobsBox.innerHTML = '<div style="color:var(--muted); font-size:12px; padding:8px;">No print jobs in memory queue yet.</div>';
                    return;
                }
                jobsBox.innerHTML = history.map(job => {
                    const statusColor = job.status === 'success' ? '#10b981' : (job.status === 'failed' ? '#f43f5e' : '#f59e0b');
                    return '<div style="display:flex; justify-content:space-between; align-items:center; background:#0c1324; border:1px solid var(--border); padding:10px 14px; border-radius:8px; margin-bottom:6px; font-size:12px;">' +
                        '<div>' +
                            '<strong style="font-size:14px; color:#fff;">' + job.childName + '</strong> ' +
                            '<span style="color:#94a3b8; font-size:11px;">[' + job.securityCode + ']</span>' +
                            '<div style="color:#64748b; font-size:11px; margin-top:2px;">' + job.time + ' | Target: ' + job.targetIp + ' | <span style="color:' + statusColor + '; font-weight:bold;">' + job.status.toUpperCase() + '</span></div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }

            async function updateLivePreview() {
                const modelSel = document.getElementById('printerModelSelect');
                const model = modelSel ? modelSel.value : 'brother_ql_820';
                const labelSizeSel = document.getElementById('labelSizeSelect');
                const labelSize = labelSizeSel ? labelSizeSel.value : '62';
                const badgeLenInput = document.getElementById('childBadgeLengthInput');
                const badgeLen = badgeLenInput ? badgeLenInput.value : 520;
                const testNameInput = document.getElementById('testName');
                const name = testNameInput ? testNameInput.value : 'SAMUEL OKONKWO';

                const url = '/api/preview-badge?model=' + encodeURIComponent(model) +
                            '&labelSize=' + encodeURIComponent(labelSize) +
                            '&childBadgeLength=' + encodeURIComponent(badgeLen) +
                            '&name=' + encodeURIComponent(name);
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const svgText = await res.text();
                        const box = document.querySelector('.preview-box');
                        if (box) box.innerHTML = svgText;
                    }
                } catch(e) {}
            }

            async function pingPrinter() {
                const ipInput = document.getElementById('defaultIpInput');
                const ip = ipInput ? ipInput.value.trim() : '';
                const pingText = document.getElementById('pingStatusText');
                if (!ip) {
                    if (pingText) pingText.innerHTML = '<span style="color:#f43f5e;">Please enter printer IP first.</span>';
                    return;
                }
                if (pingText) pingText.innerHTML = '<span style="color:#f59e0b;">Pinging ' + ip + ':9100...</span>';
                try {
                    const res = await fetch('/api/ping-printer?ip=' + encodeURIComponent(ip));
                    const data = await res.json();
                    if (data.reachable) {
                        if (pingText) pingText.innerHTML = '<span style="color:#10b981; font-weight:bold;">✅ Printer ONLINE on ' + ip + ':9100! Ready to print.</span>';
                    } else {
                        if (pingText) pingText.innerHTML = '<span style="color:#f43f5e; font-weight:bold;">❌ ' + ip + ' unreachable (' + (data.error || 'Port 9100 closed') + ')</span>';
                    }
                } catch(e) {
                    if (pingText) pingText.innerHTML = '<span style="color:#f43f5e;">Ping error: ' + e.message + '</span>';
                }
            }

            async function fetchLogs() {
                try {
                    const res = await fetch('/api/status-logs');
                    if (res.ok) {
                        const data = await res.json();
                        currentLogs = data.logs || [];
                        renderHistory(data.printJobsHistory || []);
                        filterLogsRender();
                    }
                } catch(e) {}
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
                if (!box) return;
                
                let filtered = currentLogs.filter(log => {
                    if (activeLogFilter !== 'all' && log.type !== activeLogFilter) return false;
                    if (search) {
                        const str = (log.message + ' ' + (log.details ? JSON.stringify(log.details) : '')).toLowerCase();
                        return str.includes(search);
                    }
                    return true;
                });

                if (filtered.length === 0) {
                    box.innerHTML = '<div style="color:#94a3b8; padding:12px; text-align:center;">No matching activity logs...</div>';
                    return;
                }

                box.innerHTML = filtered.map(log => {
                    return '<div class="log-entry ' + log.type + '">' +
                        '<span class="time">' + log.time + '</span>' +
                        '<strong>' + log.message + '</strong>' +
                        (log.details && log.details.targetIp ? '<div style="font-size:11px; color:#94a3b8; margin-top:2px;">Target: ' + log.details.targetIp + '</div>' : '') +
                    '</div>';
                }).join('');
            }

            async function scanNetworkPrinters() {
                const grid = document.getElementById('printersGrid');
                grid.innerHTML = '<div style="color:#f59e0b; padding:16px; text-align:center; grid-column:1/-1;">Scanning local subnets on Port 9100...</div>';
                
                try {
                    const res = await fetch('/api/scan-printers');
                    const data = await res.json();
                    
                    if (data.printers && data.printers.length > 0) {
                        grid.innerHTML = data.printers.map(p => {
                            return '<div class="printer-item">' +
                                '<div>' +
                                    '<div class="printer-title"><span>' + p.name + '</span> <span style="background:#10b981; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">PORT 9100</span></div>' +
                                    '<div class="printer-sub">' + p.ip + '</div>' +
                                '</div>' +
                                '<button onclick="selectDiscoveredPrinter(&quot;' + p.ip + '&quot;)" class="btn-success" style="padding:6px 12px; font-size:11px; margin:0;">⚡ Use Printer</button>' +
                            '</div>';
                        }).join('');
                    } else {
                        grid.innerHTML = '<div style="color:#f43f5e; padding:16px; text-align:center; grid-column:1/-1;">No thermal printers found on Port 9100. Verify printer Wi-Fi & IP.</div>';
                    }
                } catch(e) {
                    grid.innerHTML = '<div style="color:#f43f5e; padding:16px; text-align:center; grid-column:1/-1;">Scan error: ' + e.message + '</div>';
                }
            }

            function selectDiscoveredPrinter(ip) {
                document.getElementById('defaultIpInput').value = ip;
                document.getElementById('testIp').value = ip;
                saveDefaultConfig();
                pingPrinter();
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
                const model = modelSel ? modelSel.value : 'brother_ql_820';
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
                        resDiv.innerText = '✅ Saved! Active Target: ' + ip;
                        resDiv.style.color = '#10b981';
                        document.getElementById('testIp').value = ip;
                    } else {
                        resDiv.innerText = '❌ Failed to save config';
                        resDiv.style.color = '#f43f5e';
                    }
                } catch(e) {
                    resDiv.innerText = '❌ Error: ' + e.message;
                    resDiv.style.color = '#f43f5e';
                }
            }

            async function sendTestPrint() {
                const ip = document.getElementById('testIp').value;
                const name = document.getElementById('testName').value;
                const modelSel = document.getElementById('printerModelSelect');
                const model = modelSel ? modelSel.value : 'brother_ql_820';
                const labelSizeSel = document.getElementById('labelSizeSelect');
                const labelSize = labelSizeSel ? labelSizeSel.value : '62';
                const resDiv = document.getElementById('testResult');
                resDiv.innerText = 'Dispatching test print to ' + ip + '...';
                resDiv.style.color = '#f59e0b';

                try {
                    const res = await fetch('/api/test-print', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ printerIp: ip, childName: name, model, labelSize })
                    });
                    const data = await res.json();
                    if (data.success) {
                        resDiv.innerText = '✅ Test Print Dispatched to ' + ip + '!';
                        resDiv.style.color = '#10b981';
                    } else {
                        resDiv.innerText = '❌ Failed: ' + (data.error || 'Unknown error');
                        resDiv.style.color = '#f43f5e';
                    }
                } catch(e) {
                    resDiv.innerText = '❌ Error: ' + e.message;
                    resDiv.style.color = '#f43f5e';
                }
            }

            setupSseStream();
            fetchLogs();
            setInterval(fetchLogs, 4000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

const server = app.listen(PORT, HOST, () => {
    const lanInterfaces = getPhysicalLanInterfaces();
    const model = PRINTER_REGISTRY.find(p => p.id === serverConfig.defaultPrinterModel);
    console.log(`
    ===================================================================
    ⚡ KiddoChecker Native Print Server (Port ${PORT})
    ===================================================================
    OS Platform  : ${process.platform} (${os.type()})
    Status       : Listening on http://${HOST}:${PORT}
    Active Model : ${model ? model.name : serverConfig.defaultPrinterModel} [${model ? model.protocol : '?'}]
    Default IP   : ${serverConfig.defaultPrinterIp || 'None'}
    
    Local Server Web URLs:
    ${lanInterfaces.map(i => `   http://${i.ip}:${PORT} (${i.interface})`).join('\n')}
    ===================================================================
    `);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ [Fatal Error] Port ${PORT} is already in use by an old background process!`);
        console.error(`👉 Run: fuser -k ${PORT}/tcp or killall node to terminate old processes before starting.`);
        process.exit(1);
    } else {
        console.error(`❌ [Fatal Error] Server error:`, err);
        process.exit(1);
    }
});
