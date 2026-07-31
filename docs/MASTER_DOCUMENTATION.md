# 📘 KiddoChecker — Master Operations & Configuration Guide

Welcome to the **KiddoChecker Master Documentation**. This comprehensive guide covers every feature, workflow, configuration option, hardware setup, and step-by-step server installation for the KiddoChecker system.

---

## 📋 Table of Contents
1. [System Overview & Architecture](#1-system-overview--architecture)
2. [Core Features & User Workflows](#2-core-features--user-workflows)
   - [Child Check-In & Security Badging](#child-check-in--security-badging)
   - [Guardian Check-Out & Verification](#guardian-check-out--verification)
   - [User & Staff Roster Management](#user--staff-roster-management)
   - [Classrooms, Schedules & Shift Roster](#classrooms-schedules--shift-roster)
3. [User Roles & Security Permissions](#3-user-roles--security-permissions)
4. [Hardware & Multi-Printer Architecture](#4-hardware--multi-printer-architecture)
5. [Linux CLI Print Server Setup (Step-by-Step)](#5-linux-cli-print-server-setup-step-by-step)
6. [Kiosk & Android Tablet Configuration](#6-kiosk--android-tablet-configuration)
7. [Cloud Production Infrastructure (Azure)](#7-cloud-production-infrastructure-azure)

---

## 1. System Overview & Architecture

KiddoChecker is a high-security, web-based child check-in and attendance management platform built specifically for churches, childcare centers, and organizations.

```
┌────────────────────────────────────────────────────────┐
│               Android Tablet Kiosks                    │
│   (Kiosk 1, Kiosk 2, Kiosk 3 at Entry Stations)       │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
  Check-in Data │                        │ Print Jobs (HTTP/JSON)
  (HTTPS API)   │                        │ (Port 3003)
                ▼                        ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│ Azure Container Apps API  │  │ Tech Desk Linux CLI Server│
│  (Node.js / Express API)  │  │  (scripts/print-proxy.js) │
└───────────────┬───────────┘  └─────────────┬─────────────┘
                │                            │
                ▼                            │ Raw Socket (Port 9100)
┌───────────────────────────┐                ▼
│ Azure PostgreSQL Database │  ┌───────────────────────────┐
│ (Profiles, Roles, Shifts) │  │  Wireless Printers 1 & 2  │
└───────────────────────────┘  └───────────────────────────┘
```

---

## 2. Core Features & User Workflows

### Child Check-In & Security Badging
* **Search Methods**: Parents can check in by searching their registered phone number, scanning a family QR code, or entering their name.
* **Child Badge (Worn by Child)**: Prints child's name, assigned classroom, date/timestamp, and **prominent allergy/medical alert warnings**.
* **Guardian Claim Ticket (Kept by Parent)**: Prints a matching security code (e.g. `#K-8492`) and a **security verification QR code**.

### Guardian Check-Out & Verification
* Staff at the exit desk scan the parent's Claim Ticket QR code or type the security code.
* The system verifies the code against active check-in records and marks the child as safely checked out.

### User & Staff Roster Management
* **Single & Bulk Management**: Select multiple users for bulk role assignment, account activation/deactivation, or permanent deletion.
* **Direct Admin Password Reset**: Super Admins can reset user passwords directly without requiring email loops.

### Classrooms, Schedules & Shift Roster
* Manage room capacities, assign teachers/assistants, and track staff shift schedules in real-time.

---

## 3. User Roles & Security Permissions

| Role | Access Level & Capabilities |
|---|---|
| **Super Admin** | Full system control: Manage users, roles, password resets, organization settings, device enrollment, and global audits. |
| **Admin** | Managing rosters, staff shifts, classrooms, attendance reports, and check-in setups. |
| **Teacher / Staff** | Viewing assigned classroom rosters, executing child check-in/check-out, and recording attendance. |
| **Volunteer** | Kiosk assistance, check-in station helper access. |
| **Parent** | Managing registered children profiles, emergency contact details, medical alerts, and viewing family check-in history. |

---

## 4. Hardware & Multi-Printer Architecture

KiddoChecker supports **multiple Android tablet kiosks** sending print jobs over local Wi-Fi to a **central Tech Desk Print Server**, which dispatches jobs to **multiple wireless label printers**.

* **Kiosks 1 & 2** (Preschool Area) ➔ Route to **Wireless Printer 1** (`192.168.1.101`).
* **Kiosks 3 & 4** (Elementary Area) ➔ Route to **Wireless Printer 2** (`192.168.1.102`).

---

## 5. Linux CLI Print Server Setup (Step-by-Step)

> **No GUI Required!** A headless Linux CLI OS (e.g. Ubuntu Server 22.04 / 24.04 LTS or Raspberry Pi OS Lite) is **faster, lighter (uses <200MB RAM), and will never force-reboot during Sunday service**.

### Step 1: Update & Install Node.js
Log into your Linux CLI machine via SSH or local console and run:

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+ and Git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git netcat
```

Verify installation:
```bash
node -v
npm -v
```

### Step 2: Download & Install KiddoChecker Print Proxy
```bash
# Create directory and clone repository (or copy scripts/print-proxy.js)
mkdir -p ~/kiddochecker
cd ~/kiddochecker

# If cloning the repo:
git clone https://github.com/wisdomgreat/kiddochecker.git .
cd scripts

# Install required lightweight Node modules
npm install express body-parser
```

### Step 3: Test Running the Print Proxy CLI
Run the script manually to view your machine's local IP address:

```bash
node print-proxy.js
```

Output:
```text
===================================================================
🖨️  KiddoChecker Remote Multi-Printer Server (Active)
===================================================================
OS Platform : linux
Status      : Listening on http://0.0.0.0:3003

📌 TECH DESK SERVER IP ADDRESS(ES) TO ENTER ON ANDROID TABLETS:
   👉 http://192.168.1.150:3003
===================================================================
```
Press `Ctrl + C` to exit the manual test.

### Step 4: Create Automatic 24/7 Background Service (`systemd`)
To ensure the print server auto-starts whenever the PC powers on (even after power outages or reboots):

Create service file:
```bash
sudo nano /etc/systemd/system/kiddochecker-print.service
```

Paste the following content (replace `/home/ubuntu/kiddochecker` with your actual path):
```ini
[Unit]
Description=KiddoChecker Remote Print Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/kiddochecker/scripts
ExecStart=/usr/bin/node print-proxy.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Save and exit (`Ctrl + O`, `Enter`, `Ctrl + X`).

Enable & start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable kiddochecker-print
sudo systemctl start kiddochecker-print
```

Check status:
```bash
sudo systemctl status kiddochecker-print
```

---

## 6. Kiosk & Android Tablet Configuration

On each Android Tablet Kiosk:

1. Open Chrome on the tablet and go to **[https://happy-glacier-0746a2210.7.azurestaticapps.net](https://happy-glacier-0746a2210.7.azurestaticapps.net)**.
2. Navigate to **Check-In Setup** (`/check-in/setup`).
3. Under **Printing Setup**:
   * **Printer Name**: Enter label printer description (e.g. *Brother QL-820NWB*).
   * **Print Server PC IP**: Enter your Linux CLI machine's IP (e.g. `192.168.1.150`).
   * **Target Wireless Printer IP**: 
     * Kiosk 1 & 2: `192.168.1.101` (Printer 1)
     * Kiosk 3 & 4: `192.168.1.102` (Printer 2)
4. Tap **Test IP**. The tablet will show: `Print Server Online! ✅`.
5. Tap **Save Settings**.

---

## 7. Cloud Production Infrastructure (Azure)

| Resource Component | Azure Resource Name | Endpoint / Address |
|---|---|---|
| **Frontend Web App** | Azure Static Web App | [https://happy-glacier-0746a2210.7.azurestaticapps.net](https://happy-glacier-0746a2210.7.azurestaticapps.net) |
| **Backend API Service** | Azure Container App (`ca-api-kiddo-prod-yotzp`) | `https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io` |
| **Container Registry** | Azure Container Registry (`crkiddoprodyotzp`) | `crkiddoprodyotzp.azurecr.io` |
| **Production Database** | Azure PostgreSQL Flexible Server | Hosted in Resource Group `rg-kiddo` |
