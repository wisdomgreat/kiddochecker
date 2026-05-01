
# KiddoChecker - Smart Childcare Management

A premium, high-reliability childcare management system designed for churches and organizations. Built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Key Features & Innovations

### 🛡️ Hardened Security & Authentication
- **Multi-Factor Authentication (MFA)**: Banking-grade TOTP protection for admin and staff accounts.
- **Geo-fenced Check-In**: Automatic capture of GPS metadata during check-in to ensure kiosk physical presence.
- **Role-Based Access Control (RBAC)**: Granular permissions for Super Admins, Admins, Staff, Teachers, and Parents.
- **Session Resilience**: Defensive authentication lifecycle that handles transient network failures without interrupting the user session.

### ⚡ Seamless Kiosk Operations
- **Dual-Mode Identification**: Support for both traditional **Phone/PIN** login and "Techy" **QR Code** scanning.
- **NFC "Tap & Go"**: Instant check-in via smartphone NFC or physical fobs/stickers (Web NFC API).
- **Auto-Printing**: Hands-free security label printing. Tags are automatically separated (Child Tag vs. Parent Claim Ticket).
- **Smart Check-in Protection**: Intelligent 2-hour window prevents duplicate attendance logs for the same child.
- **Offline Resilience**: Cached state management to keep the kiosk operational during minor internet flickers.

### 👥 User & Family Management
- **Family Dashboard**: Parents can manage multiple children, allergies, and emergency contacts from one view.
- **Youth Self-Check**: Older children can securely check themselves in/out using personal PINs.
- **Guardian Approval**: Multi-step verification for adding or modifying authorized pickup lists.

### 🏫 Class & Staff Management
- **Live Rosters**: Real-time visibility of children present in each classroom.
- **Staff Shift Tracking**: Dedicated portal for staff to clock in/out and manage their assigned classes.
- **Teacher Profiles**: Comprehensive history of teacher assignments and certifications.

### 📊 Intelligence & Reporting
- **Real-time Analytics**: Live "Present vs. Total" counters on the main dashboard.
- **Detailed Audit Logs**: Complete history of every check-in/out, including the actor, method, and location.
- **Exportable Reports**: One-click Excel/CSV exports for regulatory compliance and attendance analysis.

---

## 📖 User Guides

### 👪 For Parents
1. **Enrollment**: Register your family and add children with their specific allergy/medical needs.
2. **Check-In**: Use your phone number or scan your personal QR code at the kiosk.
3. **Pick-up**: Present your printed Claim Ticket or Digital QR code to the teacher.
4. **NFC Setup**: Ask a staff member to "Link Tag" to your phone for instant tap-in access.

### 🧑‍🏫 For Staff & Teachers
1. **Roster Management**: View your class list in real-time.
2. **Attendance Override**: Manually check children in/out if a parent loses their ticket.
3. **Shift Tracking**: Use the Staff Portal to manage your hours and assigned stations.
4. **Tag Registration**: Use the "Link Tag" feature in the search area to help parents register their NFC devices.

### ⚙️ For Administrators
1. **Device Enrollment**: Securely register tablets/kiosks to specific physical stations.
2. **Security Config**: Enable/Disable MFA, Signature requirements, and Geo-fencing.
3. **System Audit**: Review the activity logs to monitor system health and security events.

---

## 🛠️ Technical Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Vanilla CSS, Tailwind CSS, shadcn/ui (Premium Glassmorphism aesthetic)
- **Backend**: Supabase (PostgreSQL, Real-time, Auth, Storage)
- **Hardware APIs**: Web NFC API, Browser Print API, Geolocation API
- **State Management**: TanStack Query (React Query)
- **Validation**: Zod & React Hook Form

---

## 🏁 Getting Started

1. **Install Dependencies**: `npm install`
2. **Configure Environment**: Set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Run Development**: `npm run dev`
4. **Production Build**: `npm run build`

---

## 🛡️ Support & Documentation
For advanced configuration, architectural deep-dives, or technical support, please refer to the **[Central Documentation Hub](./docs/INDEX.md)**.

**Status**: 🟢 Production Ready | 100% Feature Complete
