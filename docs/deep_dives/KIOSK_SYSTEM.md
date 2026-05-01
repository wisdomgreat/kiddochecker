# Kiosk & Attendance System Deep Dive

## Overview
The Kiosk system is a specialized, hardware-focused interface designed for rapid, secure check-in and check-out of children. It prioritizes physical presence verification and minimizes friction for parents and staff.

## 1. Hardware Enrollment
To prevent remote access, every kiosk must be enrolled:
- **Process**: An admin uses `src/pages/DeviceEnrollmentPage.tsx` to generate a secure enrollment token.
- **Handshake**: The physical device registers its `deviceId` (stored in `localStorage`) with the server.
- **Verification**: Every subsequent API call from that device includes the `X-Kiosk-Device-ID` header.

## 2. Check-In / Check-Out Flow
The system uses a highly optimized state machine:
1. **Identification**: User scans a Family QR code or enters a Staff PIN.
2. **Context Loading**: The system fetches associated children (for parents) or class rosters (for staff).
3. **Validation**: Checks for medical alerts, unpaid balances, or custody restrictions.
4. **Execution**: Atomic transaction via the `checkin_child` or `checkout_child` Supabase RPCs.
5. **Confirmation**: Instant sync to the main administrative dashboard.

## 3. Security Features
- **Offline Resilience**: Minimal local state allows the UI to stay responsive during network blips.
- **Presence Enforcement**: Geo-fencing and device-locking ensure check-ins happen *at* the facility.
- **Sensitive Alerts**: Medical or safety alerts are displayed with high-visibility overlays to ensure staff awareness.

## 4. UI Architecture
- `CheckInPage.tsx`: The primary kiosk entry point.
- `KioskLayout.tsx`: A stripped-down, touch-optimized layout without sidebars or complex menus.
- `FamilySelector.tsx`: Visual grid for choosing which children to check in.

## 5. Audit Logging
Every kiosk action is dual-logged:
1. **Attendance Log**: Primary record for billing and operations.
2. **System Audit Log**: Secondary record for forensic tracking of *which* device performed the action.
