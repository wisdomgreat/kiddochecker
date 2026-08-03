const express = require('express');
const { exec } = require('child_process');
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

// ─── Persistent Server Printer Configuration ────────────────────
const CONFIG_FILE = path.join(__dirname, 'printer-config.json');

let serverConfig = {
    defaultPrinterIp: process.env.PRINTER_IP || '',
    defaultPrinterName: process.env.PRINTER_NAME || 'Default Printer'
};

function loadServerConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed.defaultPrinterIp !== undefined) serverConfig.defaultPrinterIp = parsed.defaultPrinterIp;
            if (parsed.defaultPrinterName !== undefined) serverConfig.defaultPrinterName = parsed.defaultPrinterName;
            addLog('info', `Loaded configuration from file. Server Default Printer IP: "${serverConfig.defaultPrinterIp || 'None'}"`);
        }
    } catch (err) {
        addLog('warn', `Could not load printer-config.json: ${err.message}`);
    }
}

function saveServerConfig(newConfig) {
    try {
        serverConfig = { ...serverConfig, ...newConfig };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(serverConfig, null, 2), 'utf-8');
        addLog('success', `Saved new server default printer config. Default IP: ${serverConfig.defaultPrinterIp}`);
        return true;
    } catch (err) {
        addLog('error', `Failed to save printer-config.json: ${err.message}`);
        return false;
    }
}

loadServerConfig();

const AZURE_API_URL = process.env.AZURE_API_URL || 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';
let cloudRelayStatus = { active: false, lastPoll: null, jobsProcessed: 0, lastError: null };

// ─── Azure Cloud Print Relay Polling ────────────────────────────
async function pollAzureCloudPrintQueue() {
    try {
        const response = await fetch(`${AZURE_API_URL}/api/print-jobs/poll`);
        cloudRelayStatus.lastPoll = new Date().toISOString();
        cloudRelayStatus.active = true;
        cloudRelayStatus.lastError = null;

        if (response.ok) {
            const data = await response.json();
            if (data.jobs && data.jobs.length > 0) {
                for (const job of data.jobs) {
                    cloudRelayStatus.jobsProcessed++;
                    addLog('cloud', `Received Azure Cloud Job: ${job.id} for ${job.labelData?.name || 'Child'}`, {
                        jobId: job.id,
                        printerIp: job.printerIp,
                        printerName: job.printerName
                    });
                    dispatchPrintCommand(job.labelData, job.printerIp, job.printerName);
                }
            }
        }
    } catch (err) {
        cloudRelayStatus.active = false;
        cloudRelayStatus.lastError = err.message;
    }
}

setInterval(pollAzureCloudPrintQueue, 2000);

