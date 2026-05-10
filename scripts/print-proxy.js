
const express = require('express');
const { exec } = require('child_process');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;

app.use(bodyParser.json());

// CONFIGURATION: Set your Brother Printer IP here
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100'; 

app.post('/print', (req, res) => {
    const { labelData } = req.body;
    
    console.log(`[Proxy] Received print request for: ${labelData.name}`);

    // This is where we send the command to the Brother Printer.
    // We use the 'netcat' (nc) command to send raw data to port 9100.
    // For Brother QL-820NWB, you can send ESC/P or Raster data.
    
    // Example: Sending a simple text-based command or a pre-rendered image
    // In a real setup, we'd use a library like 'brother-ql' or send raw ESC/P.
    
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
    KiddoChecker Print Proxy (BETA)
    ================================================
    Status: Running on port ${port}
    Printer IP: ${PRINTER_IP}
    
    This script must stay running on your local PC
    to enable automatic silent printing.
    ================================================
    `);
});
