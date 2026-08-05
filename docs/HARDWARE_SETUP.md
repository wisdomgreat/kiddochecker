
# KiddoChecker Hardware & Automation Setup Guide

This guide explains how to set up the professional kiosk hardware, silent printing proxy, and location-restricted mobile check-in.

## 1. Required Hardware
*   **Tablet**: Samsung Galaxy Tab Active5 (Required for NFC support).
*   **Printer**: Brother QL-820NWB (Must be on the same WiFi as the tablets).
*   **Enclosure**: Any rugged VESA mount for Samsung Active5.

## 2. Silent Printing Setup ($0 Automation)
To enable labels to print automatically without a confirmation popup on the tablet:

1.  **Install Node.js** on any computer/laptop in the nursery.
2.  **Copy the Proxy Script**: Located at `/scripts/print-proxy.js`.
3.  **Configure Printer IP**: Open the script and set `PRINTER_IP` to your Brother printer's IP address (e.g., `192.168.1.50`).
4.  **Run the Script**:
    ```bash
    node scripts/print-proxy.js
    ```
5.  **Failover**: If this script is not running, the KiddoChecker app will automatically show the standard Browser Print dialog as a backup.

## 3. Mobile "Wall QR" Security
To allow parents to check in using their own phones safely:

1.  **The QR Code**: Print the Check-in URL (e.g., `https://kiddochecker.com/checkin/mobile`) and place it on the wall.
2.  **WiFi Lockdown**: 
    *   Log in to KiddoChecker as an Admin on a computer connected to the Nursery WiFi.
    *   Go to **Settings > Security**.
    *   Click **"Authorize Current Network"**.
    *   Now, any parent scanning the QR code will be blocked unless they are connected to the Nursery WiFi.

## 4. Kiosk Mode Configuration
1.  On the Samsung Tablet, open Chrome and go to your app URL.
2.  Tap the 3 dots → **Add to Home Screen**.
3.  Open the app from the home screen.
4.  Go to **Android Settings > Security > Advanced > App Pinning** and turn it on.
5.  Pin the KiddoChecker app to lock the tablet.

---
*Document Version: 1.0 (2024-05-11)*