// ─── Core Dispatch Printer Function (Pure Node TCP Socket) ──────
function dispatchPrintCommand(labelData, printerIp, printerName, callback) {
    if (!labelData || !labelData.name) {
        const err = new Error('Invalid or missing label data');
        addLog('error', 'Print job rejected: Invalid label data');
        if (callback) callback(err);
        return;
    }
    
    const childName = labelData.name;
    const securityCode = labelData.securityCode || 'TEST';
    const className = labelData.class || 'General';
    const allergies = labelData.allergies ? `ALLERGIES: ${labelData.allergies}` : '';
    
    // Priority: Kiosk Payload IP -> Server Default Fallback IP -> Env IP
    const targetPrinterIp = (printerIp || labelData.printerIp || serverConfig.defaultPrinterIp || '').trim();
    const targetPrinterName = (printerName || labelData.printerName || serverConfig.defaultPrinterName || '').trim();

    addLog('info', `Dispatching print job for ${childName}`, {
        childName,
        targetPrinterIp: targetPrinterIp || 'None',
        usedFallback: !printerIp && !labelData.printerIp && Boolean(serverConfig.defaultPrinterIp)
    });

    // 1. Dynamic Network/Wireless Printer (Direct TCP Socket on Port 9100)
    if (targetPrinterIp) {
        addLog('info', `Opening TCP Socket connection to ${targetPrinterIp}:9100...`, { targetIp: targetPrinterIp });
        
        const socket = new net.Socket();
        socket.setTimeout(5000);

        const printPayload = 
            `\x1b@` + // ESC/POS Initialize
            `=====================================\n` +
            `       KIDDOCHECKER NAME TAG         \n` +
            `=====================================\n` +
            `CHILD : ${childName}\n` +
            `CODE  : ${securityCode}\n` +
            `CLASS : ${className}\n` +
            (allergies ? `${allergies}\n` : '') +
            `DATE  : ${new Date().toLocaleString()}\n` +
            `=====================================\n\n\n\x1dV1`; // Cut paper

        socket.connect(9100, targetPrinterIp, () => {
            addLog('info', `TCP Socket Connected to ${targetPrinterIp}:9100! Transmitting data...`, { targetIp: targetPrinterIp });
            socket.write(printPayload, 'utf-8', () => {
                socket.end();
                addLog('success', `✅ Name tag successfully printed on ${targetPrinterIp}!`, {
                    childName,
                    targetIp: targetPrinterIp
                });
                if (callback) callback(null, { success: true, printer: targetPrinterIp, mode: 'tcp_socket' });
            });
        });

        socket.on('error', (err) => {
            addLog('error', `❌ Socket error connecting to ${targetPrinterIp}:9100 - ${err.message}`, {
                targetIp: targetPrinterIp,
                error: err.message
            });
            if (callback) callback(null, { success: false, error: err.message, targetIp: targetPrinterIp });
        });

        socket.on('timeout', () => {
            addLog('warn', `⚠️ Socket connection timed out for ${targetPrinterIp}:9100 (Unreachable or IP incorrect)`, {
                targetIp: targetPrinterIp
            });
            socket.destroy();
            if (callback) callback(null, { success: false, error: `Connection timeout to ${targetPrinterIp}` });
        });
        return;
    }

    // 2. Fallback Warning if no IP specified anywhere
    addLog('warn', `No Target Printer IP specified for ${childName}. (Kiosk payload was empty and no Server Default IP is set)`, {
        childName,
        receivedPayload: labelData
    });

    let command = '';
    const isWindows = process.platform === 'win32';

    if (isWindows) {
        const printText = `--- KIDDOCHECKER NAME TAG ---\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}\n-----------------------------`;
        command = `powershell -Command "Out-Printer -Name '${targetPrinterName}' -InputObject '${printText}'"`;
    } else {
        const printText = `KIDDOCHECKER NAME TAG\nName: ${childName}\nCode: ${securityCode}\nClass: ${className}\n${allergies}`;
        command = `echo "${printText}" | lp -d "${targetPrinterName}" 2>/dev/null || echo "${printText}"`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            addLog('warn', `System print fallback message: ${error.message}`);
            if (callback) callback(null, { success: true, warning: error.message });
            return;
        }
        addLog('success', `Printed via OS spooler fallback (${targetPrinterName})`);
        if (callback) callback(null, { success: true, printer: targetPrinterName, mode: 'os_spooler' });
    });
}

// ─── API Endpoints ──────────────────────────────────────────────

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

app.get('/api/config', (req, res) => {
    res.json(serverConfig);
});

app.post('/api/config', (req, res) => {
    const { defaultPrinterIp, defaultPrinterName } = req.body || {};
    const updated = saveServerConfig({ defaultPrinterIp, defaultPrinterName });
    if (updated) {
        res.json({ success: true, serverConfig });
    } else {
        res.status(500).json({ success: false, error: 'Failed to write configuration file' });
    }
});

