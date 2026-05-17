const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const port = 3003;

app.use(bodyParser.json());

// Enable custom zero-dependency CORS headers for browser fetch preflights
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// CONFIGURATION: Set your Brother Printer IP here
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100'; 

app.post('/print', (req, res) => {
    const { labelData } = req.body;
    
    if (!labelData || !labelData.name) {
        return res.status(400).json({ success: false, error: 'Invalid label data' });
    }
    
    console.log(`[Proxy] Received print request for: ${labelData.name}`);

    // This is where we send the command to the Brother Printer.
    // We use the 'netcat' (nc) command to send raw data to port 9100.
    // For Brother QL-820NWB, you can send ESC/P or Raster data.
    
    const command = `echo "PRINT: ${labelData.name}" | nc -w 1 ${PRINTER_IP} 9100`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`[Proxy] Print failed: ${error.message}`);
            return res.status(500).json({ success: false, error: error.message });
        }
        console.log(`[Proxy] Print job sent to ${PRINTER_IP}`);
        res.json({ success: true });
    });
});

app.listen(port, () => {
    console.log(`
    ================================================
    KiddoChecker Print Proxy (Active)
    ================================================
    Status: Running on port ${port}
    Printer IP: ${PRINTER_IP}
    
    This script must stay running on your local PC
    to enable automatic silent printing.
    ================================================
    `);
});
