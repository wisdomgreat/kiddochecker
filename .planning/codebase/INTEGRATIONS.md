# External Integrations

This document tracks all external services, APIs, and data providers integrated with KiddoChecker.

## Database

- **Provider:** Azure Database for PostgreSQL
- **Role:** Primary persistent storage for children, parents, attendance, and system logs.
- **Access:** Direct connection via `pg` pool in the Bridge API.

## Authentication & Identity

- **Provider:** Microsoft Entra CIAM (formerly Azure AD B2C)
- **Implementation:** 
  - `@azure/msal-react` / `@azure/msal-browser` on the frontend.
  - Bridge API validates session/tokens where applicable.
- **User Types:** Admin, Staff, Parent.

## Communication Services

- **Email:** Resend
  - **Usage:** Sending OTP codes and system notifications.
- **SMS:** Twilio
  - **Usage:** Emergency alerts and check-in/out confirmations.

## Storage & Assets

- **Provider:** Supabase Storage (Legacy) / Azure Blob Storage (Migration target)
- **Usage:** Storing child photos and signature images.

## Frontend Utilities

- **QR Scanning:** `html5-qrcode` library for terminal check-ins.
- **Maps:** Google Maps API (referenced in `package.json`).

## API Ingress

- **Pattern:** Bridge API acts as a secure proxy between the Frontend and the Private VNet-isolated PostgreSQL database.
- **Base URL:** Managed via Azure Container App ingress.

---
*Last updated: 2026-05-16*