app.post('/print', (req, res) => {
    const { labelData, printerIp, printerName } = req.body || {};
    dispatchPrintCommand(labelData, printerIp, printerName, (err, result) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        res.json(result);
    });
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
            .log-box { background: #090d16; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: monospace; font-size: 13px; height: 520px; overflow-y: auto; display: flex; flex-col; gap: 8px; }
            .log-entry { padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--border); background: #131b2e; word-break: break-all; margin-bottom: 6px; }
            .log-entry.success { border-color: var(--success); }
            .log-entry.error { border-color: var(--danger); }
            .log-entry.warn { border-color: var(--warning); }
            .log-entry.cloud { border-color: var(--primary); }
            .time { color: var(--muted); font-size: 11px; margin-right: 8px; }
            input, button { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border); background: #090d16; color: #fff; margin-bottom: 10px; font-size: 14px; }
            button { background: var(--primary); font-weight: bold; cursor: pointer; border: none; }
            button:hover { opacity: 0.9; }
            .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
            .ip-tag { background: #334155; padding: 3px 8px; border-radius: 4px; font-family: monospace; }
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
                <!-- Server Default Fallback Printer IP Config Card -->
                <div class="card" style="border-color: var(--primary);">
                    <h2 style="color: var(--primary);">⚙️ Server Default Fallback Printer</h2>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">If a kiosk does not specify an IP, all print jobs automatically fall back to this Default Printer IP.</p>
                    <label style="font-size:11px; color: var(--muted); font-weight:bold; display:block; margin-bottom:4px;">DEFAULT FALLBACK WIRELESS PRINTER IP:</label>
                    <input type="text" id="defaultIpInput" placeholder="e.g. 192.168.2.13" value="${serverConfig.defaultPrinterIp}" />
                    <button onclick="saveDefaultConfig()" style="background: var(--success);">💾 Save Default Server Printer IP</button>
                    <div id="configResult" style="font-size: 12px; font-weight: bold; margin-top: 4px;"></div>
                </div>

                <!-- Direct Printer Tester Card -->
                <div class="card">
                    <h2>Direct Printer Tester</h2>
                    <p style="font-size: 12px; color: var(--muted); margin-bottom: 12px;">Test network printer connectivity directly from server to target IP.</p>
                    <input type="text" id="testIp" placeholder="Printer IP (e.g. 192.168.2.13)" value="${serverConfig.defaultPrinterIp || '192.168.2.13'}" />
                    <input type="text" id="testName" placeholder="Test Child Name" value="Test Child Badge" />
                    <button onclick="sendTestPrint()">🚀 Send Test Print to IP</button>
                    <div id="testResult" style="font-size: 12px; font-weight: bold; margin-top: 8px;"></div>
                </div>

                <!-- Server Info Card -->
                <div class="card">
                    <h2>Server Info</h2>
                    <div class="stat-row"><span>Platform:</span> <strong>${process.platform}</strong></div>
                    <div class="stat-row"><span>Uptime:</span> <strong id="uptime">Loading...</strong></div>
                    <div class="stat-row"><span>Port:</span> <strong>${PORT}</strong></div>
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
                        </div>
                    \`).join('');
                } catch(e) { }
            }

            async function saveDefaultConfig() {
                const ip = document.getElementById('defaultIpInput').value.trim();
                const resDiv = document.getElementById('configResult');
                resDiv.innerText = 'Saving...';
                resDiv.style.color = '#f59e0b';

                try {
                    const res = await fetch('/api/config', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ defaultPrinterIp: ip })
                    });
                    const data = await res.json();
                    if (data.success) {
                        resDiv.innerText = '✅ Saved Default Printer IP: ' + ip;
                        resDiv.style.color = '#10b981';
                        document.getElementById('testIp').value = ip;
                    } else {
                        resDiv.innerText = '❌ Failed to save config';
                        resDiv.style.color = '#ef4444';
                    }
                } catch(e) {
                    resDiv.innerText = '❌ Error saving: ' + e.message;
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
                        resDiv.innerText = '✅ Test Print Dispatched to ' + ip;
                        resDiv.style.color = '#10b981';
                    } else {
                        resDiv.innerText = '❌ Failed: ' + (data.error || 'Unknown error');
                        resDiv.style.color = '#ef4444';
                    }
                } catch(e) {
                    resDiv.innerText = '❌ Error: ' + e.message;
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
    addLog('info', `Server listening on http://${HOST}:${PORT}`);
    console.log(`
    ===================================================================
    🖨️  KiddoChecker Remote Multi-Printer Server & Web Dashboard
    ===================================================================
    OS Platform : ${process.platform} (${os.release()})
    Status      : Listening on http://${HOST}:${PORT}
    Cloud Relay : Polling Azure API (${AZURE_API_URL})
    Default IP  : ${serverConfig.defaultPrinterIp || 'None (Set via Web Console)'}
    
    🌐 OPEN PRINT SERVER WEB CONSOLE & LOGS IN YOUR BROWSER:
    ${localIps.map(ip => `   👉 http://${ip}:${PORT}`).join('\n')}

    Multi-Printer Dynamic TCP Socket Support:
    - Send target printer IP in "printerIp" field or rely on Server Default.
    ===================================================================
    `);
});
